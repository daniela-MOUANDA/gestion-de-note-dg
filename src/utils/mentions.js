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
  
  if (m >= 18) {
    return {
      text: 'Excellent',
      color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-900',
      borderColor: 'border-yellow-300'
    }
  }
  if (m >= 16) {
    return {
      text: 'Très Bien',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    }
  }
  if (m >= 14) {
    return {
      text: 'Bien',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    }
  }
  if (m >= 12) {
    return {
      text: 'Assez Bien',
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    }
  }
  if (m >= 10) {
    return {
      text: 'Passable',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200'
    }
  }
  return {
    text: 'Ajourné',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200'
  }
}

/**
 * Version simplifiée retournant uniquement le texte de la mention
 */
export const getMentionText = (moyenne) => {
  return getMention(moyenne).text
}

