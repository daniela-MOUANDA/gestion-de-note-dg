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
 * @param {boolean} includeStamp - Inclure le cachet (true pour DEP, false pour Chef de Département)
 * @param {Object} depInfo - Informations du DEP (dateVisa, nom, prenom, titre) - optionnel
 * @returns {Promise<string>} - Chemin du fichier généré
 */
export async function generateBulletinPDF(bulletinData, outputPath, includeStamp = false, depInfo = null) {
    return new Promise((resolve, reject) => {
        try {
            // Créer un nouveau document PDF
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 25,
                    bottom: 25,
                    left: 40,
                    right: 40
                }
            })

            // Créer le flux de sortie
            const stream = fs.createWriteStream(outputPath)
            doc.pipe(stream)

            // Dessiner le bulletin
            drawHeader(doc)
            drawTitle(doc, bulletinData.semestre, bulletinData.anneeUniversitaire)
            drawStudentInfo(doc, bulletinData.student, bulletinData.classe, bulletinData.semestre)
            // 4. Grades Table
            drawGradesTable(doc, bulletinData.modules, bulletinData.moyenneClasse, bulletinData.uesValidees)
            drawSummary(doc, bulletinData)
            drawCreditsValidation(doc, bulletinData.uesValidees)
            drawFooter(doc, bulletinData.decision, bulletinData.dateGeneration, includeStamp, depInfo)

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
    const startY = 25

    // ============================================
    // CÔTÉ GAUCHE - Informations institutionnelles
    // ============================================

    // 1. Titre principal (2 lignes en haut, aligné à gauche)
    doc.fontSize(7.5)
        .font('Helvetica')
        .text('INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES', 40, startY, { width: 300, align: 'left' })
        .text('DE L\'INFORMATION ET DE LA COMMUNICATION', 40, startY + 10, { width: 300, align: 'left' })

    // 2. Logo positionné à gauche, sous le texte
    const logoY = startY + 25  // Positionné sous le texte de gauche
    const logoWidth = 65
    const logoX = 40  // Aligné à gauche
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, logoX, logoY, { width: logoWidth })
    }

    // 3. Direction (sans bold) - Remonté pour gagner de la place
    // Positionner "DIRECTION" plus haut, juste sous le logo
    const directionY = logoY + logoWidth - 18 // Remonté (était -12)
    doc.fontSize(8.5)
        .font('Helvetica')
        .fillColor('#000000')
        .text('DIRECTION DES ÉTUDES ET DE LA PÉDAGOGIE',
            40, directionY, { width: 300, align: 'left' })

    // ============================================
    // CÔTÉ DROIT - Informations nationales
    // ============================================

    const rightX = 350
    const rightWidth = 200

    // 1. "RÉPUBLIQUE GABONAISE" (en haut, aligné à droite)
    doc.fontSize(7.5)
        .font('Helvetica')
        .text('RÉPUBLIQUE GABONAISE', rightX, startY, { width: rightWidth, align: 'right' })

    // 2. Ligne de tirets
    const dashY1 = startY + 10
    const dashLength = 100
    const dashStartX = rightX + rightWidth - dashLength - 5

    doc.lineWidth(1)
    doc.moveTo(dashStartX, dashY1)
        .lineTo(dashStartX + dashLength, dashY1)
        .dash(6, { space: 3 })
        .stroke()
        .undash()

    // 3. "Union - Travail - Justice"
    doc.fontSize(7.5)
        .font('Helvetica')
        .text('Union - Travail - Justice', rightX, dashY1 + 7, { width: rightWidth, align: 'right' })

    // 4. Ligne de tirets
    const dashY2 = dashY1 + 18
    doc.moveTo(dashStartX + 20, dashY2)
        .lineTo(dashStartX + dashLength - 20, dashY2)
        .dash(6, { space: 3 })
        .stroke()
        .undash()

    doc.moveDown(1)
}

/**
 * Dessine le titre du bulletin
/**
 * Dessine le titre du bulletin
 */
