import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Génère une planche semestrielle au format PDF (Paysage A3)
 * @param {Object} data - Données consolidées de la classe
 * @param {string} outputPath - Chemin de sortie du PDF
 * @returns {Promise<string>} - Chemin du fichier généré
 */
export async function generatePlanchePDF(data, outputPath) {
    console.log(`🌀 [PDF Generator] Start generation for ${data.students?.length} students`)
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A3',
                layout: 'landscape',
                margins: { top: 20, bottom: 20, left: 20, right: 20 }
            })

            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)
            console.log(`🌀 [PDF Generator] Pipe created to ${outputPath}`)

            const TABLE_WIDTH = 1150 // Largeur utilisable sur A3 Paysage (~1190 total)
            const MARGIN_LEFT = 20
            let currentY = 20

            // 1. En-tête (Logo + Titres)
            console.log(`🌀 [PDF Generator] Drawing header...`)
            drawHeader(doc, data, MARGIN_LEFT, currentY)
            currentY += 80

            // 2. Tableau des résultats
            console.log(`🌀 [PDF Generator] Drawing table...`)
            drawPlancheTable(doc, data, MARGIN_LEFT, currentY, TABLE_WIDTH)

            doc.end()
            stream.on('finish', () => {
                console.log(`🌀 [PDF Generator] Finished successfully`)
                resolve(outputPath)
            })
            stream.on('error', (err) => {
                console.error(`🌀 [PDF Generator] Stream error:`, err)
                reject(err)
            })
        } catch (error) {
            console.error(`🌀 [PDF Generator] Critical Error:`, error)
            reject(error)
        }
    })
}

function drawHeader(doc, data, x, y) {
    const logoPath = path.join(__dirname, '../../public/images/logo.png')

    // Gauche: Logo + Institution
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, x, y, { width: 70 })
    }

    const textX = x + 85
    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('INSTITUT NATIONAL DE LA POSTE,', textX, y + 10)
    doc.text('DES TECHNOLOGIES DE L\'INFORMATION', textX, y + 22)
    doc.text('ET DE LA COMMUNICATION', textX, y + 34)

    // Centre
    const title = `RESULTATS DU SEMESTRE : ${data.classe?.filiere || 'Génie Informatique'} (${data.classe?.nom || ''})`
    doc.fontSize(16).font('Helvetica-Bold')
    doc.text(title.toUpperCase(), 0, y + 60, { align: 'center', width: 1190 })

    // Droite
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text(`ANNÉE ACADÉMIQUE ${data.anneeUniversitaire || '2024-2025'}`, 950, y + 10, { align: 'right', width: 220 })
}

