import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Génère un bulletin de notes au format PDF selon le template officiel INPTIC
 * @param {Object} bulletinData - Données du bulletin
 * @param {string} outputPath - Chemin de sortie du PDF
 * @returns {Promise<string>} - Chemin du fichier généré
 */
export async function generateBulletinPDF(bulletinData, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            // Créer un nouveau document PDF
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            })

            // Créer le flux de sortie
            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)

            // Dessiner le bulletin
            drawHeader(doc)
            drawTitle(doc, bulletinData.semestre, bulletinData.anneeUniversitaire)
            drawStudentInfo(doc, bulletinData.student, bulletinData.classe)
            drawGradesTable(doc, bulletinData.modules, bulletinData.moyenneClasse)
            drawSummary(doc, bulletinData)
            drawCreditsValidation(doc, bulletinData.uesValidees)
            drawFooter(doc, bulletinData.decision, bulletinData.dateGeneration)

            // Finaliser le PDF
            doc.end()

            stream.on('finish', () => {
                resolve(outputPath)
            })

            stream.on('error', (error) => {
                reject(error)
            })
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Dessine l'en-tête du bulletin avec le logo INPTIC
 */
function drawHeader(doc) {
    const logoPath = path.join(__dirname, '../../public/images/logo.png')

    // Texte en-tête gauche
    doc.fontSize(8)
        .font('Helvetica')
        .text('INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES', 50, 50, { width: 250, align: 'center' })
        .text('DE L\'INFORMATION ET DE LA COMMUNICATION', 50, 62, { width: 250, align: 'center' })

    // Logo centré
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 250, 40, { width: 80, align: 'center' })
    }

    // Texte en-tête droit
    doc.fontSize(8)
        .text('RÉPUBLIQUE GABONAISE', 350, 50, { width: 200, align: 'center' })
        .text('Union - Travail - Justice', 350, 62, { width: 200, align: 'center' })

    // Sous-titre
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('DIRECTION DES ÉTUDES ET DE LA PÉDAGOGIE', 50, 110, { width: 500, align: 'center' })

    doc.moveDown(2)
}

/**
 * Dessine le titre du bulletin
 */
function drawTitle(doc, semestre, anneeUniversitaire) {
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`Bulletin de notes du ${semestre}`, 50, 140, { width: 500, align: 'center' })

    doc.fontSize(10)
        .font('Helvetica')
        .text(`Année universitaire: ${anneeUniversitaire}`, 50, 160, { width: 500, align: 'center' })

    doc.moveDown(2)
}

/**
 * Dessine les informations de l'étudiant
 */
function drawStudentInfo(doc, student, classe) {
    const startY = 190

    // Bordure de la table
    doc.rect(50, startY, 500, 60).stroke()

    // Ligne de la classe
    doc.rect(50, startY, 500, 20).stroke()
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('Classe:', 55, startY + 5)
        .font('Helvetica')
        .text(`${classe.nom} ${classe.option ? 'Option: ' + classe.option : ''}`, 100, startY + 5, { width: 440 })

    // Ligne nom et prénom
    doc.rect(50, startY + 20, 250, 20).stroke()
    doc.rect(300, startY + 20, 250, 20).stroke()
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('Nom(s) et Prénom(s)', 55, startY + 25)
        .font('Helvetica')
        .text(`${student.nom} ${student.prenom}`, 305, startY + 25)

    // Ligne date et lieu de naissance
    doc.rect(50, startY + 40, 250, 20).stroke()
    doc.rect(300, startY + 40, 250, 20).stroke()
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('Date et lieu de naissance', 55, startY + 45)
        .font('Helvetica')
        .text(`Né(e) le ${student.dateNaissance} ${student.lieuNaissance}`, 305, startY + 45)

    doc.moveDown(3)
}

/**
 * Dessine le tableau des notes par UE
 */
