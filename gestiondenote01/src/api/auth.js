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

    // Stocker le token dans localStorage
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    throw error
  }
}

// Vérifier le token
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      return { valid: false }
    }

    const response = await fetch(`${API_URL}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    
    if (!response.ok || !data.valid) {
      // Token invalide, supprimer du localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { valid: false }
    }

    // Mettre à jour les informations utilisateur
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { valid: false }
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
    localStorage.removeItem('user')
    
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
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
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

