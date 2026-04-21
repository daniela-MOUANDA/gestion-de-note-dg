import { supabaseAdmin } from '../../lib/supabase.js'
import { calculerMoyenneGenerale } from '../scolarite/calculationService.js'

function roundCr(x) {
    return Math.round((Number(x) || 0) * 100) / 100
}

function normalizeModuleCode(code) {
    return String(code || '').trim().toUpperCase()
}

/** Module « Projet / Stage » (planche S4 L2) — reconnaissance par code / nom */
export function moduleEstProjetStage(m) {
    const t = `${m.code || ''} ${m.nom || ''}`.toLowerCase()
    if (t.includes('projet/stage')) return true
    if (t.includes('projet') && t.includes('stage')) return true
    return false
}

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
            .order('date_inscription', { ascending: true })

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

        // 4. Récupérer toutes les notes (DÉPLACÉ AVANT LES PARAMÈTRES)
        const etudiantIds = etudiants.map(e => e.id)
        const pageSize = 1000
        let pageStart = 0
        let notes = []

        // IMPORTANT: PostgREST limite les résultats (1000 lignes par défaut).
        // On pagine pour récupérer TOUTES les notes de la classe/semestre.
        while (true) {
            const { data: notesPage, error: errorNotes } = await supabaseAdmin
                .from('notes')
                .select('*, modules(id, code, nom, filiere_id)')
                .eq('semestre', semestre)
                .eq('classe_id', classeId)
                .in('etudiant_id', etudiantIds)
                .range(pageStart, pageStart + pageSize - 1)

            if (errorNotes) {
                console.error('DEBUG: Notes error', errorNotes)
                throw errorNotes
            }

            const chunk = notesPage || []
            notes = notes.concat(chunk)
            if (chunk.length < pageSize) break
            pageStart += pageSize
        }

        // 5. Récupérer les paramètres pour TOUS les modules (Locaux + Étrangers trouvés dans les notes)
        const localModuleIds = modules.map(m => m.id)
        const foreignModuleIds = notes ? [...new Set(notes.map(n => n.module_id))] : []
        const allModuleIds = [...new Set([...localModuleIds, ...foreignModuleIds])]

        console.log('DEBUG: Querying parametres for', allModuleIds.length, 'modules')

        const { data: parametresList, error: errorParams } = await supabaseAdmin
            .from('parametres_notation')
            .select('*')
            .in('module_id', allModuleIds)
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




        // --- PRÉPARATION DU MAPPING INTELLIGENT DES NOTES ---
        // But : Permettre de retrouver une note même si l'ID du module ou de l'évaluation diffère (cas des étudiants reclassés)

        // 1. Indexer les Signatures d'Évaluation (Type + Index -> ID) pour chaque Module ID
        // Map: ModuleID -> { EvalID -> "TYPE_INDEX" }
        const evalSignatureByModuleId = {}

        if (parametresList) {
            parametresList.forEach(p => {
                const moduleId = p.module_id
                if (!evalSignatureByModuleId[moduleId]) evalSignatureByModuleId[moduleId] = {}

                if (p.evaluations) {
                    p.evaluations.forEach(e => {
                        // On suppose que l'ordre et le type sont constants entre les formations
                        for (let i = 1; i <= e.nombreEvaluations; i++) {
                            const evalId = `${e.id}_${i}`
                            const signature = `${e.type}_${i}`
                            evalSignatureByModuleId[moduleId][evalId] = signature
                        }
                    })
                }
            })
        }

        // 2. Indexer les Notes par Étudiant -> CodeModule -> SignatureÉvaluation
        const studentNotesMap = {}
        const rawNotesByStudentAndModuleCode = {}
        const rawNotesByStudentAndModuleId = {}
        if (notes) {
            notes.forEach(n => {
                const etudId = n.etudiant_id
                const modId = n.module_id
                const evalId = n.evaluation_id
                const moduleEmbed = Array.isArray(n.modules) ? n.modules[0] : n.modules
                const modCode = normalizeModuleCode(moduleEmbed?.code)

                if (!etudId || !modId || !evalId) return

                // Trouver la signature de cette note (selon son module d'origine)
                const signatures = evalSignatureByModuleId[modId]
                const signature = signatures ? signatures[evalId] : null

                if (signature && modCode) {
                    if (!studentNotesMap[etudId]) studentNotesMap[etudId] = {}
                    if (!studentNotesMap[etudId][modCode]) studentNotesMap[etudId][modCode] = {}

                    // On stocke la note indexée par sa signature fonctionnelle
                    studentNotesMap[etudId][modCode][signature] = n
                }

                // Fallback brut: conserver aussi toutes les valeurs par étudiant + code module
                // pour afficher les notes existantes même si le mapping d'évaluation ne matche pas.
                const rawValue = Number(n.valeur)
                if (Number.isFinite(rawValue)) {
                    if (!rawNotesByStudentAndModuleId[etudId]) rawNotesByStudentAndModuleId[etudId] = {}
                    if (!rawNotesByStudentAndModuleId[etudId][modId]) rawNotesByStudentAndModuleId[etudId][modId] = []
                    rawNotesByStudentAndModuleId[etudId][modId].push(rawValue)

                    if (!rawNotesByStudentAndModuleCode[etudId]) rawNotesByStudentAndModuleCode[etudId] = {}
                    if (!rawNotesByStudentAndModuleCode[etudId][modCode]) rawNotesByStudentAndModuleCode[etudId][modCode] = []
                    rawNotesByStudentAndModuleCode[etudId][modCode].push(rawValue)
                }
            })
        }
        console.log(`🧠 Smart Mapping prêt : ${Object.keys(studentNotesMap).length} étudiants indexés`)

        // Code département pour moyenne « officielle » (MTIC/RSN) — fallback si l'embed filieres n'expose pas departements.code
        let deptCode = classe.filieres?.departements?.code || ''
        if (!deptCode && departementId) {
            const { data: dep } = await supabaseAdmin
                .from('departements')
                .select('code')
                .eq('id', departementId)
                .maybeSingle()
            if (dep?.code) deptCode = dep.code
        }
        const filiereCode = classe.filieres?.code || ''

        // Crédits total du semestre (syllabus) — identique pour tous les bulletins de cet appel
        const totalCreditsAttendusSemestre = modules.reduce((sum, m) => sum + (m.credit || 0), 0)

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

            // Premier passage : moyenne de chaque module et agrégats semestre (moyenne générale affichée)
            modules.forEach(module => {
                const evaluationsConfig = parametresMap[module.id] || []
                if (evaluationsConfig.length === 0) return

                let totalPointsModule = 0
                let totalCoeffModule = 0

                evaluationsConfig.forEach(evaluation => {
                    for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
                        const evalId = `${evaluation.id}_${i}`

                        // Stratégie 1: Recherche stricte (ID exact)
                        let noteEntry = notes.find(n =>
                            n.etudiant_id === etudiant.id &&
                            n.module_id === module.id &&
                            n.evaluation_id === evalId
                        )

                        // Stratégie 2: Recherche intelligente (Code Module + Signature Éval)
                        // Si non trouvé (étudiant reclassé ?)
                        if (!noteEntry && module.code) {
                            const normalizedModuleCode = normalizeModuleCode(module.code)
                            const targetSignature = evalSignatureByModuleId[module.id] ? evalSignatureByModuleId[module.id][evalId] : null

                            if (targetSignature && studentNotesMap[etudiant.id] && studentNotesMap[etudiant.id][normalizedModuleCode]) {
                                noteEntry = studentNotesMap[etudiant.id][normalizedModuleCode][targetSignature]
                            }
                        }

                        if (noteEntry) {
                            const noteSur20 = (noteEntry.valeur / evaluation.noteMax) * 20
                            totalPointsModule += noteSur20 * evaluation.coefficient
                            totalCoeffModule += evaluation.coefficient
                        }
                    }
                })

                // Fallback: si des notes existent mais que la correspondance paramètres/IDs a échoué,
                // calculer une moyenne simple pour éviter les cases vides sur planches/relevés.
                if (totalCoeffModule === 0 && module.code) {
                    const normalizedModuleCode = normalizeModuleCode(module.code)
                    const rawByModuleId = rawNotesByStudentAndModuleId[etudiant.id]?.[module.id] || []
                    const rawByModuleCode = rawNotesByStudentAndModuleCode[etudiant.id]?.[normalizedModuleCode] || []
                    const rawValues = rawByModuleId.length > 0 ? rawByModuleId : rawByModuleCode
                    if (rawValues.length > 0) {
                        const sumRaw = rawValues.reduce((acc, value) => acc + value, 0)
                        totalPointsModule = sumRaw / rawValues.length
                        totalCoeffModule = 1
                    }
                }

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

            // Moyenne « officielle » : même formule que partout (RSN GI/RT, MTIC : /30, sinon crédits syllabus)
            const moyenneFinale = calculerMoyenneGenerale(
                totalPointsSemestre,
                totalCreditsAttendusSemestre,
                totalCreditsSemestre,
                deptCode,
                filiereCode
            )

            // Deuxième passage : UE — crédits UE entiers seulement si chaque module est ≥ 10
            // OU si la moyenne pondérée de l'UE est ≥ 10 (compensation intra-UE).
            // Règle éliminatoire : aucune compensation possible si au moins un module de l'UE est < 6.
            // Sinon : uniquement les crédits des modules ≥ 10. La validation du semestre ne compense jamais une UE.
            let totalCreditsValides = 0
            const modulesResult = []

            Object.keys(modulesByUE).sort().forEach(ueName => {
                const modsUE = modulesByUE[ueName]

                const creditsUE = modsUE.reduce((sum, m) => sum + m.credit, 0)
                const pointsUE = modsUE.reduce(
                    (sum, m) => sum + (m.moyenneCalculee !== null ? m.moyenneCalculee * m.credit : 0),
                    0
                )
                const moyenneUE = creditsUE > 0 ? pointsUE / creditsUE : 0

                const tousModulesValidesIndividuellement = modsUE.every(
                    m => m.moyenneCalculee !== null && Number(m.moyenneCalculee) >= 10
                )
                const hasEliminatoryModule = modsUE.some(
                    m => m.moyenneCalculee !== null && Number(m.moyenneCalculee) < 6
                )
                const ueAcquiseParMoyenne = moyenneUE >= 10 && !hasEliminatoryModule
                const ueAcquise = tousModulesValidesIndividuellement || ueAcquiseParMoyenne

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
                        } else if (ueAcquise) {
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

                let ueStatus = 'NON_ACQUISE'
                if (ueAcquise) {
                    ueStatus = containsCompensatedModule ? 'ACQUISE_PAR_COMPENSATION' : 'ACQUISE'
                }

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

            // Validation du semestre : tous les crédits du syllabus doivent être capitalisés (la moyenne seule ne suffit pas)
            const crVal = Math.round(totalCreditsValides * 100) / 100
            const crAtt = Math.round(totalCreditsAttendusSemestre * 100) / 100
            const semestreValide = crAtt > 0 && crVal >= crAtt
            const statutFinal = semestreValide ? 'VALIDE' : 'AJOURNE'

            return {
                etudiant,
                modules: modulesResult,
                uesValidees: uesResult, // On retourne aussi les UEs calculées
                moyenneGenerale: moyenneFinale,
                totalCreditsValides,
                totalCreditsAttendusSemestre,
                statut: statutFinal
            }
        })

        // 7. Calcul du rang (seulement si au moins un étudiant a des notes)
        const etudiantsAvecNotesList = bulletin.filter(b => b.moyenneGenerale !== null && b.moyenneGenerale !== undefined)

        if (etudiantsAvecNotesList.length > 0) {
            // Le rang est calculé sur une copie triée, sans changer l'ordre d'affichage de la classe.
            const ranked = [...bulletin].sort((a, b) => {
                if (a.moyenneGenerale === null && b.moyenneGenerale === null) return 0
                if (a.moyenneGenerale === null) return 1
                if (b.moyenneGenerale === null) return -1
                return (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0)
            })

            // Assigner les rangs par étudiant (ID) puis les injecter dans l'ordre initial.
            let rangActuel = 1
            const rangByEtudiantId = new Map()
            ranked.forEach((item) => {
                if (item.moyenneGenerale !== null && item.moyenneGenerale !== undefined) {
                    rangByEtudiantId.set(item.etudiant.id, rangActuel)
                    rangActuel++
                }
            })
            bulletin.forEach((item) => {
                item.rang = rangByEtudiantId.get(item.etudiant.id) || null
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

        // Planche S4 (L2) : avis du jury (stage, S3+S4, diplôme)
        let s4AvisJuryRegles = false
        if (semestre === 'S4' && niveauCode === 'L2') {
            s4AvisJuryRegles = true
            const stageModuleIds = new Set(
                modules.filter((m) => moduleEstProjetStage(m)).map((m) => m.id)
            )

            bulletin.forEach((row) => {
                const stageRows = (row.modules || []).filter((m) => stageModuleIds.has(m.id))
                let noteStage = null
                if (stageRows.length) {
                    const vals = stageRows
                        .map((m) => m.moyenne)
                        .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)))
                    if (vals.length) {
                        noteStage = roundCr(
                            vals.reduce((a, b) => a + Number(b), 0) / vals.length
                        )
                    }
                }
                if (noteStage !== null && noteStage !== 0 && noteStage < 10) {
                    row.avisJury = 'Redouble la Licence 2'
                    row.avisJuryKind = 'REDOUBLE_L2'
                }
            })

            const s3Res = await getBulletinData(classeId, 'S3', departementId)
            if (s3Res.success && s3Res.data?.length) {
                const mapS3 = new Map(s3Res.data.map((r) => [r.etudiant.id, r]))
                const attendusS3 = roundCr(s3Res.meta.totalCreditsAttendusSemestre || 0)
                const attendusS4 = roundCr(totalCreditsAttendusSemestre)
                const creditsStageAttendus = roundCr(
                    modules.filter((m) => moduleEstProjetStage(m)).reduce((s, m) => s + (m.credit || 0), 0)
                )
                const seuilS4SansStage = Math.max(0, roundCr(attendusS4 - creditsStageAttendus))

                bulletin.forEach((row) => {
                    if (row.avisJuryKind === 'REDOUBLE_L2') return

                    const s3Row = mapS3.get(row.etudiant.id)
                    const cr3 = s3Row ? roundCr(s3Row.totalCreditsValides || 0) : 0
                    const cr4 = roundCr(row.totalCreditsValides || 0)
                    let cr4HorsStage = 0
                    ;(row.modules || []).forEach((m) => {
                        if (!stageModuleIds.has(m.id) && m.valide) {
                            cr4HorsStage += m.credit || 0
                        }
                    })
                    cr4HorsStage = roundCr(cr4HorsStage)

                    const s3Ok = attendusS3 <= 0 || cr3 >= attendusS3
                    const s4HorsStageOk = seuilS4SansStage <= 0 || cr4HorsStage >= seuilS4SansStage
                    const totalAttendus = roundCr(attendusS3 + attendusS4)
                    const diplomeOk = totalAttendus <= 0 || roundCr(cr3 + cr4) >= totalAttendus

                    if (diplomeOk) {
                        row.avisJury = 'Admis(e) en troisième année et diplômé(e)'
                        row.avisJuryKind = 'DIPLOME'
                    } else if (s3Ok && s4HorsStageOk) {
                        row.avisJury = 'Admission en stage'
                        row.avisJuryKind = 'STAGE'
                    } else {
                        row.avisJury = row.statut === 'VALIDE' ? 'Semestre valide' : 'Semestre non Valide'
                        row.avisJuryKind = row.statut === 'VALIDE' ? 'SEMESTRE_OK' : 'SEMESTRE_NOK'
                    }
                })
            }
        }

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
                moyenneGeneraleClasse, // Ajout métadonnée
                totalCreditsAttendusSemestre,
                s4AvisJuryRegles
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