function drawTitle(doc, semestre, anneeUniversitaire) {
    // Le titre doit être positionné après "DIRECTION DES ÉTUDES ET DE LA PÉDAGOGIE"
    const titleY = 120  // Ajusté vers le bas (était 110) pour éviter l'overlap

    // Formater le semestre (S1 -> Semestre 1)
    const formattedSemestre = semestre.replace(/^S(\d+)$/, 'Semestre $1')

    doc.fontSize(13.5)
        .font('Helvetica-Bold')
        .text(`Bulletin de notes du ${formattedSemestre}`, 0, titleY, { width: 595, align: 'center' }) // 595 = A4 Width

    doc.fontSize(10)
        .font('Times-Roman') // Police Serif pour l'année
        .text(`Année universitaire : ${anneeUniversitaire}`, 0, titleY + 18, { width: 595, align: 'center' })

    doc.moveDown(1)
}

/**
 * Dessine les informations de l'étudiant avec le nouveau design
 */
function drawStudentInfo(doc, student, classe, semestre) {
    const startY = 160  // Redescendu un peu (était 150) car le titre est plus bas
    const TABLE_WIDTH = 515
    const MARGIN_LEFT = 40

    // 1. En-tête de classe - Double bordure, fond blanc, texte noir, centré avec styles mixtes
    const headerHeight = 18 // Passé de 16 à 18

    // Bordure extérieure
    doc.rect(MARGIN_LEFT, startY, TABLE_WIDTH, headerHeight).stroke()
    // Bordure intérieure (effet double trait)
    doc.rect(MARGIN_LEFT + 2, startY + 2, TABLE_WIDTH - 4, headerHeight - 4).stroke()

    // Préparation du texte mixte
    doc.fontSize(9.5) // Passé de 9 à 9.5

    // Déterminer le libellé de niveau
    let niveauLabel = ''
    if (classe.nom.includes('L1')) niveauLabel = 'Licence 1'
    else if (classe.nom.includes('L2')) niveauLabel = 'Licence 2'
    else if (classe.nom.includes('L3')) niveauLabel = 'Licence 3'
    else niveauLabel = classe.nom // Fallback

    // Déterminer la filière
    // Essayer de récupérer le nom de la filière si disponible dans l'objet classe imbriqué
    const filiereLabel = classe.filieres?.nom || classe.filiere || 'Génie Informatique' // Valeur par défaut si manquant

    // Déterminer l'option (UNIQUEMENT pour S5 et S6)
    // S1=Semestre 1, etc.
    const isFinCycle = ['S5', 'S6', 'Semestre 5', 'Semestre 6'].includes(semestre) ||
        (semestre && (semestre.includes('5') || semestre.includes('6')));

    let optionLabel = ''
    if (isFinCycle) {
        if (filiereLabel.includes('Génie Informatique') || classe.code?.includes('GI')) {
            optionLabel = "Option: Développement d'Applications Réparties"
        } else if (filiereLabel.includes('Réseaux') || classe.code?.includes('RT')) {
            optionLabel = "Option: AZUR"
        } else if (filiereLabel.includes('Multimédia') || classe.code?.includes('MMI')) {
            optionLabel = "Option: Web mastering"
        } else if (classe.option) {
            optionLabel = `Option: ${classe.option}` // Fallback si présent
        }
    }

    // Elements du texte
    const p1 = "Classe : " // Gras
    const p2 = niveauLabel + " " // Normal
    const p3 = filiereLabel + (optionLabel ? " " : "") // Gras
    const p4 = optionLabel // Normal

    // Calcul des largeurs pour centrage
    doc.font('Helvetica-Bold')
    const w1 = doc.widthOfString(p1)
    const w3 = doc.widthOfString(p3)

    doc.font('Helvetica')
    const w2 = doc.widthOfString(p2)
    const w4 = doc.widthOfString(p4)

    const totalWidth = w1 + w2 + w3 + w4
    let currentX = MARGIN_LEFT + (TABLE_WIDTH - totalWidth) / 2
    const textY = startY + 4

    // Dessin séquentiel
    doc.fillColor('#000000')

    // Classe : (Bold)
    doc.font('Helvetica-Bold').text(p1, currentX, textY)
    currentX += w1

    // Licence X (Normal)
    doc.font('Helvetica').text(p2, currentX, textY)
    currentX += w2

    // Filière (Bold)
    doc.font('Helvetica-Bold').text(p3, currentX, textY)
    currentX += w3

    // Option (Normal)
    doc.font('Helvetica').text(p4, currentX, textY)


    // 2. Tableau informations étudiant - 2 lignes, 2 colonnes
    const infoY = startY + headerHeight
    const rowHeight = 16
    const col1Width = TABLE_WIDTH / 2
    const col2Width = TABLE_WIDTH / 2

    // Ligne 1: Nom et Prénom
    doc.rect(MARGIN_LEFT, infoY, col1Width, rowHeight).stroke()
    doc.rect(MARGIN_LEFT + col1Width, infoY, col2Width, rowHeight).stroke()
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text('Nom(s) et Prénom(s)', MARGIN_LEFT + 5, infoY + 5)
        .font('Helvetica-Bold') // CHANGEMENT: Nom étudiant en GRAS
        .text(`${student.nom} ${student.prenom}`, MARGIN_LEFT + col1Width + 5, infoY + 5)

    // Ligne 2: Date et lieu de naissance
    doc.rect(MARGIN_LEFT, infoY + rowHeight, col1Width, rowHeight).stroke()
    doc.rect(MARGIN_LEFT + col1Width, infoY + rowHeight, col2Width, rowHeight).stroke()
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text('Date et lieu de naissance', MARGIN_LEFT + 5, infoY + rowHeight + 5)
        .font('Helvetica')
        .text(`Né(e) le ${student.dateNaissance || 'N/A'} ${student.lieuNaissance || ''}`,
            MARGIN_LEFT + col1Width + 5, infoY + rowHeight + 5)

    doc.y = infoY + (rowHeight * 2) + 5
}

