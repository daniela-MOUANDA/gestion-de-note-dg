import { supabaseAdmin } from '../../lib/supabase.js'
import { getAllChefsDepartement } from '../chefDepartementService.js'
import { getAllDepartements } from '../departementService.js'

/**
 * Récupère les statistiques du dashboard pour le Directeur des Études Pédagogiques
 */
export const getDashboardStats = async () => {
  try {
    // 1. Paralléliser les requêtes initiales
    const [chefsResult, departementsResult] = await Promise.all([
      getAllChefsDepartement(),
      getAllDepartements()
    ])

    // Compter tous les chefs de département
    let totalChefsDepartement = 0
    if (chefsResult.success && chefsResult.chefs) {
      // Compter tous les chefs retournés
      totalChefsDepartement = chefsResult.chefs.length
    } else {
      // Fallback : requête directe si getAllChefsDepartement échoue
      try {
        const { data: roleChef } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('code', 'CHEF_DEPARTEMENT')
          .single()
        
        if (roleChef) {
          const { count } = await supabaseAdmin
            .from('utilisateurs')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', roleChef.id)
          
          totalChefsDepartement = count || 0
        }
      } catch (error) {
        console.error('Erreur lors du comptage direct des chefs:', error)
        totalChefsDepartement = 0
      }
    }
    const totalDepartements = departementsResult.success ? departementsResult.departements?.length || 0 : 0
    const departements = departementsResult.success ? departementsResult.departements || [] : []
    const departementIds = departements.map(d => d.id)

    // 2. Récupérer toutes les filières en une seule requête
    let filieres = []
    if (departementIds.length > 0) {
      const { data: filieresData } = await supabaseAdmin
        .from('filieres')
        .select('id, departement_id')
        .in('departement_id', departementIds)
      
      filieres = filieresData || []
    }
    const filiereIds = filieres.map(f => f.id)

    // 3. Paralléliser les requêtes de comptage
    const [
      totalEtudiantsResult,
      totalClassesResult,
      inscriptionsData
    ] = await Promise.all([
      // Total étudiants
      supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'INSCRIT'),
      // Total classes
      filiereIds.length > 0
        ? supabaseAdmin
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .in('filiere_id', filiereIds)
        : Promise.resolve({ count: 0 }),
      // Inscriptions avec filière pour répartition
      filiereIds.length > 0
        ? supabaseAdmin
            .from('inscriptions')
            .select('filiere_id')
            .in('filiere_id', filiereIds)
            .eq('statut', 'INSCRIT')
        : Promise.resolve({ data: [] })
    ])

    const totalEtudiants = totalEtudiantsResult.count || 0
    const totalClasses = totalClassesResult.count || 0

    // 4. Calculer la répartition des étudiants par département
    const repartitionEtudiants = departements.map(departement => {
      const filieresDept = filieres.filter(f => f.departement_id === departement.id)
      const filiereIdsDept = filieresDept.map(f => f.id)
      
      const nombreEtudiants = inscriptionsData.data
        ? inscriptionsData.data.filter(ins => filiereIdsDept.includes(ins.filiere_id)).length
        : 0

      return {
        departementId: departement.id,
        departementNom: departement.nom,
        departementCode: departement.code,
        nombreEtudiants
      }
    })

    // 5. Paralléliser les requêtes pour les graphiques et statistiques
    const [
      bulletinsResult,
      inscriptionsParMoisResults,
      niveauxResult
    ] = await Promise.all([
      // Taux de réussite global
      supabaseAdmin
        .from('bulletins')
        .select('moyenne_generale')
        .not('moyenne_generale', 'is', null)
        .limit(1000), // Limiter pour performance
      // Inscriptions par mois (6 derniers mois) - toutes en parallèle
      (() => {
        const moisActuel = new Date()
        const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        const promises = []
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(moisActuel.getFullYear(), moisActuel.getMonth() - i, 1)
          const moisDebut = date.toISOString().split('T')[0]
          const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
          
          promises.push(
            supabaseAdmin
              .from('inscriptions')
              .select('*', { count: 'exact', head: true })
              .gte('date_inscription', moisDebut)
              .lte('date_inscription', moisFin)
              .eq('statut', 'INSCRIT')
              .then(result => ({
                mois: moisNoms[date.getMonth()],
                inscriptions: result.count || 0
              }))
          )
        }
        return Promise.all(promises)
      })(),
      // Niveaux pour taux de réussite
      supabaseAdmin
        .from('niveaux')
        .select('id, code, nom')
        .order('code', { ascending: true })
    ])

    // 6. Calculer le taux de réussite global
    let tauxReussite = 0
    if (bulletinsResult.data && bulletinsResult.data.length > 0) {
      const moyennes = bulletinsResult.data
        .map(b => parseFloat(b.moyenne_generale))
        .filter(m => !isNaN(m) && m >= 0 && m <= 20)
      
      if (moyennes.length > 0) {
        const moyenneGlobale = moyennes.reduce((sum, m) => sum + m, 0) / moyennes.length
        tauxReussite = (moyenneGlobale / 20) * 100
      }
    }

    const inscriptionsParMois = inscriptionsParMoisResults || []

    // 7. Calculer le taux de réussite par niveau (basé sur les notes)
    const tauxReussiteParNiveau = []
    if (niveauxResult.data && niveauxResult.data.length > 0) {
      // Récupérer toutes les classes en une seule requête
      const niveauIds = niveauxResult.data.map(n => n.id)
      const { data: classesData } = await supabaseAdmin
        .from('classes')
        .select('id, niveau_id, filiere_id')
        .in('niveau_id', niveauIds)

      const classeIds = classesData ? classesData.map(c => c.id) : []
      const filiereIds = [...new Set(classesData ? classesData.map(c => c.filiere_id).filter(Boolean) : [])]

      // Récupérer toutes les inscriptions en une seule requête
      let inscriptionsParClasse = {}
      if (classeIds.length > 0) {
        const { data: inscriptionsData } = await supabaseAdmin
          .from('inscriptions')
          .select('etudiant_id, classe_id')
          .in('classe_id', classeIds)
          .eq('statut', 'INSCRIT')
        
        if (inscriptionsData) {
          inscriptionsData.forEach(ins => {
            if (!inscriptionsParClasse[ins.classe_id]) {
              inscriptionsParClasse[ins.classe_id] = []
            }
            inscriptionsParClasse[ins.classe_id].push(ins.etudiant_id)
          })
        }
      }

      // Récupérer les modules pour toutes les filières
      let modules = []
      if (filiereIds.length > 0) {
        const { data: modulesData } = await supabaseAdmin
          .from('modules')
          .select('id, code, nom, credit, semestre, filiere_id')
          .in('filiere_id', filiereIds)
        
        modules = modulesData || []
      }

      // Récupérer les paramètres de notation
      const moduleIds = modules.map(m => m.id)
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

      // Calculer les taux par niveau
      for (const niveau of niveauxResult.data) {
        const classesNiveau = classesData ? classesData.filter(c => c.niveau_id === niveau.id) : []
        const classeIdsNiveau = classesNiveau.map(c => c.id)
        
        if (classeIdsNiveau.length > 0) {
          // Récupérer tous les étudiants de ce niveau
          const etudiantsNiveau = new Set()
          classeIdsNiveau.forEach(classeId => {
            const etudiants = inscriptionsParClasse[classeId] || []
            etudiants.forEach(etudiantId => etudiantsNiveau.add(etudiantId))
          })
          
          if (etudiantsNiveau.size > 0) {
            const etudiantIds = Array.from(etudiantsNiveau)
            
            // Récupérer les modules pour les filières de ce niveau
            const filiereIdsNiveau = [...new Set(classesNiveau.map(c => c.filiere_id).filter(Boolean))]
            const modulesNiveau = modules.filter(m => filiereIdsNiveau.includes(m.filiere_id))
            const moduleIdsNiveau = modulesNiveau.map(m => m.id)
            
            if (moduleIdsNiveau.length > 0) {
              // Récupérer toutes les notes pour ces étudiants et modules
              const { data: notes } = await supabaseAdmin
                .from('notes')
                .select('etudiant_id, module_id, valeur, evaluation_id, classe_id, semestre')
                .in('etudiant_id', etudiantIds)
                .in('classe_id', classeIdsNiveau)
                .in('module_id', moduleIdsNiveau)
                .limit(10000)
              
              if (notes && notes.length > 0) {
                // Calculer les moyennes pour chaque étudiant
                const etudiantsAvecMoyenne = {}
                
                etudiantIds.forEach(etudiantId => {
                  const notesEtudiant = notes.filter(n => n.etudiant_id === etudiantId)
                  if (notesEtudiant.length === 0) return
                  
                  // Calculer la moyenne pour chaque semestre et prendre la meilleure
                  const semestres = [...new Set(modulesNiveau.map(m => m.semestre))]
                  let meilleureMoyenne = 0
                  
                  for (const semestre of semestres) {
                    const modulesSemestre = modulesNiveau.filter(m => m.semestre === semestre)
                    let totalPoints = 0
                    let totalCoeff = 0
                    
                    modulesSemestre.forEach(module => {
                      const evaluationsConfig = parametresMap[`${module.id}_${semestre}`] || []
                      const notesModule = notesEtudiant.filter(n => 
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
                        totalPoints += moyenneModule * module.credit
                        totalCoeff += module.credit
                      }
                    })
                    
                    if (totalCoeff > 0) {
                      const moyenneSemestre = totalPoints / totalCoeff
                      if (moyenneSemestre > meilleureMoyenne) {
                        meilleureMoyenne = moyenneSemestre
                      }
                    }
                  }
                  
                  if (meilleureMoyenne > 0) {
                    etudiantsAvecMoyenne[etudiantId] = meilleureMoyenne
                  }
                })
                
                // Calculer le taux de réussite (étudiants avec moyenne >= 10)
                const etudiantsReussis = Object.values(etudiantsAvecMoyenne).filter(m => m >= 10).length
                const totalEtudiantsAvecNotes = Object.keys(etudiantsAvecMoyenne).length
                
                if (totalEtudiantsAvecNotes > 0) {
                  const taux = (etudiantsReussis / totalEtudiantsAvecNotes) * 100
                  tauxReussiteParNiveau.push({
                    niveau: niveau.code,
                    taux: Math.round(taux * 10) / 10
                  })
                } else {
                  tauxReussiteParNiveau.push({
                    niveau: niveau.code,
                    taux: 0
                  })
                }
              } else {
                tauxReussiteParNiveau.push({
                  niveau: niveau.code,
                  taux: 0
                })
              }
            } else {
              tauxReussiteParNiveau.push({
                niveau: niveau.code,
                taux: 0
              })
            }
          } else {
            tauxReussiteParNiveau.push({
              niveau: niveau.code,
              taux: 0
            })
          }
        } else {
          tauxReussiteParNiveau.push({
            niveau: niveau.code,
            taux: 0
          })
        }
      }
    }

    return {
      success: true,
      stats: {
        totalChefsDepartement,
        totalDepartements,
        totalEtudiants: totalEtudiants || 0,
        totalClasses,
        tauxReussite: Math.round(tauxReussite * 10) / 10, // Arrondir à 1 décimale
        repartitionEtudiants,
        inscriptionsParMois,
        tauxReussiteParNiveau
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la récupération des statistiques'
    }
  }
}
