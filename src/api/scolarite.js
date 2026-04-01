// Client API pour le service scolarité
import { redirectToLogin } from '../utils/navigation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/scolarite'

// Helper pour gérer les erreurs d'authentification
const handleAuthError = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    redirectToLogin('Session expirée')
    return true
  }
  return false
}

// ============================================
// INSCRIPTIONS
// ============================================

export const getFormations = async () => {
  const response = await fetch(`${API_URL}/formations`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des formations')
  return response.json()
}

export const getFilieres = async (options = {}) => {
  const params = new URLSearchParams()
  if (options.sansGroupes) params.set('sansGroupes', '1')
  const qs = params.toString()
  const response = await fetch(`${API_URL}/filieres${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des filières')
  return response.json()
}

export const getNiveauxDisponibles = async (formationId, filiereId) => {
  const response = await fetch(`${API_URL}/niveaux?formationId=${formationId}&filiereId=${filiereId}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des niveaux')
  return response.json()
}

export const getClasses = async (filiereId, niveauId) => {
  const response = await fetch(`${API_URL}/classes?filiereId=${filiereId}&niveauId=${niveauId}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des classes')
  return response.json()
}

export const getPromotions = async () => {
  const response = await fetch(`${API_URL}/promotions`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des promotions')
  return response.json()
}

export const getAgentDashboardStats = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }

  const response = await fetch(`${API_URL}/dashboard/agent`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des statistiques' }))
    throw new Error(error.error || 'Erreur lors de la récupération des statistiques')
  }
  return response.json()
}

export const getSPDashboardStats = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/dashboard/sp`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des statistiques' }))
    throw new Error(error.error || 'Erreur lors de la récupération des statistiques')
  }

  return response.json()
}

export const getChefDashboardStats = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/dashboard/chef`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    if (response.status === 403) {
      const error = await response.json().catch(() => ({ error: 'Accès refusé' }))
      throw new Error(error.error || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des statistiques' }))
    throw new Error(error.error || 'Erreur lors de la récupération des statistiques')
  }

  return response.json()
}

export const getChefStatistiques = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/statistiques/chef`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    if (response.status === 403) {
      const error = await response.json().catch(() => ({ error: 'Accès refusé' }))
      throw new Error(error.error || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des statistiques' }))
    throw new Error(error.error || 'Erreur lors de la récupération des statistiques')
  }

  return response.json()
}

// ============================================
// AUDIT
// ============================================

export const getActionsAudit = async (filters = {}) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const queryParams = new URLSearchParams()
  if (filters.typeAction) queryParams.append('typeAction', filters.typeAction)
  if (filters.utilisateurId) queryParams.append('utilisateurId', filters.utilisateurId)
  if (filters.dateDebut) queryParams.append('dateDebut', filters.dateDebut)
  if (filters.dateFin) queryParams.append('dateFin', filters.dateFin)
  if (filters.searchQuery) queryParams.append('searchQuery', filters.searchQuery)
  if (filters.limit) queryParams.append('limit', filters.limit.toString())
  if (filters.offset) queryParams.append('offset', filters.offset.toString())

  const response = await fetch(`${API_URL}/audit/actions?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    if (response.status === 403) {
      const error = await response.json().catch(() => ({ error: 'Accès refusé' }))
      throw new Error(error.error || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des actions d\'audit' }))
    throw new Error(error.error || 'Erreur lors de la récupération des actions d\'audit')
  }

  return response.json()
}

export const getAgentsPourFiltre = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/audit/agents`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    if (response.status === 403) {
      const error = await response.json().catch(() => ({ error: 'Accès refusé' }))
      throw new Error(error.error || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des agents' }))
    throw new Error(error.error || 'Erreur lors de la récupération des agents')
  }

  return response.json()
}

export const getEtudiantsParClasse = async (classeId, promotionId, typeInscription) => {
  const response = await fetch(`${API_URL}/etudiants?classeId=${classeId}&promotionId=${promotionId}&typeInscription=${typeInscription}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des étudiants')
  return response.json()
}

export const getEtudiantsParFiliereNiveau = async (filiereId, niveauId, promotionId, formationId, typeInscription) => {
  const response = await fetch(`${API_URL}/etudiants?filiereId=${filiereId}&niveauId=${niveauId}&promotionId=${promotionId}&formationId=${formationId}&typeInscription=${typeInscription}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des étudiants')
  return response.json()
}

export const validerInscription = async (inscriptionId, agentId) => {
  const response = await fetch(`${API_URL}/inscriptions/${inscriptionId}/valider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  })
  if (!response.ok) throw new Error('Erreur lors de la validation')
  return response.json()
}

export const finaliserInscription = async (inscriptionId, agentId) => {
  const response = await fetch(`${API_URL}/inscriptions/${inscriptionId}/finaliser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  })
  if (!response.ok) throw new Error('Erreur lors de la finalisation')
  return response.json()
}

/** Remplit les documents d’inscription manquants avec des fichiers modèles pour tout le périmètre filière/niveau/formation/promotion. */
export const bulkFillPlaceholderDocuments = async (payload) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/inscriptions/bulk-documents-placeholder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  const raw = await response.text()
  let data = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = { error: raw?.slice(0, 240) || `Réponse invalide (HTTP ${response.status})` }
  }

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    throw new Error(data.error || `Erreur lors du remplissage (HTTP ${response.status})`)
  }

  return data
}

