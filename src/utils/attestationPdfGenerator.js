/**
 * Génération des attestations de scolarité avec jsPDF.
 * Calque fidèle de la maquette HTML/CSS — Times New Roman pour le corps,
 * Arial/Helvetica pour l'en-tête et le pied, exposants ère/ème, justification,
 * signature grande au-dessus du cachet.
 *
 * Conversion px → mm A4 :
 *   - Maquette HTML 800px de large = page A4 (210mm), facteur ~ 0.2625 mm/px
 *   - Marges 95px G/D ≈ 25mm
 *   - Tailles : 16px ≈ 12pt, 26px ≈ 20pt, 14px ≈ 10.5pt, 11px ≈ 8.5pt, 10px ≈ 7.5pt
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

// ─── Helpers noms de fichiers ────────────────────────────────────────────

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

/** Sépare "3ème" → {num:"3", sup:"ème"} pour rendu en exposant. */
function parseOrdinal(value) {
  const s = String(value ?? '').trim()
  const m = s.match(/^(\d+)\s*(ère|ere|ème|eme|ième|ieme)\b/i)
  if (!m) return { num: s, sup: '' }
  const sup = m[2].toLowerCase()
    .replace(/^ere$/i, '\u00e8re')
    .replace(/^eme$/i, '\u00e8me')
    .replace(/^ieme$/i, 'i\u00e8me')
  return { num: m[1], sup }
}

/** Triangle plein style ➤ */
function drawBullet(doc, x, y) {
  doc.setFillColor(0, 0, 0)
  doc.triangle(x, y - 2.6, x, y + 0.4, x + 2.8, y - 1.1, 'F')
}

/**
 * Dessine un paragraphe avec mélange gras/normal et justification
 * (sauf pour la dernière ligne).
 *
 * @param {Array<{text:string,bold:boolean}>} segments
 * @param {object} opts {x, y, maxWidth, lineHeight, fontSize, indent, font, justify}
 * @returns {number} Y final
 */
function drawRichParagraph(doc, segments, opts) {
  const {
    x, y: y0, maxWidth, lineHeight, fontSize,
    indent = 0, font = 'times', justify = true
  } = opts

  // Découpage en tokens
  const tokens = []
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/)
    for (const p of parts) {
      if (p.length === 0) continue
      tokens.push({ text: p, bold: seg.bold, isSpace: /^\s+$/.test(p) })
    }
  }

  doc.setFontSize(fontSize)

  // Mesure largeur d'un token
  const widthOf = (tk) => {
    doc.setFont(font, tk.bold ? 'bold' : 'normal')
    return doc.getTextWidth(tk.text)
  }

  // Compose les lignes
  const lines = []
  let line = []
  let lineW = 0
  let firstLine = true
  let availW = maxWidth - indent

  for (const tk of tokens) {
    const w = widthOf(tk)
    const lineEmpty = line.length === 0 || (line.length > 0 && line.every(t => t.isSpace))

    if (lineEmpty && tk.isSpace) continue   // pas d'espace en tête

    if (lineW + w > availW && !lineEmpty) {
      lines.push({ tokens: line, indent: firstLine ? indent : 0 })
      line = []
      lineW = 0
      firstLine = false
      availW = maxWidth
      if (tk.isSpace) continue
    }
    line.push(tk)
    lineW += w
  }
  if (line.length) lines.push({ tokens: line, indent: firstLine ? indent : 0 })

  // Rendu avec justification
  let y = y0
  for (let i = 0; i < lines.length; i++) {
    const { tokens: lineTokens, indent: lineIndent } = lines[i]
    const isLast = i === lines.length - 1
    const lineMaxW = maxWidth - lineIndent

    // Largeur naturelle de la ligne (sans étirement)
    const naturalW = lineTokens.reduce((s, t) => s + widthOf(t), 0)

    // Espaces internes
    const spaces = lineTokens.filter(t => t.isSpace).length
    const stretch = (justify && !isLast && spaces > 0)
      ? (lineMaxW - naturalW) / spaces
      : 0

    let cx = x + lineIndent
    for (const tk of lineTokens) {
      const w = widthOf(tk)
      doc.setFont(font, tk.bold ? 'bold' : 'normal')
      doc.text(tk.text, cx, y)
      cx += w + (tk.isSpace ? stretch : 0)
    }
    y += lineHeight
  }
  return y - lineHeight + lineHeight   // dernière ligne
}

// ─── Builder principal ───────────────────────────────────────────────────

