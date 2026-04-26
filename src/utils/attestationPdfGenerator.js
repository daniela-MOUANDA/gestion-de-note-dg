/**
 * Génération des attestations de scolarité avec jsPDF (sans html2canvas).
 * Evite entièrement les pages blanches dues au rendu hors-écran de html2canvas.
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
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 300
        canvas.height = img.naturalHeight || 200
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
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
 * Construit une attestation de scolarité en PDF.
 *
 * @param {object} data
 *   { etudiant, matricule, niveau, filiere, formation, anneeAcademique, numero, lieu, dateTexte }
 * @param {string|null} logoDataUrl   – data-URL PNG du logo INPTIC
 * @param {string|null} cachetDataUrl – data-URL PNG du cachet
 * @param {boolean}     isDuplicate   – ajoute le filigrane + tampon DUPLICATA rouge
 * @returns {jsPDF}
 */
export function buildAttestationPdf(data, logoDataUrl, cachetDataUrl, isDuplicate = false) {
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
  const mL = 20
  const mR = 20
  const mT = 20
  const cW = W - mL - mR // 170 mm

  // ── Filigrane DUPLICATA (diagonal, rouge clair) ──────────────────────────
  if (isDuplicate) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(66)
    doc.setTextColor(230, 170, 170) // rouge très atténué = effet watermark
    doc.text('DUPLICATA', W / 2, H / 2 + 10, { align: 'center', angle: 38 })

    // Tampon rouge vif en haut à droite
    doc.setFontSize(11)
    doc.setTextColor(200, 30, 30)
    doc.setDrawColor(200, 30, 30)
    doc.setLineWidth(0.5)
    const stampW = 44
    const stampH = 9
    const stampX = W - mR - stampW
    const stampY = mT - 3
    doc.rect(stampX, stampY, stampW, stampH)
    doc.text('DUPLICATA', stampX + stampW / 2, stampY + 6, { align: 'center' })

    // Remettre les couleurs par défaut
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
  }

  let y = mT

  // ── Logo ─────────────────────────────────────────────────────────────────
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', mL, y, 28, 22, undefined, 'FAST')
  }

  // ── En-tête texte ────────────────────────────────────────────────────────
  const hx = mL + 32
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(0, 0, 0)
  doc.text('DIRECTION GENERALE', hx, y + 7)
  doc.text('LA DIRECTION DE LA SCOLARITE ET DES EXAMENS', hx, y + 13)
  doc.setFontSize(9)
  doc.text(String(numero), hx, y + 20)

  y += 32

  // ── Bandeau bleu titre ───────────────────────────────────────────────────
  doc.setFillColor(168, 201, 228)  // #A8C9E4
  doc.setDrawColor(44, 62, 80)     // #2C3E50
  doc.setLineWidth(0.8)
  doc.rect(mL, y, cW, 13, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(0, 0, 0)
  doc.text('ATTESTATION DE SCOLARITE', W / 2, y + 8.5, { align: 'center' })
  y += 20

  // ── Paragraphe introductif ───────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  // Les polices WinAnsiEncoding (Helvetica) supportent les caractères Latin-1 (é,è,à,ç…)
  const introText =
    "   Je soussign\u00e9, Soilihi ALI ISSILAM, Directeur de la Scolarit\u00e9 et des Examens de " +
    "l'Institut National de la Poste, des Technologies de l'Information et de la " +
    "Communication (INPTIC), atteste que l'\u00e9tudiant(e) " +
    etudiant +
    " suit la formation ci-dessous dans notre \u00e9tablissement."
  const introLines = doc.splitTextToSize(introText, cW)
  doc.text(introLines, mL, y)
  y += introLines.length * 6.5 + 8

  // ── Liste d'informations ─────────────────────────────────────────────────
  const listX = mL + 8
  const lineH = 7
  const items = [
    ['Matricule', String(matricule)],
    ["Niveau d'\u00e9tudes", `${niveau} ann\u00e9e`],
    ['Fili\u00e8re', String(filiere)],
    ['Programme', String(formation)],
    ['Ann\u00e9e acad\u00e9mique', String(anneeAcademique)],
  ]

  for (const [label, value] of items) {
    doc.setFont('helvetica', 'normal')
    doc.text('>', mL + 1.5, y)
    doc.setFont('helvetica', 'bold')
    const lbl = `${label} : `
    doc.text(lbl, listX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, listX + doc.getTextWidth(lbl), y)
    y += lineH
  }

  y += 8

  // ── Paragraphe de clôture ────────────────────────────────────────────────
  const closingText =
    "   En foi de quoi, la pr\u00e9sente attestation lui est d\u00e9livr\u00e9e pour servir " +
    "et valoir ce que de droit."
  const closingLines = doc.splitTextToSize(closingText, cW)
  doc.setFont('helvetica', 'normal')
  doc.text(closingLines, mL, y)

  // ── Section signature (bas droite) ───────────────────────────────────────
  const sigY = 226
  const rightX = W - mR
  const sigCenterX = W - mR - 35

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fait \u00e0 ${lieu}, le ${dateTexte}`, rightX, sigY, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.text('Directeur de la Scolarit\u00e9 et des Examens', rightX, sigY + 8, { align: 'right' })

  const cachetSize = 38
  if (cachetDataUrl) {
    doc.addImage(
      cachetDataUrl, 'PNG',
      sigCenterX - cachetSize / 2, sigY + 12,
      cachetSize, cachetSize,
      undefined, 'FAST'
    )
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Soilihi ALI ISSILAM', sigCenterX, sigY + 56, { align: 'center' })

  // ── Pied de page ─────────────────────────────────────────────────────────
  doc.setDrawColor(120, 120, 120)
  doc.setLineWidth(0.25)
  doc.line(mL, 283, W - mR, 283)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(70, 70, 70)
  doc.text(
    "Etablissement public sous tutelle du Minist\u00e8re de l'Economie Num\u00e9rique " +
    "et des Nouvelles Technologies de l'Information",
    W / 2, 287, { align: 'center' }
  )
  doc.text(
    'Tel : (241) 01 73 81 31 - Fax: (241) 01 73 44 16 - BP 13 124 Libreville - Gabon - Email : gabon.inptic@gmail.com',
    W / 2, 292, { align: 'center' }
  )

  return doc
}

/** Retourne le blob PDF de l'attestation */
export function buildAttestationPdfBlob(data, logoDataUrl, cachetDataUrl, isDuplicate = false) {
  return buildAttestationPdf(data, logoDataUrl, cachetDataUrl, isDuplicate).output('blob')
}