/** Finalise (statut INSCRIT + compte étudiant) toutes les inscriptions du périmètre dont le dossier est complet. */
export const bulkFinaliserComplets = async (payload) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/inscriptions/bulk-finaliser-complets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  const raw = await response.text()
  let data = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = { error: raw?.slice(0, 240) || `Réponse invalide (HTTP ${response.status})` }
  }

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    throw new Error(data.error || `Erreur finalisation groupée (HTTP ${response.status})`)
  }

  return data
}

// ============================================
// PROFIL ÉTUDIANT
// ============================================

export const getMonProfilEtudiant = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/etudiant/mon-profil`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      redirectToLogin('Session expirée')
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la récupération du profil' }))
    throw new Error(errorData.error || 'Erreur lors de la récupération du profil étudiant')
  }
  const data = await response.json()
  return data.etudiant
}

export const getMesNotes = async () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/etudiant/mes-notes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      redirectToLogin('Session expirée')
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la récupération des notes' }))
    throw new Error(errorData.error || 'Erreur lors de la récupération des notes')
  }
  const data = await response.json()
  return data
}

// ============================================
// ATTESTATIONS
// ============================================

export const creerAttestation = async (etudiantId, promotionId, anneeAcademique) => {
  const response = await fetch(`${API_URL}/attestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etudiantId, promotionId, anneeAcademique })
  })
  if (!response.ok) throw new Error('Erreur lors de la création de l\'attestation')
  return response.json()
}

export const getEtudiantsInscritsParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  const response = await fetch(`${API_URL}/etudiants-inscrits?promotionId=${promotionId}&filiereId=${filiereId}&niveauId=${niveauId}&formationId=${formationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    throw new Error('Erreur lors de la récupération des étudiants inscrits')
  }
  return response.json()
}

export const getAttestationsParClasse = async (promotionId, filiereId, niveauId, classeId) => {
  const response = await fetch(`${API_URL}/attestations?promotionId=${promotionId}&filiereId=${filiereId}&niveauId=${niveauId}&classeId=${classeId}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des attestations')
  return response.json()
}

export const archiverAttestation = async (attestationId) => {
  const response = await fetch(`${API_URL}/attestations/${attestationId}/archiver`, {
    method: 'POST'
  })
  if (!response.ok) throw new Error('Erreur lors de l\'archivage')
  return response.json()
}

