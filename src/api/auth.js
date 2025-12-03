// Client API pour l'authentification
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/auth'

// Connexion
export const login = async (email, password, matricule = null) => {
  try {
    const body = { email, password }
    if (matricule) {
      body.matricule = matricule
    }
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion')
    }

    // Stocker uniquement le token dans localStorage
    if (data.token) {
      localStorage.setItem('token', data.token)
      console.log('✅ Token stocké dans localStorage après connexion:', data.token.substring(0, 20) + '...')
      
      // Vérifier que le token est bien stocké
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        console.error('❌ ERREUR CRITIQUE: Le token n\'a pas été stocké correctement')
        throw new Error('Erreur lors du stockage du token')
      }
    } else {
      console.error('❌ ERREUR: Aucun token reçu du serveur')
      throw new Error('Aucun token reçu du serveur')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    throw error
  }
}

// Vérifier le token (avec renouvellement automatique si l'utilisateur est actif)
export const verifyToken = async (shouldRefresh = false) => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      return { valid: false, error: 'Token manquant' }
    }

    // Vérifier si le token est proche de l'expiration (moins de 1 heure)
    // Renouveler proactivement pour éviter les déconnexions
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]))
        if (payload.exp) {
          const currentTime = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = payload.exp - currentTime
          const oneHour = 3600 // 1 heure en secondes
          
          // Si le token expire dans moins d'1 heure, demander un renouvellement
          if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
            shouldRefresh = true
            console.log('🔄 Token proche de l\'expiration, renouvellement demandé')
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs de décodage
    }

    const url = shouldRefresh ? `${API_URL}/verify?refresh=true` : `${API_URL}/verify`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // Vérifier si la réponse est valide avant de parser
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }))
      
      // Ne supprimer le localStorage que si c'est vraiment une erreur d'authentification (401)
      if (response.status === 401) {
        // Vérifier si c'est une expiration ou une erreur de token
        if (errorData.error && (errorData.error.includes('expiré') || errorData.error.includes('Token expiré'))) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          return { valid: false, error: errorData.error || 'Token expiré' }
        }
        // Pour les autres erreurs 401, ne pas supprimer immédiatement
        return { valid: false, error: errorData.error || 'Token invalide' }
      }
      
      // Pour les autres erreurs (500, timeout, etc.), ne pas supprimer le localStorage
      return { valid: false, error: errorData.error || 'Erreur serveur' }
    }

    const data = await response.json()
    
    if (!data.valid) {
      // Token invalide mais ne pas supprimer si c'est une erreur réseau
      // Ne supprimer que si c'est vraiment une expiration ou une erreur d'authentification
      if (data.error && (data.error.includes('expiré') || data.error.includes('Token expiré') || data.error.includes('invalide'))) {
        // Vérifier que ce n'est pas juste une erreur réseau
        if (!data.error.includes('réseau') && !data.error.includes('timeout')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      return { valid: false, error: data.error || 'Token invalide' }
    }

    // Si un nouveau token a été renvoyé, le mettre à jour
    if (data.token) {
      localStorage.setItem('token', data.token)
      console.log('✅ Nouveau token reçu et stocké')
    }

    // NE PAS stocker l'utilisateur dans localStorage
    // Toujours récupérer les données depuis le serveur pour garantir la cohérence
    // localStorage.removeItem('user') // Supprimer si présent

    return data
  } catch (error) {
    console.error('Erreur réseau lors de la vérification du token:', error)
    // En cas d'erreur réseau, ne pas supprimer le localStorage et ne pas déconnecter
    // Retourner une erreur qui indique que c'est temporaire
    return { 
      valid: false, 
      error: 'Erreur réseau temporaire. Veuillez réessayer.' 
    }
    // L'utilisateur pourra continuer à utiliser l'application
    return { valid: false, error: 'Erreur réseau. Vérification impossible.' }
  }
}

// Déconnexion
export const logout = async () => {
  try {
    const token = localStorage.getItem('token')
    
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }

    // Supprimer le token et les données utilisateur
    localStorage.removeItem('token')
    localStorage.removeItem('user') // Supprimer si présent
    
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    // Supprimer quand même les données locales
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { success: true }
  }
}

// Obtenir l'utilisateur connecté
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      return null
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

// Obtenir le token depuis localStorage
export const getToken = () => {
  return localStorage.getItem('token')
}

// Obtenir l'utilisateur depuis localStorage
export const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur depuis localStorage:', error)
    return null
  }
}


// Uploader la photo de profil
export const uploadProfilePhoto = async (file) => {
  try {
    // Récupérer le token depuis localStorage
    let token = localStorage.getItem('token')
    
    // Si le token n'est pas dans localStorage, essayer de le récupérer depuis le contexte
    if (!token) {
      // Vérifier si l'utilisateur existe dans localStorage
      const storedUser = getUserFromStorage()
      if (!storedUser) {
        throw new Error('Vous devez être connecté pour uploader une photo. Veuillez vous reconnecter.')
      }
      
      // Si l'utilisateur existe mais pas le token, c'est un problème de session
      // Essayer de vérifier le token via l'API pour voir si on peut le récupérer
      console.warn('Token manquant dans localStorage, mais utilisateur présent. Tentative de récupération...')
      throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.')
    }

    const formData = new FormData()
    formData.append('photo', file)

    const response = await fetch(`${API_URL}/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Erreur serveur: ${text || 'Réponse non-JSON'}`)
    }

    const data = await response.json()
    
    if (!response.ok) {
      // Si le token est expiré ou invalide
      if (response.status === 401) {
        const errorMsg = data.error || 'Token invalide'
        // Ne pas nettoyer le localStorage immédiatement - laisser l'utilisateur décider
        // Seulement si c'est explicitement une erreur de token expiré
        if (errorMsg.includes('expiré') || errorMsg.includes('Token expiré')) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.')
        }
        // Pour les autres erreurs 401, ne pas nettoyer automatiquement
        throw new Error(errorMsg || 'Erreur d\'authentification. Veuillez réessayer.')
      }
      throw new Error(data.error || 'Erreur lors de l\'upload de la photo')
    }

    // Mettre à jour l'utilisateur dans localStorage
    const currentUser = getUserFromStorage()
    if (currentUser) {
      currentUser.photo = data.photoUrl
      localStorage.setItem('user', JSON.stringify(currentUser))
    }

    return data
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error)
    throw error
  }
}

// Changer le mot de passe
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Vous devez être connecté pour changer votre mot de passe')
    }

    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du changement de mot de passe')
    }

    return data
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    throw error
  }
}

