const MTIC_LONG_LABEL_REGEX = /management\s+des\s+techniques\s+de\s+l['’]information\s+et\s+de\s+la\s+communication/gi

const getFormationNumber = (classe = {}, normalizedLabel = '') => {
  const candidates = [
    classe?.formation?.code,
    classe?.formation?.nom,
    classe?.formationCode,
    classe?.code,
    normalizedLabel
  ]
    .filter(Boolean)
    .map((v) => String(v))

  for (const candidate of candidates) {
    const match = candidate.match(/(?:initial(?:e)?|fi)[\s_-]*([12])/i)
    if (match) return match[1]
  }

  return null
}

export const abbreviateClasseLabel = (label = '', classe = null) => {
  const normalized = String(label)
    .replace(MTIC_LONG_LABEL_REGEX, 'MTIC')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Harmonise l'affichage MTIC avec FI dynamique (formation réelle de la classe).
  const mticYearMatch = normalized.match(/^MTIC\s*-\s*([123])(?:\s*(?:ère|ere|re|ème|eme|e))?\s+ann[ée]e\s+licence/i)
  if (mticYearMatch) {
    const yearNumber = mticYearMatch[1]
    const fiNumber = getFormationNumber(classe, normalized)
    return fiNumber
      ? `MTIC ${yearNumber} FI${fiNumber} (MTIC)`
      : `MTIC ${yearNumber} (MTIC)`
  }

  return normalized
}
