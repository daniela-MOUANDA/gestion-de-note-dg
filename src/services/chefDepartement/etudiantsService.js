import { supabaseAdmin } from '../../lib/supabase.js'
import { calculerMoyenneGenerale } from '../scolarite/calculationService.js'
import { getScopedFilieresForDepartement } from './filiereScopeService.js'

/**
 * Récupère tous les étudiants d'un département avec leurs moyennes générales pour le Chef de Département
 */
export const getEtudiantsParDepartement = async (departementId, page = 1, limit = 10, filters = {}) => {
  try {
    const { filiere, niveau, semestre, search } = filters

    const filieresBrutes = await getScopedFilieresForDepartement(departementId)
    const filieres = (filieresBrutes || []).filter((f) => f.type_filiere !== 'groupe')

    const departementCode = filieres && filieres.length > 0 ? filieres[0].departements?.code : ''

    if (!filieres || filieres.length === 0) {
      return {
        success: true,
        etudiants: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }

    const filiereIds = filieres.map(f => f.id)

    // 2. Récupérer toutes les inscriptions actives des filières du département
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
          telephone,
          date_naissance,
          lieu_naissance
        ),
        filieres (
          id,
          code,
          nom,
          departement_id
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
      .in('filiere_id', filiereIds)
      .eq('statut', 'INSCRIT')

    // Appliquer les filtres
    if (filiere && filiere !== 'TOUS') {
      const filiereData = filieres.find(f => f.code === filiere)
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
        etudiants: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }

    // 3. Filtrer par recherche si nécessaire
    let inscriptionsFiltrees = inscriptions
    if (search) {
      const searchLower = search.toLowerCase()
      inscriptionsFiltrees = inscriptions.filter(ins => {
        const etudiant = ins.etudiants
        if (!etudiant) return false
        return (
          etudiant.matricule?.toLowerCase().includes(searchLower) ||
          etudiant.nom?.toLowerCase().includes(searchLower) ||
          etudiant.prenom?.toLowerCase().includes(searchLower) ||
          `${etudiant.prenom} ${etudiant.nom}`.toLowerCase().includes(searchLower)
        )
      })
    }

    // 4. Calculer les moyennes et crédits pour chaque étudiant selon le semestre
    const etudiantIds = inscriptionsFiltrees
      .map(ins => ins.etudiants?.id)
      .filter(Boolean)
      .slice(0, 1000) // Limiter pour performance

    // Récupérer les classes pour calculer les moyennes
    const classeIds = [...new Set(inscriptionsFiltrees.map(ins => ins.classe_id).filter(Boolean))]

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
    const moyennesMap = {}
    const creditsMap = {}

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
      Object.keys(notesParEtudiant).forEach(etudiantId => {
        const notesEtudiant = notesParEtudiant[etudiantId]
        let totalPointsSemestre = 0
        let totalCreditsSemestre = 0
        let totalCreditsValides = 0

        // Si un semestre est spécifié, calculer uniquement pour ce semestre
        const semestresACalculer = semestre && semestre !== 'TOUS'
          ? [semestre]
          : [...new Set(modules.map(m => m.semestre))]

        let meilleureMoyenne = 0

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
            // Récupérer le code de la filière pour cet étudiant (celui de son inscription)
            const currentInscription = inscriptionsFiltrees.find(ins => ins.etudiants?.id === etudiantId)
            const fCode = currentInscription?.filieres?.code || ''

            // Calculer la moyenne du semestre via le service centralisé
            const moyenneSemestreItem = calculerMoyenneGenerale(
              totalPointsSemestreItem,
              totalCreditsSemestreItem,
              totalCreditsSemestreItem,
              departementCode,
              fCode
            )

            if (semestre && semestre !== 'TOUS') {
              // Pour un semestre spécifique, utiliser cette moyenne
              meilleureMoyenne = moyenneSemestreItem
              totalCreditsSemestre = totalCreditsSemestreItem
              totalCreditsValides = creditsValidesSemestreItem
            } else {
              // Pour tous les semestres, prendre la meilleure moyenne
              if (moyenneSemestreItem > meilleureMoyenne) {
                meilleureMoyenne = moyenneSemestreItem
              }
              totalCreditsSemestre += totalCreditsSemestreItem
              totalCreditsValides += creditsValidesSemestreItem
            }
          }
        }

        moyennesMap[etudiantId] = meilleureMoyenne
        creditsMap[etudiantId] = semestre && semestre !== 'TOUS'
          ? totalCreditsValides
          : totalCreditsValides
      })
    }

    // 5. Construire la liste des étudiants avec leurs moyennes et crédits
    const etudiantsAvecMoyennes = inscriptionsFiltrees
      .map(inscription => {
        const etudiant = inscription.etudiants
        if (!etudiant) return null

        return {
          id: etudiant.id,
          matricule: etudiant.matricule,
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          email: etudiant.email,
          telephone: etudiant.telephone,
          dateNaissance: etudiant.date_naissance,
          lieuNaissance: etudiant.lieu_naissance,
          sexe: etudiant.sexe || null,
          filiere: inscription.filieres?.code || 'N/A',
          niveau: inscription.niveaux?.code || 'N/A',
          classe: inscription.classes?.code || 'N/A',
          moyenneGenerale: Math.round((moyennesMap[etudiant.id] || 0) * 10) / 10,
          credits: creditsMap[etudiant.id] || 0,
          statut: inscription.statut === 'INSCRIT' ? 'Actif' : 'Inactif'
        }
      })
      .filter(e => e !== null)

    // Filtrer les nulls
    const etudiantsValides = etudiantsAvecMoyennes.filter(e => e !== null)

    // Trier par moyenne décroissante
    etudiantsValides.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)

    // Pagination
    const total = etudiantsValides.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const etudiantsPage = etudiantsValides.slice(startIndex, endIndex)

    return {
      success: true,
      etudiants: etudiantsPage,
      total,
      page,
      totalPages,
      limit
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la récupération des étudiants'
    }
  }
}