/**
 * Dessine le tableau des notes par UE avec le nouveau design
 */
function drawGradesTable(doc, modules, moyenneGeneraleClasse, uesValidees = []) {
    const startY = doc.y
    const MARGIN_LEFT = 40
    const TABLE_WIDTH = 515
    // Ajustement des largeurs pour éviter le chevauchement
    const colWidths = [195, 50, 50, 110, 110]

    // Position Calculations (accumulated)
    // 40 + 195 = 235
    // 235 + 50 = 285
    // 285 + 50 = 335
    // 335 + 110 = 445
    // 445 + 110 = 555
    const colPositions = [40, 235, 285, 335, 445]
    let currentY = startY

    const headerHeight = 14

    // Dessiner l'en-tête seulement pour les 4 colonnes de données
    doc.rect(colPositions[1], currentY, colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], headerHeight)
        .stroke()
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Crédits', colPositions[1], currentY + 5, { width: colWidths[1], align: 'center' })
        .text('Coeffs.', colPositions[2], currentY + 5, { width: colWidths[2], align: 'center' })
        .text('Note Étudiant', colPositions[3], currentY + 5, { width: colWidths[3], align: 'center' })
        .text('Moyenne Classe', colPositions[4], currentY + 5, { width: colWidths[4], align: 'center' })
    currentY += headerHeight

    // Grouper les modules par UE
    const modulesByUE = {}
    modules.forEach(module => {
        const ueKey = module.ue || 'UE Générale'
        if (!modulesByUE[ueKey]) {
            modulesByUE[ueKey] = []
        }
        modulesByUE[ueKey].push(module)
    })

    // Dessiner chaque UE
    Object.keys(modulesByUE).sort().forEach(ue => {
        // En-tête UE - Fond blanc
        const ueHeaderHeight = 15
        doc.rect(MARGIN_LEFT, currentY, TABLE_WIDTH, ueHeaderHeight).stroke()

        // Afficher le code UE avec le nom personnalisé si disponible
        const firstModule = modulesByUE[ue][0]
        const ueHeaderText = firstModule && firstModule.nom_ue
            ? `${ue} - ${firstModule.nom_ue}`
            : ue

        doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text(ueHeaderText, MARGIN_LEFT + 5, currentY + 4)
        currentY += ueHeaderHeight

        // Modules de l'UE
        modulesByUE[ue].forEach(module => {
            const rowHeight = 15 // Passé de 12 à 15
            // Dessiner les bordures complètes
            doc.rect(MARGIN_LEFT, currentY, TABLE_WIDTH, rowHeight).stroke()
            // Lignes verticales
            doc.moveTo(colPositions[1], currentY).lineTo(colPositions[1], currentY + rowHeight).stroke()
            doc.moveTo(colPositions[2], currentY).lineTo(colPositions[2], currentY + rowHeight).stroke()
            doc.moveTo(colPositions[3], currentY).lineTo(colPositions[3], currentY + rowHeight).stroke()
            doc.moveTo(colPositions[4], currentY).lineTo(colPositions[4], currentY + rowHeight).stroke()

            // Nom du module
            doc.fontSize(8) // Passé de 7 à 8
                .font('Helvetica')
                .text(module.nom || module.code || '-', MARGIN_LEFT + 5, currentY + 4, { width: colWidths[0] - 10 })

            // Crédits
            doc.fillColor('#000000')
            doc.text(module.credits ? module.credits.toString() : '-', colPositions[1], currentY + 4,
                { width: colWidths[1], align: 'center' })

            // Coefficients
            doc.text(module.coefficient ? module.coefficient.toFixed(2) : '-', colPositions[2], currentY + 4,
                { width: colWidths[2], align: 'center' })

            // Notes
            const noteValue = module.noteEtudiant ? module.noteEtudiant.toFixed(2) : '-'
            doc.fillColor('#000000')
            doc.fontSize(8)
                .text(noteValue, colPositions[3], currentY + 4, { width: colWidths[3], align: 'center' })

            // Moyenne classe
            doc.fillColor('#000000')
            doc.fontSize(8)
                .text(module.moyenneClasse ? module.moyenneClasse.toFixed(2) : '-', colPositions[4], currentY + 4,
                    { width: colWidths[4], align: 'center' })

            currentY += rowHeight
        })

        // Moyenne de l'UE
        const ueData = uesValidees.find(u => u.ue === ue)
        const ueRowHeight = 15
        const totalCredits = modulesByUE[ue].reduce((sum, m) => sum + (m.credits || 0), 0)
        const totalCoeff = modulesByUE[ue].reduce((sum, m) => sum + (m.coefficient || 0), 0)
        const totalPoints = modulesByUE[ue].reduce((sum, m) => sum + ((m.noteEtudiant || 0) * (m.coefficient || 0)), 0)
        const moyenneUE = ueData ? ueData.moyenne : (totalCoeff > 0 ? totalPoints / totalCoeff : 0)
        const moyenneClasseUE = modulesByUE[ue].reduce((sum, m) => sum + (m.moyenneClasse || 0) || 0, 0) / (modulesByUE[ue].length || 1)

        doc.rect(MARGIN_LEFT, currentY, TABLE_WIDTH, ueRowHeight).stroke()
        doc.rect(colPositions[3], currentY, colWidths[3], ueRowHeight).fillAndStroke('#F0F0F0', '#000000')
        doc.rect(colPositions[4], currentY, colWidths[4], ueRowHeight).stroke()

        doc.moveTo(colPositions[1], currentY).lineTo(colPositions[1], currentY + ueRowHeight).stroke()
        doc.moveTo(colPositions[2], currentY).lineTo(colPositions[2], currentY + ueRowHeight).stroke()

        doc.fontSize(8.5)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text(`MOYENNE ${ue}`, MARGIN_LEFT + 5, currentY + 4)

        doc.text(totalCredits.toString(), colPositions[1], currentY + 4, { width: colWidths[1], align: 'center' })
        doc.text(totalCoeff.toFixed(2), colPositions[2], currentY + 4, { width: colWidths[2], align: 'center' })

        doc.fontSize(8)
            .text(moyenneUE.toFixed(2), colPositions[3], currentY + 4, { width: colWidths[3], align: 'center' })

        doc.fontSize(8)
            .text(moyenneClasseUE.toFixed(2), colPositions[4], currentY + 4, { width: colWidths[4], align: 'center' })

        currentY += ueRowHeight
        doc.moveDown(0.2)
    })

    doc.y = currentY + 5
}

