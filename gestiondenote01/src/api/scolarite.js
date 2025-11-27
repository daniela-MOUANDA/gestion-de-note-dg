// Client API pour le service scolarité
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/scolarite'

// ============================================
// INSCRIPTIONS
// ============================================

export const getFormations = async () => {
  const response = await fetch(`${API_URL}/formations`)
  if (!response.ok) throw new Error('Erreur lors de la récupération des formations')
  return response.json()
}

export const getFilieres = async () => {
  const response = await fetch(`${API_URL}/filieres`)
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

export const getEtudiantsParClasse = async (classeId, promotionId, typeInscription) => {
  const response = await fetch(`${API_URL}/etudiants?classeId=${classeId}&promotionId=${promotionId}&typeInscription=${typeInscription}`)
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
