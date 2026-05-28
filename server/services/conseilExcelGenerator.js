/**
 * Conseil de Classe – Générateur Excel
 *
 * Feuille 1 "Graphique"   → onglet affiché en premier, contient le tableau de
 *                            répartition + un vrai diagramme en anneau Excel injecté
 *                            via OpenXML / JSZip.
 * Feuille 2 "Rapport"     → rapport complet : métadonnées, synthèse, récapitulatif
 *                            par étudiant. AUCUN gel de volet.
 */

import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import JSZip from 'jszip'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ─── Palette ──────────────────────────────────────────────────────────────────
const NAVY    = 'FF0F2744'
const NAVY_L  = 'FF1B3A5C'
const GRAY_BG = 'FFF1F5F9'
const WHITE   = 'FFFFFFFF'
const ALT     = 'FFF8FAFC'
const BDR     = { argb: 'FFD1D5DB' }

const GRN_BG  = 'FFD1FAE5';  const GRN_TXT = 'FF065F46'
const AMB_BG  = 'FFFEF3C7';  const AMB_TXT = 'FF92400E'
const RED_BG  = 'FFFEE2E2';  const RED_TXT = 'FF991B1B'
const BLU_BG  = 'FFDBEAFE'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const thin  = (c = BDR) => ({
  top:    { style: 'thin', color: c },
  left:   { style: 'thin', color: c },
  bottom: { style: 'thin', color: c },
  right:  { style: 'thin', color: c },
})
const medium = (c = { argb: NAVY }) => ({
  top: { style: 'medium', color: c }, bottom: { style: 'medium', color: c },
  left: { style: 'thin', color: BDR }, right: { style: 'thin', color: BDR },
})

function decisionStyle(kind) {
  if (kind === 'ADMIS')                return { bg: GRN_BG, txt: GRN_TXT }
  if (kind === 'PASSAGE_CONDITIONNEL') return { bg: AMB_BG, txt: AMB_TXT }
  if (kind === 'REDOUBLE')             return { bg: RED_BG, txt: RED_TXT }
  return { bg: ALT, txt: '475569' }
}

function xmlEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]))
}

// ─── OpenXML builders ─────────────────────────────────────────────────────────

/**
 * Builds a donut chart XML referencing cells on the "Graphique" sheet.
 * data3: [{ name, value }, ...] always 3 items (Admis, Pass. cond., Redoublé)
 */
function buildChartXml(data3) {
  const hex = ['22c55e', 'f59e0b', 'ef4444']

  const dPts = data3.map((d, i) =>
    d.value > 0
      ? `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/>` +
        `<c:spPr><a:solidFill><a:srgbClr val="${hex[i]}"/></a:solidFill>` +
        `<a:ln><a:noFill/></a:ln></c:spPr></c:dPt>`
      : ''
  ).join('')

  const strPts = data3.map((d, i) => `<c:pt idx="${i}"><c:v>${xmlEsc(d.name)}</c:v></c:pt>`).join('')
  const numPts = data3.map((d, i) => `<c:pt idx="${i}"><c:v>${d.value}</c:v></c:pt>`).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:date1904 val="0"/><c:lang val="fr-FR"/><c:roundedCorners val="0"/>
  <c:chart>
    <c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/>
      <a:p><a:pPr><a:defRPr b="1" sz="1300" lang="fr-FR">
        <a:solidFill><a:srgbClr val="0F2744"/></a:solidFill>
      </a:defRPr></a:pPr>
      <a:r><a:t>R&#233;partition des D&#233;cisions</a:t></a:r>
    </a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea><c:layout/>
      <c:doughnutChart>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/><c:order val="0"/>
          ${dPts}
          <c:dLbls>
            <c:numFmt formatCode="0.00%" sourceLinked="0"/>
            <c:spPr/>
            <c:txPr><a:bodyPr/><a:lstStyle/>
              <a:p><a:pPr><a:defRPr b="1" sz="1000"/></a:pPr></a:p>
            </c:txPr>
            <c:showLegendKey val="0"/>
            <c:showVal val="0"/>
            <c:showCatName val="0"/>
            <c:showSerName val="0"/>
            <c:showPercent val="1"/>
            <c:showBubbleSize val="0"/>
          </c:dLbls>
          <c:cat><c:strRef>
            <c:f>Graphique!$A$3:$A$5</c:f>
            <c:strCache><c:ptCount val="3"/>${strPts}</c:strCache>
          </c:strRef></c:cat>
          <c:val><c:numRef>
            <c:f>Graphique!$B$3:$B$5</c:f>
            <c:numCache>
              <c:formatCode>General</c:formatCode>
              <c:ptCount val="3"/>${numPts}
            </c:numCache>
          </c:numRef></c:val>
        </c:ser>
        <c:firstSliceAng val="0"/>
        <c:holeSize val="50"/>
      </c:doughnutChart>
    </c:plotArea>
    <c:legend>
      <c:legendPos val="r"/>
      <c:overlay val="0"/><c:spPr/>
      <c:txPr><a:bodyPr/><a:lstStyle/>
        <a:p><a:pPr><a:defRPr sz="1050"/></a:pPr></a:p>
      </c:txPr>
    </c:legend>
    <c:plotVisOnly val="1"/>
    <c:dispBlanksAs val="gap"/>
  </c:chart>
  <c:spPr>
    <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
    <a:ln><a:noFill/></a:ln>
  </c:spPr>
</c:chartSpace>`
}

/**
 * Drawing XML that positions the chart on the Graphique sheet.
 * Chart spans col E (idx 4) row 1 to col Q (idx 16) row 25.
 */
function buildDrawingXml(chartRelId) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
          xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
          xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
  <xdr:twoCellAnchor moveWithCells="1" sizeWithCells="1">
    <xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff>
              <xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to>  <xdr:col>16</xdr:col><xdr:colOff>0</xdr:colOff>
              <xdr:row>26</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="2" name="Graphique 1"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart r:id="${chartRelId}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`
}