/**
 * Dessine le résumé du semestre avec le nouveau design
 */
function drawSummary(doc, bulletinData) {
    const startY = doc.y + 8 // Passé de 5 à 8
    const rowHeight = 15 // Passé de 12 à 15
    const MARGIN_LEFT = 40

    // Pénalités d'absences
    doc.rect(MARGIN_LEFT, startY, 515, rowHeight).stroke()
    doc.fontSize(8) // Passé de 7 à 8
        .font('Helvetica')
        .fillColor('#000000')
        .text('Pénalités d\'absences', MARGIN_LEFT + 5, startY + 4)
    doc.fillColor('#000000')
    const penalites = bulletinData.penalitesAbsences ? bulletinData.penalitesAbsences.toFixed(2).replace('.', ',') : '0,00'
    const heures = bulletinData.heuresAbsences ? `${bulletinData.heuresAbsences} heure(s)` : '0 heure(s)'
    doc.text(`${penalites}      ${heures}`, 350, startY + 4, { width: 150, align: 'right' })

    // Moyenne du semestre
    const moyenneRowHeight = 18 // Passé de 16 à 18
    const summaryColWidths = [205, 50, 50, 105, 105] // Aligné avec colWidths du tableau
    const summaryColPositions = [40, 245, 295, 345, 450]

    // Première colonne
    doc.rect(summaryColPositions[0], startY + rowHeight, summaryColWidths[0], moyenneRowHeight).stroke()
    doc.fontSize(9) // Passé de 8 à 9
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`Moyenne Semestre ${bulletinData.semestre.replace('S', '')}`, summaryColPositions[0] + 5, startY + rowHeight + 5)

    // Colonnes intermédiaires
    doc.rect(summaryColPositions[1], startY + rowHeight, summaryColWidths[1], moyenneRowHeight).stroke()
    doc.rect(summaryColPositions[2], startY + rowHeight, summaryColWidths[2], moyenneRowHeight).stroke()

    // Lignes verticales
    doc.moveTo(summaryColPositions[1], startY + rowHeight).lineTo(summaryColPositions[1], startY + rowHeight + moyenneRowHeight).stroke()
    doc.moveTo(summaryColPositions[2], startY + rowHeight).lineTo(summaryColPositions[2], startY + rowHeight + moyenneRowHeight).stroke()
    doc.moveTo(summaryColPositions[3], startY + rowHeight).lineTo(summaryColPositions[3], startY + rowHeight + moyenneRowHeight).stroke()
    doc.moveTo(summaryColPositions[4], startY + rowHeight).lineTo(summaryColPositions[4], startY + rowHeight + moyenneRowHeight).stroke()

    // Moyenne Étudiant
    doc.rect(summaryColPositions[3], startY + rowHeight, summaryColWidths[3], moyenneRowHeight)
        .fillAndStroke('#FADBD8', '#000000')
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(bulletinData.moyenneSemestre ? bulletinData.moyenneSemestre.toFixed(2).replace('.', ',') : '0,00',
            summaryColPositions[3], startY + rowHeight + 4, { width: summaryColWidths[3], align: 'center' })

    // Moyenne Classe
    doc.rect(summaryColPositions[4], startY + rowHeight, summaryColWidths[4], moyenneRowHeight)
        .stroke()
    doc.fontSize(7)
        .font('Helvetica')
        .text(bulletinData.moyenneClasse ? bulletinData.moyenneClasse.toFixed(2).replace('.', ',') : '0,00',
            summaryColPositions[4], startY + rowHeight + 4, { width: summaryColWidths[4], align: 'center' })

    // Rang et mention
    const rangRowHeight = 12
    const rangY = startY + rowHeight + moyenneRowHeight + 5

    // Ligne 1: Titres
    doc.rect(summaryColPositions[0], rangY, summaryColWidths[0], rangRowHeight).stroke()
    doc.rect(summaryColPositions[1], rangY, 515 - summaryColWidths[0], rangRowHeight).stroke()
    doc.fontSize(7)
        .font('Helvetica')
        .text('Rang de l\'étudiant au Semestre', summaryColPositions[0] + 5, rangY + 3)
        .text('Mention', summaryColPositions[1] + 5, rangY + 3)

    // Ligne 2: Valeurs
    doc.rect(summaryColPositions[0], rangY + rangRowHeight, summaryColWidths[0], rangRowHeight).stroke()
    doc.rect(summaryColPositions[1], rangY + rangRowHeight, 515 - summaryColWidths[0], rangRowHeight).stroke()
    const rangText = bulletinData.rangEtudiant ? `${bulletinData.rangEtudiant}ème/${bulletinData.totalEtudiants || ''}` : '-'

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(rangText, summaryColPositions[0] + 5, rangY + rangRowHeight + 3)
        .text(bulletinData.mention || 'Assez Bien', summaryColPositions[1] + 5, rangY + rangRowHeight + 3)

    doc.y = rangY + (rangRowHeight * 2) + 5
}

