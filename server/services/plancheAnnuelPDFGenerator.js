import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Génère une planche annuelle au format PDF (Paysage A3)
 */
export async function generatePlancheAnnuelPDF(data, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A3',
                layout: 'landscape',
                margins: { top: 20, bottom: 20, left: 20, right: 20 }
            })
            const {
                classe,
                anneeUniversitaire,
                students = [],
                semA = 'S1',
                semB = 'S2'
            } = data;

            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)

            const TABLE_WIDTH = 1150
            const MARGIN_LEFT = 20
            let currentY = 20

            // 1. En-tête
            drawHeader(doc, data, MARGIN_LEFT, currentY)
            currentY += 80

            // 2. Tableau
            drawAnnualTable(doc, data, MARGIN_LEFT, currentY, TABLE_WIDTH)

            doc.end()
            stream.on('finish', () => resolve(outputPath))
            stream.on('error', (err) => reject(err))
        } catch (error) {
            reject(error)
        }
    })
}

function drawHeader(doc, data, x, y) {
    const logoPath = path.join(__dirname, '../../public/images/logo.png')
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, x, y, { width: 60 })
    }

    doc.fontSize(10).font('Helvetica-Bold')
    doc.text('INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES', x + 70, y + 10)
    doc.text('DE L\'INFORMATION ET DE LA COMMUNICATION', x + 70, y + 22)

    doc.fontSize(18).text('RÉSULTATS ANNUELS', 0, y + 50, { align: 'center', width: 1190 })
    doc.fontSize(12).text(`${data.classe?.filiere || ''} - ${data.classe?.nom || ''}`, 0, y + 75, { align: 'center', width: 1190 })

    doc.fontSize(11).text(`ANNÉE ACADÉMIQUE ${data.anneeUniversitaire || '2024-2025'}`, 950, y + 10, { align: 'right', width: 220 })
}

