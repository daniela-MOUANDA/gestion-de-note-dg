/**
 * Utilitaires de validation pour l'application
 */

/**
 * Valide un numéro de téléphone gabonais
 * Format: 9 chiffres commençant par 07, 06 ou 01
 * @param {string} telephone - Le numéro de téléphone à valider
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateTelephone = (telephone) => {
  if (!telephone || telephone.trim() === '') {
    return { isValid: false, error: 'Le numéro de téléphone est requis' }
  }

  // Retirer tous les caractères non numériques
  const cleanTel = telephone.replace(/\D/g, '')

  // Vérifier la longueur
  if (cleanTel.length !== 9) {
    return { 
      isValid: false, 
      error: 'Le numéro de téléphone doit contenir exactement 9 chiffres' 
    }
  }

  // Vérifier le préfixe
  const prefix = cleanTel.substring(0, 2)
  if (!['07', '06', '01'].includes(prefix)) {
    return { 
      isValid: false, 
      error: 'Le numéro de téléphone doit commencer par 07, 06 ou 01' 
    }
  }

  return { isValid: true, error: null }
}

/**
 * Valide un email
 * @param {string} email - L'email à valider
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email est requis' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' }
  }

  return { isValid: true, error: null }
}

/**
 * Valide un matricule étudiant
 * @param {string} matricule - Le matricule à valider
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateMatricule = (matricule) => {
  if (!matricule || matricule.trim() === '') {
    return { isValid: false, error: 'Le matricule est requis' }
  }

  // Minimum 5 caractères
  if (matricule.length < 5) {
    return { isValid: false, error: 'Le matricule doit contenir au moins 5 caractères' }
  }

  return { isValid: true, error: null }
}


