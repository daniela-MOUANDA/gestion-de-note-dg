import { getBulletinData } from './relevesService.js'

/** Ordre stable des codes UE (1 avant 2, puis ordre alpha) pour remplir les colonnes « 1re UE / 2e UE ». */
function compareUeCodes(a, b) {
    const na = extractUeOrdinal(a)
    const nb = extractUeOrdinal(b)
    if (na !== null && nb !== null && na !== nb) return na - nb
    return String(a || '').localeCompare(String(b || ''), 'fr', { numeric: true, sensitivity: 'base' })
}

function extractUeOrdinal(ue) {
    const s = String(ue || '').toUpperCase()
    const m = s.match(/(\d+)/)
    return m ? parseInt(m[1], 10) : null
}

function collectUeOrderFromBulletins(studentRows) {
    const set = new Set()
    for (const s of studentRows || []) {
        for (const u of s.uesValidees || []) {
            if (u && u.ue != null && String(u.ue).trim() !== '') set.add(u.ue)
        }
    }
    return [...set].sort(compareUeCodes)
}

/** Mention selon la moyenne annuelle (/20), grille LMD demandée. */
function mentionFromMoyenneAnnuelle(moy) {
    const m = Number(moy)
    if (!Number.isFinite(m)) return 'Faible'
    if (m >= 18) return 'Excellent'
    if (m >= 16) return 'Très Bien'
    if (m >= 14) return 'Bien'
    if (m >= 12) return 'Assez Bien'
    if (m >= 10) return 'Passable'
    if (m >= 6) return 'Insuffisant'
    return 'Faible'
}

/** Année de Licence en cours d’après le 1er semestre de la paire (S1/S2→L1, S3/S4→L2, S5/S6→L3). */
function licenceAnneeEnCours(semestreA) {
    const s = String(semestreA || '').toUpperCase()
    if (s === 'S1' || s === 'S2') return 1
    if (s === 'S3' || s === 'S4') return 2
    if (s === 'S5' || s === 'S6') return 3
    return 1
}

/**
 * Règles annuelles :
 * - Admis en année suivante : 60 crédits capitalisés sur l’année.
 * - Passage conditionnel (48–59 cr.) : uniquement L1 → L2 (comme en L2 il n’existe pas d’équivalent pour entrer en L3 : il faut tous les crédits).
 * - Sinon : redoublement de l’année en cours (L2 ou L3 si crédits incomplets).
 *
 * @returns {{ text: string, kind: 'ADMIS' | 'REDOUBLE' | 'PASSAGE_CONDITIONNEL' }}
 */
function decisionAnnuelleDetails(totalCreditsAnnuel, semestreA) {
    const annee = licenceAnneeEnCours(semestreA)
    const suivante = annee < 3 ? annee + 1 : null

    if (totalCreditsAnnuel >= 60) {
        if (suivante != null) {
            return { text: `Admis en Licence ${suivante}`, kind: 'ADMIS' }
        }
        return { text: 'Admis — validation de la Licence 3', kind: 'ADMIS' }
    }

    if (totalCreditsAnnuel >= 48 && annee === 1 && suivante === 2) {
        return { text: 'Passage conditionnel en Licence 2', kind: 'PASSAGE_CONDITIONNEL' }
    }

    return { text: `Redouble la Licence ${annee}`, kind: 'REDOUBLE' }
}