// ─── JSZip chart injection ────────────────────────────────────────────────────

async function injectChart(buffer, data3) {
  const zip = await JSZip.loadAsync(buffer)

  // Locate "Graphique" sheet in workbook
  const wbXml  = await zip.file('xl/workbook.xml').async('string')
  const wbRels = await zip.file('xl/_rels/workbook.xml.rels').async('string')

  const sheetEl  = wbXml.match(/<sheet\b[^>]*\bname="Graphique"[^>]*/)?.[0]
  const sheetRId = sheetEl?.match(/\br:id="([^"]+)"/)?.[1]
  if (!sheetRId) throw new Error('Feuille "Graphique" introuvable dans workbook.xml')

  const relEl  = wbRels.match(new RegExp(`<Relationship[^>]*\\bId="${sheetRId}"[^>]*`))?.[0]
  const target = relEl?.match(/\bTarget="([^"]+)"/)?.[1]
  if (!target) throw new Error(`Relation ${sheetRId} introuvable dans workbook.xml.rels`)

  const sheetXmlPath  = `xl/${target}`
  const sheetRelsPath = `xl/${target.replace('worksheets/', 'worksheets/_rels/')}.rels`

  // Choose free drawing / chart filenames
  let dNum = 1; while (zip.file(`xl/drawings/drawing${dNum}.xml`)) dNum++
  let cNum = 1; while (zip.file(`xl/charts/chart${cNum}.xml`))     cNum++

  const drawingFile    = `drawing${dNum}.xml`
  const chartFile      = `chart${cNum}.xml`
  const drawingPath    = `xl/drawings/${drawingFile}`
  const drawingRelPath = `xl/drawings/_rels/${drawingFile}.rels`
  const chartPath      = `xl/charts/${chartFile}`

  // chart XML
  zip.file(chartPath, buildChartXml(data3))

  // drawing XML (references chart via "rId1")
  zip.file(drawingPath, buildDrawingXml('rId1'))

  // drawing rels
  zip.file(drawingRelPath,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
    `  <Relationship Id="rId1"\n` +
    `    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"\n` +
    `    Target="../charts/${chartFile}"/>\n` +
    `</Relationships>`)

  // inject <drawing r:id="rId_draw"/> into sheet XML
  let sheetXml = await zip.file(sheetXmlPath).async('string')
  if (!sheetXml.includes('<drawing ')) {
    if (!sheetXml.includes('xmlns:r=')) {
      sheetXml = sheetXml.replace(
        /(<worksheet\b)([^>]*>)/,
        `$1 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"$2`
      )
    }
    sheetXml = sheetXml.replace('</worksheet>', '<drawing r:id="rId_draw"/></worksheet>')
  }
  zip.file(sheetXmlPath, sheetXml)

  // sheet rels
  const existingRels = await zip.file(sheetRelsPath)?.async('string')
  const drawingRel =
    `<Relationship Id="rId_draw"\n` +
    `  Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"\n` +
    `  Target="../drawings/${drawingFile}"/>`

  let newSheetRels
  if (existingRels && !existingRels.includes('rId_draw')) {
    newSheetRels = existingRels.replace('</Relationships>', `  ${drawingRel}\n</Relationships>`)
  } else if (!existingRels) {
    newSheetRels =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
      `  ${drawingRel}\n</Relationships>`
  } else {
    newSheetRels = existingRels
  }
  zip.file(sheetRelsPath, newSheetRels)

  // Content_Types.xml
  let ct = await zip.file('[Content_Types].xml').async('string')
  let ctChanged = false
  if (!ct.includes(`charts/${chartFile}`)) {
    ct = ct.replace('</Types>',
      `  <Override PartName="/xl/charts/${chartFile}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>\n</Types>`)
    ctChanged = true
  }
  if (!ct.includes(`drawings/${drawingFile}`)) {
    ct = ct.replace('</Types>',
      `  <Override PartName="/xl/drawings/${drawingFile}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>\n</Types>`)
    ctChanged = true
  }
  if (ctChanged) zip.file('[Content_Types].xml', ct)

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

