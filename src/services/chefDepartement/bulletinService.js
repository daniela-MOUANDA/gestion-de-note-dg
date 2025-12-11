import { supabaseAdmin } from '../../lib/supabase.js'

// Récupérer l'état de toutes les classes pour un semestre donné
export const getEtatBulletinsToutesClasses = async (departementId, semestre = null) => {
  try {
    // Récupérer toutes les classes du département
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id')
      .eq('departement_id', departementId)

    const filiereIds = (filieres || []).map(f => f.id)
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

    // Pour chaque classe, calculer l'état
    const classesAvecEtat = await Promise.all(
      classes.map(async (classe) => {
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

        const etatsParSemestre = await Promise.all(
          semestresATraiter.map(async (sem) => {
            const etat = await verifierEtatBulletins(classe.id, sem, departementId)
            return { semestre: sem, etat }
          })
        )

        // S'assurer que chaque état de semestre a le bon nombre de modules requis
        const semestresAvecEtat = etatsParSemestre.map(s => {
          if (s.etat.success) {
            return {
              semestre: s.semestre,
              ...s.etat,
              nombreModulesRequis: s.etat.nombreModulesRequis || classe.nombre_modules || 0
            }
          }
          return {
            semestre: s.semestre,
            ...s.etat
          }
        })

        return {
          id: classe.id,
          code: classe.code,
          nom: classe.nom,
          filiere: classe.filieres?.code,
          niveau: niveauCode,
          nombreModulesRequis: classe.nombre_modules || 0,
          semestres: semestresAvecEtat
        }
      })
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
export const verifierEtatBulletins = async (classeId, semestre, departementId) => {
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

    // S'assurer que nombre_modules est bien un nombre
    const nombreModulesRequis = parseInt(classe.nombre_modules) || 0
    
    console.log(`📊 Classe ${classe.code}: nombre_modules (raw) = ${classe.nombre_modules}, nombreModulesRequis (parsed) = ${nombreModulesRequis}`)

    if (nombreModulesRequis === 0) {
      return {
        success: false,
        error: 'Le nombre de modules requis n\'a pas été défini pour cette classe'
      }
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
        nombreEtudiants: 0,
        modulesAvecNotes: 0,
        etudiantsAvecNotesCompletes: 0,
        pretPourGeneration: false,
        message: 'Aucun étudiant inscrit dans cette classe',
        pourcentageNotes: 0
      }
    }

    // 3. Récupérer les modules de la filière pour ce semestre
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id, code, nom')
      .eq('filiere_id', classe.filieres?.id)
      .eq('departement_id', departementId)
      .eq('semestre', semestre)

    if (modulesError) throw modulesError

    const moduleIds = (modules || []).map(m => m.id)
    const nombreModulesDisponibles = moduleIds.length

    // 4. Pour chaque module, vérifier si tous les étudiants ont des notes
    let modulesAvecNotesCompletes = 0
    let etudiantsAvecNotesCompletes = 0

    for (const moduleId of moduleIds) {
      // Récupérer les paramètres de notation pour ce module
      const { data: parametres } = await supabaseAdmin
        .from('parametres_notation')
        .select('evaluations')
        .eq('module_id', moduleId)
        .eq('semestre', semestre)
        .single()

      if (!parametres || !parametres.evaluations) continue

      const evaluations = parametres.evaluations
      const nombreEvaluationsTotal = evaluations.reduce((sum, evaluation) => sum + evaluation.nombreEvaluations, 0)

      // Compter les notes pour ce module
      const { data: notes, error: notesError } = await supabaseAdmin
        .from('notes')
        .select('etudiant_id, evaluation_id')
        .eq('module_id', moduleId)
        .eq('classe_id', classeId)
        .eq('semestre', semestre)
        .in('etudiant_id', etudiantIds)

      if (notesError) continue

      // Grouper les notes par étudiant
      const notesParEtudiant = {}
      notes.forEach(note => {
        if (!notesParEtudiant[note.etudiant_id]) {
          notesParEtudiant[note.etudiant_id] = new Set()
        }
        notesParEtudiant[note.etudiant_id].add(note.evaluation_id)
      })

      // Vérifier combien d'étudiants ont toutes les notes pour ce module
      let etudiantsComplets = 0
      etudiantIds.forEach(etudiantId => {
        const notesEtudiant = notesParEtudiant[etudiantId] || new Set()
        if (notesEtudiant.size >= nombreEvaluationsTotal) {
          etudiantsComplets++
        }
      })

      if (etudiantsComplets === nombreEtudiants) {
        modulesAvecNotesCompletes++
      }
    }

    // 5. Compter les étudiants qui ont toutes leurs notes pour tous les modules
    const etudiantsComplets = new Set()
    for (const etudiantId of etudiantIds) {
      let tousModulesComplets = true
      for (const moduleId of moduleIds) {
        const { data: parametres } = await supabaseAdmin
          .from('parametres_notation')
          .select('evaluations')
          .eq('module_id', moduleId)
          .eq('semestre', semestre)
          .single()

        if (!parametres || !parametres.evaluations) {
          tousModulesComplets = false
          break
        }

        const evaluations = parametres.evaluations
        const nombreEvaluationsTotal = evaluations.reduce((sum, evaluation) => sum + evaluation.nombreEvaluations, 0)

        const { count: notesCount } = await supabaseAdmin
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('module_id', moduleId)
          .eq('classe_id', classeId)
          .eq('semestre', semestre)
          .eq('etudiant_id', etudiantId)

        if ((notesCount || 0) < nombreEvaluationsTotal) {
          tousModulesComplets = false
          break
        }
      }
      if (tousModulesComplets) {
        etudiantsComplets.add(etudiantId)
      }
    }

    etudiantsAvecNotesCompletes = etudiantsComplets.size

    // 6. Calculer le pourcentage de notes saisies
    console.log(`📊 Calcul pourcentage: ${modulesAvecNotesCompletes} modules avec notes / ${nombreModulesRequis} modules requis`)
    const pourcentageNotes = nombreModulesRequis > 0
      ? Math.round((modulesAvecNotesCompletes / nombreModulesRequis) * 100)
      : 0
    console.log(`📊 Pourcentage calculé: ${pourcentageNotes}%`)

    // 7. Déterminer si les bulletins sont prêts à être générés
    const pretPourGeneration = modulesAvecNotesCompletes >= nombreModulesRequis &&
                                etudiantsAvecNotesCompletes === nombreEtudiants

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
      nombreEtudiants,
      etudiantsAvecNotesCompletes,
      pretPourGeneration,
      pourcentageNotes,
      message: pretPourGeneration
        ? 'Les bulletins sont prêts à être générés'
        : `${modulesAvecNotesCompletes}/${nombreModulesRequis} modules avec notes complètes, ${etudiantsAvecNotesCompletes}/${nombreEtudiants} étudiants avec toutes leurs notes`
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
    // 1. Vérifier l'état des bulletins
    const etat = await verifierEtatBulletins(classeId, semestre, departementId)
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

    // Récupérer la promotion active
    const { data: promotion, error: promotionError } = await supabaseAdmin
      .from('promotions')
      .select('id, annee')
      .eq('active', true)
      .single()

    if (promotionError || !promotion) {
      return {
        success: false,
        error: 'Aucune promotion active trouvée'
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
    const { data: bulletinsExistants } = await supabaseAdmin
      .from('bulletins')
      .select('id')
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
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
      semestre,
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
