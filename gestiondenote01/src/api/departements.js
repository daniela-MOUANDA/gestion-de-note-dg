// Client API pour la gestion des départements
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Obtenir le token depuis localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Obtenir tous les départements
export const getAllDepartements = async () => {
  try {
    const response = await fetch(`${API_URL}/departements`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération des départements')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error)
    throw error
  }
}

// Créer un nouveau département
export const createDepartement = async (departementData) => {
  try {
    const response = await fetch(`${API_URL}/departements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(departementData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du département:', error)
    throw error
  }
}

// Mettre à jour un département
export const updateDepartement = async (id, departementData) => {
  try {
    const response = await fetch(`${API_URL}/departements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(departementData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du département:', error)
    throw error
  }
}

// Supprimer un département
export const deleteDepartement = async (id) => {
  try {
    const response = await fetch(`${API_URL}/departements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la suppression du département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error)
    throw error
  }
}