const LBDR  = { argb: 'FFCBD5E1' }  // light border
const LBDR2 = { argb: 'FFE2E8F0' }  // even lighter

/**
 * Feuille "Graphique" – table de répartition + zone graphique
 * Design épuré : fond blanc, textes colorés, pas de bleu marine en fond
 */
function buildGraphiqueSheet(wb, chartData) {
  const ws = wb.addWorksheet('Graphique', { properties: { showGridLines: false } })

  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 12
  ws.getColumn(3).width = 14

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const rows = [
    { name: 'Admis',                value: chartData.find(d => d.name === 'Admis')?.value               ?? 0, bg: GRN_BG, txt: GRN_TXT },
    { name: 'Passage conditionnel', value: chartData.find(d => d.name === 'Passage conditionnel')?.value ?? 0, bg: AMB_BG, txt: AMB_TXT },
    { name: 'Redoublé',             value: chartData.find(d => d.name === 'Redouble')?.value            ?? 0, bg: RED_BG, txt: RED_TXT },
  ]

  // Row 1 – Titre : blanc, texte navy, trait inférieur navy
  ws.getRow(1).height = 34
  ws.mergeCells(1, 1, 1, 3)
  const tit = ws.getCell(1, 1)
  tit.value     = 'RÉPARTITION DES DÉCISIONS DU CONSEIL'
  tit.font      = { name: 'Calibri', bold: true, size: 14, color: { argb: NAVY } }
  tit.fill      = fill(WHITE)
  tit.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  tit.border    = { bottom: { style: 'medium', color: { argb: NAVY } } }

  // Row 2 – En-têtes colonnes : gris clair, texte sombre
  ws.getRow(2).height = 20
  ;['Décision', 'Effectif', 'Pourcentage'].forEach((h, i) => {
    const c = ws.getCell(2, i + 1)
    c.value     = h
    c.font      = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF475569' } }
    c.fill      = fill(GRAY_BG)
    c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 }
    c.border    = { bottom: { style: 'thin', color: LBDR } }
  })

  // Rows 3-5 – données
  rows.forEach((d, i) => {
    ws.getRow(3 + i).height = 24
    const pct = total > 0 ? `${((d.value / total) * 100).toFixed(2)} %` : '0.00 %'
    ;[d.name, d.value, pct].forEach((v, ci) => {
      const c = ws.getCell(3 + i, ci + 1)
      c.value     = v
      c.font      = { name: 'Calibri', bold: true, size: 12, color: { argb: d.txt } }
      c.fill      = fill(d.bg)
      c.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'left' : 'center', indent: ci === 0 ? 1 : 0 }
      c.border    = { bottom: { style: 'thin', color: LBDR } }
    })
  })

  // Row 6 – Total
  ws.getRow(6).height = 20
  ;['Total', total, '100 %'].forEach((v, i) => {
    const c = ws.getCell(6, i + 1)
    c.value     = v
    c.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF334155' } }
    c.fill      = fill(GRAY_BG)
    c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 }
    c.border    = { top: { style: 'medium', color: LBDR }, bottom: { style: 'thin', color: LBDR } }
  })

  return rows.map(d => ({ name: d.name, value: d.value }))
}

