import { abbreviateClasseLabel } from './classeLabel.js'

function filiereRecord(classe) {
  const f = classe?.filieres
  return Array.isArray(f) ? f[0] : f
}

function primaryFormation(classe) {
  const f = classe?.formations ?? classe?.formation
  if (Array.isArray(f)) return f[0] || null
  return f || null
}

/** Contexte formation pour abbreviateClasseLabel (embed Supabase formations ou formation). */
function formationCtx(classe) {
  const embed = primaryFormation(classe)
  return { ...classe, formation: embed }
}

function getFiDigit(classe, normalizedLabel = '') {
  const form = primaryFormation(classe)
  const candidates = [
    form?.code,
    form?.nom,
    classe?.formationCode,
    classe?.code,
    normalizedLabel
  ]
    .filter(Boolean)
    .map((v) => String(v))

  for (const c of candidates) {
    const match = c.match(/(?:initial(?:e)?|fi)[\s_-]*([12])/i)
    if (match) return match[1]
  }
  return null
}

function licenceYearDigit(classe, abbreviatedLabel = '') {
  const niv = String(classe?.niveaux?.code || classe?.niveau || '').toUpperCase()
  let m = niv.match(/L([123])/)
  if (m) return m[1]

  const pool = `${abbreviatedLabel} ${classe?.nom || ''}`
  m = pool.match(/^MTIC\s*-\s*([123])/im)
  if (m) return m[1]
  m = pool.match(/\b([123])(?:\s*(?:ère|ere|re|ème|eme|e))?\s+ann[ée]e/i)
  if (m) return m[1]
  return null
}

/**
 * Libellé court type « MMI 2 FI2 » / « MTIC 1 FI2 » pour noms de fichiers (planches, exports).
 */
export function buildCompactPlancheLabel(classe) {
  if (!classe) return 'Classe'

  const ctx = formationCtx(classe)
  const rawNom = String(classe.nom || '').trim()
  let label = abbreviateClasseLabel(rawNom, ctx)

  const f = filiereRecord(classe)
  const filiereCode = (f?.code || '').trim()

  if (filiereCode && label.endsWith(` (${filiereCode})`)) {
    label = label.slice(0, -(filiereCode.length + 3)).trim()
  }

  const mticMatch = label.match(/^MTIC\s+(\d+)\s+FI(\d)/i)
  if (filiereCode && mticMatch && filiereCode.toUpperCase() !== 'MTIC') {
    label = `${filiereCode} ${mticMatch[1]} FI${mticMatch[2]}`
  }

  const MAX = 42
  if (label.length > MAX || (rawNom.length > 55 && label === rawNom)) {
    const yr = licenceYearDigit(classe, label)
    const fi = getFiDigit(classe, label)
    const firstToken = rawNom.split(/\s+/)[0] || 'CLASSE'
    const parts = [filiereCode || firstToken.slice(0, 14)]
    if (yr) parts.push(yr)
    if (fi) parts.push(`FI${fi}`)
    label = parts.join(' ')
  }

  return label.replace(/\s+/g, ' ').trim() || 'Classe'
}

/**
 * Ex. Planche_MMI 2 FI2_S4.xlsx | Planche_MMI 2 FI2_ANNUEL.xlsx
 */
export function buildPlancheDownloadFilename(classe, period, ext = 'xlsx') {
  const cleanExt = String(ext || 'xlsx').replace(/^\./, '')
  let label = buildCompactPlancheLabel(classe)
  label = label
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)

  let p = String(period || 'S1').trim().toUpperCase()
  if (p === 'ANNUEL') p = 'ANNUEL'

  return `Planche_${label}_${p}.${cleanExt}`
}

/** Relevé / autres exports : même cœur de libellé, préfixe au choix. */
export function buildExportFilename(prefix, classe, period, ext = 'xlsx') {
  const cleanExt = String(ext || 'xlsx').replace(/^\./, '')
  let label = buildCompactPlancheLabel(classe)
  label = label
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  const p = String(period || 'S1').trim().toUpperCase()
  return `${prefix}_${label}_${p}.${cleanExt}`
}

/** Export modèle de notes : libellé classe court + code module + semestre. */
export function buildNotesExportFilename(classe, moduleKey, semestre, ext = 'xlsx') {
  const cleanExt = String(ext || 'xlsx').replace(/^\./, '')
  let label = buildCompactPlancheLabel(classe)
  label = label
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  const mk = String(moduleKey || 'module')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .trim()
    .slice(0, 32)
  const p = String(semestre || 'S1').trim().toUpperCase()
  return `Notes_${label}_${mk}_${p}.${cleanExt}`
}