/**
 * Construit l'attestation de scolarité.
 *
 * @param {object}      data
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
  const W = 210, H = 297
  const mL = 25, mR = 25, mT = 18
  const cW = W - mL - mR

  // ── Filigrane DUPLICATA ────────────────────────────────────────────────
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

  // ── LOGO (grand, sans texte additionnel sous le logo) ───────────────────
  // 220px dans la maquette HTML ≈ 58mm en A4
  const logoW = 58
  const logoH = 44
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', mL, mT, logoW, logoH, undefined, 'FAST')
  }

  // ── EN-TÊTE textuel (Arial, sous le logo, aligné à gauche) ──────────────
  const headerY = mT + logoH + 4
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')

  doc.setFontSize(11)                 // 14px ≈ 10.5pt
  doc.text('DIRECTION GENERALE', mL, headerY)

  doc.setFontSize(10)                 // 13px ≈ 9.75pt
  doc.text('LA DIRECTION DE LA SCOLARITE ET DES EXAMENS', mL, headerY + 5)

  doc.setFontSize(9)                  // 11px ≈ 8.25pt
  doc.text(String(numero), mL, headerY + 10)

  // ── BANDEAU BLEU TITRE ──────────────────────────────────────────────────
  // CSS : background #cfe1f0, border 1.5px solid #2e6396, border-radius 6px
  let y = headerY + 22
  const bandX = mL
  const bandW = cW
  const bandH = 14

  doc.setFillColor(207, 225, 240)        // #cfe1f0
  doc.setDrawColor(46, 99, 150)          // #2e6396
  doc.setLineWidth(0.7)
  doc.roundedRect(bandX, y, bandW, bandH, 2.2, 2.2, 'FD')

  doc.setFont('times', 'bold')
  doc.setFontSize(20)                    // 26px ≈ 19.5pt
  doc.setTextColor(0, 0, 0)
  // Letter-spacing 1px ≈ 0.27mm — on simule en écrivant lettre par lettre
  drawSpacedText(doc, 'ATTESTATION DE SCOLARITE', W / 2, y + 9.5, 0.4, 'center')

  y += bandH + 12

  // ── PARAGRAPHE D'INTRODUCTION (Times, justifié, indent 36px≈9.5mm) ──────
  const bodyFontSize = 12              // 16px ≈ 12pt
  const bodyLineH    = 6.6             // line-height 1.5 → 12pt × 1.5 ≈ 18pt ≈ 6.35mm
  const bodyIndent   = 9.5

  doc.setTextColor(0, 0, 0)
  doc.setFont('times', 'normal')

  y = drawRichParagraph(doc, [
    { text: 'Je soussign\u00e9, Soilihi ALI ISSILAM, Directeur de la Scolarit\u00e9 ' +
            'et des Examens de l\u2019Institut National de la Poste, des Technologies ' +
            'de l\u2019Information et de la Communication (INPTIC), atteste que ' +
            'l\u2019\u00e9tudiant(e) ', bold: false },
    { text: String(etudiant).toUpperCase(), bold: true },
    { text: ' suit la formation ci-dessous dans notre \u00e9tablissement.', bold: false },
  ], {
    x: mL, y, maxWidth: cW,
    lineHeight: bodyLineH, fontSize: bodyFontSize,
    indent: bodyIndent, font: 'times', justify: true,
  })

  y += bodyLineH * 1.2

  // ── LISTE D'INFORMATIONS ────────────────────────────────────────────────
  // Décalée du bord gauche (padding-left 24px ≈ 6.3mm)
  const listX = mL + 6.3
  const labelX = listX + 6
  const itemH  = bodyLineH * 1.5      // line-height 1.8 ≈ 21.6pt ≈ 7.6mm
  const ord    = parseOrdinal(niveau)

  const drawListItem = (label, valueRenderer) => {
    drawBullet(doc, listX, y)
    doc.setFont('times', 'bold')
    doc.setFontSize(bodyFontSize)
    const lbl = `${label}\u00a0:\u00a0`
    doc.text(lbl, labelX, y)
    const valueX = labelX + doc.getTextWidth(lbl)
    doc.setFont('times', 'normal')
    valueRenderer(valueX, y)
    y += itemH
  }

  drawListItem("Niveau d'\u00e9tudes", (vx, vy) => {
    doc.setFontSize(bodyFontSize)
    doc.text(ord.num, vx, vy)
    const numW = doc.getTextWidth(ord.num)
    let supW = 0
    if (ord.sup) {
      doc.setFontSize(bodyFontSize * 0.65)
      doc.text(ord.sup, vx + numW + 0.4, vy - 1.8)
      supW = doc.getTextWidth(ord.sup)
      doc.setFontSize(bodyFontSize)
    }
    doc.setFont('times', 'normal')
    doc.text(' ann\u00e9e', vx + numW + supW + 1, vy)
  })

  drawListItem('Fili\u00e8re',          (vx, vy) => doc.text(String(filiere), vx, vy))
  drawListItem('Programme',             (vx, vy) => doc.text(String(formation), vx, vy))
  drawListItem('Ann\u00e9e acad\u00e9mique', (vx, vy) => doc.text(String(anneeAcademique), vx, vy))

  y += 4

  // ── PARAGRAPHE DE CLÔTURE ───────────────────────────────────────────────
  doc.setFont('times', 'normal')
  doc.setFontSize(bodyFontSize)
  y = drawRichParagraph(doc, [
    { text: 'En foi de quoi, la pr\u00e9sente attestation lui est d\u00e9livr\u00e9e ' +
            'pour servir et valoir ce que de droit.', bold: false },
  ], {
    x: mL, y, maxWidth: cW,
    lineHeight: bodyLineH, fontSize: bodyFontSize,
    indent: bodyIndent, font: 'times', justify: true,
  })

  // ── ZONE SIGNATURE (alignée à droite) ───────────────────────────────────
  y += 8
  const blockRight  = W - mR
  const blockCenter = W - mR - 38

  doc.setFont('times', 'normal')
  doc.setFontSize(bodyFontSize)
  doc.text(`Fait \u00e0 ${lieu}, le ${dateTexte}`, blockRight, y, { align: 'right' })
  y += 9

  doc.setFont('times', 'bold')
  doc.setFontSize(11)                  // 14px
  doc.text('Directeur de la Scolarit\u00e9 et des Examens', blockRight, y, { align: 'right' })
  y += 4

  // Signature manuscrite (grande, AU-DESSUS du cachet)
  const sigW = 50
  const sigH = 22
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'PNG',
      blockCenter - sigW / 2, y,
      sigW, sigH, undefined, 'FAST')
    y += sigH - 8
  } else {
    y += 6
  }

  // Cachet (chevauche la signature)
  const cachetSize = 32
  if (cachetDataUrl) {
    doc.addImage(cachetDataUrl, 'PNG',
      blockCenter - cachetSize / 2, y,
      cachetSize, cachetSize, undefined, 'FAST')
    y += cachetSize
  }

  // Nom du signataire (small-caps simulé via majuscules)
  doc.setFont('times', 'bold')
  doc.setFontSize(bodyFontSize)
  doc.text('Soilihi ALI ISSILAM', blockCenter, y + 3, { align: 'center' })

  // ── PIED DE PAGE (Helvetica 7.5pt, bordure haute grise) ────────────────
  const footY = H - 16
  doc.setDrawColor(204, 204, 204)        // #ccc
  doc.setLineWidth(0.3)
  doc.line(mL, footY, W - mR, footY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)                   // 10px
  doc.setTextColor(31, 31, 31)
  doc.text(
    "\u00c9tablissement public sous tutelle du Minist\u00e8re de l'Economie Num\u00e9rique " +
    "et des Nouvelles Technologies de l'Information",
    W / 2, footY + 5, { align: 'center' }
  )
  doc.text(
    'T\u00e9l\u00a0: (241) 01 73 81 31 \u2013 Fax\u00a0: (241) 01 73 44 16 \u2013 ' +
    'BP 13 124 Libreville \u2013 Gabon \u2013 Email\u00a0: gabon.inptic@gmail.com',
    W / 2, footY + 10, { align: 'center' }
  )

  return doc
}

/**
 * Écrit du texte avec un letter-spacing uniforme (en mm).
 * Sert pour le titre du bandeau bleu.
 */
function drawSpacedText(doc, text, x, y, spacing = 0.4, align = 'left') {
  // Mesurer la largeur totale
  const widths = []
  let total = 0
  for (const ch of text) {
    const w = doc.getTextWidth(ch)
    widths.push(w)
    total += w + spacing
  }
  total -= spacing

  let cx
  if (align === 'center') cx = x - total / 2
  else if (align === 'right') cx = x - total
  else cx = x

  let i = 0
  for (const ch of text) {
    doc.text(ch, cx, y)
    cx += widths[i] + spacing
    i++
  }
}

/** Retourne le blob PDF de l'attestation */
export function buildAttestationPdfBlob(data, logoDataUrl, cachetDataUrl, isDuplicate = false, signatureDataUrl = null) {
  return buildAttestationPdf(data, logoDataUrl, cachetDataUrl, isDuplicate, signatureDataUrl).output('blob')
}
