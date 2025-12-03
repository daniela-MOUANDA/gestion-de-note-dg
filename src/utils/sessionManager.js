/**
 * Gestionnaire de session robuste
 * Garantit la cohérence entre le token et l'utilisateur
 */

import { verifyToken } from '../api/auth.js'

let sessionCheckInterval = null
let lastVerifiedUserId = null
let lastVerifiedUserRole = null
let isFirstCheck = true // Flag pour la première vérification après connexion

/**
 * Vérifier la cohérence de la session
 * @param {boolean} skipConsistencyCheck - Si true, ne pas vérifier la cohérence (utile lors d'une nouvelle connexion)
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export const verifySessionConsistency = async (skipConsistencyCheck = false) => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      return { valid: false, error: 'Token manquant' }
    }

    // Vérifier si le token est proche de l'expiration (moins de 1 heure)
    // et demander un renouvellement proactif
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]))
        if (payload.exp) {
          const currentTime = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = payload.exp - currentTime
          const oneHour = 3600 // 1 heure en secondes
          
          // Si le token expire dans moins d'1 heure, demander un renouvellement
          const shouldRefresh = timeUntilExpiry < oneHour && timeUntilExpiry > 0
          
          const result = await verifyToken(shouldRefresh)
          
          // Si un nouveau token a été renvoyé, le mettre à jour
          if (result.token) {
            localStorage.setItem('token', result.token)
            console.log('✅ Token renouvelé automatiquement')
          }
          
          if (!result.valid || !result.user) {
            return { valid: false, error: result.error || 'Session invalide' }
          }

          // Vérifier la cohérence avec la dernière vérification
          // MAIS seulement si ce n'est pas la première vérification après connexion
          // et si skipConsistencyCheck n'est pas activé
          if (!skipConsistencyCheck && !isFirstCheck) {
            // Vérification CRITIQUE : Si l'ID change, c'est qu'un autre utilisateur s'est connecté
            // Il faut IMMÉDIATEMENT déconnecter pour éviter le basculement
            if (lastVerifiedUserId && lastVerifiedUserId !== result.user.id) {
              console.error('❌ DÉTECTION CRITIQUE: Changement d\'utilisateur détecté!')
              console.error('   Ancien ID:', lastVerifiedUserId)
              console.error('   Nouveau ID:', result.user.id)
              console.error('   ⚠️ ATTENTION: Un autre utilisateur s\'est connecté. Déconnexion immédiate.')
              
              // Supprimer immédiatement le token pour éviter tout basculement
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              
              return { 
                valid: false, 
                error: 'Un autre utilisateur s\'est connecté. Veuillez vous reconnecter.' 
              }
            }

            // Vérifier aussi le rôle pour détecter les changements
            if (lastVerifiedUserRole && lastVerifiedUserRole !== result.user.role) {
              console.error('❌ Détection de changement de rôle!')
              console.error('   Ancien rôle:', lastVerifiedUserRole)
              console.error('   Nouveau rôle:', result.user.role)
              console.error('   ⚠️ ATTENTION: Le rôle a changé. Déconnexion immédiate.')
              
              // Supprimer immédiatement le token pour éviter tout basculement
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              
              return { 
                valid: false, 
                error: 'Incohérence de session détectée. Veuillez vous reconnecter.' 
              }
            }
          }

          // Mettre à jour les valeurs de référence
          lastVerifiedUserId = result.user.id
          lastVerifiedUserRole = result.user.role
          isFirstCheck = false // Marquer que la première vérification est passée

          return { valid: true, user: result.user }
        }
      }
    } catch (decodeError) {
      console.warn('⚠️ Erreur lors du décodage du token:', decodeError)
    }

    // Si le décodage échoue, faire une vérification normale
    const result = await verifyToken(false)
    
    if (!result.valid || !result.user) {
      return { valid: false, error: result.error || 'Session invalide' }
    }

    // Mettre à jour les valeurs de référence
    lastVerifiedUserId = result.user.id
    lastVerifiedUserRole = result.user.role

    return { valid: true, user: result.user }
  } catch (error) {
    console.error('Erreur lors de la vérification de la session:', error)
    // Ne pas déconnecter pour les erreurs réseau
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      return { valid: false, error: 'Erreur réseau lors de la vérification de la session' }
    }
    return { valid: false, error: 'Erreur lors de la vérification de la session' }
  }
}

/**
 * Démarrer la vérification périodique de la session
 * @param {Function} onSessionInvalid - Callback appelé si la session est invalide
 * @param {number} interval - Intervalle en millisecondes (défaut: 2 minutes)
 */
export const startSessionMonitoring = (onSessionInvalid, interval = 120000) => {
  // Arrêter le monitoring précédent si existant
  stopSessionMonitoring()

  // Réinitialiser le flag de première vérification
  isFirstCheck = true

  // Vérifier immédiatement (mais ne pas vérifier la cohérence lors de la première vérification)
  verifySessionConsistency(true).then(result => {
    if (!result.valid) {
      // Ne déconnecter que si c'est une erreur critique (pas d'erreur réseau)
      if (result.error && !result.error.includes('réseau') && !result.error.includes('timeout')) {
        console.warn('⚠️ Session invalide détectée:', result.error)
        if (onSessionInvalid) {
          onSessionInvalid(result.error)
        }
      }
    }
  })

  // Vérifier périodiquement
  sessionCheckInterval = setInterval(async () => {
    try {
      const result = await verifySessionConsistency(false) // Vérifier la cohérence après la première vérification
      if (!result.valid) {
        // Ne déconnecter que si c'est une erreur critique
        if (result.error && !result.error.includes('réseau') && !result.error.includes('timeout')) {
          console.warn('⚠️ Session invalide détectée:', result.error)
          if (onSessionInvalid) {
            onSessionInvalid(result.error)
            stopSessionMonitoring()
          }
        } else {
          // Erreur temporaire, juste logger
          console.warn('⚠️ Erreur temporaire de session (ignorée):', result.error)
        }
      }
    } catch (error) {
      // Erreur réseau ou autre, ne pas déconnecter
      console.warn('⚠️ Erreur lors de la vérification de session (ignorée):', error.message)
    }
  }, interval)

  console.log('✅ Monitoring de session démarré (intervalle:', interval / 1000, 'secondes)')
}

/**
 * Arrêter la vérification périodique de la session
 */
export const stopSessionMonitoring = () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
    sessionCheckInterval = null
    console.log('⏹️ Monitoring de session arrêté')
  }
}

/**
 * Réinitialiser les valeurs de référence
 */
export const resetSessionReferences = () => {
  lastVerifiedUserId = null
  lastVerifiedUserRole = null
  isFirstCheck = true // Réinitialiser aussi le flag de première vérification
}

/**
 * Obtenir l'ID de l'utilisateur actuellement vérifié
 */
export const getLastVerifiedUserId = () => lastVerifiedUserId

/**
 * Obtenir le rôle de l'utilisateur actuellement vérifié
 */
export const getLastVerifiedUserRole = () => lastVerifiedUserRole

