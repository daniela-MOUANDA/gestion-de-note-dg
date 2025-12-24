/**
 * Calcule la mention selon la moyenne académique
 * Standards académiques français :
 * - Excellent : 18-20
 * - Très Bien : 16-17.99
 * - Bien : 14-15.99
 * - Assez Bien : 12-13.99
 * - Passable : 10-11.99
 * - Ajourné : < 10
 */
export const getMention = (moyenne) => {
  const m = parseFloat(moyenne)
  
  if (isNaN(m)) {
    return 'Assez Bien' // Valeur par défaut
  }
  
  if (m >= 18) {
    return 'Excellent'
  }
  if (m >= 16) {
    return 'Très Bien'
  }
  if (m >= 14) {
    return 'Bien'
  }
  if (m >= 12) {
    return 'Assez Bien'
  }
  if (m >= 10) {
    return 'Passable'
  }
  return 'Ajourné'
}