/**
 * Feuille "Rapport du Conseil" – rapport complet.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  EN-TÊTE UNIFIÉE (rows 1-N) : fond BLANC, zéro bleu marine     │
 * │    Logo · Titre grand (navy text) · Institution (gris)          │
 * │    ── trait navy fin ──                                         │
 * │    Métadonnées 2 colonnes (labels navy bold, valeurs sombres)   │
 * │    ── espacement ──                                              │
 * │    SYNTHÈSE DU CONSEIL (fond très clair, accent left navy)      │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  RÉCAPITULATIF PAR ÉTUDIANT – EN-TÊTES NAVY conservées         │
 * │  (demande utilisateur : "sur le tableau tu peux laisser")       │
 * └─────────────────────────────────────────────────────────────────┘
 * AUCUN gel de volet – hauteurs compactes pour vue d'ensemble.
 */
function buildRapportSheet(wb, { meta, stats, chartData = [], etudiants = [] }) {
  const blocks = meta.blocks || []
  const NC     = 4 + 4 * blocks.length + 1

  const ws = wb.addWorksheet('Rapport du Conseil', {
    pageSetup: {
      paperSize: 9, orientation: 'landscape',
      fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    },
    properties: { showGridLines: false }
  })

  // Largeurs colonnes
  ws.getColumn(1).width = 5
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 16
  ws.getColumn(4).width = 14
  for (let i = 5; i < NC; i++) ws.getColumn(i).width = 11
  ws.getColumn(NC).width = 20

  const half = Math.max(5, Math.floor(NC / 2))

  // Utilitaire : remplir une ligne en blanc, sans bordure
  const whiteRow = (row, h = 8) => {
    ws.getRow(row).height = h
    for (let c = 1; c <= NC; c++) {
      ws.getCell(row, c).fill   = fill(WHITE)
      ws.getCell(row, c).border = {}
    }
  }

  let r = 1

  // ════════════════════════════════════════════════════════════════════
  // BLOC EN-TÊTE UNIFIÉ – fond blanc, aucun bleu marine en fond
  // ════════════════════════════════════════════════════════════════════

  whiteRow(r, 6); r++   // r=2 – marge haute

  // ── Logo + Titre + Institution (rows 2-4) ──────────────────────────
  ws.getRow(r).height     = 46   // ligne du titre principal
  ws.getRow(r + 1).height = 18   // institution
  ws.getRow(r + 2).height = 6    // marge basse

  for (let row = r; row <= r + 2; row++) {
    for (let col = 1; col <= NC; col++) {
      ws.getCell(row, col).fill   = fill(WHITE)
      ws.getCell(row, col).border = {}
    }
  }

  // Logo (span 3 lignes, cols 1-2)
  ws.mergeCells(r, 1, r + 2, 2)
  ws.getCell(r, 1).fill = fill(WHITE)
  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
  if (fs.existsSync(logoPath)) {
    try {
      const logoId = wb.addImage({ filename: logoPath, extension: 'png' })
      ws.addImage(logoId, {
        tl: { col: 0.12, row: r - 0.75 },
        br: { col: 1.88, row: r + 1.88 },
        editAs: 'oneCell'
      })
    } catch { /* logo optionnel */ }
  }

  // Titre principal (row r, cols 3-NC) – texte navy BOLD, fond blanc
  ws.mergeCells(r, 3, r, NC)
  const titCell = ws.getCell(r, 3)
  titCell.value     = 'CONSEIL DE CLASSE – RÉCAPITULATIF ACADÉMIQUE'
  titCell.font      = { name: 'Calibri', bold: true, size: 22, color: { argb: NAVY } }
  titCell.fill      = fill(WHITE)
  titCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titCell.border    = {}

  // Institution (row r+1, cols 3-NC) – texte gris clair
  ws.mergeCells(r + 1, 3, r + 1, NC)
  const subCell = ws.getCell(r + 1, 3)
  subCell.value     = 'INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L\'INFORMATION ET DE LA COMMUNICATION'
  subCell.font      = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF64748B' } }
  subCell.fill      = fill(WHITE)
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
  subCell.border    = {}

  r += 3   // r=5

  // ── Trait séparateur navy (fin, 3px) ─────────────────────────────────
  ws.getRow(r).height = 3
  ws.mergeCells(r, 1, r, NC)
  ws.getCell(r, 1).fill   = fill(NAVY)
  ws.getCell(r, 1).border = {}
  r++   // r=6

  // ── Métadonnées (rows 6-8) – fond blanc, labels navy bold ────────────
  const metaData = [
    ['Année académique', meta.anneeAcademique || '—', 'Classe',    meta.classe?.nom || '—'],
    ['Niveau',           meta.niveauCode      || '—', 'Formation', meta.formationNom || meta.formationCode || '—'],
    ['Effectif',         String(stats?.effectif ?? 0), 'Filière',  meta.classe?.filiereNom || meta.classe?.filiere || '—'],
  ]

  for (const [l1, v1, l2, v2] of metaData) {
    ws.getRow(r).height = 20
    for (let c = 1; c <= NC; c++) {
      ws.getCell(r, c).fill   = fill(WHITE)
      ws.getCell(r, c).border = {}
    }

    // Label gauche
    ws.mergeCells(r, 1, r, 2)
    const lc1 = ws.getCell(r, 1)
    lc1.value     = l1
    lc1.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: NAVY } }
    lc1.fill      = fill('FFF8FAFC')
    lc1.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
    lc1.border    = { bottom: { style: 'thin', color: LBDR }, right: { style: 'dotted', color: LBDR2 } }

    // Valeur gauche
    ws.mergeCells(r, 3, r, half)
    const vc1 = ws.getCell(r, 3)
    vc1.value     = v1
    vc1.font      = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
    vc1.fill      = fill(WHITE)
    vc1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    vc1.border    = { bottom: { style: 'thin', color: LBDR } }

    // Label droit
    ws.mergeCells(r, half + 1, r, half + 2)
    const lc2 = ws.getCell(r, half + 1)
    lc2.value     = l2
    lc2.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: NAVY } }
    lc2.fill      = fill('FFF8FAFC')
    lc2.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
    lc2.border    = { bottom: { style: 'thin', color: LBDR }, left: { style: 'thin', color: LBDR2 }, right: { style: 'dotted', color: LBDR2 } }

    // Valeur droite
    ws.mergeCells(r, half + 3, r, NC)
    const vc2 = ws.getCell(r, half + 3)
    vc2.value     = v2
    vc2.font      = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
    vc2.fill      = fill(WHITE)
    vc2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    vc2.border    = { bottom: { style: 'thin', color: LBDR } }

    r++
  }
  // r=9

  // ── Espacement avant synthèse ─────────────────────────────────────────
  whiteRow(r, 12); r++   // r=10

  // ── SYNTHÈSE DU CONSEIL (titre : fond très clair, accent left navy) ───
  ws.getRow(r).height = 26
  ws.mergeCells(r, 1, r, NC)
  const sectSynt = ws.getCell(r, 1)
  sectSynt.value     = 'SYNTHÈSE DU CONSEIL'
  sectSynt.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: NAVY } }
  sectSynt.fill      = fill('FFF1F5F9')
  sectSynt.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }
  sectSynt.border    = { left: { style: 'thick', color: { argb: NAVY } }, bottom: { style: 'thin', color: LBDR } }
  r++

  // En-têtes colonnes synthèse – gris clair, texte sombre
  const SEP = Math.max(3, Math.floor(NC * 0.62))
  ws.getRow(r).height = 16

  ws.mergeCells(r, 1, r, SEP)
  const sh1 = ws.getCell(r, 1)
  sh1.value     = 'Indicateur'
  sh1.font      = { name: 'Calibri', bold: true, size: 9, color: { argb: 'FF475569' } }
  sh1.fill      = fill(GRAY_BG)
  sh1.alignment = { vertical: 'middle', horizontal: 'left', indent: 3 }
  sh1.border    = { bottom: { style: 'medium', color: LBDR2 } }

  ws.mergeCells(r, SEP + 1, r, NC)
  const sh2 = ws.getCell(r, SEP + 1)
  sh2.value     = 'Valeur'
  sh2.font      = { name: 'Calibri', bold: true, size: 9, color: { argb: 'FF475569' } }
  sh2.fill      = fill(GRAY_BG)
  sh2.alignment = { vertical: 'middle', horizontal: 'center' }
  sh2.border    = { bottom: { style: 'medium', color: LBDR2 } }
  r++

  const syntItems = [
    { label: 'Effectif de la classe',             val: String(stats?.effectif ?? 0),       valBg: WHITE,  valTxt: 'FF1E293B', bold: false },
    { label: 'Total admis',                       val: String(stats?.admis ?? 0),           valBg: GRN_BG, valTxt: GRN_TXT,    bold: true  },
    ...(stats?.afficherPassageConditionnel
      ? [{ label: 'Passage conditionnel (L1 → L2)', val: String(stats?.passageConditionnel ?? 0), valBg: AMB_BG, valTxt: AMB_TXT, bold: true }]
      : []),
    { label: 'Redoublants',                       val: String(stats?.redouble ?? 0),        valBg: RED_BG, valTxt: RED_TXT,    bold: true  },
    { label: 'Taux de réussite',                  val: `${stats?.tauxReussite ?? 0} %`,     valBg: BLU_BG, valTxt: 'FF1E40AF', bold: true  },
    { label: 'Taux d\'échec (redoublement)',       val: `${stats?.tauxEchec ?? 0} %`,        valBg: RED_BG, valTxt: RED_TXT,    bold: false },
  ]

  syntItems.forEach((si, idx) => {
    ws.getRow(r).height = 17
    const rowBg = idx % 2 === 0 ? WHITE : 'FFFAFBFD'

    ws.mergeCells(r, 1, r, SEP)
    const lc = ws.getCell(r, 1)
    lc.value     = si.label
    lc.font      = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
    lc.fill      = fill(rowBg)
    lc.alignment = { vertical: 'middle', horizontal: 'left', indent: 3 }
    lc.border    = { bottom: { style: 'thin', color: LBDR } }

    ws.mergeCells(r, SEP + 1, r, NC)
    const vc = ws.getCell(r, SEP + 1)
    vc.value     = si.val
    vc.font      = { name: 'Calibri', bold: si.bold, size: 11, color: { argb: si.valTxt } }
    vc.fill      = fill(si.valBg)
    vc.alignment = { vertical: 'middle', horizontal: 'center' }
    vc.border    = { bottom: { style: 'thin', color: LBDR } }
    r++
  })

  // ════════════════════════════════════════════════════════════════════
  // SÉPARATEUR AVANT LE TABLEAU ÉTUDIANT
  // ════════════════════════════════════════════════════════════════════
  whiteRow(r, 16); r++

  // ════════════════════════════════════════════════════════════════════
  // RÉCAPITULATIF PAR ÉTUDIANT – entêtes NAVY conservées (demande user)
  // ════════════════════════════════════════════════════════════════════

  // Titre section (navy)
  ws.getRow(r).height = 22
  ws.mergeCells(r, 1, r, NC)
  const sectRec = ws.getCell(r, 1)
  sectRec.value     = 'RÉCAPITULATIF PAR ÉTUDIANT'
  sectRec.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: WHITE } }
  sectRec.fill      = fill(NAVY)
  sectRec.alignment = { vertical: 'middle', horizontal: 'center' }
  r++

  // En-têtes groupes (niveau 1)
  ws.getRow(r).height = 20
  ws.mergeCells(r, 1, r, 4)
  const gh = ws.getCell(r, 1)
  gh.value     = 'Étudiant'
  gh.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: WHITE } }
  gh.fill      = fill(NAVY)
  gh.alignment = { vertical: 'middle', horizontal: 'center' }
  gh.border    = thin({ argb: WHITE })

  let colCur = 5
  for (const blk of blocks) {
    ws.mergeCells(r, colCur, r, colCur + 3)
    const bh = ws.getCell(r, colCur)
    bh.value     = blk.label
    bh.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: WHITE } }
    bh.fill      = fill(NAVY_L)
    bh.alignment = { vertical: 'middle', horizontal: 'center' }
    bh.border    = thin({ argb: WHITE })
    colCur += 4
  }
  const dhdr = ws.getCell(r, NC)
  dhdr.value     = 'Décision'
  dhdr.font      = { name: 'Calibri', bold: true, size: 10, color: { argb: WHITE } }
  dhdr.fill      = fill(NAVY)
  dhdr.alignment = { vertical: 'middle', horizontal: 'center' }
  dhdr.border    = thin({ argb: WHITE })
  r++

  // En-têtes sous-colonnes (niveau 2)
  ws.getRow(r).height = 18
  ;['N°', 'Nom', 'Prénom', 'Matricule'].forEach((h, i) => {
    const c = ws.getCell(r, i + 1)
    c.value     = h
    c.font      = { name: 'Calibri', bold: true, size: 9, color: { argb: WHITE } }
    c.fill      = fill(NAVY)
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    c.border    = thin({ argb: WHITE })
  })
  colCur = 5
  for (const blk of blocks) {
    ;[...blk.semestres.map(s => `Moy. ${s}`), 'Crédits', 'Moy. Ann.'].forEach(label => {
      const c = ws.getCell(r, colCur)
      c.value     = label
      c.font      = { name: 'Calibri', bold: true, size: 8.5, color: { argb: WHITE } }
      c.fill      = fill(NAVY_L)
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      c.border    = thin({ argb: WHITE })
      colCur++
    })
  }
  const lastHdr = ws.getCell(r, NC)
  lastHdr.value     = '(cours)'
  lastHdr.font      = { name: 'Calibri', bold: true, size: 8.5, color: { argb: WHITE } }
  lastHdr.fill      = fill(NAVY)
  lastHdr.alignment = { vertical: 'middle', horizontal: 'center' }
  lastHdr.border    = thin({ argb: WHITE })
  r++

  // ── Lignes étudiants – hauteur compacte, aucun gel ────────────────────
  etudiants.forEach((row, idx) => {
    ws.getRow(r).height = 15
    const rowBg = idx % 2 === 0 ? WHITE : ALT

    ;[idx + 1, row.etudiant.nom, row.etudiant.prenom, row.etudiant.matricule].forEach((val, i) => {
      const c = ws.getCell(r, i + 1)
      c.value     = val
      c.font      = { name: 'Calibri', size: 9 }
      c.fill      = fill(rowBg)
      c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i > 0 ? 1 : 0, wrapText: false }
      c.border    = thin()
    })

    colCur = 5
    for (const annee of row.annees) {
      for (const sem of annee.semestres) {
        const c = ws.getCell(r, colCur)
        c.value     = sem.moyenne != null ? Number(sem.moyenne).toFixed(2) : '—'
        c.font      = { name: 'Calibri', size: 9 }
        c.fill      = fill(rowBg)
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
        c.border    = thin()
        colCur++
      }

      const cc = ws.getCell(r, colCur)
      cc.value     = annee.creditsAnnuel
      cc.font      = { name: 'Calibri', bold: true, size: 9 }
      cc.fill      = fill(rowBg)
      cc.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
      cc.border    = thin()
      colCur++

      const mc = ws.getCell(r, colCur)
      mc.value     = annee.moyenneAnnuelle != null ? Number(annee.moyenneAnnuelle).toFixed(2) : '—'
      mc.font      = { name: 'Calibri', size: 9 }
      mc.fill      = fill(rowBg)
      mc.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
      mc.border    = thin()
      colCur++
    }

    const ds = decisionStyle(row.decisionKindCourante)
    const dc = ws.getCell(r, NC)
    dc.value     = row.decisionCourante
    dc.font      = { name: 'Calibri', bold: true, size: 9, color: { argb: ds.txt } }
    dc.fill      = fill(ds.bg)
    dc.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    dc.border    = thin()
    r++
  })

  // Aucun gel de volet
  ws.views = []
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateConseilExcel(conseilData, outputPath) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'INPTIC – Gestion des Notes'
  wb.created = new Date()
  // Show first sheet (Graphique) when opening
  wb.views = [{ activeTab: 0, visibility: 'visible' }]

  // Sheet 1 "Graphique" (first tab, shown on open)
  const data3 = buildGraphiqueSheet(wb, conseilData.chartData || [])

  // Sheet 2 "Rapport du Conseil"
  buildRapportSheet(wb, conseilData)

  // Write to buffer → inject chart → write file
  const buffer      = await wb.xlsx.writeBuffer()
  const finalBuffer = await injectChart(buffer, data3)
  fs.writeFileSync(outputPath, finalBuffer)
}

