/**
 * Le champ bulletins.semestre est stocké comme S1/S2 (pair/impair du cycle).
 * Pour L2/L3, le calcul des notes utilise S3–S6 selon le niveau.
 */
export function resolveSemestreForClasseLevel(semestreStocke, niveauCode, semestreDemande) {
  const requested = String(semestreDemande || '').toUpperCase().trim()
  const stored = String(semestreStocke || '').toUpperCase().trim()
  const niveau = String(niveauCode || '').toUpperCase().trim()

  const allowedByLevel = {
    L1: ['S1', 'S2'],
    L2: ['S3', 'S4'],
    L3: ['S5', 'S6']
  }

  if (requested && (allowedByLevel[niveau] || []).includes(requested)) {
    return requested
  }

  if (stored === 'S1') return niveau === 'L2' ? 'S3' : (niveau === 'L3' ? 'S5' : 'S1')
  if (stored === 'S2') return niveau === 'L2' ? 'S4' : (niveau === 'L3' ? 'S6' : 'S2')
  return stored
}
