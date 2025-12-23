import { supabaseAdmin } from '../../lib/supabase.js'

/**
 * Récupère les meilleurs étudiants avec leurs moyennes et crédits
 */
export const getMeilleursEtudiants = async (filters = {}) => {
  try {
    const { filiere, niveau, semestre, limit = 50 } = filters

    // 1. Récupérer toutes les inscriptions actives
    let query = supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        classe_id,
        filiere_id,
        niveau_id,
        statut,
        etudiants (
          id,
          matricule,
          nom,
          prenom,
          email,
          telephone
        ),
        filieres (
          id,
          code,
          nom
        ),
        niveaux (
          id,
          code,
          nom
        ),
        classes (
          id,
          code,
          nom
        )
      `)
      .eq('statut', 'INSCRIT')

    // Appliquer les filtres
    if (filiere && filiere !== 'TOUS') {
      const { data: filiereData } = await supabaseAdmin
        .from('filieres')
        .select('id')
        .eq('code', filiere)
        .single()
      
      if (filiereData) {
        query = query.eq('filiere_id', filiereData.id)
      }
    }

    if (niveau && niveau !== 'TOUS') {
      const { data: niveauData } = await supabaseAdmin
        .from('niveaux')
        .select('id')
        .eq('code', niveau)
        .single()
      
      if (niveauData) {
        query = query.eq('niveau_id', niveauData.id)
      }
    }

    const { data: inscriptions, error } = await query

    if (error) throw error

    if (!inscriptions || inscriptions.length === 0) {
      return {
        success: true,
        etudiants: []
      }
    }

    // 2. Calculer les moyennes et crédits pour chaque étudiant selon le semestre
    const etudiantIds = inscriptions
      .map(ins => ins.etudiants?.id)
      .filter(Boolean)
      .slice(0, 1000)

    const filiereIds = [...new Set(inscriptions.map(ins => ins.filiere_id).filter(Boolean))]
    const classeIds = [...new Set(inscriptions.map(ins => ins.classe_id).filter(Boolean))]

    // Récupérer les modules selon le semestre
    let modulesQuery = supabaseAdmin
      .from('modules')
      .select('id, code, nom, credit, semestre, filiere_id')
      .in('filiere_id', filiereIds)

    if (semestre && semestre !== 'TOUS') {
      modulesQuery = modulesQuery.eq('semestre', semestre)
    }

    const { data: modules } = await modulesQuery
    const moduleIds = modules ? modules.map(m => m.id) : []

    // Récupérer les paramètres de notation
    const { data: parametresList } = moduleIds.length > 0
      ? await supabaseAdmin
          .from('parametres_notation')
          .select('module_id, evaluations, semestre')
          .in('module_id', moduleIds)
      : { data: [] }

    const parametresMap = {}
    if (parametresList) {
      parametresList.forEach(p => {
        parametresMap[`${p.module_id}_${p.semestre}`] = p.evaluations || []
      })
    }

    // Récupérer toutes les notes pour le semestre
    let notesQuery = supabaseAdmin
      .from('notes')
      .select('etudiant_id, module_id, valeur, evaluation_id, classe_id, semestre')
      .in('etudiant_id', etudiantIds)
      .in('classe_id', classeIds)
      .in('module_id', moduleIds)
      .limit(10000)

    if (semestre && semestre !== 'TOUS') {
      notesQuery = notesQuery.eq('semestre', semestre)
    }

    const { data: notes } = await notesQuery

    // Calculer les moyennes et crédits pour chaque étudiant
    const etudiantsAvecMoyennes = []

    if (notes && notes.length > 0 && modules && modules.length > 0) {
      // Grouper les notes par étudiant
      const notesParEtudiant = {}
      notes.forEach(note => {
        if (!notesParEtudiant[note.etudiant_id]) {
          notesParEtudiant[note.etudiant_id] = []
        }
        notesParEtudiant[note.etudiant_id].push(note)
      })

      // Calculer pour chaque étudiant
      inscriptions.forEach(inscription => {
        const etudiant = inscription.etudiants
        if (!etudiant) return

        const etudiantId = etudiant.id
        const notesEtudiant = notesParEtudiant[etudiantId] || []

        // Si un semestre ou niveau est spécifié et qu'il n'y a pas de notes, ne pas inclure l'étudiant
        if (notesEtudiant.length === 0) {
          // Si un filtre semestre ou niveau est actif, ne pas inclure les étudiants sans notes
          if ((semestre && semestre !== 'TOUS') || (niveau && niveau !== 'TOUS')) {
            return
          }
          // Sinon, inclure avec moyenne 0 (mais sera filtré plus tard)
          etudiantsAvecMoyennes.push({
            id: etudiant.id,
            matricule: etudiant.matricule,
            nom: etudiant.nom,
            prenom: etudiant.prenom,
            filiere: inscription.filieres?.code || 'N/A',
            niveau: inscription.niveaux?.code || 'N/A',
            moyenneGenerale: 0,
            credits: 0
          })
          return
        }

        let totalPointsSemestre = 0
        let totalCreditsSemestre = 0
        let totalCreditsValides = 0

        // Si un semestre est spécifié, calculer uniquement pour ce semestre
        const semestresACalculer = semestre && semestre !== 'TOUS' 
          ? [semestre] 
          : [...new Set(modules.map(m => m.semestre))]

        let meilleureMoyenne = 0
        let meilleurSemestre = null

        for (const semestreItem of semestresACalculer) {
          const modulesSemestre = modules.filter(m => m.semestre === semestreItem)
          let totalPointsSemestreItem = 0
          let totalCreditsSemestreItem = 0
          let creditsValidesSemestreItem = 0

          modulesSemestre.forEach(module => {
            const evaluationsConfig = parametresMap[`${module.id}_${semestreItem}`] || []
            const notesModule = notesEtudiant.filter(n => 
              n.module_id === module.id && 
              n.semestre === semestreItem
            )

            if (notesModule.length === 0 || evaluationsConfig.length === 0) return

            let totalPointsModule = 0
            let totalCoeffModule = 0

            evaluationsConfig.forEach(evaluation => {
              for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
                const evalId = `${evaluation.id}_${i}`
                const noteEntry = notesModule.find(n => n.evaluation_id === evalId)

                if (noteEntry) {
                  const noteSur20 = (noteEntry.valeur / evaluation.noteMax) * 20
                  totalPointsModule += noteSur20 * evaluation.coefficient
                  totalCoeffModule += evaluation.coefficient
                }
              }
            })

            if (totalCoeffModule > 0) {
              const moyenneModule = totalPointsModule / totalCoeffModule
              totalPointsSemestreItem += moyenneModule * module.credit
              totalCreditsSemestreItem += module.credit

              // Un module est validé si la moyenne >= 10
              if (moyenneModule >= 10) {
                creditsValidesSemestreItem += module.credit
              }
            }
          })

          if (totalCreditsSemestreItem > 0) {
            const moyenneSemestreItem = totalPointsSemestreItem / totalCreditsSemestreItem
            if (semestre && semestre !== 'TOUS') {
              meilleureMoyenne = moyenneSemestreItem
              totalCreditsSemestre = totalCreditsSemestreItem
              totalCreditsValides = creditsValidesSemestreItem
            } else {
              if (moyenneSemestreItem > meilleureMoyenne) {
                meilleureMoyenne = moyenneSemestreItem
                meilleurSemestre = semestreItem
                totalCreditsSemestre = totalCreditsSemestreItem
                totalCreditsValides = creditsValidesSemestreItem
              }
            }
          }
        }

        // Si un semestre ou niveau est spécifié et qu'il n'y a pas de moyenne calculée, ne pas inclure l'étudiant
        if ((semestre && semestre !== 'TOUS') || (niveau && niveau !== 'TOUS')) {
          if (meilleureMoyenne === 0) {
            return // Ne pas inclure les étudiants sans notes pour le semestre/niveau choisi
          }
        }

        etudiantsAvecMoyennes.push({
          id: etudiant.id,
          matricule: etudiant.matricule,
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          filiere: inscription.filieres?.code || 'N/A',
          niveau: inscription.niveaux?.code || 'N/A',
          moyenneGenerale: Math.round(meilleureMoyenne * 10) / 10,
          credits: totalCreditsValides || 0
        })
      })
    } else {
      // Aucune note trouvée
      // Si un filtre semestre ou niveau est actif, ne rien retourner
      if ((semestre && semestre !== 'TOUS') || (niveau && niveau !== 'TOUS')) {
        return {
          success: true,
          etudiants: []
        }
      }
      // Sinon, ne pas inclure les étudiants sans notes (on veut seulement ceux avec des notes)
    }

    // Filtrer les étudiants avec moyenne > 0 (on ne veut que ceux qui ont des notes)
    const etudiantsAvecNotes = etudiantsAvecMoyennes.filter(e => e.moyenneGenerale > 0)

    // Trier par moyenne décroissante
    etudiantsAvecNotes.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)

    // Limiter le nombre de résultats
    const etudiantsLimites = etudiantsAvecNotes.slice(0, limit)

    // Ajouter le rang
    etudiantsLimites.forEach((etudiant, index) => {
      etudiant.rang = index + 1
    })

    return {
      success: true,
      etudiants: etudiantsLimites
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs étudiants:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la récupération des meilleurs étudiants'
    }
  }
}
