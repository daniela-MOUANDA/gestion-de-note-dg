// Client API pour la gestion des comptes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Obtenir le token depuis localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.error('❌ Token manquant dans localStorage')
    throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Obtenir tous les comptes
export const getAllComptes = async () => {
  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      console.error('❌ Token manquant lors de la récupération des comptes')
      return {
        success: false,
        error: 'Token d\'authentification manquant. Veuillez vous reconnecter.'
      }
    }

    const response = await fetch(`${API_URL}/comptes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      // Token invalide ou expiré
      localStorage.removeItem('token')
      return {
        success: false,
        error: 'Votre session a expiré. Veuillez vous reconnecter.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la récupération des comptes'
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des comptes'
    }
  }
}

// Créer un nouveau compte
export const createCompte = async (compteData) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return {
        success: false,
        error: 'Token d\'authentification manquant. Veuillez vous reconnecter.'
      }
    }

    const response = await fetch(`${API_URL}/comptes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(compteData)
    })

    if (response.status === 401) {
      localStorage.removeItem('token')
      return {
        success: false,
        error: 'Votre session a expiré. Veuillez vous reconnecter.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la création du compte'
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du compte'
    }
  }
}

// Mettre à jour un compte
export const updateCompte = async (id, compteData) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return {
        success: false,
        error: 'Token d\'authentification manquant. Veuillez vous reconnecter.'
      }
    }

    const response = await fetch(`${API_URL}/comptes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(compteData)
    })

    if (response.status === 401) {
      localStorage.removeItem('token')
      return {
        success: false,
        error: 'Votre session a expiré. Veuillez vous reconnecter.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la mise à jour du compte'
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du compte'
    }
  }
}

// Supprimer un compte
export const deleteCompte = async (id) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return {
        success: false,
        error: 'Token d\'authentification manquant. Veuillez vous reconnecter.'
      }
    }

    const response = await fetch(`${API_URL}/comptes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      localStorage.removeItem('token')
      return {
        success: false,
        error: 'Votre session a expiré. Veuillez vous reconnecter.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la suppression du compte'
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression du compte'
    }
  }
}

// Activer/Désactiver un compte
export const toggleActif = async (id, actif) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return {
        success: false,
        error: 'Token d\'authentification manquant. Veuillez vous reconnecter.'
      }
    }

    const response = await fetch(`${API_URL}/comptes/${id}/toggle-actif`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ actif })
    })

    if (response.status === 401) {
      localStorage.removeItem('token')
      return {
        success: false,
        error: 'Votre session a expiré. Veuillez vous reconnecter.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la modification du statut'
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la modification du statut'
    }
  }
}

