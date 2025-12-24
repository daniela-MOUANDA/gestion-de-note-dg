import { supabaseAdmin } from '../../lib/supabase.js'

/**
 * Récupère les statistiques complètes pour le DEP
 * Basé sur les sections disponibles : Chefs de Département, Départements, Visas, Étudiants
 */
export const getStatistiquesDEP = async () => {
  try {
    // 1. Statistiques sur les Chefs de Département
    // Récupérer le rôle CHEF_DEPARTEMENT
    const { data: roleChef } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'CHEF_DEPARTEMENT')
      .single()

    let chefs = []
    if (roleChef) {
      const { data: utilisateurs } = await supabaseAdmin
        .from('utilisateurs')
        .select(`
          id,
          departement_id,
          departements (
            id,
            nom
          )
        `)
        .eq('role_id', roleChef.id)
      
      chefs = utilisateurs || []
    }

    const repartitionChefsParDepartement = {}
    if (chefs && chefs.length > 0) {
      chefs.forEach(chef => {
        const depNom = chef.departements?.nom || 'Non assigné'
        repartitionChefsParDepartement[depNom] = (repartitionChefsParDepartement[depNom] || 0) + 1
      })
    }

    const repartitionChefsArray = Object.entries(repartitionChefsParDepartement).map(([nom, count]) => ({
      name: nom,
      value: count,
      color: getColorForIndex(Object.keys(repartitionChefsParDepartement).indexOf(nom))
    }))

    // 2. Statistiques sur les Départements
    const { data: departements } = await supabaseAdmin
      .from('departements')
      .select('id, nom')

    // Récupérer les filières par département
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id, code, nom, departement_id')

    const filieresParDepartement = {}
    if (filieres) {
      filieres.forEach(filiere => {
        const depId = filiere.departement_id
        if (!filieresParDepartement[depId]) {
          filieresParDepartement[depId] = []
        }
        filieresParDepartement[depId].push(filiere)
      })
    }

    // Récupérer les étudiants par département
    const { data: inscriptions } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        filiere_id,
        filieres (
          departement_id,
          departements (
            nom
          )
        )
      `)
      .eq('statut', 'INSCRIT')

    const etudiantsParDepartement = {}
    if (inscriptions) {
      inscriptions.forEach(ins => {
        const depNom = ins.filieres?.departements?.nom || 'Non assigné'
        etudiantsParDepartement[depNom] = (etudiantsParDepartement[depNom] || 0) + 1
      })
    }

    const repartitionEtudiantsParDepartement = Object.entries(etudiantsParDepartement).map(([nom, count]) => ({
      name: nom,
      value: count,
      color: getColorForIndex(Object.keys(etudiantsParDepartement).indexOf(nom))
    }))

    // 3. Statistiques sur les Visas & Documents (Bulletins)
    const { data: bulletinsEnAttente } = await supabaseAdmin
      .from('bulletins')
      .select('id, date_generation, statut_visa')
      .eq('statut_visa', 'EN_ATTENTE')

    const { data: bulletinsVises } = await supabaseAdmin
      .from('bulletins')
      .select('id, date_visa, statut_visa')
      .eq('statut_visa', 'VISE')
      .not('date_visa', 'is', null)

    // Bulletins visés par mois (6 derniers mois)
    const maintenant = new Date()
    const sixMois = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
      sixMois.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
        annee: date.getFullYear(),
        moisNum: date.getMonth() + 1
      })
    }

    const bulletinsVisesParMois = sixMois.map(({ mois, annee, moisNum }) => {
      const count = bulletinsVises?.filter(b => {
        if (!b.date_visa) return false
        const dateVisa = new Date(b.date_visa)
        return dateVisa.getFullYear() === annee && dateVisa.getMonth() + 1 === moisNum
      }).length || 0

      return {
        mois: mois.charAt(0).toUpperCase() + mois.slice(1),
        vises: count
      }
    })

    // 4. Statistiques sur les Étudiants
    // Répartition par niveau
    const { data: inscriptionsAvecNiveau } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        niveau_id,
        niveaux (
          code,
          nom
        )
      `)
      .eq('statut', 'INSCRIT')

    const repartitionParNiveau = {}
    if (inscriptionsAvecNiveau) {
      inscriptionsAvecNiveau.forEach(ins => {
        const niveauCode = ins.niveaux?.code || 'N/A'
        repartitionParNiveau[niveauCode] = (repartitionParNiveau[niveauCode] || 0) + 1
      })
    }

    const repartitionParNiveauArray = Object.entries(repartitionParNiveau).map(([code, count]) => ({
      niveau: code,
      etudiants: count,
      color: getColorForNiveau(code)
    }))

    // Répartition par filière
    const repartitionParFiliere = {}
    if (inscriptions) {
      inscriptions.forEach(ins => {
        const filiere = ins.filieres
        if (filiere) {
          const code = filiere.code || 'Autres'
          repartitionParFiliere[code] = (repartitionParFiliere[code] || 0) + 1
        }
      })
    }

    const repartitionParFiliereArray = Object.entries(repartitionParFiliere)
      .map(([code, count]) => ({
        name: code,
        value: count,
        color: getColorForFiliere(code)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Taux de réussite par niveau (basé sur les notes réelles)
    const { data: niveaux } = await supabaseAdmin
      .from('niveaux')
      .select('id, code, nom')
      .order('code')

    // Récupérer toutes les classes en une seule requête
    const { data: toutesClasses } = await supabaseAdmin
      .from('classes')
      .select('id, niveau_id, filiere_id')

    // Récupérer toutes les filières
    const filiereIds = [...new Set((toutesClasses || []).map(c => c.filiere_id).filter(Boolean))]
    const { data: toutesFilieres } = filiereIds.length > 0
      ? await supabaseAdmin
          .from('filieres')
          .select('id')
          .in('id', filiereIds)
      : { data: [] }

    // Récupérer tous les modules
    const { data: tousModules } = filiereIds.length > 0
      ? await supabaseAdmin
          .from('modules')
          .select('id, code, nom, credit, semestre, filiere_id')
          .in('filiere_id', filiereIds)
      : { data: [] }

    // Récupérer tous les paramètres de notation
    const moduleIds = (tousModules || []).map(m => m.id)
    const { data: tousParametres } = moduleIds.length > 0
      ? await supabaseAdmin
          .from('parametres_notation')
          .select('module_id, evaluations, semestre')
          .in('module_id', moduleIds)
      : { data: [] }

    const parametresMap = {}
    if (tousParametres) {
      tousParametres.forEach(p => {
        parametresMap[`${p.module_id}_${p.semestre}`] = p.evaluations || []
      })
    }

    const tauxReussiteParNiveau = await Promise.all(
      (niveaux || []).map(async (niveau) => {
        const classesNiveau = (toutesClasses || []).filter(c => c.niveau_id === niveau.id)
        const classeIdsNiveau = classesNiveau.map(c => c.id)

        if (classeIdsNiveau.length === 0) {
          return {
            niveau: niveau.code,
            taux: 0
          }
        }

        // Récupérer les inscriptions
        const { data: inscriptionsNiveau } = await supabaseAdmin
          .from('inscriptions')
          .select('etudiant_id, classe_id')
          .in('classe_id', classeIdsNiveau)
          .eq('statut', 'INSCRIT')

        if (!inscriptionsNiveau || inscriptionsNiveau.length === 0) {
          return {
            niveau: niveau.code,
            taux: 0
          }
        }

        const etudiantIds = [...new Set(inscriptionsNiveau.map(i => i.etudiant_id))]

        // Récupérer les modules pour les filières de ce niveau
        const filiereIdsNiveau = [...new Set(classesNiveau.map(c => c.filiere_id).filter(Boolean))]
        const modulesNiveau = (tousModules || []).filter(m => filiereIdsNiveau.includes(m.filiere_id))
        const moduleIdsNiveau = modulesNiveau.map(m => m.id)

        if (moduleIdsNiveau.length === 0) {
          return {
            niveau: niveau.code,
            taux: 0
          }
        }

        // Récupérer toutes les notes pour ces étudiants et modules
        const { data: notes } = await supabaseAdmin
          .from('notes')
          .select('etudiant_id, module_id, valeur, evaluation_id, classe_id, semestre')
          .in('etudiant_id', etudiantIds)
          .in('classe_id', classeIdsNiveau)
          .in('module_id', moduleIdsNiveau)
          .limit(10000)

        if (!notes || notes.length === 0) {
          return {
            niveau: niveau.code,
            taux: 0
          }
        }

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

        return {
          niveau: niveau.code,
          taux: totalEtudiantsAvecNotes > 0 ? Math.round((etudiantsReussis / totalEtudiantsAvecNotes) * 100 * 10) / 10 : 0
        }
      })
    )

    // Taux de réussite par filière (basé sur les notes réelles)
    // Utiliser toutes les filières qui ont soit des classes, soit des étudiants inscrits
    const filieresAvecDonnees = (filieres || []).filter(f => {
      // Vérifier si cette filière a des classes
      const classesFiliere = (toutesClasses || []).filter(c => c.filiere_id === f.id)
      // OU si elle a des étudiants inscrits (d'après repartitionParFiliere)
      const aDesEtudiants = (repartitionParFiliere[f.code] || 0) > 0
      // OU si elle a des modules (donc potentiellement des notes)
      const aDesModules = (tousModules || []).some(m => m.filiere_id === f.id)
      return classesFiliere.length > 0 || aDesEtudiants || aDesModules
    }).slice(0, 10)

    const tauxReussiteParFiliereRaw = await Promise.all(
      filieresAvecDonnees.map(async (filiere) => {
        const filiereCode = filiere.code

        // Récupérer les classes de cette filière
        const { data: classesFiliere } = await supabaseAdmin
          .from('classes')
          .select('id')
          .eq('filiere_id', filiere.id)

        if (!classesFiliere || classesFiliere.length === 0) {
          return {
            filiere: filiereCode,
            taux: 0
          }
        }

        const classeIds = classesFiliere.map(c => c.id)

        // Récupérer les inscriptions
        const { data: inscriptionsFiliere } = await supabaseAdmin
          .from('inscriptions')
          .select('etudiant_id, classe_id')
          .in('classe_id', classeIds)
          .eq('statut', 'INSCRIT')

        if (!inscriptionsFiliere || inscriptionsFiliere.length === 0) {
          return {
            filiere: filiereCode,
            taux: 0
          }
        }

        const etudiantIds = [...new Set(inscriptionsFiliere.map(i => i.etudiant_id))]

        // Récupérer les modules de cette filière
        const modulesFiliere = (tousModules || []).filter(m => m.filiere_id === filiere.id)
        const moduleIdsFiliere = modulesFiliere.map(m => m.id)

        if (moduleIdsFiliere.length === 0) {
          return {
            filiere: filiereCode,
            taux: 0
          }
        }

        // Récupérer toutes les notes pour ces étudiants et modules
        // Note: Les notes peuvent être liées via classe_id OU directement via module_id
        // On ne filtre pas par classe_id dans la requête car certaines notes peuvent ne pas avoir de classe_id
        const { data: notes } = await supabaseAdmin
          .from('notes')
          .select('etudiant_id, module_id, valeur, evaluation_id, classe_id, semestre')
          .in('etudiant_id', etudiantIds)
          .in('module_id', moduleIdsFiliere)
          .limit(10000)

        // Filtrer les notes pour ne garder que celles qui correspondent aux classes de cette filière
        // Si classe_id est null, on accepte quand même (notes peuvent être sans classe_id mais liées via module_id)
        const notesFiltrees = notes ? notes.filter(n => 
          !n.classe_id || classeIds.includes(n.classe_id)
        ) : []

        if (!notesFiltrees || notesFiltrees.length === 0) {
          return {
            filiere: filiereCode,
            taux: 0,
            etudiantsAvecNotes: 0,
            etudiantsReussis: 0
          }
        }

        // Calculer les moyennes pour chaque étudiant
        const etudiantsAvecMoyenne = {}
        
        etudiantIds.forEach(etudiantId => {
          const notesEtudiant = notesFiltrees.filter(n => n.etudiant_id === etudiantId)
          if (notesEtudiant.length === 0) return
          
          // Calculer la moyenne pour chaque semestre et prendre la meilleure
          const semestres = [...new Set(modulesFiliere.map(m => m.semestre))]
          let meilleureMoyenne = 0
          
          for (const semestre of semestres) {
            const modulesSemestre = modulesFiliere.filter(m => m.semestre === semestre)
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

        const taux = totalEtudiantsAvecNotes > 0 
          ? Math.round((etudiantsReussis / totalEtudiantsAvecNotes) * 100 * 10) / 10 
          : 0

        return {
          filiere: filiereCode,
          taux: taux,
          etudiantsAvecNotes: totalEtudiantsAvecNotes,
          etudiantsReussis: etudiantsReussis
        }
      })
    )

    // Filtrer et retourner uniquement les filières avec des données (taux > 0 ou étudiants avec notes)
    const tauxReussiteParFiliere = tauxReussiteParFiliereRaw.filter(f => 
      f.taux > 0 || (f.etudiantsAvecNotes && f.etudiantsAvecNotes > 0)
    )

    return {
      success: true,
      data: {
        // Chefs de Département
        totalChefs: chefs?.length || 0,
        repartitionChefsParDepartement: repartitionChefsArray,
        
        // Départements
        totalDepartements: departements?.length || 0,
        repartitionEtudiantsParDepartement: repartitionEtudiantsParDepartement,
        filieresParDepartement: Object.entries(filieresParDepartement).map(([depId, fils]) => {
          const dep = departements?.find(d => d.id === depId)
          return {
            departement: dep?.nom || 'Inconnu',
            nombreFilieres: fils.length
          }
        }),
        
        // Visas & Documents
        bulletinsEnAttente: bulletinsEnAttente?.length || 0,
        bulletinsVisesTotal: bulletinsVises?.length || 0,
        bulletinsVisesParMois: bulletinsVisesParMois,
        
        // Étudiants
        totalEtudiants: inscriptions?.length || 0,
        repartitionParNiveau: repartitionParNiveauArray,
        repartitionParFiliere: repartitionParFiliereArray,
        tauxReussiteParNiveau: tauxReussiteParNiveau,
        tauxReussiteParFiliere: tauxReussiteParFiliere
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la récupération des statistiques'
    }
  }
}

/**
 * Fonction utilitaire pour obtenir une couleur selon l'index
 */
function getColorForIndex(index) {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f97316']
  return colors[index % colors.length]
}

/**
 * Fonction utilitaire pour obtenir une couleur selon la filière
 */
function getColorForFiliere(code) {
  const colors = {
    'GI': '#3b82f6',
    'RT': '#8b5cf6',
    'Réseaux': '#10b981',
    'Autres': '#f59e0b'
  }
  return colors[code] || getColorForIndex(Math.floor(Math.random() * 8))
}

/**
 * Fonction utilitaire pour obtenir une couleur selon le niveau
 */
function getColorForNiveau(code) {
  const colors = {
    'L1': '#3b82f6',
    'L2': '#10b981',
    'L3': '#f59e0b'
  }
  return colors[code] || '#8b5cf6'
}