function drawGradesTable(doc, modules, moyenneClasse) {
    const startY = 270
    const tableWidth = 500
    const colWidths = [200, 40, 60, 80, 80]
    let currentY = startY

    // En-tête du tableau
    doc.rect(50, currentY, tableWidth, 20).stroke()
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text('', 55, currentY + 5)
        .text('Crédits', 255, currentY + 5, { width: 35, align: 'center' })
        .text('Coefficients', 295, currentY + 5, { width: 55, align: 'center' })
        .text('Notes de\nl\'étudiant', 355, currentY + 5, { width: 75, align: 'center' })
        .text('Moyenne de\nclasse', 435, currentY + 5, { width: 75, align: 'center' })

    currentY += 20

    // Grouper les modules par UE
    const modulesByUE = {}
    modules.forEach(module => {
        if (!modulesByUE[module.ue]) {
            modulesByUE[module.ue] = []
        }
        modulesByUE[module.ue].push(module)
    })

    // Dessiner chaque UE
    Object.keys(modulesByUE).sort().forEach(ue => {
        // Titre de l'UE
        doc.rect(50, currentY, tableWidth, 15).stroke()
        doc.fontSize(8)
            .font('Helvetica-Bold')
            .text(ue, 55, currentY + 3)
        currentY += 15

        // Modules de l'UE
        modulesByUE[ue].forEach(module => {
            doc.rect(50, currentY, tableWidth, 15).stroke()

            // Lignes verticales
            doc.moveTo(250, currentY).lineTo(250, currentY + 15).stroke()
            doc.moveTo(290, currentY).lineTo(290, currentY + 15).stroke()
            doc.moveTo(350, currentY).lineTo(350, currentY + 15).stroke()
            doc.moveTo(430, currentY).lineTo(430, currentY + 15).stroke()

            doc.fontSize(7)
                .font('Helvetica')
                .text(module.nom, 55, currentY + 3, { width: 190 })
                .text(module.credits.toString(), 255, currentY + 3, { width: 35, align: 'center' })
                .text(module.coefficient.toFixed(2), 295, currentY + 3, { width: 55, align: 'center' })
                .text(module.noteEtudiant.toFixed(2), 355, currentY + 3, { width: 75, align: 'center' })
                .text(module.moyenneClasse ? module.moyenneClasse.toFixed(2) : '-', 435, currentY + 3, { width: 75, align: 'center' })

            currentY += 15
        })

        // Moyenne de l'UE
        const moyenneUE = modulesByUE[ue].reduce((sum, m) => sum + m.noteEtudiant, 0) / modulesByUE[ue].length
        doc.rect(50, currentY, tableWidth, 15).stroke()
        doc.moveTo(250, currentY).lineTo(250, currentY + 15).stroke()
        doc.moveTo(290, currentY).lineTo(290, currentY + 15).stroke()
        doc.moveTo(350, currentY).lineTo(350, currentY + 15).stroke()
        doc.moveTo(430, currentY).lineTo(430, currentY + 15).stroke()

        doc.fontSize(8)
            .font('Helvetica-Bold')
            .text(`Moyenne ${ue}`, 55, currentY + 3)
            .text(moyenneUE.toFixed(2), 355, currentY + 3, { width: 75, align: 'center' })

        currentY += 15
    })

    return currentY
}

/**
 * Dessine la section résumé (moyenne, rang, mention)
 */
function drawSummary(doc, bulletinData) {
    const startY = doc.y + 10

    // Pénalités d'absences
    doc.rect(50, startY, 500, 15).stroke()
    doc.fontSize(8)
        .font('Helvetica')
        .text('Pénalités d\'absences:', 55, startY + 3)
        .text(bulletinData.penalitesAbsences ? bulletinData.penalitesAbsences.toFixed(2) : '0.00', 200, startY + 3)

    // Moyenne du semestre
    doc.rect(50, startY + 15, 250, 20).stroke()
    doc.rect(300, startY + 15, 250, 20).stroke()
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text(`Moyenne ${bulletinData.semestre}`, 55, startY + 20)
        .fontSize(11)
        .text(bulletinData.moyenneSemestre.toFixed(2), 305, startY + 20)

    // Rang et mention
    doc.rect(50, startY + 35, 250, 15).stroke()
    doc.rect(300, startY + 35, 250, 15).stroke()
    doc.fontSize(8)
        .font('Helvetica')
        .text('Rang de l\'étudiant au Semestre', 55, startY + 38)
        .text('Mention', 305, startY + 38)

    doc.rect(50, startY + 50, 250, 15).stroke()
    doc.rect(300, startY + 50, 250, 15).stroke()
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text(bulletinData.rangEtudiant ? bulletinData.rangEtudiant.toString() : '-', 55, startY + 53)
        .text(bulletinData.mention || 'Assez Bien', 305, startY + 53)

    doc.moveDown(3)
}

/**
 * Dessine le tableau de validation des crédits
 */
function drawCreditsValidation(doc, uesValidees) {
    const startY = doc.y + 10

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('État de la Validation des Crédits au Semestre', 50, startY, { width: 500, align: 'center' })

    const tableY = startY + 20
    doc.rect(50, tableY, 500, 15).stroke()

    // En-tête
    doc.fontSize(8)
        .text('UE', 55, tableY + 3, { width: 240, align: 'center' })
        .text('Crédits validés au Semestre', 305, tableY + 3, { width: 240, align: 'center' })

    let currentY = tableY + 15

    // Lignes des UEs
    uesValidees.forEach(ue => {
        doc.rect(50, currentY, 250, 15).stroke()
        doc.rect(300, currentY, 250, 15).stroke()

        doc.fontSize(8)
            .font('Helvetica')
            .text(ue.ue, 55, currentY + 3)
            .text(ue.valide ? `${ue.credits} Crédits /${ue.credits}` : 'Semestre Ajourné', 305, currentY + 3)

        currentY += 15
    })

    doc.moveDown(2)
}

/**
 * Dessine le pied de page avec la décision et le cachet
 */
function drawFooter(doc, decision, dateGeneration) {
    const cachetPath = path.join(__dirname, '../../public/images/cachet.png')
    const footerY = 700

    // Décision du jury
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text(`Décision du Jury: ${decision}`, 50, footerY, { width: 500, align: 'left' })

    // Date et lieu
    const date = new Date(dateGeneration).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    doc.fontSize(9)
        .font('Helvetica')
        .text(`Fait à Libreville, le ${date}`, 50, footerY + 20)

    // Cachet officiel
    if (fs.existsSync(cachetPath)) {
        doc.image(cachetPath, 200, footerY + 30, { width: 150 })
    }

    // Note en bas de page
    doc.fontSize(7)
        .font('Helvetica-Oblique')
        .text('Il ne sera délivré qu\'un seul et unique exemplaire de bulletin de notes. L\'étudiant est donc prié d\'en faire plusieurs copies légalisées.',
            50, 780, { width: 500, align: 'center' })
}
