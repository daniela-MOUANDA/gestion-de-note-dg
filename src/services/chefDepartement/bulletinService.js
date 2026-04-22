import { supabaseAdmin } from '../../lib/supabase.js'
import { getScopedFiliereIdsForDepartement } from './filiereScopeService.js'
import {
  fetchPromotionForCurrentAcademicYear,
  getCurrentAcademicYearLabel
} from '../../utils/academicYear.js'

// La table bulletins utilise un enum semestre limité à S1/S2.
// Pour les niveaux L2/L3 (S3..S6), on projette vers le semestre relatif.
const normalizeSemestreForBulletinEnum = (semestre) => {
  const value = String(semestre || '').toUpperCase().trim()
  const match = value.match(/^S([1-6])$/)
  if (!match) return value
  const n = Number(match[1])
  return n % 2 === 0 ? 'S2' : 'S1'
}

// Récupérer l'état de toutes les classes pour un semestre donné
export const getEtatBulletinsToutesClasses = async (departementId, semestre = null) => {
  try {
    const filiereIds = await getScopedFiliereIdsForDepartement(departementId)
    if (filiereIds.length === 0) {
      return { success: true, classes: [] }
    }

    const { data: classes } = await supabaseAdmin
      .from('classes')
      .select('id, code, nom, nombre_modules, filieres(code, nom), niveaux(code)')
      .in('filiere_id', filiereIds)

    if (!classes || classes.length === 0) {
      return { success: true, classes: [] }
    }

    if (!classes || classes.length === 0) {
      return { success: true, classes: [] }
    }

    // Limiter la concurrence pour éviter de saturer Supabase
    // (la version full Promise.all sur toutes les classes peut dépasser le timeout HTTP)
    const runWithConcurrency = async (items, worker, limit = 3) => {
      const results = new Array(items.length)
      let idx = 0

      const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (idx < items.length) {
          const current = idx++
          results[current] = await worker(items[current], current)
        }
      })

      await Promise.all(runners)
      return results
    }

    // Pour chaque classe, calculer l'état (avec concurrence limitée)
    const classesAvecEtat = await runWithConcurrency(
      classes,
      async (classe) => {
        const niveauCode = classe.niveaux?.code
        if (!niveauCode) return null

        // Déterminer les semestres autorisés
        const semestresAutorises = {
          'L1': ['S1', 'S2'],
          'L2': ['S3', 'S4'],
          'L3': ['S5', 'S6']
        }[niveauCode] || []

        // Si un semestre est spécifié, ne traiter que ce semestre
        const semestresATraiter = semestre ? [semestre] : semestresAutorises

        const etatsParSemestre = await runWithConcurrency(
          semestresATraiter,
          async (sem) => {
            const etat = await verifierEtatBulletins(classe.id, sem, departementId, true)
            return { semestre: sem, etat }
          },
          2
        )

        // S'assurer que chaque état de semestre a le bon nombre de modules requis
        // Utiliser nombre_modules de la classe comme référence principale
        const nombreModulesRequisClasse = parseInt(classe.nombre_modules) || 0
        const semestresAvecEtat = etatsParSemestre.map(s => {
          if (s.etat.success) {
            // Utiliser le nombreModulesRequis du service, sinon celui de la classe
            const nombreModulesRequis = s.etat.nombreModulesRequis || nombreModulesRequisClasse
            return {
              semestre: s.semestre,
              ...s.etat,
              nombreModulesRequis: nombreModulesRequis,
              modulesAvecNotes: s.etat.modulesAvecNotes || 0 // Inclure le nombre de modules avec notes
            }
          }
          return {
            semestre: s.semestre,
            ...s.etat,
            nombreModulesRequis: nombreModulesRequisClasse,
            modulesAvecNotes: 0
          }
        })

        return {
          id: classe.id,
          code: classe.code,
          nom: classe.nom,
          filiere: classe.filieres?.code,
          niveau: niveauCode,
          nombreModulesRequis: nombreModulesRequisClasse, // Nombre de modules requis de la classe
          semestres: semestresAvecEtat
        }
      },
      3
    )

    return {
      success: true,
      classes: classesAvecEtat.filter(c => c !== null)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état des bulletins:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération de l\'état des bulletins'
    }
  }
}

