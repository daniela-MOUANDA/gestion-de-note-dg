/**
 * Utilitaire de débogage pour le token
 */

export const checkToken = () => {
  const token = localStorage.getItem('token')
  console.log('🔍 Vérification du token:')
  console.log('   Token présent:', !!token)
  if (token) {
    console.log('   Token (premiers 20 caractères):', token.substring(0, 20) + '...')
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        console.log('   Payload:', payload)
        if (payload.exp) {
          const expiryDate = new Date(payload.exp * 1000)
          const now = new Date()
          console.log('   Expire le:', expiryDate.toLocaleString())
          console.log('   Expiré:', expiryDate < now)
        }
      }
    } catch (e) {
      console.error('   Erreur lors du décodage:', e)
    }
  } else {
    console.error('   ❌ Aucun token trouvé dans localStorage')
  }
  return token
}

// Exposer dans la console pour le débogage
if (typeof window !== 'undefined') {
  window.checkToken = checkToken
}

