const API_BASE_URL = 'http://localhost:3000/api/chef-departement'

// Fonction helper pour les requêtes
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erreur API:', error)
    return {
      success: false,
      error: error.message || 'Erreur de connexion'
    }
  }
}

// ============================================
// CLASSES
// ============================================

export const getClasses = async () => {
  return request('/classes')
}

export const createClasse = async (data) => {
  return request('/classes', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const updateClasse = async (id, data) => {
  return request(`/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const deleteClasse = async (id) => {
  return request(`/classes/${id}`, {
    method: 'DELETE'
  })
}

// ============================================
// ENSEIGNANTS
// ============================================

export const getEnseignants = async () => {
  return request('/enseignants')
}

export const createEnseignant = async (data) => {
  return request('/enseignants', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const updateEnseignant = async (id, data) => {
  return request(`/enseignants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const deleteEnseignant = async (id) => {
  return request(`/enseignants/${id}`, {
    method: 'DELETE'
  })
}

export const affecterModulesEnseignant = async (enseignantId, moduleIds) => {
  return request(`/enseignants/${enseignantId}/affecter-modules`, {
    method: 'POST',
    body: JSON.stringify({ moduleIds })
  })
}

// ============================================
// MODULES
// ============================================

export const getModules = async (classeId = null) => {
  const query = classeId ? `?classeId=${classeId}` : ''
  return request(`/modules${query}`)
}

export const createModule = async (data) => {
  return request('/modules', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const updateModule = async (id, data) => {
  return request(`/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const deleteModule = async (id) => {
  return request(`/modules/${id}`, {
    method: 'DELETE'
  })
}

// ============================================
// RÉPARTITION
// ============================================

export const getEtudiantsNonRepartis = async () => {
  return request('/repartition/etudiants-non-repartis')
}

export const repartirEtudiant = async (inscriptionId, classeId) => {
  return request('/repartition/repartir', {
    method: 'POST',
    body: JSON.stringify({ inscriptionId, classeId })
  })
}

export const getEtudiantsByClasse = async (classeId) => {
  return request(`/repartition/classes/${classeId}/etudiants`)
}

// ============================================
// EMPLOI DU TEMPS
// ============================================

export const getEmploiDuTemps = async (classeId, semestre) => {
  return request(`/emplois-temps/classes/${classeId}?semestre=${semestre}`)
}

export const createEmploiDuTemps = async (data) => {
  return request('/emplois-temps', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const deleteEmploiDuTemps = async (id) => {
  return request(`/emplois-temps/${id}`, {
    method: 'DELETE'
  })
}

// ============================================
// NOTES
// ============================================

export const getNotes = async (classeId, moduleId, semestre) => {
  return request(`/notes/classes/${classeId}/modules/${moduleId}?semestre=${semestre}`)
}

export const saveNote = async (data) => {
  return request('/notes', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const deleteNote = async (id) => {
  return request(`/notes/${id}`, {
    method: 'DELETE'
  })
}