// Vérifier l'état de préparation des bulletins pour une classe et un semestre
export const verifierEtatBulletins = async (classeId, semestre, departementId, modeRapide = false) => {
  try {
    // 1. Récupérer la classe et son nombre de modules requis
    // Utiliser .select() avec toutes les colonnes nécessaires et forcer le rechargement
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('id, code, nom, nombre_modules, filieres(id, code, nom), niveaux(code)')
      .eq('id', classeId)
      .single()

    if (classeError || !classe) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    // 1.5. Récupérer le statut des notes depuis la table statut_notes_classes
    // Ne pas mettre à jour le statut ici pour éviter les problèmes de mémoire
    // Le statut sera mis à jour après chaque sauvegarde de notes
    const { getStatutNotes } = await import('./statutNotesService.js')

    // Récupérer le statut existant (sans forcer la mise à jour)
    const statutResult = await getStatutNotes(classeId, semestre)
    const statutNotes = statutResult.statut


    // S'assurer que nombre_modules est bien un nombre
    // nombre_modules représente le nombre de modules requis pour le semestre (optionnel)
    // Si non défini, on utilisera le nombre de modules trouvés dans la BD
    const nombreModulesRequis = parseInt(classe.nombre_modules) || 0

    console.log(`📊 Classe ${classe.code} - Semestre ${semestre}:`)
    console.log(`   - nombre_modules (configuré) = ${classe.nombre_modules}`)
    console.log(`   - nombreModulesRequis (parsed) = ${nombreModulesRequis}`)

    // Note: Si nombreModulesRequis === 0, on utilisera le nombre de modules trouvés dans la BD
    if (nombreModulesRequis === 0) {
      console.log(`ℹ️ Classe ${classe.code}: nombre_modules non défini, utilisation automatique du nombre de modules trouvés`)
    }

    // 2. Récupérer les étudiants de la classe
    const { data: inscriptions, error: inscriptionsError } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiant_id, etudiants(id, nom, prenom, matricule)')
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')

    if (inscriptionsError) throw inscriptionsError

    const etudiantIds = (inscriptions || []).map(i => i.etudiant_id)
    const nombreEtudiants = etudiantIds.length

    if (nombreEtudiants === 0) {
      console.log(`⚠️ Classe ${classe.code}: Aucun étudiant inscrit`)
      return {
        success: true,
        classe: {
          id: classe.id,
          code: classe.code,
          nom: classe.nom,
          filiere: classe.filieres?.code,
          niveau: classe.niveaux?.code
        },
        nombreModulesRequis,
        nombreModulesDisponibles: 0,
        modulesAvecNotesCompletes: 0,
        modulesAvecNotes: statutNotes?.nombre_modules_avec_notes || 0,
        nombreEtudiants: 0,
        etudiantsAvecNotesCompletes: 0,
        pretPourGeneration: false,
        message: 'Aucun étudiant inscrit dans cette classe',
        pourcentageNotes: 0
      }
    }

    // Utiliser les données du statut si disponibles (plus rapide que de recalculer)
    let modulesAvecNotes = statutNotes?.nombre_modules_avec_notes || 0
    let modulesAvecNotesCompletes = statutNotes?.nombre_modules_complets || 0
    let etudiantsAvecNotesCompletes = statutNotes?.nombre_etudiants_complets || 0

    // 3. Récupérer les modules pour ce semestre
    // Essayer d'abord par classe_id, puis par filiere_id si pas de résultats
    let { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id, code, nom, classe_id, filiere_id')
      .eq('classe_id', classeId)
      .eq('semestre', semestre)

    // Si pas de modules trouvés par classe_id, chercher par filiere_id
    if ((!modules || modules.length === 0) && classe.filieres?.id) {
      const { data: modulesByFiliere, error: modulesErrorByFiliere } = await supabaseAdmin
        .from('modules')
        .select('id, code, nom, classe_id, filiere_id')
        .eq('filiere_id', classe.filieres.id)
        .eq('departement_id', departementId)
        .eq('semestre', semestre)

      if (!modulesErrorByFiliere && modulesByFiliere) {
        modules = modulesByFiliere
        modulesError = null
      }
    }

    if (modulesError) {
      console.error(`❌ Erreur lors de la récupération des modules:`, modulesError)
      throw modulesError
    }

    const moduleIds = (modules || []).map(m => m.id)
    const nombreModulesDisponibles = moduleIds.length

    console.log(`📚 Modules trouvés pour ${classe.code} - ${semestre}: ${nombreModulesDisponibles} modules`)
    if (modules && modules.length > 0) {
      console.log(`   - Modules: ${modules.map(m => m.code).join(', ')}`)
    }

    // Si aucun module n'est trouvé, retourner un état vide
    if (nombreModulesDisponibles === 0) {
      console.log(`⚠️ Aucun module trouvé pour ${classe.code} - ${semestre}`)
      return {
        success: true,
        classe: {
          id: classe.id,
          code: classe.code,
          nom: classe.nom,
          filiere: classe.filieres?.code,
          niveau: classe.niveaux?.code
        },
        nombreModulesRequis,
        nombreModulesDisponibles: 0,
        modulesAvecNotesCompletes: 0,
        modulesAvecNotes: 0,
        nombreEtudiants,
        etudiantsAvecNotesCompletes: 0,
        pretPourGeneration: false,
        message: `Aucun module trouvé pour le semestre ${semestre}`,
        pourcentageNotes: 0
      }
    }

    // 4. Recalcul coûteux depuis les notes réelles (désactivé en mode rapide liste).
    // En mode rapide, on s'appuie sur le cache statut_notes_classes pour éviter les timeouts.
    if (!modeRapide) {
      console.log('🔁 Recalcul en temps réel de l\'état des notes...')

      // 4. Pour chaque module, vérifier si tous les étudiants ont des notes
      modulesAvecNotesCompletes = 0
      modulesAvecNotes = 0
      etudiantsAvecNotesCompletes = 0

      for (const moduleId of moduleIds) {
        // Récupérer les paramètres de notation pour ce module
        const { data: parametres } = await supabaseAdmin
          .from('parametres_notation')
          .select('evaluations')
          .eq('module_id', moduleId)
          .eq('semestre', semestre)
          .single()

        // Récupérer les notes pour ce module
        const { data: notes, error: notesError } = await supabaseAdmin
          .from('notes')
          .select('etudiant_id, evaluation_id')
          .eq('module_id', moduleId)
          .eq('classe_id', classeId)
          .eq('semestre', semestre)
          .in('etudiant_id', etudiantIds.length > 0 ? etudiantIds : [''])

        if (notesError) {
          console.error(`❌ Erreur lors de la récupération des notes pour le module ${moduleId}:`, notesError)
          continue
        }

        console.log(`📝 Module ${moduleId}: ${notes?.length || 0} notes trouvées`)

        // Notes au format DB (snake_case)
        const notesNormalisees = (notes || []).map(note => ({
          etudiant_id: note.etudiant_id,
          evaluation_id: note.evaluation_id
        }))

        // Compter ce module comme ayant des notes si au moins une note existe
        if (notesNormalisees.length > 0) {
          modulesAvecNotes++
          console.log(`✅ Module ${moduleId}: Au moins une note saisie (total: ${notesNormalisees.length} notes)`)
        }

        // Si pas de paramètres de notation configurés
        if (!parametres || !parametres.evaluations) {
          console.log(`⚠️ Module ${moduleId}: Pas de paramètres de notation trouvés`)

          // Vérifier si des notes existent quand même
          if (notesNormalisees.length === 0) {
            console.log(`   → Aucune note trouvée, module ignoré`)
            continue
          }

          // Grouper les notes par étudiant
          const notesParEtudiant = {}
          notesNormalisees.forEach(note => {
            const etudiantId = note.etudiant_id
            if (!etudiantId) return

            if (!notesParEtudiant[etudiantId]) {
              notesParEtudiant[etudiantId] = new Set()
            }
            notesParEtudiant[etudiantId].add(note.evaluation_id)
          })

          // Compter les étudiants qui ont au moins une note
          const etudiantsAvecNotes = Object.keys(notesParEtudiant).length

          // Si tous les étudiants ont au moins une note, considérer le module comme complet
          if (etudiantsAvecNotes === nombreEtudiants && nombreEtudiants > 0) {
            modulesAvecNotesCompletes++
            console.log(`✅ Module ${moduleId}: Complet sans paramètres (${etudiantsAvecNotes}/${nombreEtudiants} étudiants avec notes)`)
          } else {
            console.log(`⚠️ Module ${moduleId}: Incomplet - ${etudiantsAvecNotes}/${nombreEtudiants} étudiants avec notes`)
          }

          continue
        }

        const evaluations = parametres.evaluations
        const nombreEvaluationsTotal = evaluations.reduce((sum, evaluation) => sum + evaluation.nombreEvaluations, 0)

        // Construire la liste des IDs d'évaluation attendus
        const evaluationIdsAttendus = []
        evaluations.forEach(evaluation => {
          for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
            evaluationIdsAttendus.push(`${evaluation.id}_${i}`)
          }
        })

        console.log(`📋 Module ${moduleId}: ${nombreEvaluationsTotal} évaluations attendues (IDs: ${evaluationIdsAttendus.join(', ')})`)

        // Grouper les notes par étudiant
        const notesParEtudiant = {}
        notesNormalisees.forEach(note => {
          const etudiantId = note.etudiant_id
          const evaluationId = note.evaluation_id

          if (!etudiantId || !evaluationId) {
            console.warn(`⚠️ Note invalide: etudiant_id=${etudiantId}, evaluation_id=${evaluationId}`)
            return
          }

          if (!notesParEtudiant[etudiantId]) {
            notesParEtudiant[etudiantId] = new Set()
          }
          notesParEtudiant[etudiantId].add(evaluationId)
        })

        console.log(`📊 Module ${moduleId}: Notes groupées pour ${Object.keys(notesParEtudiant).length} étudiants`)

        // Vérifier combien d'étudiants ont toutes les notes pour ce module
        let etudiantsComplets = 0
        let etudiantsAvecNotes = 0

        etudiantIds.forEach(etudiantId => {
          const notesEtudiant = notesParEtudiant[etudiantId] || new Set()
          const notesEtudiantArray = Array.from(notesEtudiant)

          // Compter les étudiants qui ont au moins une note
          if (notesEtudiant.size > 0) {
            etudiantsAvecNotes++
          }

          // Vérifier que l'étudiant a au moins le nombre requis d'évaluations
          // On accepte si le nombre de notes est >= au nombre attendu (peut avoir des notes supplémentaires)
          // Si nombreEvaluationsTotal est 0, on considère que l'étudiant a ses notes (cas où il n'y a pas d'évaluations configurées)
          const aToutesLesNotes = nombreEvaluationsTotal === 0 || notesEtudiant.size >= nombreEvaluationsTotal

          if (aToutesLesNotes) {
            etudiantsComplets++
          }
        })

        console.log(`📊 Module ${moduleId}: ${etudiantsComplets}/${nombreEtudiants} étudiants avec notes complètes (${etudiantsAvecNotes} avec au moins une note)`)

        // Un module est complet si :
        // 1. Tous les étudiants ont toutes leurs notes (nombre exact) - CAS IDÉAL
        // 2. OU si tous les étudiants ont au moins une note ET le nombre total de notes correspond - CAS TOLÉRANT
        // 3. OU si le nombre d'évaluations attendues est 0 mais des notes existent - CAS SANS PARAMÈTRES

        const tousEtudiantsComplets = etudiantsComplets === nombreEtudiants && nombreEtudiants > 0

        // Calculer le nombre minimum de notes attendues pour tous les étudiants
        const notesMinAttendues = nombreEtudiants * nombreEvaluationsTotal
        const ratioNotes = notesMinAttendues > 0 ? (notesNormalisees.length / notesMinAttendues) : 1

        // Si tous les étudiants ont au moins une note ET qu'on a au moins 90% des notes attendues
        const tousEtudiantsAvecNotes = etudiantsAvecNotes === nombreEtudiants &&
          nombreEtudiants > 0 &&
          ratioNotes >= 0.9

        const notesSansParametres = nombreEvaluationsTotal === 0 && notesNormalisees.length > 0 && nombreEtudiants > 0

        const moduleComplet = tousEtudiantsComplets || tousEtudiantsAvecNotes || notesSansParametres

        if (moduleComplet) {
          modulesAvecNotesCompletes++
          console.log(`✅ Module ${moduleId}: Tous les étudiants ont leurs notes complètes`)
          if (tousEtudiantsComplets) {
            console.log(`   → Raison: Tous les étudiants ont toutes leurs notes (${etudiantsComplets}/${nombreEtudiants})`)
          } else if (tousEtudiantsAvecNotes) {
            console.log(`   → Raison: Tous les étudiants ont des notes (${etudiantsAvecNotes}/${nombreEtudiants}) avec ${Math.round(ratioNotes * 100)}% des notes attendues`)
          } else {
            console.log(`   → Raison: Notes sans paramètres configurés`)
          }
        } else {
          console.log(`⚠️ Module ${moduleId}: Notes incomplètes`)
          console.log(`   - Étudiants complets: ${etudiantsComplets}/${nombreEtudiants}`)
          console.log(`   - Étudiants avec notes: ${etudiantsAvecNotes}/${nombreEtudiants}`)
          console.log(`   - Notes trouvées: ${notesNormalisees.length}, Notes attendues min: ${notesMinAttendues}, Ratio: ${Math.round(ratioNotes * 100)}%`)
        }
      }

      // 5. Compter les étudiants qui ont toutes leurs notes pour tous les modules
      // Utiliser une approche plus simple : si tous les modules ont leurs notes complètes,
      // alors tous les étudiants ont leurs notes complètes
      // Sinon, vérifier individuellement

      if (modulesAvecNotesCompletes === nombreModulesDisponibles && nombreModulesDisponibles > 0) {
        // Si tous les modules sont complets, tous les étudiants sont complets
        etudiantsAvecNotesCompletes = nombreEtudiants
        console.log(`👥 Tous les modules sont complets → Tous les étudiants sont complets: ${etudiantsAvecNotesCompletes}/${nombreEtudiants}`)
      } else {
        // Sinon, vérifier individuellement (mais de manière plus tolérante)
        const etudiantsComplets = new Set()

        // Pour chaque étudiant, vérifier s'il a des notes pour tous les modules
        for (const etudiantId of etudiantIds) {
          let tousModulesComplets = true

          for (const moduleId of moduleIds) {
            // Vérifier simplement s'il y a au moins une note pour cet étudiant et ce module
            const { count: notesCount } = await supabaseAdmin
              .from('notes')
              .select('*', { count: 'exact', head: true })
              .eq('module_id', moduleId)
              .eq('classe_id', classeId)
              .eq('semestre', semestre)
              .eq('etudiant_id', etudiantId)

            // Si l'étudiant n'a aucune note pour ce module, il n'est pas complet
            if ((notesCount || 0) === 0) {
              tousModulesComplets = false
              break
            }
          }

          if (tousModulesComplets) {
            etudiantsComplets.add(etudiantId)
          }
        }

        etudiantsAvecNotesCompletes = etudiantsComplets.size
        console.log(`👥 Étudiants avec des notes pour tous les modules: ${etudiantsAvecNotesCompletes}/${nombreEtudiants}`)
      }
    } else {
      console.log(`⚡ Mode rapide: statut cache utilisé pour ${classe.code} - ${semestre}`)
    } // Fin du recalcul en temps réel / mode rapide

    // 6. Calculer le pourcentage de notes saisies
    // Utiliser le nombre de modules requis de la classe (nombre_modules) comme référence principale
    // Si nombre_modules = 1 et qu'on a 1 module disponible avec notes complètes, on devrait avoir 100%
    console.log(`📊 Calcul pourcentage pour ${classe.code} - ${semestre}:`)
    console.log(`   - Modules avec notes complètes: ${modulesAvecNotesCompletes}`)
    console.log(`   - Modules requis (depuis classe.nombre_modules): ${nombreModulesRequis}`)
    console.log(`   - Modules disponibles dans la base: ${nombreModulesDisponibles}`)

    // Pourcentage/progression :
    // - si nombre_modules est défini mais supérieur aux modules réellement disponibles,
    //   on se base sur les modules disponibles pour éviter un faux blocage (ex: 12/12 affiché mais 60%).
    // - sinon on garde l'objectif configuré.
    const nombreModulesPourCalcul = nombreModulesDisponibles > 0
      ? (nombreModulesRequis > 0
          ? Math.min(nombreModulesRequis, nombreModulesDisponibles)
          : nombreModulesDisponibles)
      : nombreModulesRequis

    const pourcentageNotes = nombreModulesPourCalcul > 0
      ? Math.round((modulesAvecNotesCompletes / nombreModulesPourCalcul) * 100)
      : (modulesAvecNotesCompletes > 0 && nombreModulesDisponibles > 0 ? 100 : 0)

    console.log(`   - Modules de référence pour le calcul: ${nombreModulesPourCalcul}`)
    console.log(`   - Pourcentage calculé: ${pourcentageNotes}% (${modulesAvecNotesCompletes}/${nombreModulesPourCalcul})`)
    console.log(`   - Étudiants avec notes complètes: ${etudiantsAvecNotesCompletes}/${nombreEtudiants}`)

    // 7. Déterminer si les bulletins sont prêts à être générés
    // Les bulletins sont prêts si :
    // - Tous les modules disponibles ont leurs notes complètes (modulesAvecNotesCompletes === nombreModulesDisponibles)
    // - ET tous les étudiants ont toutes leurs notes (etudiantsAvecNotesCompletes === nombreEtudiants)
    // - ET il y a au moins un étudiant et un module

    // Priorité 1: Si tous les modules disponibles sont complets ET tous les étudiants sont complets
    const tousModulesDisponiblesComplets = nombreModulesDisponibles > 0 &&
      modulesAvecNotesCompletes === nombreModulesDisponibles

    // Priorité 2: Si le nombre de modules requis est atteint ET tous les étudiants sont complets
    const modulesRequisAtteints = nombreModulesRequis > 0 &&
      modulesAvecNotesCompletes >= nombreModulesRequis

    // Priorité 3: Si nombre_modules n'est pas défini, utiliser le nombre de modules disponibles
    const modulesReferenceAtteints = nombreModulesDisponibles > 0 &&
      modulesAvecNotesCompletes >= (nombreModulesRequis > 0 ? nombreModulesRequis : nombreModulesDisponibles)

    // Vérifier que tous les étudiants ont toutes leurs notes
    const tousEtudiantsComplets = nombreEtudiants > 0 &&
      etudiantsAvecNotesCompletes === nombreEtudiants

    // Condition finale : au moins une des conditions de modules ET tous les étudiants complets
    // Si tous les modules disponibles ont leurs notes complètes, on peut générer même si nombre_modules est différent
    // Cas spécial : si nombre_modules = 1 et qu'on a 1 module avec notes complètes, on peut générer
    const tousModulesDisponiblesAvecNotes = nombreModulesDisponibles > 0 &&
      modulesAvecNotesCompletes >= nombreModulesDisponibles

    // Condition finale pour la génération de bulletins :
    // Si nombre_modules est configuré (> 0):
    //   - Le nombre de modules avec notes complètes doit être >= au nombre de modules requis
    // Si nombre_modules n'est PAS configuré (= 0):
    //   - TOUS les modules disponibles doivent avoir leurs notes complètes
    // Dans les deux cas:
    //   - Tous les étudiants doivent avoir toutes leurs notes
    //   - Il doit y avoir au moins un étudiant et un module

    // Déterminer le nombre de modules de référence pour autoriser la génération.
    // Même logique que pour le pourcentage: on ne peut pas exiger plus que les modules disponibles.
    const modulesReference = nombreModulesDisponibles > 0
      ? (nombreModulesRequis > 0
          ? Math.min(nombreModulesRequis, nombreModulesDisponibles)
          : nombreModulesDisponibles)
      : nombreModulesRequis

    const pretPourGeneration = modulesAvecNotesCompletes >= modulesReference &&
      modulesReference > 0 &&
      tousEtudiantsComplets &&
      nombreEtudiants > 0

    // Vérifier si des bulletins existent déjà pour cette classe et ce semestre
    const promotion = await fetchPromotionForCurrentAcademicYear(supabaseAdmin)

    let bulletinsExistent = false
    let nombreBulletinsGeneres = 0
    if (promotion) {
      const semestreBulletin = normalizeSemestreForBulletinEnum(semestre)
      const { count } = await supabaseAdmin
        .from('bulletins')
        .select('*', { count: 'exact', head: true })
        .eq('promotion_id', promotion.id)
        .eq('classe_id', classeId)
        .eq('semestre', semestreBulletin)

      bulletinsExistent = (count || 0) > 0
      nombreBulletinsGeneres = count || 0
    }

    // Logs finaux
    console.log(`   - Modules avec notes complètes: ${modulesAvecNotesCompletes}`)
    console.log(`   - Modules avec au moins une note saisie: ${modulesAvecNotes}`)
    console.log(`   - Modules disponibles: ${nombreModulesDisponibles}`)
    console.log(`   - Modules requis (configuré): ${nombreModulesRequis}`)
    console.log(`   - Modules de référence (utilisé): ${modulesReference}`)
    console.log(`   - Tous les modules disponibles complets: ${tousModulesDisponiblesComplets} (${modulesAvecNotesCompletes} === ${nombreModulesDisponibles})`)
    console.log(`   - Modules requis atteints: ${modulesRequisAtteints} (${modulesAvecNotesCompletes} >= ${nombreModulesRequis})`)
    console.log(`   - Modules de référence atteints: ${modulesReferenceAtteints} (${modulesAvecNotesCompletes} >= ${modulesReference})`)
    console.log(`   - Tous les modules disponibles avec notes: ${tousModulesDisponiblesAvecNotes} (${modulesAvecNotesCompletes} >= ${nombreModulesDisponibles})`)
    console.log(`   - Étudiants avec notes complètes: ${etudiantsAvecNotesCompletes}/${nombreEtudiants}`)
    console.log(`   - Tous les étudiants complets: ${tousEtudiantsComplets}`)
    console.log(`   - Prêt pour génération: ${pretPourGeneration}`)

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        filiere: classe.filieres?.code,
        niveau: classe.niveaux?.code
      },
      nombreModulesRequis,
      nombreModulesDisponibles,
      modulesAvecNotesCompletes,
      modulesAvecNotes, // Nombre de modules avec au moins une note saisie
      nombreEtudiants,
      etudiantsAvecNotesCompletes,
      pretPourGeneration,
      pourcentageNotes,
      bulletinsExistent,
      nombreBulletinsGeneres,
      message: bulletinsExistent
        ? `${nombreBulletinsGeneres} bulletin(s) déjà généré(s)`
        : pretPourGeneration
          ? 'Les bulletins sont prêts à être générés'
          : `${modulesAvecNotesCompletes}/${nombreModulesDisponibles} modules disponibles avec notes complètes (requis: ${nombreModulesRequis}), ${etudiantsAvecNotesCompletes}/${nombreEtudiants} étudiants avec toutes leurs notes`
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état des bulletins:', error)
    return {
      success: false,
      error: 'Erreur lors de la vérification de l\'état des bulletins'
    }
  }
}

