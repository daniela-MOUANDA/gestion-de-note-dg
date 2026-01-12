import { getBulletinData } from './relevesService.js'

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

        // 2. Fusionner les données par étudiant
        const annualData = studentsA.map(studentA => {
            const studentB = studentsB.find(s => s.etudiant.id === studentA.etudiant.id)

            const moyS1 = studentA.moyenneGenerale || 0
            const moyS2 = studentB?.moyenneGenerale || 0
            const creditsS1 = studentA.totalCreditsValides || 0
            const creditsS2 = studentB?.totalCreditsValides || 0

            const moyAnnuelle = (moyS1 + moyS2) / (studentB ? 2 : 1)
            const totalCreditsAnnuel = creditsS1 + creditsS2

            // Décision du jury (Règles standards LMD)
            let decision = 'Redouble'
            let statusColor = 'red'

            if (totalCreditsAnnuel >= 60) {
                decision = 'Admis'
                statusColor = 'green'
            } else if (totalCreditsAnnuel >= 48) {
                decision = 'Passage conditionnel'
                statusColor = 'orange'
            }

            // Mention
            let mention = 'Passable'
            if (moyAnnuelle >= 16) mention = 'Très Bien'
            else if (moyAnnuelle >= 14) mention = 'Bien'
            else if (moyAnnuelle >= 12) mention = 'Assez Bien'

            return {
                etudiant: studentA.etudiant,
                s1: {
                    moyenne: moyS1,
                    credits: creditsS1,
                    ues: studentA.uesValidees
                },
                s2: {
                    moyenne: moyS2,
                    credits: creditsS2,
                    ues: studentB?.uesValidees || []
                },
                annuel: {
                    moyenne: parseFloat(moyAnnuelle.toFixed(2)),
                    credits: totalCreditsAnnuel,
                    decision,
                    mention,
                    statusColor
                }
            }
        })

        // 3. Calculer les rangs annuels
        annualData.sort((a, b) => b.annuel.moyenne - a.annuel.moyenne)
        annualData.forEach((item, index) => {
            item.annuel.rang = index + 1
        })

        return {
            success: true,
            data: annualData,
            meta: {
                semestreA: sA,
                semestreB: sB,
                classeInfo: resultsA.meta?.classeInfo
            }
        }

    } catch (error) {
        console.error('❌ [Service Annuel] Erreur:', error)
        return { success: false, error: error.message }
    }
}
