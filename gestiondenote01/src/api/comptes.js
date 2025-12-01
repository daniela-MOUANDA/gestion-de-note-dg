// Client API pour la gestion des comptes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Obtenir le token depuis localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Obtenir tous les comptes
export const getAllComptes = async () => {
  try {
    const response = await fetch(`${API_URL}/comptes`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération des comptes')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    throw error
  }
}

// Créer un nouveau compte
export const createCompte = async (compteData) => {
  try {
    const response = await fetch(`${API_URL}/comptes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(compteData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du compte')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    throw error
  }
}

// Mettre à jour un compte
export const updateCompte = async (id, compteData) => {
  try {
    const response = await fetch(`${API_URL}/comptes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(compteData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du compte')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    throw error
  }
}

// Supprimer un compte
export const deleteCompte = async (id) => {
  try {
    const response = await fetch(`${API_URL}/comptes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la suppression du compte')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    throw error
  }
}

// Activer/Désactiver un compte
export const toggleActif = async (id, actif) => {
  try {
    const response = await fetch(`${API_URL}/comptes/${id}/toggle-actif`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actif })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la modification du statut')
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error)
    throw error
  }
}