function drawAnnualTable(doc, data, startX, startY, totalWidth) {
    const students = data.students || []
    let currentY = startY

    const colWidths = {
        num: 25,
        nom: 165,
        sexe: 38,
        age: 32,
        sem: 210, // Moyenne + crédits + rang par semestre
        annuel: 280 // Moy + crédits + taux + rang + décision
    }

    doc.fontSize(8).font('Helvetica-Bold')

    // En-tête du tableau
    doc.rect(startX, currentY, colWidths.num, 40).stroke()
    doc.text('N°', startX, currentY + 15, { width: colWidths.num, align: 'center' })

    doc.rect(startX + colWidths.num, currentY, colWidths.nom, 40).stroke()
    doc.text('Nom et Prénom', startX + colWidths.num + 5, currentY + 15)

    doc.rect(startX + colWidths.num + colWidths.nom, currentY, colWidths.sexe, 40).stroke()
    doc.text('Sexe', startX + colWidths.num + colWidths.nom, currentY + 15, { width: colWidths.sexe, align: 'center' })

    doc.rect(startX + colWidths.num + colWidths.nom + colWidths.sexe, currentY, colWidths.age, 40).stroke()
    doc.text('Âge', startX + colWidths.num + colWidths.nom + colWidths.sexe, currentY + 15, { width: colWidths.age, align: 'center' })

    // Bloc Semestre 1
    let x = startX + colWidths.num + colWidths.nom + colWidths.sexe + colWidths.age
    doc.rect(x, currentY, colWidths.sem, 20).stroke()
    doc.text('SEMESTRE 1', x, currentY + 6, { width: colWidths.sem, align: 'center' })
    const w3 = colWidths.sem / 3
    doc.rect(x, currentY + 20, w3, 20).stroke()
    doc.text('Moyenne', x, currentY + 26, { width: w3, align: 'center' })
    doc.rect(x + w3, currentY + 20, w3, 20).stroke()
    doc.text('Crédits', x + w3, currentY + 26, { width: w3, align: 'center' })
    doc.rect(x + 2 * w3, currentY + 20, w3, 20).stroke()
    doc.text('Rang', x + 2 * w3, currentY + 26, { width: w3, align: 'center' })

    // Bloc Semestre 2
    x += colWidths.sem
    doc.rect(x, currentY, colWidths.sem, 20).stroke()
    doc.text('SEMESTRE 2', x, currentY + 6, { width: colWidths.sem, align: 'center' })
    doc.rect(x, currentY + 20, w3, 20).stroke()
    doc.text('Moyenne', x, currentY + 26, { width: w3, align: 'center' })
    doc.rect(x + w3, currentY + 20, w3, 20).stroke()
    doc.text('Crédits', x + w3, currentY + 26, { width: w3, align: 'center' })
    doc.rect(x + 2 * w3, currentY + 20, w3, 20).stroke()
    doc.text('Rang', x + 2 * w3, currentY + 26, { width: w3, align: 'center' })

    // Bloc Annuel
    x += colWidths.sem
    doc.rect(x, currentY, colWidths.annuel, 20).stroke()
    doc.text('RÉSULTATS ANNUELS', x, currentY + 6, { width: colWidths.annuel, align: 'center' })

    const subWidth = colWidths.annuel / 5
    const subs = ['Moy. Ann', 'Crédits', 'Taux', 'Rang', 'Décision']
    subs.forEach((lbl, i) => {
        doc.rect(x + i * subWidth, currentY + 20, subWidth, 20).stroke()
        doc.fontSize(6).text(lbl, x + i * subWidth, currentY + 26, { width: subWidth, align: 'center' })
    })

    currentY += 40

    // Lignes étudiants
    doc.fontSize(8).font('Helvetica')
    students.forEach((s, idx) => {
        let lx = startX
        const rowH = 20

        // Alternance de couleur
        if (idx % 2 === 1) {
            doc.fillColor('#F9F9F9').rect(startX, currentY, totalWidth, rowH).fill().fillColor('#000000')
        }

        doc.rect(lx, currentY, colWidths.num, rowH).stroke()
        doc.text((idx + 1).toString(), lx, currentY + 6, { width: colWidths.num, align: 'center' })
        lx += colWidths.num

        doc.rect(lx, currentY, colWidths.nom, rowH).stroke()
        doc.text(`${s.nom} ${s.prenom}`, lx + 5, currentY + 6)
        lx += colWidths.nom

        doc.rect(lx, currentY, colWidths.sexe, rowH).stroke()
        doc.text(s.sexe != null && String(s.sexe).trim() !== '' ? String(s.sexe) : '—', lx, currentY + 6, { width: colWidths.sexe, align: 'center' })
        lx += colWidths.sexe

        doc.rect(lx, currentY, colWidths.age, rowH).stroke()
        doc.text(s.age != null ? String(s.age) : '—', lx, currentY + 6, { width: colWidths.age, align: 'center' })
        lx += colWidths.age

        const sw = colWidths.sem / 3
        // S1
        doc.rect(lx, currentY, sw, rowH).stroke()
        doc.text(Number(s.s1?.moyenne).toFixed(2), lx, currentY + 6, { width: sw, align: 'center' })
        doc.rect(lx + sw, currentY, sw, rowH).stroke()
        doc.text(String(s.s1?.credits ?? ''), lx + sw, currentY + 6, { width: sw, align: 'center' })
        doc.rect(lx + 2 * sw, currentY, sw, rowH).stroke()
        doc.text(s.s1?.rang != null ? String(s.s1.rang) : '—', lx + 2 * sw, currentY + 6, { width: sw, align: 'center' })
        lx += colWidths.sem

        // S2
        doc.rect(lx, currentY, sw, rowH).stroke()
        doc.text(Number(s.s2?.moyenne).toFixed(2), lx, currentY + 6, { width: sw, align: 'center' })
        doc.rect(lx + sw, currentY, sw, rowH).stroke()
        doc.text(String(s.s2?.credits ?? ''), lx + sw, currentY + 6, { width: sw, align: 'center' })
        doc.rect(lx + 2 * sw, currentY, sw, rowH).stroke()
        doc.text(s.s2?.rang != null ? String(s.s2.rang) : '—', lx + 2 * sw, currentY + 6, { width: sw, align: 'center' })
        lx += colWidths.sem

        // Annuel
        doc.rect(lx, currentY, subWidth, rowH).stroke()
        doc.font('Helvetica-Bold').text(Number(s.annuel.moyenne).toFixed(2), lx, currentY + 6, { width: subWidth, align: 'center' }).font('Helvetica')
        lx += subWidth

        doc.rect(lx, currentY, subWidth, rowH).stroke()
        doc.text(String(s.annuel.credits ?? ''), lx, currentY + 6, { width: subWidth, align: 'center' })
        lx += subWidth

        doc.rect(lx, currentY, subWidth, rowH).stroke()
        doc.font('Helvetica-Bold').text(
            s.annuel.tauxValidation != null ? `${s.annuel.tauxValidation}%` : '—',
            lx,
            currentY + 6,
            { width: subWidth, align: 'center' }
        ).font('Helvetica')
        lx += subWidth

        doc.rect(lx, currentY, subWidth, rowH).stroke()
        doc.text(s.annuel.rang != null ? String(s.annuel.rang) : '—', lx, currentY + 6, { width: subWidth, align: 'center' })
        lx += subWidth

        doc.rect(lx, currentY, subWidth, rowH).stroke()
        doc.fontSize(5).text(String(s.annuel.decision || ''), lx, currentY + 4, { width: subWidth, align: 'center' }).fontSize(8)

        currentY += rowH
        if (currentY > 780) {
            doc.addPage({ size: 'A3', layout: 'landscape' })
            currentY = 40
        }
    })
}