/**
 * Récupère les détails complets d'un étudiant (même fonction que pour le DEP)
 */
export const getEtudiantDetailsChef = async (etudiantId, departementId, semestre = null) => {
  try {
    // Vérifier que l'étudiant appartient au département
    const { data: inscriptionsCheck } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        filiere_id,
        filieres!inner(departement_id)
      `)
      .eq('etudiant_id', etudiantId)
      .eq('statut', 'INSCRIT')
      .eq('filieres.departement_id', departementId)
      .limit(1)

    if (!inscriptionsCheck || inscriptionsCheck.length === 0) {
      return {
        success: false,
        error: 'Étudiant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Récupérer les informations de l'étudiant
    const { data: etudiant, error: etudiantError } = await supabaseAdmin
      .from('etudiants')
      .select('*')
      .eq('id', etudiantId)
      .single()

    if (etudiantError || !etudiant) {
      return {
        success: false,
        error: 'Étudiant introuvable'
      }
    }

    // Récupérer les inscriptions de l'étudiant dans ce département
    const { data: inscriptions } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        filieres!inner(id, code, nom, departement_id, departements(code)),
        niveaux (id, code, nom),
        classes (id, code, nom)
      `)
      .eq('etudiant_id', etudiantId)
      .eq('statut', 'INSCRIT')
      .eq('filieres.departement_id', departementId)

    // Calculer la moyenne générale et les crédits validés pour le semestre spécifié
    let moyenneGenerale = 0
    let totalCredits = 0
    let creditsValides = 0

    if (inscriptions && inscriptions.length > 0) {
      const filiereIds = [...new Set(inscriptions.map(i => i.filiere_id))]
      const classeIds = [...new Set(inscriptions.map(i => i.classe_id))]

      // Si un semestre est spécifié, filtrer les modules par ce semestre
      let modulesQuery = supabaseAdmin
        .from('modules')
        .select('id, code, nom, credit, semestre, filiere_id')
        .in('filiere_id', filiereIds)

      if (semestre && semestre !== 'TOUS') {
        modulesQuery = modulesQuery.eq('semestre', semestre)
      }

      const { data: modules } = await modulesQuery

      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id)
        const { data: parametresList } = await supabaseAdmin
          .from('parametres_notation')
          .select('module_id, evaluations, semestre')
          .in('module_id', moduleIds)

        const parametresMap = {}
        if (parametresList) {
          parametresList.forEach(p => {
            parametresMap[`${p.module_id}_${p.semestre}`] = p.evaluations || []
          })
        }

        // Filtrer les notes par semestre si spécifié
        let notesQuery = supabaseAdmin
          .from('notes')
          .select('module_id, valeur, evaluation_id, classe_id, semestre')
          .eq('etudiant_id', etudiantId)
          .in('classe_id', classeIds)
          .in('module_id', moduleIds)

        if (semestre && semestre !== 'TOUS') {
          notesQuery = notesQuery.eq('semestre', semestre)
        }

        const { data: notes } = await notesQuery.limit(5000)

        if (notes && notes.length > 0) {
          // Si un semestre est spécifié, calculer uniquement pour ce semestre
          if (semestre && semestre !== 'TOUS') {
            const modulesSemestre = modules.filter(m => m.semestre === semestre)
            let totalPointsSemestre = 0
            let totalCreditsSemestre = 0
            let creditsValidesSemestre = 0

            modulesSemestre.forEach(module => {
              const evaluationsConfig = parametresMap[`${module.id}_${semestre}`] || []
              const notesModule = notes.filter(n =>
                n.module_id === module.id &&
                n.semestre === semestre
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
                totalPointsSemestre += moyenneModule * module.credit
                totalCreditsSemestre += module.credit

                // Un module est validé si la moyenne >= 10
                if (moyenneModule >= 10) {
                  creditsValidesSemestre += module.credit
                }
              }
            })

            if (totalCreditsSemestre > 0) {
              const dCode = (inscriptions[0].filieres?.departements?.code || '')
              const fCode = (inscriptions[0].filieres?.code || '')

              moyenneGenerale = calculerMoyenneGenerale(
                totalPointsSemestre,
                totalCreditsSemestre,
                totalCreditsSemestre,
                dCode,
                fCode
              )

              totalCredits = totalCreditsSemestre
              creditsValides = creditsValidesSemestre
            } else {
              // Aucune note pour ce semestre, moyenne = 0
              moyenneGenerale = 0
              totalCredits = 0
              creditsValides = 0
            }
          } else {
            // Pas de filtre semestre, prendre la meilleure moyenne parmi tous les semestres
            const semestres = [...new Set(modules.map(m => m.semestre))]
            let meilleureMoyenne = 0
            let meilleurSemestre = null

            for (const semestreItem of semestres) {
              const modulesSemestre = modules.filter(m => m.semestre === semestreItem)
              let totalPointsSemestre = 0
              let totalCreditsSemestre = 0
              let creditsValidesSemestre = 0

              modulesSemestre.forEach(module => {
                const evaluationsConfig = parametresMap[`${module.id}_${semestreItem}`] || []
                const notesModule = notes.filter(n =>
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
                  totalPointsSemestre += moyenneModule * module.credit
                  totalCreditsSemestre += module.credit

                  // Un module est validé si la moyenne >= 10
                  if (moyenneModule >= 10) {
                    creditsValidesSemestre += module.credit
                  }
                }
              })

              if (totalCreditsSemestre > 0) {
                const dCode = (inscriptions[0].filieres?.departements?.code || '')
                const fCode = (inscriptions[0].filieres?.code || '')

                const moyenneSemestre = calculerMoyenneGenerale(
                  totalPointsSemestre,
                  totalCreditsSemestre,
                  totalCreditsSemestre,
                  dCode,
                  fCode
                )

                if (moyenneSemestre > meilleureMoyenne) {
                  meilleureMoyenne = moyenneSemestre
                  meilleurSemestre = semestreItem
                  creditsValides = creditsValidesSemestre
                }
                totalCredits += totalCreditsSemestre
              }
            }

            moyenneGenerale = meilleureMoyenne
          }
        } else {
          // Aucune note trouvée
          moyenneGenerale = 0
          totalCredits = 0
        }
      }
    }

    return {
      success: true,
      etudiant: {
        ...etudiant,
        dateNaissance: etudiant.date_naissance || etudiant.dateNaissance,
        lieuNaissance: etudiant.lieu_naissance || etudiant.lieuNaissance,
        sexe: etudiant.sexe || null,
        inscriptions: inscriptions || [],
        moyenneGenerale: Math.round(moyenneGenerale * 10) / 10,
        totalCredits: creditsValides || 0 // Crédits validés (moyenne >= 10)
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'étudiant:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la récupération des détails'
    }
  }
}
