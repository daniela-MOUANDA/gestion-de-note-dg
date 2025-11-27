import express from 'express'
import {
  getFormations,
  getFilieres,
  getNiveauxDisponibles,
  getClasses,
  getEtudiantsParClasse,
  validerInscription,
  finaliserInscription,
  getPromotions
} from '../../src/services/scolarite/inscriptionService.js'
import {
  creerAttestation,
  getAttestationsParClasse,
  archiverAttestation,
  getAttestationsArchivees
} from '../../src/services/scolarite/attestationService.js'
import {
  getBulletinsParClasse,
  marquerBulletinRecupere
} from '../../src/services/scolarite/bulletinService.js'
import {
  getDiplomesParClasse,
  marquerDiplomeRecupere
} from '../../src/services/scolarite/diplomeService.js'

const router = express.Router()

// Routes Inscriptions
router.get('/formations', async (req, res) => {
  try {
    const formations = await getFormations()
    res.json(formations)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/filieres', async (req, res) => {
  try {
    const filieres = await getFilieres()
    res.json(filieres)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/niveaux', async (req, res) => {
  try {
    const { formationId, filiereId } = req.query
    if (!formationId || !filiereId) {
      return res.status(400).json({ error: 'formationId et filiereId sont requis' })
    }
    const niveaux = await getNiveauxDisponibles(formationId, filiereId)
    res.json(niveaux)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/classes', async (req, res) => {
  try {
    const { filiereId, niveauId } = req.query
    if (!filiereId || !niveauId) {
      return res.status(400).json({ error: 'filiereId et niveauId sont requis' })
    }
    const classes = await getClasses(filiereId, niveauId)
    res.json(classes)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/promotions', async (req, res) => {
  try {
    const promotions = await getPromotions()
    res.json(promotions)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/etudiants', async (req, res) => {
  try {
    const { classeId, promotionId, typeInscription } = req.query
    if (!classeId || !promotionId || !typeInscription) {
      return res.status(400).json({ error: 'classeId, promotionId et typeInscription sont requis' })
    }
    const etudiants = await getEtudiantsParClasse(classeId, promotionId, typeInscription)
    res.json(etudiants)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/inscriptions/:id/valider', async (req, res) => {
  try {
    const { id } = req.params
    const { agentId } = req.body
    const inscription = await validerInscription(id, agentId)
    res.json(inscription)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/inscriptions/:id/finaliser', async (req, res) => {
  try {
    const { id } = req.params
    const { agentId } = req.body
    const inscription = await finaliserInscription(id, agentId)
    res.json(inscription)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

// Routes Attestations
router.post('/attestations', async (req, res) => {
  try {
    const { etudiantId, promotionId, anneeAcademique } = req.body
    const attestation = await creerAttestation(etudiantId, promotionId, anneeAcademique)
    res.json(attestation)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/attestations', async (req, res) => {
  try {
    const { promotionId, filiereId, niveauId, classeId } = req.query
    if (!promotionId || !filiereId || !niveauId || !classeId) {
      return res.status(400).json({ error: 'Tous les paramètres sont requis' })
    }
    const attestations = await getAttestationsParClasse(promotionId, filiereId, niveauId, classeId)
    res.json(attestations)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/attestations/:id/archiver', async (req, res) => {
  try {
    const { id } = req.params
    const attestation = await archiverAttestation(id)
    res.json(attestation)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/attestations/archives', async (req, res) => {
  try {
    const { promotionId, filiereId, niveauId, classeId } = req.query
    if (!promotionId || !filiereId || !niveauId || !classeId) {
      return res.status(400).json({ error: 'Tous les paramètres sont requis' })
    }
    const attestations = await getAttestationsArchivees(promotionId, filiereId, niveauId, classeId)
    res.json(attestations)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

// Routes Bulletins
router.get('/bulletins', async (req, res) => {
  try {
    const { promotionId, classeId, semestre } = req.query
    if (!promotionId || !classeId || !semestre) {
      return res.status(400).json({ error: 'Tous les paramètres sont requis' })
    }
    const bulletins = await getBulletinsParClasse(promotionId, classeId, semestre)
    res.json(bulletins)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/bulletins/:id/recuperer', async (req, res) => {
  try {
    const { id } = req.params
    const { etudiantId, promotionId, classeId, semestre, agentId } = req.body
    const bulletin = await marquerBulletinRecupere(id, etudiantId, promotionId, classeId, semestre, agentId)
    res.json(bulletin)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

// Routes Diplômes
router.get('/diplomes', async (req, res) => {
  try {
    const { promotionId, classeId, typeDiplome } = req.query
    if (!promotionId || !classeId || !typeDiplome) {
      return res.status(400).json({ error: 'Tous les paramètres sont requis' })
    }
    const diplomes = await getDiplomesParClasse(promotionId, classeId, typeDiplome)
    res.json(diplomes)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/diplomes/:id/recuperer', async (req, res) => {
  try {
    const { id } = req.params
    const { etudiantId, promotionId, classeId, typeDiplome, agentId } = req.body
    const diplome = await marquerDiplomeRecupere(id, etudiantId, promotionId, classeId, typeDiplome, agentId)
    res.json(diplome)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