/** Âge en années révolues (date du jour, fuseau local du serveur / navigateur). */
function ageFromDateNaissance(dateNaissance) {
    if (dateNaissance == null || String(dateNaissance).trim() === '') return null
    const d = new Date(dateNaissance)
    if (Number.isNaN(d.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const md = today.getMonth() - d.getMonth()
    if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--
    if (age < 0 || age > 120) return null
    return age
}

/** Affichage court pour la planche (M / F / —). */
function sexeAffichePlanche(sexe) {
    const s = String(sexe || '').trim().toUpperCase()
    if (s === 'M' || s === 'MASCULIN') return 'M'
    if (s === 'F' || s === 'FÉMININ' || s === 'FEMININ') return 'F'
    return '—'
}

/**
 * Récupère et consolide les données pour une planche annuelle
 * @param {string} classeId 
 * @param {string} departementId 
 */
export const getAnnualPlancheData = async (classeId, departementId) => {
    try {
        console.log(`📊 [Service Annuel] Début consolidation pour classe: ${classeId}`)

        // 1. Déterminer les semestres selon le niveau (L1=S1,S2 | L2=S3,S4 | L3=S5,S6)
        // On va appeler getBulletinData pour les deux semestres potentiels
        // Un petit hack simple: on teste les paires S1/S2, S3/S4, S5/S6
        const pairs = [['S1', 'S2'], ['S3', 'S4'], ['S5', 'S6']]
        let sA, sB
        let resultsA, resultsB

        for (const [s1, s2] of pairs) {
            resultsA = await getBulletinData(classeId, s1, departementId)
            if (resultsA.success && resultsA.data.length > 0) {
                sA = s1
                sB = s2
                resultsB = await getBulletinData(classeId, s2, departementId)
                break
            }
        }

        if (!sA || !resultsA.success) {
            return { success: false, error: 'Impossible de trouver des données pour les semestres de cette classe.' }
        }

        const studentsA = resultsA.data
        const studentsB = resultsB.success ? resultsB.data : []

        const toNum = (v) => {
            const n = Number(v)
            return Number.isFinite(n) ? n : 0
        }

        const creditsAttendusS1 = toNum(resultsA.meta?.totalCreditsAttendusSemestre)
        const creditsAttendusS2 = toNum(resultsB.success ? resultsB.meta?.totalCreditsAttendusSemestre : 0)
        const creditsAttendusAnnuelClasse = creditsAttendusS1 + creditsAttendusS2

        /** Taux de validation = crédits capitalisés / crédits attendus (année), en %. */
        function tauxValidationPourCreditsObtenus(creditsObtenus) {
            if (creditsAttendusAnnuelClasse <= 0) return null
            return Math.round((toNum(creditsObtenus) / creditsAttendusAnnuelClasse) * 100)
        }

        // 2. Fusionner les données par étudiant
        const annualData = studentsA.map(studentA => {
            const idA = studentA.etudiant?.id
            const studentB = idA
                ? studentsB.find(s => s.etudiant?.id === idA)
                : null

            const moyS1 = toNum(studentA.moyenneGenerale)
            const moyS2 = toNum(studentB?.moyenneGenerale)
            const creditsS1 = toNum(studentA.totalCreditsValides)
            const creditsS2 = toNum(studentB?.totalCreditsValides)

            const moyAnnuelle = (moyS1 + moyS2) / (studentB ? 2 : 1)
            const moyAnnuelleArrondie = Number.isFinite(moyAnnuelle)
                ? parseFloat(moyAnnuelle.toFixed(2))
                : 0
            const totalCreditsAnnuel = creditsS1 + creditsS2

            const { text: decision, kind: decisionKind } = decisionAnnuelleDetails(totalCreditsAnnuel, sA)
            const statusColor =
                decisionKind === 'ADMIS' ? 'green' : decisionKind === 'REDOUBLE' ? 'red' : 'orange'

            const mention = mentionFromMoyenneAnnuelle(moyAnnuelleArrondie)
            const tauxValidation = tauxValidationPourCreditsObtenus(totalCreditsAnnuel)

            const et = studentA.etudiant || {}
            const sexe = sexeAffichePlanche(et.sexe)
            const age = ageFromDateNaissance(et.date_naissance)

            return {
                etudiant: studentA.etudiant,
                sexe,
                age,
                s1: {
                    moyenne: moyS1,
                    credits: creditsS1,
                    creditsAttendus: creditsAttendusS1,
                    rang: studentA.rang ?? null,
                    ues: studentA.uesValidees || []
                },
                s2: {
                    moyenne: moyS2,
                    credits: creditsS2,
                    creditsAttendus: creditsAttendusS2,
                    rang: studentB?.rang ?? null,
                    ues: studentB?.uesValidees || []
                },
                annuel: {
                    moyenne: moyAnnuelleArrondie,
                    credits: totalCreditsAnnuel,
                    creditsAttendus: creditsAttendusAnnuelClasse,
                    tauxValidation,
                    decision,
                    decisionKind,
                    mention,
                    statusColor
                }
            }
        })

        // 3. Calculer les rangs annuels sans modifier l'ordre de la classe
        const rankedAnnual = [...annualData].sort((a, b) => {
            const mb = toNum(b.annuel?.moyenne)
            const ma = toNum(a.annuel?.moyenne)
            return mb - ma
        })
        const rangByEtudiantId = new Map()
        rankedAnnual.forEach((item, index) => {
            const id = item.etudiant?.id
            if (id) rangByEtudiantId.set(id, index + 1)
        })
        annualData.forEach((item) => {
            const id = item.etudiant?.id
            item.annuel.rang = id ? rangByEtudiantId.get(id) ?? null : null
        })

        const ueOrderS1 = collectUeOrderFromBulletins(studentsA)
        const ueOrderS2 = collectUeOrderFromBulletins(studentsB)

        return {
            success: true,
            data: annualData,
            meta: {
                semestreA: sA,
                semestreB: sB,
                classeInfo: resultsA.meta?.classeInfo,
                ueOrderS1,
                ueOrderS2,
                creditsAttendusS1,
                creditsAttendusS2,
                creditsAttendusAnnuel: creditsAttendusAnnuelClasse
            }
        }

    } catch (error) {
        console.error('❌ [Service Annuel] Erreur:', error)
        return { success: false, error: error.message }
    }
}
