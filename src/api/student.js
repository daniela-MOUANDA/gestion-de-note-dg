const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Récupérer les informations de l'étudiant connecté
 */
export const getMyInfo = async () => {
    try {
        const token = localStorage.getItem('token')

        if (!token) {
            throw new Error('Non authentifié. Veuillez vous connecter.')
        }

        const response = await fetch(`${API_URL}/student/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des données')
        }

        return {
            success: true,
            data: data.data
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de l\'étudiant:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la récupération des données'
        }
    }
}
