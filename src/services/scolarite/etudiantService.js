import { supabaseAdmin } from '../../lib/supabase.js'
import { calculerMoyenneGenerale } from './calculationService.js'

// Récupérer les informations complètes d'un étudiant par son ID utilisateur
export const getEtudiantByUserId = async (userId) => {
  try {
    // Récupérer l'utilisateur
    const { data: utilisateur, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email, username, nom, prenom, roles (code)')
      .eq('id', userId)
      .single()

    if (userError || !utilisateur || utilisateur.roles?.code !== 'ETUDIANT') {
      throw new Error('Utilisateur non trouvé ou n\'est pas un étudiant')
    }

    // Chercher l'étudiant par matricule ou par email
    let etudiant = null
    const searchUsername = (utilisateur.username || "").trim()
    const searchEmail = (utilisateur.email || "").trim()

    console.log(`🔍 Recherche de l'étudiant pour UserID: ${userId}, Username: "${searchUsername}", Email: "${searchEmail}"`)

    // 1. Essai par matricule
    const { data: byMatricule, error: matError } = await supabaseAdmin
      .from('etudiants')
      .select(`
        *,
        inscriptions (
          *,
          promotions (id, annee, statut),
          formations (id, nom, code),
          filieres (id, nom, code, departements(id, code, nom)),
          niveaux (id, nom, code, ordinal),
          classes (id, nom, code)
        ),
        parents (id, nom, prenom, telephone, email, lien_parente)
      `)
      .ilike('matricule', searchUsername)
      .maybeSingle()

    if (byMatricule) {
      etudiant = byMatricule
      console.log('✅ Étudiant trouvé par matricule (avec jointures)')
    } else {
      if (matError) console.error('❌ Erreur recherche matricule:', matError.message)

      if (searchEmail) {
        const { data: byEmail, error: mailError } = await supabaseAdmin
          .from('etudiants')
          .select(`
            *,
            inscriptions (
              *,
              promotions (*),
              formations (*),
              filieres (*, departements(*)),
              niveaux (*),
              classes (*)
            ),
            parents (*)
          `)
          .ilike('email', searchEmail)
          .maybeSingle()

        if (byEmail) {
          etudiant = byEmail
          console.log('✅ Étudiant trouvé par email (avec jointures)')
        } else if (mailError) {
          console.error('❌ Erreur recherche email:', mailError.message)
        }
      }
    }

    // 3. Fallback : Recherche simplifiée sans jointures si rien n'a été trouvé
    if (!etudiant) {
      console.log('🔄 Tentative de recherche simplifiée (sans jointures)...')
      const { data: simpleEtudiant, error: simpleError } = await supabaseAdmin
        .from('etudiants')
        .select('*')
        .or(`matricule.ilike.${searchUsername},email.ilike.${searchEmail || searchUsername}`)
        .maybeSingle()

      if (simpleEtudiant) {
        etudiant = simpleEtudiant
        console.log('✅ Étudiant trouvé via recherche simplifiée')

        // Charger manuellement les inscriptions pour ce cas
        const { data: manualInsc } = await supabaseAdmin
          .from('inscriptions')
          .select('*, promotions(*), formations(*), filieres(*, departements(*)), niveaux(*), classes(*)')
          .eq('etudiant_id', etudiant.id)
        etudiant.inscriptions = manualInsc || []

        // Charger manuellement les parents
        const { data: manualParents } = await supabaseAdmin
          .from('parents')
          .select('*')
          .eq('etudiant_id', etudiant.id)
        etudiant.parents = manualParents || []
      } else {
        if (simpleError) console.error('❌ Erreur recherche simplifiée:', simpleError.message)
      }
    }

    if (!etudiant) {
      throw new Error(`Étudiant non trouvé pour le matricule "${searchUsername}"`)
    }

    // --- SYNCHRONISATION USER_ID ---
    // Si l'étudiant a été trouvé par matricule/email mais que son user_id n'est pas rempli 
    // ou ne correspond pas au userId actuel, on le met à jour pour assurer le lien futur.
    if (etudiant.user_id !== userId) {
      console.log(`🔗 Synchronisation user_id pour l'étudiant ${etudiant.matricule}: ${etudiant.user_id} -> ${userId}`)
      await supabaseAdmin
        .from('etudiants')
        .update({ user_id: userId })
        .eq('id', etudiant.id)

      // Mettre à jour l'objet local
      etudiant.user_id = userId
    }

    // Sélectionner l'inscription active
    const inscriptions = etudiant.inscriptions || []
    const inscription = inscriptions
      .filter(i => (i.statut || '').toUpperCase() === 'INSCRIT')
      .sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))[0] ||
      inscriptions.sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))[0] || null

    // --- CALCULS ACADÉMIQUES ---
    let moyenneGenerale = 0
    let totalCredits = 0
    let nbrModules = 0
    let rangClasse = null
    let timetable = []
    let etudiantNotes = []
    let totalStudentsInClass = 0
    let totalStudentsWithNotes = 0

    // Déterminer le semestre en cours (défini avant le bloc if pour être accessible partout)
    let semestreActuel = 'S1' // Valeur par défaut
    if (inscription) {
      const niveauCode = (inscription.niveaux?.code || '').toUpperCase()
      semestreActuel = (niveauCode === 'L1') ? 'S1' : (niveauCode === 'L2' ? 'S3' : 'S5')
    }

    if (inscription) {
      // 1. Modules de la classe
      const niveauCode = (inscription.niveaux?.code || '').toUpperCase()
      const correspondenceNiveauSemestre = { 'L1': ['S1', 'S2'], 'L2': ['S3', 'S4'], 'L3': ['S5', 'S6'] }
      const semestresNiveau = correspondenceNiveauSemestre[niveauCode] || []

      // Modules du semestre en cours uniquement
      const { data: classModules } = await supabaseAdmin
        .from('modules')
        .select('*')
        .eq('filiere_id', inscription.filiere_id)
        .eq('semestre', semestreActuel) // Seulement les modules du semestre en cours

      nbrModules = classModules?.length || 0

      // 2. Notes et Moyenne - Filtrer par semestre en cours
      // Récupérer les notes avec ou sans inscription_id (car inscription_id peut être nullable)
      let notesData = null
      const { data: notesWithInscription } = await supabaseAdmin
        .from('notes')
        .select('*, modules(*)')
        .eq('etudiant_id', etudiant.id)
        .eq('inscription_id', inscription.id)
        .eq('semestre', semestreActuel)

      const { data: notesWithoutInscription } = await supabaseAdmin
        .from('notes')
        .select('*, modules(*)')
        .eq('etudiant_id', etudiant.id)
        .eq('classe_id', inscription.classe_id)
        .eq('semestre', semestreActuel)
        .is('inscription_id', null)

      // Combiner les deux résultats
      notesData = [
        ...(notesWithInscription || []),
        ...(notesWithoutInscription || [])
      ]

      if (notesData && notesData.length > 0) {
        // Organiser les notes par module
        const notesByModule = {}
        notesData.forEach(note => {
          const moduleId = note.module_id
          if (!notesByModule[moduleId]) {
            notesByModule[moduleId] = {
              module: note.modules,
              notes: []
            }
          }
          notesByModule[moduleId].notes.push(note)
        })

        // Transformer en format attendu par le frontend
        etudiantNotes = Object.entries(notesByModule).map(([moduleId, { module, notes }]) => {
          // Calculer la moyenne
          let moyenne = 0
          const noteFinale = notes.find(n => n.evaluation_id?.toLowerCase() === 'moyenne' || n.evaluation_id?.toLowerCase() === 'final' || n.evaluation_id?.toLowerCase() === 'moy')

          if (noteFinale) {
            moyenne = parseFloat(noteFinale.valeur) || 0
          } else {
            // Filtrer les notes pour ne pas inclure d'éventuels doublons ou calculs intermédiaires si possible
            // Pour le calcul simple, on prend toutes les notes numériques
            const valeurs = notes.map(n => parseFloat(n.valeur)).filter(v => !isNaN(v))
            if (valeurs.length > 0) {
              moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length
            }
          }

          // Préparer la liste des évaluations de manière dynamique
          const listEvaluations = notes
            .filter(n => n.evaluation_id?.toLowerCase() !== 'moyenne' && n.evaluation_id?.toLowerCase() !== 'final')
            .map(n => ({
              id: n.evaluation_id,
              name: n.evaluation_id?.replace(/_/g, ' ') || 'Note',
              valeur: parseFloat(parseFloat(n.valeur).toFixed(2))
            }))
            .sort((a, b) => (a.id > b.id ? 1 : -1))

          return {
            id: notes[0].id,
            module_id: moduleId,
            module: module?.nom || 'Inconnu',
            code: module?.code || '',
            evaluations: listEvaluations, // Liste dynamique des notes
            moyenne: parseFloat(moyenne.toFixed(2)),
            credit: module?.credit || 0,
            statut: moyenne >= 10 ? 'Validé' : 'Non validé',
            tendance: moyenne >= 10 ? 'up' : 'down'
          }
        })

        // Calculer la moyenne générale avec la même logique que les bulletins
        let totalPointsSemestre = 0
        let totalCreditsSyllabus = 0 // Total des crédits de tous les modules du semestre
        let sumCoefs = 0 // Total des crédits des modules ayant une note

        // Calculer les crédits attendus du syllabus (tous les modules du semestre)
        if (classModules && classModules.length > 0) {
          totalCreditsSyllabus = classModules.reduce((sum, m) => sum + (m.credit || 0), 0)
        }

        etudiantNotes.forEach(note => {
          const val = note.moyenne || 0
          const coef = note.credit || 1
          totalPointsSemestre += (val * coef)
          sumCoefs += coef
          if (val >= 10) totalCredits += coef
        })

        // Calculer la moyenne générale avec le service centralisé pour garantir la cohérence avec les bulletins
        const deptCode = inscription.filieres?.departements?.code || ''
        const filiereCode = inscription.filieres?.code || ''

        moyenneGenerale = calculerMoyenneGenerale(
          totalPointsSemestre,
          totalCreditsSyllabus,
          sumCoefs,
          deptCode,
          filiereCode
        )
      }

      // 3. Rang et Effectif - OPTIMISÉ : Calculer le rang uniquement parmi les étudiants avec notes
      // Récupérer tous les étudiants de la classe pour l'effectif total
      const { data: allInsc } = await supabaseAdmin
        .from('inscriptions')
        .select('id, etudiant_id')
        .eq('classe_id', inscription.classe_id)
        .eq('statut', 'INSCRIT')

      if (allInsc) {
        totalStudentsInClass = allInsc.length

        // OPTIMISATION : Récupérer toutes les notes de tous les étudiants en une seule requête
        const inscriptionIds = allInsc.map(i => i.id)
        const { data: allNotesData } = await supabaseAdmin
          .from('notes')
          .select('*, modules(*), inscriptions(id, etudiant_id)')
          .in('inscription_id', inscriptionIds)
          .eq('semestre', semestreActuel)

        // Créer un map inscription_id -> etudiant_id pour faciliter la recherche
        const inscriptionToStudentMap = {}
        allInsc.forEach(insc => {
          inscriptionToStudentMap[insc.id] = insc.etudiant_id
        })

        // Organiser les notes par étudiant
        const notesByStudent = {}
        if (allNotesData && allNotesData.length > 0) {
          allNotesData.forEach(note => {
            const etudiantId = inscriptionToStudentMap[note.inscription_id] || note.inscriptions?.etudiant_id
            if (!etudiantId) return

            if (!notesByStudent[etudiantId]) {
              notesByStudent[etudiantId] = []
            }
            notesByStudent[etudiantId].push(note)
          })
        }

        // Calculer les moyennes uniquement pour les étudiants qui ont des notes
        const studentAverages = []

        // Fonction helper pour calculer la moyenne d'un étudiant
        const calculateStudentAverage = (notes) => {
          if (!notes || notes.length === 0) return 0

          // Organiser les notes par module
          const notesByModule = {}
          notes.forEach(note => {
            const moduleId = note.module_id
            if (!notesByModule[moduleId]) {
              notesByModule[moduleId] = []
            }
            notesByModule[moduleId].push(note)
          })

          // Calculer la moyenne par module puis la moyenne générale
          let sumNotesWeighted = 0, sumCoefs = 0
          Object.values(notesByModule).forEach(moduleNotes => {
            const module = moduleNotes[0]?.modules
            if (!module) return

            // Trouver la note finale ou calculer la moyenne
            const noteFinale = moduleNotes.find(n => n.evaluation_id === 'MOYENNE' || n.evaluation_id === 'FINAL' || n.evaluation_id === 'moyenne')
            let moyenneModule = 0
            if (noteFinale) {
              moyenneModule = parseFloat(noteFinale.valeur) || 0
            } else {
              const valeurs = moduleNotes.map(n => parseFloat(n.valeur) || 0).filter(v => v > 0)
              if (valeurs.length > 0) {
                moyenneModule = valeurs.reduce((a, b) => a + b, 0) / valeurs.length
              }
            }

            const coef = parseFloat(module.credit || 1)
            sumNotesWeighted += (moyenneModule * coef)
            sumCoefs += coef
          })

          return sumCoefs > 0 ? sumNotesWeighted / sumCoefs : 0
        }

        // Calculer les moyennes pour tous les étudiants qui ont des notes
        Object.keys(notesByStudent).forEach(etudiantId => {
          const avg = calculateStudentAverage(notesByStudent[etudiantId])
          if (avg > 0) { // Seulement inclure les étudiants avec des notes valides
            studentAverages.push({ id: etudiantId, avg })
          }
        })

        // Calculer le rang uniquement parmi les étudiants avec notes
        if (studentAverages.length > 0) {
          totalStudentsWithNotes = studentAverages.length
          studentAverages.sort((a, b) => b.avg - a.avg)
          const pos = studentAverages.findIndex(s => s.id === etudiant.id)
          if (pos !== -1) {
            rangClasse = pos + 1
            // totalStudentsInClass reste le total d'étudiants dans la classe
            // totalStudentsWithNotes est le nombre d'étudiants avec notes pour l'affichage du rang
          } else {
            // Si l'étudiant n'a pas de notes, ne pas afficher de rang
            rangClasse = null
          }
        } else {
          // Aucun étudiant n'a de notes
          rangClasse = null
          totalStudentsWithNotes = 0
        }
      }

      // 4. Emploi du temps - Filtrer par semestre pour éviter les doublons
      const { data: edtData } = await supabaseAdmin
        .from('emplois_du_temps')
        .select('*, modules(*), enseignants(*)')
        .eq('classe_id', inscription.classe_id)
        .eq('semestre', semestreActuel) // FILTRE CRUCIAL : Uniquement le semestre en cours
        .order('jour', { ascending: true })
        .order('heure_debut', { ascending: true })

      if (edtData) {
        // Pour l'emploi du temps, on renvoie toutes les occurrences pour que le frontend
        // puisse filtrer par semaine réelle.
        timetable = edtData.map(item => ({
          id: item.id,
          jour: item.jour,
          heureDebut: item.heure_debut,
          heureFin: item.heure_fin,
          matiere: item.modules?.nom || 'Inconnu',
          professeur: item.enseignants ? `${item.enseignants.prenom || ''} ${item.enseignants.nom}`.trim() : 'N/A',
          salle: item.salle || 'N/A',
          type: item.type_activite || 'Cours',
          date: item.date_specifique,
          isRecurrent: item.est_recurrent
        }))
      }
    }

    // --- OBJET FINAL ---
    return {
      id: etudiant.id,
      userId: utilisateur.id,
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      fullName: `${etudiant.nom} ${etudiant.prenom}`,
      email: etudiant.email || utilisateur.email,
      telephone: etudiant.telephone || null,
      adresse: etudiant.adresse || null,
      photo: etudiant.photo ? (etudiant.photo.startsWith('/') ? etudiant.photo : `/uploads/inscriptions/${etudiant.photo}`) : null,
      dateNaissance: etudiant.date_naissance ? (typeof etudiant.date_naissance === 'string' ? etudiant.date_naissance.split('T')[0] : etudiant.date_naissance) : null,
      lieuNaissance: etudiant.lieu_naissance || null,
      // Infos Académiques
      filiere: inscription?.filieres?.nom || '',
      niveau: inscription?.niveaux?.nom || '',
      niveauCode: inscription?.niveaux?.code || '',
      classe: inscription?.classes?.nom || '',
      programme: inscription?.classes ? `${inscription.classes.nom} - ${inscription.filieres?.code || 'INPTIC'}` : 'INPTIC 2025',
      moyenneGenerale: parseFloat(moyenneGenerale.toFixed(2)),
      nbrCredits: totalCredits,
      totalModules: nbrModules,
      rangClasse: rangClasse,
      totalStudentsInClass: totalStudentsInClass,
      totalStudentsWithNotes: totalStudentsWithNotes, // Nombre d'étudiants avec notes pour l'affichage du rang
      semestreActuel: semestreActuel,
      anneeAcademique: inscription?.promotions?.annee || '',
      dateInscription: inscription?.date_inscription ? inscription.date_inscription.split('T')[0] : null,
      // Données dynamiques pour dashboard
      grades: (etudiantNotes || []).map(n => ({
        id: n.id,
        module: n.module || 'Inconnu',
        code: n.code || '',
        evaluations: n.evaluations || [],
        moyenne: n.moyenne,
        credit: n.credit,
        statut: n.statut,
        tendance: n.tendance
      })),
      timetable,
      parents: (etudiant.parents || []).map(p => ({
        fullName: `${p.nom} ${p.prenom}`,
        telephone: p.telephone,
        email: p.email,
        lienParente: p.lien_parente
      }))
    }
  } catch (error) {
    console.error('Erreur getEtudiantByUserId:', error)
    throw error
  }
}

