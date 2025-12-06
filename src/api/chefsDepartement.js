// Client API pour la gestion des chefs de département
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Obtenir le token depuis localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Obtenir tous les chefs de département
export const getAllChefsDepartement = async () => {
  try {
    const response = await fetch(`${API_URL}/chef-departement`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération des chefs de département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des chefs de département:', error)
    throw error
  }
}

// Créer un nouveau chef de département
export const createChefDepartement = async (chefData) => {
  try {
    const response = await fetch(`${API_URL}/chef-departement`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(chefData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du chef de département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du chef de département:', error)
    throw error
  }
}

// Mettre à jour un chef de département
export const updateChefDepartement = async (id, chefData) => {
  try {
    const response = await fetch(`${API_URL}/chef-departement/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(chefData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du chef de département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chef de département:', error)
    throw error
  }
}

// Supprimer un chef de département
export const deleteChefDepartement = async (id) => {
  try {
    const response = await fetch(`${API_URL}/chef-departement/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la suppression du chef de département')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la suppression du chef de département:', error)
    throw error
  }
}

