const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})

export const searchStudents = async (searchTerm) => {
    const response = await fetch(`${API_URL}/admin-systeme/students/search?searchTerm=${searchTerm}`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error('Erreur lors de la recherche')
    return response.json()
}

export const updatePassword = async (userId, newPassword) => {
    const response = await fetch(`${API_URL}/admin-systeme/students/${userId}/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword })
    })
    if (!response.ok) throw new Error('Erreur lors de la mise à jour')
    return response.json()
}

export const getAuditLogs = async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key])
    })

    const response = await fetch(`${API_URL}/admin-systeme/audit/logs?${queryParams.toString()}`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error('Erreur lors de la récupération des logs')
    return response.json()
}

export const getAuditUsers = async () => {
    const response = await fetch(`${API_URL}/admin-systeme/audit/users`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs')
    return response.json()
}

/**
 * Récupère les statistiques dynamiques du dashboard
 */
export const getDashboardStats = async () => {
    const response = await fetch(`${API_URL}/admin-systeme/dashboard/stats`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques')
    return response.json()
}

/**
 * Récupère les logs récents pour le dashboard
 */
export const getRecentLogs = async () => {
    const response = await fetch(`${API_URL}/admin-systeme/dashboard/recent-logs`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error('Erreur lors de la récupération des logs')
    return response.json()
}

export const createAccount = async (studentId, password) => {
    const response = await fetch(`${API_URL}/admin-systeme/students/create-account`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ studentId, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Erreur lors de la création du compte')
    return data
}
