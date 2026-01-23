const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Récupérer toutes les notifications de l'étudiant connecté
 */
export const getNotifications = async (filters = {}) => {
    try {
        const token = localStorage.getItem('token')

        // Construire les paramètres de requête
        const params = new URLSearchParams()
        if (filters.type) params.append('type', filters.type)
        if (filters.lu !== undefined) params.append('lu', filters.lu)
        if (filters.limit) params.append('limit', filters.limit)

        const queryString = params.toString()
        const url = `${API_URL}/notifications${queryString ? `?${queryString}` : ''}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération des notifications')
        }

        return data.notifications
    } catch (error) {
        console.error('Erreur getNotifications:', error)
        throw error
    }
}

/**
 * Obtenir le nombre de notifications non lues
 */
export const getUnreadCount = async () => {
    try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/notifications/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du comptage des notifications')
        }

        return data.count
    } catch (error) {
        console.error('Erreur getUnreadCount:', error)
        return 0
    }
}

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId) => {
    try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du marquage de la notification')
        }

        return data.notification
    } catch (error) {
        console.error('Erreur markAsRead:', error)
        throw error
    }
}

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllAsRead = async () => {
    try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du marquage de toutes les notifications')
        }

        return data.count
    } catch (error) {
        console.error('Erreur markAllAsRead:', error)
        throw error
    }
}

/**
 * Supprimer une notification
 */
export const deleteNotification = async (notificationId) => {
    try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la suppression de la notification')
        }

        return true
    } catch (error) {
        console.error('Erreur deleteNotification:', error)
        throw error
    }
}

/**
 * Supprimer toutes les notifications
 */
export const deleteAllNotifications = async () => {
    try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/notifications`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la suppression des notifications')
        }

        return true
    } catch (error) {
        console.error('Erreur deleteAllNotifications:', error)
        throw error
    }
}
