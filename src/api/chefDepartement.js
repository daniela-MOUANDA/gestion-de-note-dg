const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/chef-departement'

// Fonction helper pour les requêtes
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }

  const url = `${API_BASE_URL}${endpoint}`
  console.log(`🌐 [API Request] ${options.method || 'GET'} ${url}`)
  console.log(`🔑 [API Request] Auth Headers:`, {
    hasToken: !!token,
    authHeader: headers.Authorization ? 'Bearer [PRESENT]' : 'NONE'
  })

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    console.log(`📥 [API] Réponse reçue:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type')
    })

    // Vérifier si la réponse est du JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ [API] Réponse non-JSON reçue:', text)
      return {
        success: false,
        error: `Erreur serveur (${response.status}): ${text.substring(0, 100)}`
      }
    }

    const data = await response.json()
    console.log(`✅ [API] Données reçues:`, data)
    return data
  } catch (error) {
    console.error('❌ [API] Erreur de connexion:', error)
    return {
      success: false,
      error: error.message || 'Erreur de connexion'
    }
  }
}
// ============================================
// DASHBOARD & STATS
// ============================================

export const getFilieres = async () => {
  return request('/filieres')
}

export const getDashboardStats = async () => {
  return request('/stats')
}

export const getMeilleursEtudiantsParFiliere = async () => {
  return request('/statistiques/meilleurs-etudiants')
}

// ============================================
// BULLETINS
// ============================================

export const verifierEtatBulletins = async (classeId, semestre) => {
  return request(`/bulletins/verifier/${classeId}?semestre=${semestre}`)
}

export const getEtatBulletinsToutesClasses = async (semestre = null) => {
  const url = semestre
    ? `/bulletins/etat-toutes-classes?semestre=${semestre}`
    : '/bulletins/etat-toutes-classes'
  return request(url)
}

export const genererBulletins = async (classeId, semestre) => {
  return request(`/bulletins/generer/${classeId}?semestre=${semestre}`, {
    method: 'POST'
  })
}

export const getBulletinsGeneres = async (classeId, semestre) => {
  return request(`/bulletins/classe/${classeId}?semestre=${semestre}`)
}

export const getNiveaux = async () => {
  return request('/niveaux')
}

// ============================================
// RÉPARTITION CLASSES
// ============================================

export const getRepartitionCount = async (filiereId, niveauId, formation = null) => {
  const params = new URLSearchParams({
    filiereId,
    niveauId
  })
  if (formation) {
    params.append('formation', formation)
  }
  return request(`/repartition/count?${params.toString()}`)
}

export const createClassesRepartition = async (data) => {
  return request('/repartition/create', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const getClassesExistantes = async (filiereId, niveauId, formation = null) => {
  const params = new URLSearchParams({
    filiereId,
    niveauId
  })
  if (formation) {
    params.append('formation', formation)
  }
  return request(`/repartition/classes-existantes?${params.toString()}`)
}

export const affecterEtudiantsAClasse = async (data) => {
  return request('/repartition/affecter-classe', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Récupère TOUS les étudiants pour la répartition manuelle (filière, niveau, formation)
 */
export const getEtudiantsTouts = async (filiereId, niveauId, formation) => {
  return request(`/repartition/etudiants-tous?filiereId=${filiereId}&niveauId=${niveauId}&formation=${formation}`)
}

/**
 * Reclasse manuellement des étudiants par lot
 */
export const reclasserEtudiantsManuellement = async (data) => {
  return request('/repartition/reclasser-manuel', {
    method: 'POST',
    body: JSON.stringify(data)
  })
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
// ÉTUDIANTS AVEC MOYENNES
// ============================================

// Obtenir tous les étudiants du département avec leurs moyennes (avec pagination)
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

    return request(`/etudiants?${params}`)
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return { success: false, error: error.message }
  }
}

// Obtenir les détails d'un étudiant du département
export const getEtudiantDetails = async (etudiantId, semestre = null) => {
  try {
    const url = semestre && semestre !== 'TOUS'
      ? `/etudiants/${etudiantId}?semestre=${semestre}`
      : `/etudiants/${etudiantId}`
    return request(url)
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'étudiant:', error)
    return { success: false, error: error.message }
  }
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

// Paramètres de notation
export const getParametresNotation = async (moduleId, semestre) => {
  return request(`/notes/parametres/${moduleId}?semestre=${semestre}`)
}

export const saveParametresNotation = async (data) => {
  return request('/notes/parametres', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Notes par module et classe
export const getNotesByModuleClasse = async (moduleId, classeId, semestre) => {
  return request(`/notes/module/${moduleId}/classe/${classeId}?semestre=${semestre}`)
}


export const saveNotes = async (notes) => {
  return request('/notes/bulk', {
    method: 'POST',
    body: JSON.stringify({ notes })
  })
}

// ============================================
// EMPLOI DU TEMPS PÉRIODIQUE
// ============================================

export const createEmploiDuTempsPeriode = async (data) => {
  return request('/emploi-du-temps/periode', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const getEmploiDuTempsPeriode = async (classeId, semestre, dateDebut, dateFin) => {
  let url = `/emploi-du-temps/periode/${classeId}?semestre=${semestre}`
  if (dateDebut && dateFin) {
    url += `&dateDebut=${dateDebut}&dateFin=${dateFin}`
  }
  return request(url)
}

export const getHistoriqueEmploisDuTemps = async () => {
  return request('/emploi-du-temps/historique')
}

export const deleteEmploiDuTempsPeriode = async (classeId, dateDebut, dateFin) => {
  let url = `/emploi-du-temps/periode?classeId=${classeId}&dateDebut=${dateDebut}&dateFin=${dateFin}`
  return request(url, {
    method: 'DELETE'
  })
}

export const updateGroupeRecurrence = async (groupeId, data) => {
  return request(`/emploi-du-temps/groupe/${groupeId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const deleteGroupeRecurrence = async (groupeId) => {
  return request(`/emploi-du-temps/groupe/${groupeId}`, {
    method: 'DELETE'
  })
}

export const deleteEmploiDuTempsId = async (id) => {
  return request(`/emploi-du-temps/${id}`, {
    method: 'DELETE'
  })
}

export const getBulletinData = async (classeId, semestre) => {
  return request(`/releves/bulletin/${classeId}?semestre=${semestre}`)
}

export const getAnnualBulletinData = async (classeId) => {
  return request(`/releves/annual/${classeId}`)
}

export const updateEmploiDuTempsId = async (id, data) => {
  return request(`/emploi-du-temps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export const exportPlanchePDF = async (classeId, semestre) => {
  const token = localStorage.getItem('token')
  const url = `${API_BASE_URL}/classes/${classeId}/planches/${semestre}/pdf`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la planche')
  }

  return response.blob()
}

export const exportPlancheExcel = async (classeId, semestre, classeNom = '', filiereNom = '') => {
  const token = localStorage.getItem('token')
  let url = `${API_BASE_URL}/classes/${classeId}/planches/${semestre}/excel`

  const params = new URLSearchParams()
  if (classeNom) params.append('classeNom', classeNom)
  if (filiereNom) params.append('filiereNom', filiereNom)

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la planche Excel')
  }

  return response.blob()
}

export const exportAnnualPlanchePDF = async (classeId) => {
  const token = localStorage.getItem('token')
  const url = `${API_BASE_URL}/classes/${classeId}/planches/annuel/pdf`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la planche annuelle')
  }

  return response.blob()
}

export const exportAnnualPlancheExcel = async (classeId, classeNom = '', filiereNom = '') => {
  const token = localStorage.getItem('token')
  let url = `${API_BASE_URL}/classes/${classeId}/planches/annuel/excel`

  const params = new URLSearchParams()
  if (classeNom) params.append('classeNom', classeNom)
  if (filiereNom) params.append('filiereNom', filiereNom)

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la planche annuelle Excel')
  }

  return response.blob()
}
