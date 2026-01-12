import { supabaseAdmin } from '../../lib/supabase.js'

export const getBulletinData = async (classeId, semestre, departementId) => {
    try {
        console.log('DEBUG: getBulletinData v4 START', { classeId, semestre, departementId })

        // 1. Récupérer la classe pour obtenir sa filière et son niveau
        const { data: classe, error: classeError } = await supabaseAdmin
            .from('classes')
            .select('*, filieres(id, code, nom, departements(code)), niveaux(code)')
            .eq('id', classeId)
            .single()

        if (classeError || !classe) {
            throw new Error('Classe introuvable')
        }

        const filiereId = classe.filiere_id
        const niveauCode = classe.niveaux?.code

        console.log('DEBUG: Classe récupérée:', {
            id: classe.id,
            nom: classe.nom,
            filiereId,
            niveauCode,
            filiere: classe.filieres
        })

        // Vérifier la correspondance niveau-semestre
        const correspondanceNiveauSemestre = {
            'L1': ['S1', 'S2'],
            'L2': ['S3', 'S4'],
            'L3': ['S5', 'S6']
        }

        const semestresAutorises = correspondanceNiveauSemestre[niveauCode] || []
        if (!semestresAutorises.includes(semestre)) {
            console.log(`⚠️ Semestre ${semestre} non autorisé pour niveau ${niveauCode}`)
            return {
                success: false,
                error: `Le semestre ${semestre} n'est pas autorisé pour une classe de ${niveauCode}`
            }
        }

        // 2. Récupérer les étudiants
        console.log('DEBUG: Querying inscriptions...')
        const { data: inscriptions, error: errorInscriptions } = await supabaseAdmin
            .from('inscriptions')
            .select('*, etudiants(*)')
            .eq('classe_id', classeId)
            .eq('statut', 'INSCRIT') // Seulement les inscriptions validées

        if (errorInscriptions) {
            console.error('DEBUG: Inscriptions error', errorInscriptions)
            throw errorInscriptions
        }
        console.log('DEBUG: Inscriptions found', inscriptions?.length)
        if (inscriptions && inscriptions.length > 0) {
            console.log('DEBUG: Exemple inscription:', {
                id: inscriptions[0].id,
                statut: inscriptions[0].statut,
                etudiant: inscriptions[0].etudiants ? 'présent' : 'absent'
            })
        }

        // Extraire la liste des étudiants
        const etudiants = inscriptions
            .map(i => i.etudiants)
            .filter(e => e !== null && e !== undefined) // Filtrer seulement les null/undefined
            .filter(e => e.actif !== false) // Garder ceux qui sont actifs ou sans champ actif
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))

        console.log('DEBUG: Étudiants actifs trouvés', etudiants.length)
        if (etudiants.length > 0) {
            console.log('DEBUG: Exemples étudiants:', etudiants.slice(0, 3).map(e => `${e.nom} ${e.prenom} (${e.matricule})`))
        } else if (inscriptions && inscriptions.length > 0) {
            console.log('⚠️ Des inscriptions existent mais aucun étudiant actif trouvé')
            console.log('DEBUG: Étudiants dans inscriptions:', inscriptions.map(i => i.etudiants ? `${i.etudiants.nom} (actif: ${i.etudiants.actif})` : 'null'))
        }

        console.log('DEBUG: Étudiants actifs trouvés', etudiants.length)
        console.log('DEBUG: Filière ID', filiereId)
        console.log('DEBUG: Département ID', departementId)
        console.log('DEBUG: Semestre', semestre)

        // 3. Récupérer les modules de la filière et du semestre
        console.log('DEBUG: Recherche modules avec:', { semestre, filiereId, departementId })
        const { data: modules, error: errorModules } = await supabaseAdmin
            .from('modules')
            .select('id, code, nom, credit, semestre, filiere_id, departement_id, ue, nom_ue')
            .eq('semestre', semestre)
            .eq('filiere_id', filiereId)
            .eq('departement_id', departementId)

        if (errorModules) {
            console.error('DEBUG: Error modules', errorModules)
            throw errorModules
        }
        console.log('DEBUG: Modules found', modules?.length)
        if (modules && modules.length > 0) {
            // Trier les modules par UE : UE1 d'abord, puis UE2
            modules.sort((a, b) => {
                const ueA = (a.ue || 'UE1').toUpperCase()
                const ueB = (b.ue || 'UE1').toUpperCase()
                if (ueA === ueB) {
                    // Si même UE, trier par code
                    return (a.code || '').localeCompare(b.code || '')
                }
                // UE1 avant UE2
                return ueA === 'UE1' ? -1 : 1
            })
            console.log('DEBUG: Modules codes (triés par UE):', modules.map(m => `${m.code} (UE: ${m.ue || 'UE1'}, filiere: ${m.filiere_id})`))
        } else {
            // Vérifier s'il y a des modules pour ce semestre mais d'une autre filière
            const { data: modulesAutreFiliere } = await supabaseAdmin
                .from('modules')
                .select('id, code, nom, filiere_id')
                .eq('semestre', semestre)
                .eq('departement_id', departementId)

            console.log(`DEBUG: Modules trouvés pour semestre ${semestre} et département ${departementId}:`, modulesAutreFiliere?.length || 0)
            if (modulesAutreFiliere && modulesAutreFiliere.length > 0) {
                console.log('DEBUG: Modules disponibles (autres filières):', modulesAutreFiliere.map(m => `${m.code} (filiere: ${m.filiere_id})`))
            }
        }

        // Si aucun étudiant, retourner un tableau vide avec métadonnées
        if (!etudiants || etudiants.length === 0) {
            console.log('DEBUG: Aucun étudiant trouvé')
            return {
                success: true,
                data: [],
                meta: {
                    semestre,
                    evaluationsConfig: [],
                    modulesCount: modules?.length || 0,
                    etudiantsCount: 0,
                    notesCount: 0,
                    parametresCount: 0,
                    etudiantsAvecNotes: 0,
                    etudiantsSansNotes: 0
                }
            }
        }

        // Si aucun module trouvé pour la filière, essayer de récupérer les modules utilisés dans les notes
        if (!modules || modules.length === 0) {
            console.log('DEBUG: Aucun module trouvé pour cette filière et ce semestre')
            // Récupérer les notes pour identifier les modules utilisés
            const { data: notesCheck, error: notesError } = await supabaseAdmin
                .from('notes')
                .select('module_id, modules(id, code, nom, credit, filiere_id, ue, nom_ue)')
                .eq('classe_id', classeId)
                .eq('semestre', semestre)

            if (!notesError && notesCheck && notesCheck.length > 0) {
                // Récupérer les modules uniques utilisés dans les notes
                const moduleIdsUtilises = [...new Set(notesCheck.map(n => n.module_id).filter(Boolean))]
                const modulesUtilises = notesCheck
                    .map(n => n.modules)
                    .filter((m, index, self) => m && index === self.findIndex(mm => mm?.id === m.id))

                console.log('DEBUG: Notes trouvées mais modules non trouvés pour la filière. Modules utilisés dans les notes:', modulesUtilises.map(m => `${m.code} (filiere: ${m.filiere_id})`))

                // Utiliser les modules trouvés dans les notes
                if (modulesUtilises.length > 0) {
                    console.log('DEBUG: Utilisation des modules trouvés dans les notes au lieu des modules de la filière')
                    // Récupérer les modules avec leur UE
                    const { data: modulesAvecUE } = await supabaseAdmin
                        .from('modules')
                        .select('id, code, nom, credit, ue')
                        .in('id', moduleIdsUtilises)

                    modules = modulesUtilises.map(m => {
                        const moduleAvecUE = modulesAvecUE?.find(mm => mm.id === m.id)
                        return {
                            id: m.id,
                            code: m.code,
                            nom: m.nom,
                            credit: m.credit || 0,
                            semestre: semestre,
                            filiere_id: m.filiere_id,
                            departement_id: departementId,
                            ue: moduleAvecUE?.ue || 'UE1'
                        }
                    })

                    // Trier par UE
                    modules.sort((a, b) => {
                        const ueA = (a.ue || 'UE1').toUpperCase()
                        const ueB = (b.ue || 'UE1').toUpperCase()
                        if (ueA === ueB) {
                            return (a.code || '').localeCompare(b.code || '')
                        }
                        return ueA === 'UE1' ? -1 : 1
                    })
                } else {
                    return {
                        success: true,
                        data: [],
                        meta: {
                            semestre,
                            evaluationsConfig: [],
                            modulesCount: 0,
                            etudiantsCount: etudiants.length,
                            notesCount: notesCheck?.length || 0,
                            parametresCount: 0,
                            etudiantsAvecNotes: 0,
                            etudiantsSansNotes: etudiants.length
                        },
                        warning: 'Aucun module trouvé pour cette filière et ce semestre. Vérifiez que les modules sont bien créés pour cette filière.'
                    }
                }
            } else {
                return {
                    success: true,
                    data: [],
                    meta: {
                        semestre,
                        evaluationsConfig: [],
                        modulesCount: 0,
                        etudiantsCount: etudiants.length,
                        notesCount: 0,
                        parametresCount: 0,
                        etudiantsAvecNotes: 0,
                        etudiantsSansNotes: etudiants.length
                    },
                    warning: 'Aucun module trouvé pour cette filière et ce semestre. Vérifiez que les modules sont bien créés pour cette filière.'
                }
            }
        }

        // 4. Récupérer les paramètres pour chaque module
        console.log('DEBUG: Querying parametres...')
        const moduleIds = modules.map(m => m.id)
        const { data: parametresList, error: errorParams } = await supabaseAdmin
            .from('parametres_notation')
            .select('*')
            .in('module_id', moduleIds)
            .eq('semestre', semestre)

        if (errorParams) console.error('DEBUG: Params error', errorParams)

        // Créer un map des paramètres par module_id
        const parametresMap = {}
        if (parametresList) {
            parametresList.forEach(p => {
                parametresMap[p.module_id] = p.evaluations || []
                console.log(`📋 Paramètres pour module ${p.module_id}:`, p.evaluations?.length || 0, 'évaluations')
                if (p.evaluations && p.evaluations.length > 0) {
                    console.log(`   Types:`, p.evaluations.map(e => `${e.type} (id: ${e.id}, nb: ${e.nombreEvaluations})`).join(', '))
                }
            })
        } else {
            console.log('⚠️ Aucun paramètre de notation trouvé pour les modules')
        }

        // Vérifier quels modules ont des paramètres
        const modulesAvecParametres = modules.filter(m => parametresMap[m.id] && parametresMap[m.id].length > 0)
        const modulesSansParametres = modules.filter(m => !parametresMap[m.id] || parametresMap[m.id].length === 0)

        console.log(`📊 Modules avec paramètres: ${modulesAvecParametres.length}/${modules.length}`)
        if (modulesSansParametres.length > 0) {
            console.log(`⚠️ Modules sans paramètres:`, modulesSansParametres.map(m => m.code).join(', '))
        }

        // 5. Récupérer toutes les notes pour cette classe et ce semestre
        // Important: On récupère TOUTES les notes, pas seulement celles des modules de la filière
        // car un module peut avoir été créé pour une autre filière mais utilisé pour cette classe
        console.log('DEBUG: Querying notes...')
        console.log('DEBUG: Recherche notes pour classe_id:', classeId, 'semestre:', semestre)
        const { data: notes, error: errorNotes } = await supabaseAdmin
            .from('notes')
            .select('*, modules(id, code, nom, filiere_id)')
            .eq('classe_id', classeId)
            .eq('semestre', semestre)

        if (errorNotes) {
            console.error('DEBUG: Notes error', errorNotes)
            throw errorNotes
        }
        console.log('DEBUG: Notes found', notes?.length)
        if (notes && notes.length > 0) {
            console.log('DEBUG: Exemple de note:', notes[0])
            // Afficher les différents evaluation_id trouvés
            const evalIds = [...new Set(notes.map(n => n.evaluation_id).filter(Boolean))]
            console.log('DEBUG: Evaluation IDs trouvés dans les notes:', evalIds.slice(0, 10))

            // Grouper les notes par module
            const notesByModule = {}
            notes.forEach(n => {
                if (!notesByModule[n.module_id]) notesByModule[n.module_id] = []
                notesByModule[n.module_id].push(n)
            })
            Object.keys(notesByModule).forEach(moduleId => {
                const module = modules.find(m => m.id === moduleId)
                const noteModule = notesByModule[moduleId][0]?.modules
                console.log(`📝 Notes pour module ${module?.code || noteModule?.code || moduleId}: ${notesByModule[moduleId].length}`)
                if (noteModule && !module) {
                    console.log(`⚠️ Module ${noteModule.code} utilisé dans les notes mais pas dans la liste des modules de la filière (filiere_id: ${noteModule.filiere_id} vs attendu: ${filiereId})`)
                }
            })
        } else {
            console.log('⚠️ Aucune note trouvée dans la base de données pour cette classe et ce semestre')
        }

        // 6. Calcul des moyennes et rangs
        console.log('DEBUG: Calcul des moyennes pour', etudiants.length, 'étudiants')
        const bulletin = etudiants.map(etudiant => {
            // Groupe les modules par UE pour calculer les moyennes d'UE
            const modulesByUE = {}
            modules.forEach(m => {
                const ueName = m.ue || 'UE Générale'
                if (!modulesByUE[ueName]) modulesByUE[ueName] = []
                modulesByUE[ueName].push(m)
            })

            const uesResult = []
            let totalCreditsSemestre = 0 // Crédits des modules ayant des notes
            let totalPointsSemestre = 0

            // Calculer le total des crédits attendus pour tout le semestre
            const totalCreditsAttendus = modules.reduce((sum, m) => sum + (m.credit || 0), 0)

            // Calculer la moyenne générale d'abord pour savoir si on compense
            // On fait un premier passage
            modules.forEach(module => {
                const evaluationsConfig = parametresMap[module.id] || []
                if (evaluationsConfig.length === 0) return

                let totalPointsModule = 0
                let totalCoeffModule = 0

                evaluationsConfig.forEach(evaluation => {
                    for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
                        const evalId = `${evaluation.id}_${i}`
                        const noteEntry = notes.find(n =>
                            n.etudiant_id === etudiant.id &&
                            n.module_id === module.id &&
                            n.evaluation_id === evalId
                        )

                        if (noteEntry) {
                            const noteSur20 = (noteEntry.valeur / evaluation.noteMax) * 20
                            totalPointsModule += noteSur20 * evaluation.coefficient
                            totalCoeffModule += evaluation.coefficient
                        }
                    }
                })

                const moyenneModule = totalCoeffModule > 0
                    ? parseFloat((totalPointsModule / totalCoeffModule).toFixed(2))
                    : null

                module.moyenneCalculee = moyenneModule // Temporaire
                if (moyenneModule !== null) {
                    totalPointsSemestre += moyenneModule * module.credit
                    totalCreditsSemestre += module.credit
                }
            })

            const moyenneGenerale = totalCreditsSemestre > 0
                ? parseFloat((totalPointsSemestre / totalCreditsSemestre).toFixed(2))
                : null

            // Le semestre n'est valide que si la moyenne sur l'ENSEMBLE des crédits attendus est >= 10
            const moyenneSyllabus = totalCreditsAttendus > 0
                ? parseFloat((totalPointsSemestre / totalCreditsAttendus).toFixed(2))
                : 0

            const semestreValide = moyenneSyllabus >= 10

            // Deuxième passage: Calcul par UE et statut final
            let totalCreditsValides = 0
            const modulesResult = []

            Object.keys(modulesByUE).sort().forEach(ueName => {
                const modsUE = modulesByUE[ueName]
                let pointsUE = 0
                let creditsUE = 0
                let totalCreditsUEValides = 0
                let containsCompensatedModule = false

                const modsResultUE = modsUE.map(m => {
                    const moyenne = m.moyenneCalculee
                    let valide = false
                    let status = 'NON_ACQUIS'

                    if (moyenne !== null) {
                        if (moyenne >= 10) {
                            valide = true
                            status = 'ACQUIS'
                        } else if (semestreValide) {
                            valide = true
                            status = 'COMPENSE'
                            containsCompensatedModule = true
                        }
                    }

                    if (valide) {
                        totalCreditsUEValides += m.credit
                    }

                    const res = {
                        ...m,
                        moyenne: moyenne,
                        valide: valide,
                        status: status
                    }
                    modulesResult.push(res)
                    return res
                })

                pointsUE = modsResultUE.reduce((sum, m) => sum + (m.moyenne !== null ? m.moyenne * m.credit : 0), 0)
                creditsUE = modsResultUE.reduce((sum, m) => sum + m.credit, 0)
                const moyenneUE = creditsUE > 0 ? pointsUE / creditsUE : 0

                const ueAcquise = moyenneUE >= 10 || semestreValide

                // NOUVELLE LOGIQUE: Une UE est "par compensation" si elle est acquise ET (moyenne < 10 OU contient un module < 10)
                let ueStatus = 'NON_ACQUISE'
                if (ueAcquise) {
                    if (moyenneUE >= 10 && !containsCompensatedModule) {
                        ueStatus = 'ACQUISE'
                    } else {
                        ueStatus = 'ACQUISE_PAR_COMPENSATION'
                    }
                }

                // Si l'UE est acquise (même par compensation), tous ses crédits sont validés
                const creditsUEFinaux = ueAcquise ? creditsUE : totalCreditsUEValides
                totalCreditsValides += creditsUEFinaux

                uesResult.push({
                    ue: ueName,
                    nom_ue: modsResultUE[0]?.nom_ue || '',
                    moyenne: moyenneUE,
                    credits: creditsUEFinaux,
                    totalCredits: creditsUE,
                    valide: ueAcquise,
                    status: ueStatus
                })
            })

            const statut = semestreValide ? 'VALIDE' : 'AJOURNE'

            // --- NOUVELLE LOGIQUE: Formule spéciale pour RSN (RT et GI) ---
            const deptCode = classe.filieres?.departements?.code || ''
            const filiereCode = classe.filieres?.code || ''

            let moyenneFinale = moyenneGenerale

            if (deptCode === 'RSN' && (filiereCode === 'RT' || filiereCode === 'GI')) {
                // Formule demandée: (Total Points) / 30
                moyenneFinale = parseFloat((totalPointsSemestre / 30).toFixed(2))
                console.log(`📊 Formule Spéciale RSN (${filiereCode}) pour ${etudiant.nom}: (${totalPointsSemestre} / 30) = ${moyenneFinale}`)
            } else {
                // Pour les autres, on utilise la moyenne sur les crédits attendus (Syllabus)
                // pour être cohérent avec la validation
                moyenneFinale = moyenneSyllabus
            }

            // Mettre à jour le statut final basé sur la moyenneFinale calculée
            const statutFinal = (moyenneFinale >= 10) ? 'VALIDE' : 'AJOURNE'

            return {
                etudiant,
                modules: modulesResult,
                uesValidees: uesResult, // On retourne aussi les UEs calculées
                moyenneGenerale: moyenneFinale,
                totalCreditsValides,
                statut: statutFinal
            }
        })

        // 7. Calcul du rang (seulement si au moins un étudiant a des notes)
        const etudiantsAvecNotesList = bulletin.filter(b => b.moyenneGenerale !== null && b.moyenneGenerale !== undefined)

        if (etudiantsAvecNotesList.length > 0) {
            // Tri par moyenne générale décroissante (les null en dernier)
            bulletin.sort((a, b) => {
                if (a.moyenneGenerale === null && b.moyenneGenerale === null) return 0
                if (a.moyenneGenerale === null) return 1
                if (b.moyenneGenerale === null) return -1
                return (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0)
            })

            // Assigner les rangs seulement aux étudiants avec des notes
            let rangActuel = 1
            bulletin.forEach((item, index) => {
                if (item.moyenneGenerale !== null && item.moyenneGenerale !== undefined) {
                    item.rang = rangActuel
                    rangActuel++
                } else {
                    item.rang = null // Pas de rang si pas de notes
                }
            })
        } else {
            // Aucun étudiant n'a de notes, pas de rang
            bulletin.forEach((item) => {
                item.rang = null
            })
        }

        // --- NOUVEAU: Calculer les moyennes de classe par module et générale ---

        // 1. Moyennes par module
        const statsModules = {}
        // Initialiser pour chaque module
        modules.forEach(m => {
            statsModules[m.id] = { sum: 0, count: 0, avg: null }
        })

        // Parcourir tous les bulletins pour accumuler les notes
        bulletin.forEach(etudiantBulletin => {
            etudiantBulletin.modules.forEach(mod => {
                if (mod.moyenne !== null && mod.moyenne !== undefined && statsModules[mod.id]) {
                    statsModules[mod.id].sum += parseFloat(mod.moyenne)
                    statsModules[mod.id].count++
                }
            })
        })

        // Calculer les moyennes finales
        Object.keys(statsModules).forEach(moduleId => {
            const stats = statsModules[moduleId]
            if (stats.count > 0) {
                stats.avg = parseFloat((stats.sum / stats.count).toFixed(2))
            }
        })

        // 2. Moyenne générale de la classe
        let moyenneGeneraleClasse = null
        const notesGenerales = bulletin
            .map(b => b.moyenneGenerale)
            .filter(m => m !== null && m !== undefined)

        if (notesGenerales.length > 0) {
            const sumGenerale = notesGenerales.reduce((acc, val) => acc + val, 0)
            moyenneGeneraleClasse = parseFloat((sumGenerale / notesGenerales.length).toFixed(2))
        }

        // 3. Injecter les moyennes de classe dans chaque module de chaque bulletin
        bulletin.forEach(etudiantBulletin => {
            etudiantBulletin.modules.forEach(mod => {
                const stats = statsModules[mod.id]
                mod.moyenneClasse = stats ? stats.avg : null
            })
            // Injecter aussi la moyenne générale de la classe au niveau racine de l'étudiant 
            // (optionnel mais utile si on veut l'avoir directement)
            etudiantBulletin.moyenneGeneraleClasse = moyenneGeneraleClasse
        })

        console.log('DEBUG: Moyennes de classe calculées. Générale:', moyenneGeneraleClasse)


        console.log('DEBUG: Bulletin calculé avec', bulletin.length, 'étudiants')
        if (bulletin.length > 0) {
            console.log('DEBUG: Modules dans le bulletin:', bulletin[0]?.modules?.length || 0)
            console.log('DEBUG: Exemple étudiant:', {
                nom: bulletin[0].etudiant?.nom,
                modules: bulletin[0].modules?.length,
                moyenne: bulletin[0].moyenneGenerale
            })
        }

        // Statistiques
        const etudiantsAvecNotes = etudiantsAvecNotesList.length
        const etudiantsSansNotes = bulletin.filter(b => b.moyenneGenerale === null).length
        console.log(`📊 Statistiques: ${etudiantsAvecNotes} avec notes, ${etudiantsSansNotes} sans notes`)

        return {
            success: true,
            data: bulletin,
            meta: {
                semestre,
                evaluationsConfig: [], // On ne retourne plus une config globale, mais par module
                modulesCount: modules.length,
                etudiantsCount: etudiants.length,
                notesCount: notes?.length || 0,
                parametresCount: parametresList?.length || 0,
                etudiantsAvecNotes,
                etudiantsSansNotes,
                moyenneGeneraleClasse // Ajout métadonnée
            }
        }

    } catch (error) {
        console.error('Erreur calcul bulletin:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors du calcul du relevé'
        }
    }
}
