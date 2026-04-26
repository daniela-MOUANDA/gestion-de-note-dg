/**
 * Génération des attestations de scolarité avec jsPDF.
 * Design calqué sur l'attestation officielle INPTIC.
 */
import { jsPDF } from 'jspdf'

// ---------- helpers ----------

export async function preloadAttestationImages() {
  const [logoUrl, cachetUrl] = await Promise.all([
    loadImgAsDataUrl(`${window.location.origin}/images/logo.png`),
    loadImgAsDataUrl(`${window.location.origin}/images/cachet.png`),
  ])
  return { logoUrl, cachetUrl }
}

function loadImgAsDataUrl(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth || 300
        c.height = img.naturalHeight || 200
        c.getContext('2d').drawImage(img, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Sanitize un segment pour un nom de fichier/dossier zip */
export function sanitizeZipSegment(value) {
  if (value == null || String(value).trim() === '') return 'X'
  return String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'X'
}

/** Sanitize un morceau de nom de fichier PDF */
export function sanitizePdfNamePart(s) {
  return String(s ?? 'X')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'X'
}

// ---------- core PDF builder ----------

/**
 * Construit une attestation de scolarité en PDF, design fidèle à l'original INPTIC.
 *
 * @param {object}  data           - champs de l'attestation
 * @param {string|null} logoDataUrl
 * @param {string|null} cachetDataUrl
 * @param {boolean} isDuplicate    - ajoute filigrane + tampon DUPLICATA rouge
 * @param {string|null} signatureDataUrl - signature du Directeur (optionnelle)
 * @returns {jsPDF}
 */
export function buildAttestationPdf(data, logoDataUrl, cachetDataUrl, isDuplicate = false, signatureDataUrl = null) {
  const {
    etudiant = '',
    matricule = '',
    niveau = '',
    filiere = '',
    formation = '',
    anneeAcademique = '',
    numero = '',
    lieu = 'Libreville',
    dateTexte = '',
  } = data

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210
  const H = 297
  const mL = 20   // marge gauche
  const mR = 20   // marge droite
  const mT = 18   // marge haute
  const cW = W - mL - mR   // 170 mm

  // ── Filigrane DUPLICATA (diagonal, rouge très clair) ─────────────────────
  if (isDuplicate) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(70)
    doc.setTextColor(235, 185, 185)
    doc.text('DUPLICATA', W / 2, H / 2 + 10, { align: 'center', angle: 38 })
    doc.setTextColor(0, 0, 0)

    // Tampon rouge vif haut droite
    doc.setFontSize(11)
    doc.setTextColor(200, 30, 30)
    doc.setDrawColor(200, 30, 30)
    doc.setLineWidth(0.5)
    const sw = 44, sh = 9, sx = W - mR - sw, sy = mT - 3
    doc.rect(sx, sy, sw, sh)
    doc.text('DUPLICATA', sx + sw / 2, sy + 6, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
  }

  let y = mT

  // ── Logo ─────────────────────────────────────────────────────────────────
  // L'original : logo 32×26 mm en haut à gauche, texte à droite du logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', mL, y, 32, 26, undefined, 'FAST')
  }

  // ── En-tête textuel (à droite du logo, calque identique à l'original) ────
  const hx = mL + 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('DIRECTION GENERALE', hx, y + 6)
  doc.text('LA DIRECTION DE LA SCOLARITE ET DES EXAMENS', hx, y + 12)

  // Numéro de l'attestation
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(String(numero), hx, y + 20)

  y += 32   // avance après le bloc logo/en-tête

  // ── Bandeau bleu titre ───────────────────────────────────────────────────
  doc.setFillColor(168, 201, 228)   // #A8C9E4
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(mL, y, cW, 14, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('ATTESTATION DE SCOLARITE', W / 2, y + 9.5, { align: 'center' })
  y += 22

  // ── Paragraphe introductif ───────────────────────────────────────────────
  // Police légèrement réduite pour avoir de l'air, texte justifié simulé
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)

  const introText =
    '   Je soussign\u00e9, Soilihi ALI ISSILAM, Directeur de la Scolarit\u00e9 et des ' +
    'Examens de l\'Institut National de la Poste, des Technologies de l\'Information ' +
    'et de la Communication (INPTIC), atteste que l\'\u00e9tudiant(e) ' +
    etudiant +
    ' suit la formation ci-dessous dans notre \u00e9tablissement.'

  const introLines = doc.splitTextToSize(introText, cW)
  doc.text(introLines, mL, y)
  y += introLines.length * 6.2 + 10

  // ── Liste d'informations (calque fidèle : ➤ bold label, valeur normale) ──
  const listX  = mL + 9   // décalage de la liste
  const lineH  = 8        // espacement entre items

  // Selon l'original : Niveau, Filière, Programme, Année — PAS de matricule dans la liste
  const items = [
    ["Niveau d'\u00e9tudes", `${niveau} ann\u00e9e`],
    ['Fili\u00e8re', String(filiere)],
    ['Programme', String(formation)],
    ['Ann\u00e9e acad\u00e9mique', String(anneeAcademique)],
  ]

  for (const [label, value] of items) {
    // Symbole flèche
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('>', mL + 1, y)

    // Label en gras
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const lbl = `${label}\u00a0: `
    doc.text(lbl, listX, y)

    // Valeur en normal
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), listX + doc.getTextWidth(lbl), y)

    y += lineH
  }

  y += 10

  // ── Paragraphe de clôture ────────────────────────────────────────────────
  const closingText =
    '   En foi de quoi, la pr\u00e9sente attestation lui est d\u00e9livr\u00e9e ' +
    'pour servir et valoir ce que de droit.'
  const closingLines = doc.splitTextToSize(closingText, cW)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(closingLines, mL, y)

  // ── Section signature ────────────────────────────────────────────────────
  // Position fixe proche du bas, alignée à droite (comme l'original)
  const sigY     = 232
  const rightX   = W - mR
  const sigCtrX  = W - mR - 32   // centre horizontal du bloc signature

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fait \u00e0 ${lieu}, le ${dateTexte}`, rightX, sigY, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.text('Directeur de la Scolarit\u00e9 et des Examens', rightX, sigY + 8, { align: 'right' })

  // Signature du directeur (si fournie)
  const sigImgSize = 30
  if (signatureDataUrl) {
    doc.addImage(
      signatureDataUrl, 'PNG',
      sigCtrX - sigImgSize / 2, sigY + 10,
      sigImgSize, sigImgSize * 0.5,
      undefined, 'FAST'
    )
  }

  // Cachet circulaire (chevauchant la signature comme sur l'original)
  const cachetSize = 34
  const cachetX    = sigCtrX - cachetSize / 2 + 8   // légèrement décalé à droite
  const cachetY    = sigY + (signatureDataUrl ? 18 : 10)
  if (cachetDataUrl) {
    doc.addImage(cachetDataUrl, 'PNG', cachetX, cachetY, cachetSize, cachetSize, undefined, 'FAST')
  }

  // Nom du signataire
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Soilihi ALI ISSILAM', sigCtrX, cachetY + cachetSize + 4, { align: 'center' })

  // ── Pied de page institutionnel ──────────────────────────────────────────
  const footY = H - 14
  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.3)
  doc.line(mL, footY, W - mR, footY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(50, 50, 50)
  doc.text(
    '\u00c9tablissement public sous tutelle du Minist\u00e8re de l\'Economie Num\u00e9rique ' +
    'et des Nouvelles Technologies de l\'Information',
    W / 2, footY + 4, { align: 'center' }
  )
  doc.text(
    'T\u00e9l\u00a0: (241) 01 73 81 31 \u2013 Fax\u00a0: (241) 01 73 44 16 \u2013 ' +
    'BP 13 124 Libreville \u2013 Gabon \u2013 Email\u00a0: gabon.inptic@gmail.com',
    W / 2, footY + 9, { align: 'center' }
  )

  return doc
}

/** Retourne le blob PDF de l'attestation */
export function buildAttestationPdfBlob(data, logoDataUrl, cachetDataUrl, isDuplicate = false, signatureDataUrl = null) {
  return buildAttestationPdf(data, logoDataUrl, cachetDataUrl, isDuplicate, signatureDataUrl).output('blob')
}
