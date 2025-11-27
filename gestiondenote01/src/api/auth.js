// Client API pour l'authentification
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/auth'

// Connexion
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
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