export const deleteEtudiant = async (etudiantId) => {
  try {
    // 1. Récupérer le matricule/email de l'étudiant pour trouver son compte utilisateur
    const { data: etudiant } = await supabaseAdmin
      .from('etudiants')
      .select('matricule, email')
      .eq('id', etudiantId)
      .single()

    // 2. Supprimer l'étudiant (cascade sur inscriptions, etc. si configuré, sinon devra être géré)
    // Supabase gère souvent les cascades, mais le compte utilisateur n'est pas lié par une FK stricte dans ce code
    const { error } = await supabaseAdmin.from('etudiants').delete().eq('id', etudiantId)
    if (error) throw error

    // 3. Supprimer le compte utilisateur associé s'il existe
    if (etudiant && etudiant.matricule) {
      console.log(`🗑️ Suppression du compte utilisateur associé au matricule: ${etudiant.matricule}`)

      // Essayer de supprimer par username = matricule
      const { error: userError } = await supabaseAdmin
        .from('utilisateurs')
        .delete()
        .eq('username', etudiant.matricule)

      if (userError) {
        console.error('Erreur suppression compte utilisateur (username):', userError)
      } else {
        console.log('✅ Compte utilisateur supprimé avec succès (username)')
      }

      // Par sécurité, si un compte existe avec l'email mais un username différent (cas rare)
      if (etudiant.email) {
        const { error: emailError } = await supabaseAdmin
          .from('utilisateurs')
          .delete()
          .eq('email', etudiant.email)

        if (!emailError) console.log('✅ Nettoyage par email effectué')
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur deleteEtudiant:', error)
    return { success: false, error: error.message }
  }
}
