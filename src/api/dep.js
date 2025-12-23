// Client API pour le DEP - Utilisation de fetch natif pour éviter les dépendances externes

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Obtenir le token depuis localStorage et formater les headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    }
}

// Obtenir les bulletins en attente de visa
export const getBulletinsEnAttente = async () => {
    try {
        const response = await fetch(`${API_URL}/dep/bulletins/en-attente`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des bulletins')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des bulletins en attente:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir l'historique des bulletins visés
export const getBulletinsVises = async () => {
    try {
        const response = await fetch(`${API_URL}/dep/bulletins/vises`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des bulletins visés')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des bulletins visés:', error)
        return { success: false, error: error.message }
    }
}

// Viser un bulletin (lot)
export const viserBulletin = async (id) => {
    try {
        const response = await fetch(`${API_URL}/dep/bulletins/${id}/viser`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du visa')
        }

        return data
    } catch (error) {
        console.error('Erreur lors du visa du bulletin:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir les statistiques du dashboard DEP
export const getDashboardStats = async () => {
    try {
        const response = await fetch(`${API_URL}/dep/dashboard/stats`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des statistiques')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du dashboard:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir tous les étudiants avec leurs moyennes (avec pagination)
export const getEtudiants = async (page = 1, limit = 10, filters = {}) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            filiere: filters.filiere || 'TOUS',
            niveau: filters.niveau || 'TOUS',
            semestre: filters.semestre || 'TOUS',
            search: filters.search || ''
        })

        const response = await fetch(`${API_URL}/dep/etudiants?${params}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des étudiants')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir les détails d'un étudiant
export const getEtudiantDetails = async (etudiantId, semestre = null) => {
    try {
        const url = semestre && semestre !== 'TOUS'
            ? `${API_URL}/dep/etudiants/${etudiantId}?semestre=${semestre}`
            : `${API_URL}/dep/etudiants/${etudiantId}`
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des détails de l\'étudiant')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'étudiant:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir les meilleurs étudiants
export const getMeilleursEtudiants = async (filters = {}) => {
    try {
        const params = new URLSearchParams({
            filiere: filters.filiere || 'TOUS',
            niveau: filters.niveau || 'TOUS',
            semestre: filters.semestre || 'TOUS',
            limit: (filters.limit || 50).toString()
        })

        const response = await fetch(`${API_URL}/dep/meilleurs-etudiants?${params}`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des meilleurs étudiants')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des meilleurs étudiants:', error)
        return { success: false, error: error.message }
    }
}

// Obtenir les statistiques complètes
export const getStatistiques = async () => {
    try {
        const response = await fetch(`${API_URL}/dep/statistiques`, {
            method: 'GET',
            headers: getAuthHeaders()
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des statistiques')
        }

        return data
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        return { success: false, error: error.message }
    }
}