export const getAttestationsArchivees = async (promotionId, filiereId, niveauId, classeId) => {
  const response = await fetch(`${API_URL}/attestations/archives?promotionId=${promotionId}&filiereId=${filiereId}&niveauId=${niveauId}&classeId=${classeId}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des archives')
  return response.json()
}

export const getAttestationsArchiveesParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId = null) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')

  let url = `${API_URL}/attestations/archives?promotionId=${promotionId}&filiereId=${filiereId}&niveauId=${niveauId}`
  if (formationId) {
    url += `&formationId=${formationId}`
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    throw new Error('Erreur lors de la récupération des archives')
  }
  return response.json()
}

// ============================================
// BULLETINS
// ============================================

export const getBulletinsParClasse = async (promotionId, classeId, semestre) => {
  const response = await fetch(`${API_URL}/bulletins?promotionId=${promotionId}&classeId=${classeId}&semestre=${semestre}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des bulletins')
  return response.json()
}

export const marquerBulletinRecupere = async (bulletinId, etudiantId, promotionId, classeId, semestre, agentId) => {
  const response = await fetch(`${API_URL}/bulletins/${bulletinId || 'new'}/recuperer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etudiantId, promotionId, classeId, semestre, agentId })
  })
  if (!response.ok) throw new Error('Erreur lors de la mise à jour')
  return response.json()
}

// ============================================
// DIPLÔMES
// ============================================

export const getDiplomesParClasse = async (promotionId, classeId, typeDiplome) => {
  const response = await fetch(`${API_URL}/diplomes?promotionId=${promotionId}&classeId=${classeId}&typeDiplome=${typeDiplome}`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des diplômes')
  return response.json()
}

export const marquerDiplomeRecupere = async (diplomeId, etudiantId, promotionId, classeId, typeDiplome, agentId) => {
  const response = await fetch(`${API_URL}/diplomes/${diplomeId || 'new'}/recuperer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etudiantId, promotionId, classeId, typeDiplome, agentId })
  })
  if (!response.ok) throw new Error('Erreur lors de la mise à jour')
  return response.json()
}

// ============================================
// DOCUMENTS D'INSCRIPTION
// ============================================

export const uploadDocumentInscription = async (inscriptionId, documentType, file) => {
  const formData = new FormData()
  formData.append('document', file)

  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/inscriptions/${inscriptionId}/documents/${documentType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de l\'upload')
  }
  return response.json()
}

export const deleteDocumentInscription = async (inscriptionId, documentType, raison = null) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/inscriptions/${inscriptionId}/documents/${documentType}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raison })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de la suppression')
  }
  return response.json()
}

export const deleteEtudiant = async (etudiantId) => {
  const token = localStorage.getItem('token')
  if (!token) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    redirectToLogin('Session expirée')
    return
  }

  const response = await fetch(`${API_URL}/etudiants/${etudiantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    redirectToLogin('Session expirée')
    return
  }

  if (!response.ok) {
    let errorMessage = 'Erreur lors de la suppression de l\'étudiant'
    try {
      const error = await response.json()
      errorMessage = error.error || errorMessage
    } catch (e) {
      // Si la réponse n'est pas du JSON, utiliser le message d'erreur par défaut
      errorMessage = `Erreur ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export const updateEtudiantInfo = async (etudiantId, data) => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('Token manquant dans localStorage')
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }

  const response = await fetch(`${API_URL}/etudiants/${etudiantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la mise à jour' }))
    throw new Error(error.error || 'Erreur lors de la mise à jour')
  }
  return response.json()
}

export const uploadPhotoEtudiant = async (etudiantId, file) => {
  const formData = new FormData()
  formData.append('photo', file)

  const token = localStorage.getItem('token')
  if (!token) {
    console.error('Token manquant dans localStorage')
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }

  const response = await fetch(`${API_URL}/etudiants/${etudiantId}/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de l\'upload de la photo' }))
    throw new Error(error.error || 'Erreur lors de l\'upload de la photo')
  }
  return response.json()
}

export const upsertParent = async (etudiantId, parentData) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/etudiants/${etudiantId}/parents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(parentData)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erreur lors de l\'enregistrement du parent')
  }
  return response.json()
}

export const getParents = async (etudiantId) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/etudiants/${etudiantId}/parents`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) throw new Error('Erreur lors de la récupération des parents')
  return response.json()
}

export const getDossierEtudiant = async (etudiantId, inscriptionId) => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('Token manquant dans localStorage')
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }

  const response = await fetch(`${API_URL}/dossiers/${etudiantId}/${inscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la récupération du dossier' }))
    throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// CRÉATION MANUELLE D'ÉTUDIANT
// ============================================

export const creerEtudiantManuel = async (data) => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }

  const response = await fetch(`${API_URL}/etudiants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    if (handleAuthError(response)) {
      throw new Error('Session expirée. Veuillez vous reconnecter.')
    }
    const error = await response.json().catch(() => ({ error: 'Erreur lors de la création de l\'étudiant' }))
    throw new Error(error.error || 'Erreur lors de la création de l\'étudiant')
  }

  return response.json()
}