// Générer les bulletins pour une classe et un semestre
export const genererBulletins = async (classeId, semestre, departementId, chefDepartementId) => {
  try {
    // 1. Même critère « prêt » que la liste (mode rapide / cache statut_notes_classes).
    // Sans mode rapide, un recalcul complet par module peut prendre plusieurs minutes → spinner infini côté UI.
    const etat = await verifierEtatBulletins(classeId, semestre, departementId, true)
    if (!etat.success) {
      return etat
    }

    if (!etat.pretPourGeneration) {
      return {
        success: false,
        error: 'Les bulletins ne sont pas encore prêts à être générés. ' + etat.message
      }
    }

    // 2. Récupérer la classe et la promotion
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(*), niveaux(*)')
      .eq('id', classeId)
      .single()

    if (classeError || !classe) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    const promotion = await fetchPromotionForCurrentAcademicYear(supabaseAdmin)

    if (!promotion) {
      return {
        success: false,
        error:
          `Aucune promotion trouvée. Créez une ligne dans « promotions » avec année = ${getCurrentAcademicYearLabel()} (année académique dérivée de la date du jour), ou indiquez statut EN_COURS.`
      }
    }

    // 3. Récupérer TOUS les étudiants de la classe (pas seulement ceux qui n'ont pas de bulletin)
    const { data: inscriptions, error: inscriptionsError } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiant_id, etudiants(id, nom, prenom, matricule, date_naissance, lieu_naissance)')
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')

    if (inscriptionsError) throw inscriptionsError

    const etudiantIds = (inscriptions || []).map(i => i.etudiant_id)

    if (etudiantIds.length === 0) {
      return {
        success: false,
        error: 'Aucun étudiant inscrit dans cette classe'
      }
    }

    // 4. Vérifier si des bulletins existent déjà et les supprimer pour régénérer
    const semestreBulletin = normalizeSemestreForBulletinEnum(semestre)

    const { data: bulletinsExistants } = await supabaseAdmin
      .from('bulletins')
      .select('id')
      .eq('classe_id', classeId)
      .eq('semestre', semestreBulletin)
      .eq('promotion_id', promotion.id)
      .in('etudiant_id', etudiantIds)

    // Supprimer les bulletins existants pour régénérer
    if (bulletinsExistants && bulletinsExistants.length > 0) {
      const idsASupprimer = bulletinsExistants.map(b => b.id)
      await supabaseAdmin
        .from('bulletins')
        .delete()
        .in('id', idsASupprimer)
    }

    // 5. Créer les bulletins pour TOUS les étudiants de la classe
    const bulletinsACreer = etudiantIds.map(etudiantId => ({
      etudiant_id: etudiantId,
      promotion_id: promotion.id,
      classe_id: classeId,
      semestre: semestreBulletin,
      annee_academique: promotion.annee,
      statut_visa: 'EN_ATTENTE',
      date_generation: new Date().toISOString(),
      genere_par: chefDepartementId
    }))

    const { data: bulletinsCrees, error: insertError } = await supabaseAdmin
      .from('bulletins')
      .insert(bulletinsACreer)
      .select()

    if (insertError) throw insertError

    // 6. Enregistrer ou mettre à jour dans la table de suivi des visas (bulletins_generes)
    // Vérifier si une entrée existe déjà
    const { data: existingGeneres } = await supabaseAdmin
      .from('bulletins_generes')
      .select('id')
      .eq('classeId', classeId)
      .eq('semestre', semestre)
      .eq('departementId', departementId)
      .single()

    const bulletinGenereData = {
      classeId,
      semestre,
      departementId,
      chefDepartementId,
      nombreEtudiants: etudiantIds.length,
      anneeAcademique: promotion.annee,
      statut: 'EN_ATTENTE',
      dateGeneration: new Date().toISOString() // Mettre à jour la date
    }

    let genereError
    if (existingGeneres) {
      // Mise à jour
      const { error } = await supabaseAdmin
        .from('bulletins_generes')
        .update(bulletinGenereData)
        .eq('id', existingGeneres.id)
      genereError = error
    } else {
      // Création
      const { error } = await supabaseAdmin
        .from('bulletins_generes')
        .insert(bulletinGenereData)
      genereError = error
    }

    if (genereError) {
      console.error('Erreur lors de l\'enregistrement dans bulletins_generes:', genereError)
      // On ne bloque pas la génération, mais on logue l'erreur
    }


    return {
      success: true,
      message: `${bulletinsACreer.length} bulletin(s) généré(s) avec succès pour tous les étudiants de la classe`,
      nombreBulletins: bulletinsACreer.length,
      bulletins: bulletinsCrees
    }
  } catch (error) {
    console.error('Erreur lors de la génération des bulletins:', error)
    return {
      success: false,
      error: 'Erreur lors de la génération des bulletins: ' + error.message
    }
  }
}
