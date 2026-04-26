/**
 * Génération des attestations de scolarité avec jsPDF.
 * Design calqué fidèlement sur l'attestation officielle INPTIC.
 *
 *  - Gras sur le nom de l'étudiant et les labels
 *  - Exposants "ère" / "ème" / "ième" pour les niveaux d'études
 *  - Triangles ➤ pour la liste
 *  - Bandeau bleu titre avec bordure marquée
 *  - Signature grande, posée AU-DESSUS du cachet (qui chevauche en bas)
 */
import { jsPDF } from 'jspdf'

// ─── Helpers d'images ────────────────────────────────────────────────────

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

// ─── Helpers de noms de fichiers ─────────────────────────────────────────

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

export function sanitizePdfNamePart(s) {
  return String(s ?? 'X')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'X'
}

// ─── Helpers typographiques ──────────────────────────────────────────────

/**
 * Sépare un libellé d'ordinal en (chiffre, suffixe à mettre en exposant).
 * Ex : "1ère" → {num:"1", sup:"\u00e8re"}, "3ème" → {num:"3", sup:"\u00e8me"}
 */
function parseOrdinal(value) {
  const s = String(value ?? '').trim()
  const m = s.match(/^(\d+)\s*(ère|ere|ème|eme|ième|ieme)\b/i)
  if (!m) return { num: s, sup: '', tail: '' }
  const sup = m[2].toLowerCase()
    .replace(/^ere$/i, '\u00e8re')
    .replace(/^eme$/i, '\u00e8me')
    .replace(/^ieme$/i, 'i\u00e8me')
  return { num: m[1], sup, tail: s.slice(m[0].length).trim() }
}

/** Dessine un petit triangle (style ➤) plein, à gauche d'un item de liste. */
function drawBullet(doc, x, y) {
  // triangle pointant à droite
  doc.setFillColor(0, 0, 0)
  doc.triangle(x, y - 2.4, x, y + 0.4, x + 2.6, y - 1, 'F')
}

/**
 * Écrit un paragraphe contenant des segments en gras et en normal,
 * en gérant correctement le wrap. Renvoie le Y final.
 *
 * @param {Array<{text:string,bold:boolean}>} segments
 */
function drawRichParagraph(doc, segments, { x, y, maxWidth, lineHeight, fontSize, indent = 0 }) {
  const space = ' '
  // Découper en tokens (mots + espaces)
  const tokens = []
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/) // garde les espaces
    for (const p of parts) {
      if (p.length === 0) continue
      tokens.push({ text: p, bold: seg.bold, isSpace: /^\s+$/.test(p) })
    }
  }

  let cursorX = x + indent
  let lineMax = maxWidth - indent
  let firstOfLine = true

  doc.setFontSize(fontSize)

  for (const tk of tokens) {
    doc.setFont('helvetica', tk.bold ? 'bold' : 'normal')
    const w = doc.getTextWidth(tk.text)

    // Si on est en début de ligne et que le token est un espace, on l'ignore
    if (firstOfLine && tk.isSpace) continue

    // Si le mot ne tient pas → retour à la ligne
    if (!tk.isSpace && cursorX - x + w > maxWidth) {
      y += lineHeight
      cursorX = x
      lineMax = maxWidth
      firstOfLine = true
      if (tk.isSpace) continue
    }

    doc.text(tk.text, cursorX, y)
    cursorX += w
    firstOfLine = false
  }
  return y
}

// ─── Builder principal ───────────────────────────────────────────────────