/**
 * Dessine le tableau de validation des crédits avec le nouveau design
 */
function drawCreditsValidation(doc, uesValidees) {
    const startY = doc.y + 8 // Passé de 5 à 8
    const headerHeight = 15 // Passé de 12 à 15
    const rowHeight = 15 // Passé de 12 à 15
    const MARGIN_LEFT = 40
    const TABLE_WIDTH = 515

    // En-tête
    doc.rect(MARGIN_LEFT, startY, TABLE_WIDTH, headerHeight).stroke()
    doc.fontSize(8.5) // Passé de 8 à 8.5
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('État de la Validation des Crédits au Semestre', MARGIN_LEFT, startY + 4, { width: TABLE_WIDTH, align: 'center' })

    const tableY = startY + headerHeight
    const colWidth = TABLE_WIDTH / 3

    let currentY = tableY

    // Lignes des UEs
    uesValidees.forEach((ue, index) => {
        if (index < 3) {
            const xPos = MARGIN_LEFT + (index * colWidth)
            const padding = 5

            // Ligne 1: Nom UE (Afficher le nom si disponible, sinon le code)
            doc.rect(xPos, currentY, colWidth, rowHeight).stroke()
            doc.fontSize(8) // Passé de 7 à 8
                .font('Helvetica')
                .fillColor('#000000')
                .text(ue.nom_ue || ue.ue || `UE ${index + 1}`, xPos + padding, currentY + 4, { width: colWidth - 10, truncate: true })

            // Ligne 2: Crédits (Vrai nombre / Total)
            doc.rect(xPos, currentY + rowHeight, colWidth, rowHeight).stroke()
            const creditsText = `${ue.credits || 0} Crédits /${ue.totalCredits || 0}`
            doc.text(creditsText, xPos + padding, currentY + rowHeight + 4)

            // Ligne 3: Statut (avec compensation)
            doc.rect(xPos, currentY + (rowHeight * 2), colWidth, rowHeight).stroke()
            doc.fontSize(8)
                .font('Helvetica-Bold')

            let statusText = 'UE Non Acquise'
            if (ue.status === 'ACQUISE') statusText = 'UE Acquise'
            else if (ue.status === 'ACQUISE_PAR_COMPENSATION') statusText = 'UE Acquise par compensation'

            doc.text(statusText, xPos + padding, currentY + (rowHeight * 2) + 4)
        }
    })

    // Colonne Semestre (si place)
    if (uesValidees.length < 3) {
        const totalCredits = uesValidees.reduce((sum, ue) => sum + (ue.credits || 0), 0)
        const totalCreditsRequired = uesValidees.reduce((sum, ue) => sum + (ue.totalCredits || 0), 0)
        const allValides = uesValidees.every(ue => ue.valide)
        const compense = uesValidees.some(ue => ue.status === 'ACQUISE_PAR_COMPENSATION')

        const xPos = MARGIN_LEFT + (2 * colWidth)
        doc.rect(xPos, currentY, colWidth, rowHeight).stroke()
        doc.fontSize(8)
            .font('Helvetica')
            .text('Crédits validés au Semestre', xPos + 5, currentY + 4, { width: colWidth - 10 })

        doc.rect(xPos, currentY + rowHeight, colWidth, rowHeight).stroke()
        doc.text(`${totalCredits} Crédits /${totalCreditsRequired}`, xPos + 5, currentY + rowHeight + 4)

        doc.rect(xPos, currentY + (rowHeight * 2), colWidth, rowHeight).stroke()
        doc.fontSize(8)
            .font('Helvetica-Bold')

        let semestreStatus = 'Semestre Non Acquis'
        if (allValides) {
            semestreStatus = compense ? 'Semestre Acquis par compensation' : 'Semestre Acquis'
        }
        doc.text(semestreStatus, xPos + 5, currentY + (rowHeight * 2) + 4)
    }

    doc.y = currentY + (rowHeight * 3) + 10
}