function drawPlancheTable(doc, data, startX, startY, totalWidth) {
    const students = data.students || []
    if (students.length === 0) return

    // Organiser les modules par UE
    const ueGroups = []
    const firstStudentModules = students[0].modules || []
    firstStudentModules.forEach(m => {
        const ueKey = m.ue || 'UE Sans Nom'
        let group = ueGroups.find(g => g.code === ueKey)
        if (!group) {
            group = { code: ueKey, name: m.nom_ue || '', modules: [] }
            ueGroups.push(group)
        }
        group.modules.push(m)
    })

    let currentY = startY
    const rowHeight = 15
    const headerHeight = 70 // Pour les noms verticaux/diagonaux

    const colFixedCount = 2 // N° + Nom
    const colFixedWidhts = [25, 180]
    const moduleColWidth = 45
    const ueSummaryWidth = 120 // Moyenne + Crédits + Statut

    // --- DESSIN DES EN-TÊTES ---
    doc.fontSize(8).font('Helvetica-Bold')

    let currentX = startX

    // N° et Nom Étudiant
    doc.rect(currentX, currentY, colFixedWidhts[0], headerHeight + 35).stroke()
    doc.text('N°', currentX, currentY + 50, { width: colFixedWidhts[0], align: 'center' })
    currentX += colFixedWidhts[0]

    doc.rect(currentX, currentY, colFixedWidhts[1], headerHeight + 35).stroke()
    doc.text('Nom et Prénom (Matières)', currentX + 5, currentY + 50)
    currentX += colFixedWidhts[1]

    // UE Headers
    ueGroups.forEach((ue, ueIdx) => {
        const ueHeaderWidth = (ue.modules.length * moduleColWidth) + ueSummaryWidth
        doc.rect(currentX, currentY, ueHeaderWidth, 20).stroke()
        doc.fillColor('#F5F5F5').rect(currentX + 1, currentY + 1, ueHeaderWidth - 2, 18).fill().fillColor('#000000')
        doc.text(`${ue.code} : ${ue.name}`, currentX, currentY + 6, { width: ueHeaderWidth, align: 'center' })

        let moduleX = currentX
        ue.modules.forEach(m => {
            // Nom du module tourné à 90 degrés
            doc.rect(moduleX, currentY + 20, moduleColWidth, headerHeight).stroke()
            doc.save()
            doc.translate(moduleX + (moduleColWidth / 2) + 5, currentY + 20 + headerHeight - 5)
            doc.rotate(-90)
            doc.fontSize(7).text(m.nom.toUpperCase(), 0, 0, { width: headerHeight - 10, truncate: true })
            doc.restore()

            // Ligne Crédits
            doc.rect(moduleX, currentY + 20 + headerHeight, moduleColWidth, 10).stroke()
            doc.fontSize(7).text(m.credit?.toString() || '', moduleX, currentY + 20 + headerHeight + 2, { width: moduleColWidth, align: 'center' })

            // Ligne Coefficients
            doc.rect(moduleX, currentY + 20 + headerHeight + 10, moduleColWidth, 10).stroke()
            doc.fontSize(7).text(m.credit?.toFixed(2).replace('.', ',') || '', moduleX, currentY + 20 + headerHeight + 12, { width: moduleColWidth, align: 'center' })

            moduleX += moduleColWidth
        })

        // UE Summary Headers (Moyenne UE, Crédits Validés, Statut)
        // Moyenne UE
        doc.rect(moduleX, currentY + 20, ueSummaryWidth / 3, headerHeight).stroke()
        doc.save()
        doc.translate(moduleX + (ueSummaryWidth / 6) + 5, currentY + 20 + headerHeight - 5)
        doc.rotate(-90)
        doc.text(`MOYENNE ${ue.code}`, 0, 0, { width: headerHeight - 10, align: 'center' })
        doc.restore()

        // Crédits Validés
        doc.rect(moduleX + (ueSummaryWidth / 3), currentY + 20, ueSummaryWidth / 3, headerHeight).stroke()
        doc.save()
        doc.translate(moduleX + (ueSummaryWidth / 2) + 5, currentY + 20 + headerHeight - 5)
        doc.rotate(-90)
        doc.text('CRÉDITS', 0, 0, { width: headerHeight - 10, align: 'center' })
        doc.restore()

        // Statut UE
        doc.rect(moduleX + (2 * ueSummaryWidth / 3), currentY + 20, ueSummaryWidth / 3, headerHeight).stroke()
        doc.save()
        doc.translate(moduleX + (5 * ueSummaryWidth / 6) + 5, currentY + 20 + headerHeight - 5)
        doc.rotate(-90)
        doc.text('STATUT', 0, 0, { width: headerHeight - 10, align: 'center' })
        doc.restore()

        // Lignes vides pour Credits/Coeffs dans le bloc résumé (valeurs totales)
        const totalCredits = ue.modules.reduce((sum, m) => sum + (m.credit || 0), 0)
        doc.rect(moduleX, currentY + 20 + headerHeight, ueSummaryWidth, 10).stroke()
        doc.fontSize(7).text(totalCredits.toString(), moduleX + (ueSummaryWidth / 3), currentY + 20 + headerHeight + 2, { width: ueSummaryWidth / 3, align: 'center' })

        doc.rect(moduleX, currentY + 20 + headerHeight + 10, ueSummaryWidth, 10).stroke()
        doc.fontSize(7).text(totalCredits.toFixed(2).replace('.', ','), moduleX, currentY + 20 + headerHeight + 2, { width: ueSummaryWidth / 3, align: 'center' })

        currentX += ueHeaderWidth
    })

    // Moyenne Générale Headers
    const finalHeadersWidth = 160 // Réduit car on enlève la moyenne classe
    doc.rect(currentX, currentY, finalHeadersWidth, 20).stroke()
    doc.text('MOYENNE GÉNÉRALE', currentX, currentY + 6, { width: finalHeadersWidth, align: 'center' })

    // Total Crédit Header
    doc.rect(currentX, currentY + 20, 50, headerHeight).stroke()
    doc.save()
    doc.translate(currentX + 30, currentY + 20 + headerHeight - 5)
    doc.rotate(-90)
    doc.text('TOTAL CRÉDIT', 0, 0, { width: headerHeight - 10 })
    doc.restore()
    // Lignes Headers Crédit/Coeff
    doc.rect(currentX, currentY + 20 + headerHeight, 50, 10).stroke()
    doc.text('30', currentX, currentY + 20 + headerHeight + 2, { width: 50, align: 'center' })
    doc.rect(currentX, currentY + 20 + headerHeight + 10, 50, 10).stroke()
    doc.text('30,00', currentX, currentY + 20 + headerHeight + 12, { width: 50, align: 'center' })

    // Moyenne Générale Column Header
    doc.rect(currentX + 50, currentY + 20, 60, headerHeight).stroke()
    doc.save()
    doc.translate(currentX + 85, currentY + 20 + headerHeight - 5)
    doc.rotate(-90)
    doc.text('MOYENNE GÉNÉRALE', 0, 0, { width: headerHeight - 10 })
    doc.restore()
    // Lignes Headers Crédit/Coeff
    doc.rect(currentX + 50, currentY + 20 + headerHeight, 60, 10).stroke()
    doc.text('30', currentX + 50, currentY + 20 + headerHeight + 2, { width: 60, align: 'center' })
    doc.rect(currentX + 50, currentY + 20 + headerHeight + 10, 60, 10).stroke()
    doc.text('30,00', currentX + 50, currentY + 20 + headerHeight + 12, { width: 60, align: 'center' })

    // Rang Header
    doc.rect(currentX + 110, currentY + 20, 50, headerHeight + 20).stroke()
    doc.save()
    doc.translate(currentX + 140, currentY + 50)
    doc.rotate(-90)
    doc.text('RANG MGC', 0, 0, { width: 50 })
    doc.restore()

    currentY += headerHeight + 35

    // --- DESSIN DES LIGNES DES ÉTUDIANTS ---
    students.forEach((student, sIdx) => {
        if (currentY > 780) { // Nouvelle page A3 paysage
            doc.addPage({ size: 'A3', layout: 'landscape' })
            currentY = 40
            // (Optionnel: redessiner l'en-tête simplifié)
        }

        let x = startX
        doc.fontSize(7).font('Helvetica')

        // Background alterné
        if (sIdx % 2 === 1) {
            doc.fillColor('#F9F9F9').rect(startX, currentY, totalWidth, rowHeight).fill().fillColor('#000000')
        }

        // N°
        doc.rect(x, currentY, colFixedWidhts[0], rowHeight).stroke()
        doc.text((sIdx + 1).toString(), x, currentY + 4, { width: colFixedWidhts[0], align: 'center' })
        x += colFixedWidhts[0]

        // Nom
        doc.rect(x, currentY, colFixedWidhts[1], rowHeight).stroke()
        doc.font('Helvetica-Bold').text(`${student.nom} ${student.prenom}`, x + 5, currentY + 4, { width: colFixedWidhts[1] - 10, truncate: true })
        x += colFixedWidhts[1]

        // UE Data
        ueGroups.forEach(ueGroup => {
            const ueResult = student.uesValidees?.find(u => u.ue === ueGroup.code) || {}

            ueGroup.modules.forEach(m => {
                const grade = student.modules.find(rm => rm.id === m.id)?.noteEtudiant
                doc.rect(x, currentY, moduleColWidth, rowHeight).stroke()
                if (grade !== undefined && grade !== null) {
                    if (grade < 10) doc.fillColor('#CC0000')
                    doc.text(grade.toFixed(2), x, currentY + 4, { width: moduleColWidth, align: 'center' })
                    doc.fillColor('#000000')
                }
                x += moduleColWidth
            })

            // Moyenne UE
            doc.rect(x, currentY, ueSummaryWidth / 3, rowHeight).stroke()
            doc.font('Helvetica-Bold')
            const moyUE = ueResult.moyenne || 0
            if (moyUE < 10) doc.fillColor('#CC0000')
            doc.text(moyUE.toFixed(2), x, currentY + 4, { width: ueSummaryWidth / 3, align: 'center' })
            doc.fillColor('#000000').font('Helvetica')
            x += ueSummaryWidth / 3

            // Crédits UE
            doc.rect(x, currentY, ueSummaryWidth / 3, rowHeight).stroke()
            doc.text(ueResult.credits?.toString() || '0', x, currentY + 4, { width: ueSummaryWidth / 3, align: 'center' })
            x += ueSummaryWidth / 3

            // Statut UE
            doc.rect(x, currentY, ueSummaryWidth / 3, rowHeight).stroke()
            doc.fontSize(5)
            let ueStatusText = ''
            switch (ueResult.status) {
                case 'VALIDE':
                case 'ACQUIS':
                case 'ACQUISE':
                    ueStatusText = 'UE Acquise'
                    break
                case 'COMPENSE':
                case 'ACQUISE_PAR_COMPENSATION':
                    ueStatusText = 'UE Acquise par Compensation'
                    break
                case 'AJOURNE':
                case 'NON_ACQUIS':
                case 'NON_ACQUISE':
                    ueStatusText = 'UE non Acquise'
                    break
                default:
                    ueStatusText = ueResult.status?.replace(/_/g, ' ') || 'UE non Acquise'
            }
            doc.text(ueStatusText, x, currentY + 4, { width: ueSummaryWidth / 3, align: 'center' })
            doc.fontSize(7)
            x += ueSummaryWidth / 3
        })

        // Final Data (Crédits, Moyenne Générale, Rang)
        // Total Crédits
        doc.rect(x, currentY, 50, rowHeight).stroke()
        doc.text(student.totalCreditsValides?.toString() || '0', x, currentY + 4, { width: 50, align: 'center' })
        x += 50

        // Moyenne Générale
        doc.rect(x, currentY, 60, rowHeight).stroke()
        doc.font('Helvetica-Bold')
        const mg = student.moyenneSemestre || 0
        if (mg < 10) doc.fillColor('#CC0000')
        doc.text(mg.toFixed(2).replace('.', ','), x, currentY + 4, { width: 60, align: 'center' })
        doc.fillColor('#000000').font('Helvetica')
        x += 60

        // Rang
        doc.rect(x, currentY, 50, rowHeight).stroke()
        doc.text(student.rangEtudiant?.toString() || '-', x, currentY + 4, { width: 50, align: 'center' })
        x += 50

        // Décision / Avis Jury
        const avisWidth = 150
        doc.rect(x, currentY, avisWidth, rowHeight).stroke()
        doc.fontSize(7).font('Helvetica-Bold')
        const decisionText = student.decision || ''
        const kind = student.avisJuryKind
        if (kind === 'REDOUBLE_L2' || kind === 'SEMESTRE_NOK' || decisionText.includes('non Valide')) {
            doc.fillColor('#DC2626')
        } else if (kind === 'DIPLOME' || kind === 'STAGE' || kind === 'SEMESTRE_OK') {
            doc.fillColor('#15803D')
        } else {
            doc.fillColor('#15803D')
        }
        doc.text(decisionText.toUpperCase(), x + 5, currentY + 4, { width: avisWidth - 10 })
        doc.fillColor('#000000')
        x += avisWidth

        currentY += rowHeight
    })

    // Footer legend
    currentY += 10
    doc.fontSize(8).font('Helvetica-Oblique').text('* Les cases en rouge indiquent une note inférieure à 10/20.', startX, currentY)
}