/**
 * Construit une attestation de scolarité en PDF.
 *
 * @param {object}      data              - infos
 * @param {string|null} logoDataUrl
 * @param {string|null} cachetDataUrl
 * @param {boolean}     isDuplicate
 * @param {string|null} signatureDataUrl
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
  const mL = 22
  const mR = 22
  const mT = 14
  const cW = W - mL - mR // 166 mm

  // ── Filigrane DUPLICATA ─────────────────────────────────────────────────
  if (isDuplicate) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(72)
    doc.setTextColor(235, 185, 185)
    doc.text('DUPLICATA', W / 2, H / 2 + 10, { align: 'center', angle: 38 })
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setTextColor(200, 30, 30)
    doc.setDrawColor(200, 30, 30)
    doc.setLineWidth(0.5)
    const sw = 40, sh = 8, sx = W - mR - sw, sy = mT - 2
    doc.rect(sx, sy, sw, sh)
    doc.text('DUPLICATA', sx + sw / 2, sy + 5.5, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
  }

  // ── Logo + texte sous le logo ───────────────────────────────────────────
  // Sur l'original : logo ~28mm de large, légende juste en dessous
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', mL, mT, 30, 24, undefined, 'FAST')
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(0, 0, 0)
  doc.text('Institut National de la Poste, des Technologies', mL + 15, mT + 26, { align: 'center' })
  doc.text("de l'Information et de la Communication",        mL + 15, mT + 28.5, { align: 'center' })

  // ── En-tête textuel (à droite du logo) ──────────────────────────────────
  const hx = mL + 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('DIRECTION GENERALE', hx, mT + 8)
  doc.text('LA DIRECTION DE LA SCOLARITE ET DES EXAMENS', hx, mT + 13)
  doc.text(String(numero), hx, mT + 19)

  // ── Bandeau bleu titre ──────────────────────────────────────────────────
  let y = mT + 40
  const bandX = mL + 14
  const bandW = cW - 28

  doc.setFillColor(168, 201, 228)        // #A8C9E4
  doc.setDrawColor(40, 90, 145)          // bord bleu foncé
  doc.setLineWidth(0.7)
  doc.roundedRect(bandX, y, bandW, 13, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(0, 0, 0)
  doc.text('ATTESTATION DE SCOLARITE', W / 2, y + 9, { align: 'center' })
  y += 22

  // ── Paragraphe d'introduction (avec NOM en gras) ────────────────────────
  doc.setTextColor(0, 0, 0)
  const introFontSize = 11
  const introLineH    = 5.8
  const nomUpper      = String(etudiant).trim()

  y = drawRichParagraph(doc, [
    { text: 'Je soussign\u00e9, ',                                                      bold: false },
    { text: 'Soilihi ALI ISSILAM',                                                       bold: false },
    { text: ', Directeur de la Scolarit\u00e9 et des Examens de l\u2019Institut '       , bold: false },
    { text: 'National de la Poste, des Technologies de l\u2019Information et de la '   , bold: false },
    { text: 'Communication (INPTIC), atteste que l\u2019\u00e9tudiant(e) '              , bold: false },
    { text: nomUpper.toUpperCase(),                                                       bold: true },
    { text: ' suit la formation ci-dessous dans notre \u00e9tablissement.',               bold: false },
  ], { x: mL, y, maxWidth: cW, lineHeight: introLineH, fontSize: introFontSize, indent: 8 })

  y += introLineH + 6

  // ── Liste d'informations ────────────────────────────────────────────────
  // Format : ➤ **Label :** valeur (avec exposant pour le niveau)
  const labelFontSize = 11
  const itemSpacing   = 8.5
  const labelX        = mL + 8     // après le triangle
  const ord           = parseOrdinal(niveau)

  const drawListItem = (label, valueRenderer) => {
    drawBullet(doc, mL + 2, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(labelFontSize)
    const lbl = `${label}\u00a0:\u00a0`
    doc.text(lbl, labelX, y)
    const valueX = labelX + doc.getTextWidth(lbl)
    doc.setFont('helvetica', 'normal')
    valueRenderer(valueX, y)
    y += itemSpacing
  }

  // Niveau d'études — avec exposant
  drawListItem("Niveau d'\u00e9tudes", (vx, vy) => {
    doc.setFontSize(labelFontSize)
    doc.text(ord.num, vx, vy)
    const numW = doc.getTextWidth(ord.num)
    if (ord.sup) {
      // exposant : police plus petite + offset Y vers le haut
      doc.setFontSize(labelFontSize * 0.65)
      doc.text(ord.sup, vx + numW + 0.3, vy - 1.6)
      doc.setFontSize(labelFontSize)
    }
    const supW = ord.sup ? doc.getTextWidth(ord.sup) * (0.65) : 0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(labelFontSize)
    doc.text(' ann\u00e9e', vx + numW + supW + 1, vy)
  })

  drawListItem('Fili\u00e8re',          (vx, vy) => doc.text(String(filiere), vx, vy))
  drawListItem('Programme',             (vx, vy) => doc.text(String(formation), vx, vy))
  drawListItem('Ann\u00e9e acad\u00e9mique', (vx, vy) => doc.text(String(anneeAcademique), vx, vy))

  // ── Paragraphe de clôture ───────────────────────────────────────────────
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(introFontSize)
  y = drawRichParagraph(doc, [
    { text: 'En foi de quoi, la pr\u00e9sente attestation lui est d\u00e9livr\u00e9e ' +
            'pour servir et valoir ce que de droit.', bold: false },
  ], { x: mL, y, maxWidth: cW, lineHeight: introLineH, fontSize: introFontSize, indent: 8 })

  // ── Bloc signature (aligné à droite, comme l'original) ──────────────────
  // Position fixe : on aligne sur le bas pour une présentation aérée
  const blockRight  = W - mR
  const blockCenter = W - mR - 38   // centre du bloc signature/cachet
  let sigY = 195                    // commence assez haut pour avoir de la place

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fait \u00e0 ${lieu}, le ${dateTexte}`, blockRight, sigY, { align: 'right' })
  sigY += 8

  // Titre signataire (en gras)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Directeur de la Scolarit\u00e9 et des Examens', blockRight, sigY, { align: 'right' })
  sigY += 4

  // Signature manuscrite (grande, AU-DESSUS du cachet)
  const sigW = 50
  const sigH = 22
  if (signatureDataUrl) {
    doc.addImage(
      signatureDataUrl, 'PNG',
      blockCenter - sigW / 2, sigY,
      sigW, sigH,
      undefined, 'FAST'
    )
    sigY += sigH - 8     // léger chevauchement avec le cachet en dessous
  } else {
    sigY += 6            // espace réservé même sans signature
  }

  // Cachet circulaire (chevauchement avec le bas de la signature)
  const cachetSize = 32
  if (cachetDataUrl) {
    doc.addImage(
      cachetDataUrl, 'PNG',
      blockCenter - cachetSize / 2, sigY,
      cachetSize, cachetSize,
      undefined, 'FAST'
    )
    sigY += cachetSize
  }

  // Nom du signataire (en gras, sous le cachet)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Soilihi ALI ISSILAM', blockCenter, sigY + 2, { align: 'center' })

  // ── Pied de page institutionnel ─────────────────────────────────────────
  const footY = H - 14
  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.3)
  doc.line(mL, footY, W - mR, footY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(50, 50, 50)
  doc.text(
    "\u00c9tablissement public sous tutelle du Minist\u00e8re de l'Economie Num\u00e9rique " +
    "et des Nouvelles Technologies de l'Information",
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