/**
 * Dessine le pied de page avec la décision et le cachet (si autorisé)
 * @param {PDFDocument} doc - Document PDF
 * @param {string} decision - Décision du jury
 * @param {string} dateGeneration - Date de génération
 * @param {boolean} includeStamp - Inclure le cachet (true pour DEP uniquement)
 * @param {Object} depInfo - Informations du DEP (dateVisa, nom, prenom, titre) - optionnel
 */
function drawFooter(doc, decision, dateGeneration, includeStamp = false, depInfo = null) {
    const cachetPath = path.join(__dirname, '../../public/images/cachet.png')

    // Utiliser l'espace restant naturellement
    // doc.y contient la position actuelle après les tableaux
    const footerY = doc.y
    const MARGIN_LEFT = 40
    const TABLE_WIDTH = 515

    // Décision du jury
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text(`Décision du jury: ${decision}`, MARGIN_LEFT, footerY, { width: TABLE_WIDTH, align: 'left' })

    if (includeStamp && fs.existsSync(cachetPath)) {
        const cachetWidth = 140
        const cachetHeight = 140

        const cachetY = footerY + 10
        const cachetX = MARGIN_LEFT + (TABLE_WIDTH - cachetWidth) / 2

        doc.image(cachetPath, cachetX, cachetY, { width: cachetWidth })

        // Texte sur le cachet
        const fontSize = 7.5
        const textWidth = 200 // Plus large que le cachet pour que la date loge sur une ligne
        const textX = MARGIN_LEFT + (TABLE_WIDTH - textWidth) / 2

        if (depInfo && depInfo.dateVisa) {
            const dateVisa = new Date(depInfo.dateVisa).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            doc.fontSize(fontSize)
                .font('Helvetica-Bold')
                .text(`Fait à Libreville le ${dateVisa}`, textX, cachetY + 12, {
                    width: textWidth,
                    align: 'center'
                })
        }

        const titreText = depInfo?.titre || 'Directeur des Études et de la Pédagogie'
        doc.fontSize(fontSize)
            .font('Helvetica-Bold')
            .text(titreText, textX, cachetY + 65, {
                width: textWidth,
                align: 'center'
            })

        if (depInfo && depInfo.nom && depInfo.prenom) {
            const nomComplet = `${depInfo.prenom} ${depInfo.nom}`
            doc.fontSize(fontSize)
                .font('Helvetica-Bold')
                .text(nomComplet, textX, cachetY + 120, {
                    width: textWidth,
                    align: 'center'
                })
        }
    } else {
        const date = new Date(dateGeneration).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        doc.fontSize(8)
            .font('Helvetica')
            .text(`Fait à Libreville, le ${date}`, MARGIN_LEFT, footerY + 15)
    }

    // Note en bas
    // Placer tout en bas de la page
    const bottomPageY = 842 - 30 // Hauteur A4 - margin bottom
    doc.fontSize(6)
        .font('Helvetica-Oblique')
        .text('Il ne sera délivré qu\'un seul et unique exemplaire de bulletin de notes. L\'étudiant est donc prié d\'en faire plusieurs copies légalisées.',
            MARGIN_LEFT, bottomPageY - 10, { width: TABLE_WIDTH, align: 'center' })
}
