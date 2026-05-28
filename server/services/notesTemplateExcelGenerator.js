import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ─── Palette minimale ────────────────────────────────────────────────────────
const NAVY       = 'FF0F2744'   // en-tête colonnes
const NAVY_LIGHT = 'FF1E3A5F'   // sous-titre
const GRAY_HDR   = 'FFF1F5F9'   // fond étiquettes méta
const WHITE      = 'FFFFFFFF'
const BORDER_C   = { argb: 'FFD1D5DB' }
const NOTE_BG    = 'FFFAFAFA'   // fond cellules notes (quasi blanc)

function thin(color = BORDER_C) {
  return { top: { style:'thin', color }, left: { style:'thin', color },
           bottom: { style:'thin', color }, right: { style:'thin', color } }
}
function medium(color = { argb: NAVY }) {
  return { top: { style:'medium', color }, left: { style:'medium', color },
           bottom: { style:'medium', color }, right: { style:'medium', color } }
}

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

/**
 * @param {object} data
 *   classeNom, moduleNom, anneeAcad, enseignant, semestre, effectif,
 *   noteColumns: string[],
 *   etudiants: { matricule, nom, prenom }[]
 * @param {string} outputPath
 */
export async function generateNotesTemplateExcel(data, outputPath) {
  const { classeNom, moduleNom, anneeAcad, enseignant,
          semestre, effectif, noteColumns, etudiants } = data

  const wb = new ExcelJS.Workbook()
  wb.creator = 'INPTIC – Gestion des Notes'
  wb.created = new Date()

  const ws = wb.addWorksheet('Notes', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    },
    properties: { showGridLines: false }
  })

  const NC = 4 + noteColumns.length   // nombre total de colonnes

  // ── Largeurs ──────────────────────────────────────────────────────────────
  ws.getColumn(1).width = 5    // N°
  ws.getColumn(2).width = 14   // Matricule
  ws.getColumn(3).width = 28   // Nom
  ws.getColumn(4).width = 22   // Prénom
  for (let i = 0; i < noteColumns.length; i++) ws.getColumn(5 + i).width = 18

  // ═══════════════════════════════════════════════════════════════════════════
  // EN-TÊTE UNIFIÉ (lignes 1-4) — nappe navy d'un seul tenant
  // ═══════════════════════════════════════════════════════════════════════════
  ws.getRow(1).height = 8    // marge haute
  ws.getRow(2).height = 38   // zone logo + titre
  ws.getRow(3).height = 22   // sous-titre / institution
  ws.getRow(4).height = 8    // marge basse

  // Fond navy uniforme sur tout le bloc (aucune bordure interne visible)
  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= NC; col++) {
      const cell = ws.getCell(row, col)
      cell.fill   = fill(NAVY)
      cell.border = {}   // pas de bordures entre cellules du header
    }
  }

  // ── Zone logo : col 1-2, lignes 1-4 ──────────────────────────────────────
  ws.mergeCells(1, 1, 4, 2)
  const logoCell = ws.getCell(1, 1)
  logoCell.fill = fill(NAVY)

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
  if (fs.existsSync(logoPath)) {
    try {
      const logoId = wb.addImage({ filename: logoPath, extension: 'png' })
      ws.addImage(logoId, { tl: { col: 0.1, row: 0.15 }, br: { col: 1.9, row: 3.85 }, editAs: 'oneCell' })
    } catch { /* logo optionnel */ }
  }

  // ── Titre principal : lignes 2, toutes les colonnes sauf logo ─────────────
  ws.mergeCells(2, 3, 2, NC)
  const titCell = ws.getCell(2, 3)
  titCell.value = 'FICHE DE RELEVÉ DE NOTES'
  titCell.font  = { name: 'Calibri', bold: true, size: 20, color: { argb: WHITE } }
  titCell.fill  = fill(NAVY)
  titCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // ── Sous-titre institution : ligne 3, mêmes colonnes ─────────────────────
  ws.mergeCells(3, 3, 3, NC)
  const subCell = ws.getCell(3, 3)
  subCell.value = 'INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L\'INFORMATION ET DE LA COMMUNICATION'
  subCell.font  = { name: 'Calibri', bold: false, italic: true, size: 8.5, color: { argb: 'FFBFDBFE' } }
  subCell.fill  = fill(NAVY)
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIGNES DE MÉTADONNÉES (démarrage après l'en-tête unifié)
  // ═══════════════════════════════════════════════════════════════════════════

  const half = Math.max(2, Math.floor(NC / 2))

  const metas = [
    ['Année académique :', anneeAcad,        'Module :',      moduleNom ],
    ['Classe :',           classeNom,        'Enseignant :', enseignant ],
    ['Semestre :',         semestre,         'Effectif :',  String(effectif) ],
  ]

  let r = 5   // les lignes 1-4 sont le header unifié
  for (const [l1, v1, l2, v2] of metas) {
    ws.getRow(r).height = 18

    // Étiquette gauche
    const lc1 = ws.getCell(r, 1)
    lc1.value = l1
    lc1.font  = { name: 'Calibri', bold: true, size: 10, color: { argb: NAVY } }
    lc1.fill  = fill(GRAY_HDR)
    lc1.alignment = { vertical: 'middle', horizontal: 'right' }
    lc1.border = thin()

    // Valeur gauche
    ws.mergeCells(r, 2, r, half)
    const vc1 = ws.getCell(r, 2)
    vc1.value = v1
    vc1.font  = { name: 'Calibri', size: 10 }
    vc1.fill  = fill(WHITE)
    vc1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    vc1.border = thin()

    if (l2) {
      // Étiquette droite
      const lc2 = ws.getCell(r, half + 1)
      lc2.value = l2
      lc2.font  = { name: 'Calibri', bold: true, size: 10, color: { argb: NAVY } }
      lc2.fill  = fill(GRAY_HDR)
      lc2.alignment = { vertical: 'middle', horizontal: 'right' }
      lc2.border = thin()

      // Valeur droite
      ws.mergeCells(r, half + 2, r, NC)
      const vc2 = ws.getCell(r, half + 2)
      vc2.value = v2
      vc2.font  = { name: 'Calibri', size: 10 }
      vc2.fill  = fill(WHITE)
      vc2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      vc2.border = thin()
    } else {
      ws.mergeCells(r, half + 1, r, NC)
      ws.getCell(r, half + 1).fill = fill(WHITE)
      ws.getCell(r, half + 1).border = thin()
    }

    r++
  }

  // Ligne vide de séparation avant tableau
  ws.getRow(r).height = 6
  r++

  // ═══════════════════════════════════════════════════════════════════════════
  // EN-TÊTE DES COLONNES
  // ═══════════════════════════════════════════════════════════════════════════

  const hRow = ws.getRow(r)
  hRow.height = 26

  const colHdrs = ['N°', 'Matricule', 'Nom', 'Prénom', ...noteColumns]
  colHdrs.forEach((h, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value     = h
    cell.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: WHITE } }
    cell.fill      = fill(NAVY)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border    = { top: { style:'medium', color:{ argb: WHITE } },
                       bottom: { style:'medium', color:{ argb: WHITE } },
                       left: thin().left, right: thin().right }
  })
  r++

  // ═══════════════════════════════════════════════════════════════════════════
  // LIGNES ÉTUDIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  etudiants.forEach((etu, idx) => {
    const dRow = ws.getRow(r)
    dRow.height = 18

    const rowBg = idx % 2 === 0 ? WHITE : 'FFF8FAFC'

    const vals = [idx + 1, etu.matricule, etu.nom, etu.prenom, ...noteColumns.map(() => null)]
    vals.forEach((val, i) => {
      const cell = dRow.getCell(i + 1)
      cell.value  = val
      cell.font   = { name: 'Calibri', size: 10 }
      cell.border = thin()

      if (i >= 4) {
        // Colonne note : fond très légèrement teinté, texte centré
        cell.fill      = fill(NOTE_BG)
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else {
        cell.fill      = fill(rowBg)
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left', indent: i > 0 ? 1 : 0 }
      }
    })
    r++
  })

  // Gel de la ligne d'en-tête des colonnes
  const dataStartRow = r - etudiants.length
  ws.views = [{ state: 'frozen', ySplit: dataStartRow - 1 }]

  await wb.xlsx.writeFile(outputPath)
}
