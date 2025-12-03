import express from 'express'
import multer from 'multer'
import prisma from '../../src/lib/prisma.js'
import {
  getFormations,
  getFilieres,
  getNiveauxDisponibles,
  getClasses,
  getEtudiantsParClasse,
  getEtudiantsParFiliereNiveau,
  validerInscription,
  finaliserInscription,
  getPromotions
} from '../../src/services/scolarite/inscriptionService.js'
import {
  creerAttestation,
  getAttestationsParClasse,
  getEtudiantsInscritsParFiliereNiveau,
  archiverAttestation,
  getAttestationsArchiveesParFiliereNiveau
} from '../../src/services/scolarite/attestationService.js'
import { getSPDashboardStats, getAgentDashboardStats, getChefDashboardStats, getChefStatistiques } from '../../src/services/scolarite/dashboardService.js'
import { getActionsAudit, getAgentsPourFiltre } from '../../src/services/scolarite/auditService.js'
import {
  getBulletinsParClasse,
  marquerBulletinRecupere
} from '../../src/services/scolarite/bulletinService.js'
import {
  getDiplomesParClasse,
  marquerDiplomeRecupere
} from '../../src/services/scolarite/diplomeService.js'
import { parseExcelFile, importEtudiants } from '../../src/services/scolarite/importService.js'
import { 
  saveDocument, 
  updateInscriptionDocument, 
  updateEtudiantInfo, 
  upsertParent, 
  getParents,
  getDossierEtudiant,
  deleteInscriptionDocument
} from '../../src/services/scolarite/inscriptionDocumentsService.js'
import { verifyToken } from '../../src/services/authService.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Configuration de multer pour l'upload de fichiers Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop())
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel'
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'))
    }
  }
})

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

router.get('/dashboard/sp', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien une SP
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'SP_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }
    const stats = await getSPDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard SP:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/dashboard/agent', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un agent
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'AGENT_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }
    const stats = await getAgentDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard agent:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/dashboard/chef', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un Chef de Service
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'CHEF_SERVICE_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }
    const stats = await getChefDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard Chef:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/statistiques/chef', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un Chef de Service
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'CHEF_SERVICE_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }
    const stats = await getChefStatistiques()
    res.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

// Routes Audit
router.get('/audit/actions', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un Chef de Service
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'CHEF_SERVICE_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }

    const filters = {
      typeAction: req.query.typeAction,
      utilisateurId: req.query.utilisateurId,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      searchQuery: req.query.searchQuery,
      limit: req.query.limit ? parseInt(req.query.limit) : 1000,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    }

    const actions = await getActionsAudit(filters)
    res.json(actions)
  } catch (error) {
    console.error('Erreur lors de la récupération des actions d\'audit:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/audit/agents', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un Chef de Service
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'CHEF_SERVICE_SCOLARITE') {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' })
    }

    const agents = await getAgentsPourFiltre()
    res.json(agents)
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/niveaux', async (req, res) => {
  try {
    const { formationId, filiereId } = req.query
    if (formationId && filiereId) {
      // Si formationId et filiereId sont fournis, utiliser getNiveauxDisponibles
      const niveaux = await getNiveauxDisponibles(formationId, filiereId)
      res.json(niveaux)
    } else {
      // Sinon, retourner tous les niveaux
      const niveaux = await prisma.niveau.findMany({
        orderBy: { code: 'asc' }
      })
      res.json(niveaux)
    }
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
    const { classeId, filiereId, niveauId, promotionId, formationId, typeInscription } = req.query
    
    // Si filiereId et niveauId sont fournis, utiliser la nouvelle méthode
    if (filiereId && niveauId && promotionId && formationId && typeInscription) {
      const etudiants = await getEtudiantsParFiliereNiveau(filiereId, niveauId, promotionId, formationId, typeInscription)
      return res.json(etudiants)
    }
    
    // Sinon, utiliser l'ancienne méthode avec classeId (pour compatibilité)
    if (classeId && promotionId && typeInscription) {
      const etudiants = await getEtudiantsParClasse(classeId, promotionId, typeInscription)
      return res.json(etudiants)
    }
    
    return res.status(400).json({ error: 'Paramètres requis manquants' })
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

// Route pour récupérer les étudiants inscrits par filière et niveau (pour SP)
router.get('/etudiants-inscrits', authenticate, async (req, res) => {
  try {
    const { promotionId, filiereId, niveauId, formationId } = req.query
    if (!promotionId || !filiereId || !niveauId || !formationId) {
      return res.status(400).json({ error: 'Tous les paramètres sont requis' })
    }
    const etudiants = await getEtudiantsInscritsParFiliereNiveau(promotionId, filiereId, niveauId, formationId)
    res.json(etudiants)
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

// Route pour récupérer les attestations archivées (avec filtre par classe)
router.get('/attestations/archives', authenticate, async (req, res) => {
  try {
    const { promotionId, filiereId, niveauId, formationId } = req.query
    
    if (!promotionId || !filiereId || !niveauId) {
      return res.status(400).json({ 
        error: 'Les paramètres promotionId, filiereId et niveauId sont requis',
        required: ['promotionId', 'filiereId', 'niveauId']
      })
    }
    
    console.log('Requête pour les attestations archivées avec les paramètres:', {
      promotionId,
      filiereId,
      niveauId,
      formationId: formationId || 'toutes les formations'
    });
    
    const attestations = await getAttestationsArchiveesParFiliereNiveau(
      promotionId, 
      filiereId, 
      niveauId, 
      formationId || null // formationId est optionnel
    )
    
    console.log(`Nombre d'attestations trouvées: ${attestations.length}`);
    
    res.json(attestations)
  } catch (error) {
    console.error('Erreur lors de la récupération des attestations archivées:', error)
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des attestations archivées',
      details: error.message 
    })
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

// Configuration de multer pour l'upload de documents d'inscription
const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Seuls les fichiers PDF et images sont autorisés'))
    }
  }
})

// Route pour importer les étudiants depuis un fichier Excel
router.post('/import-etudiants', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    const { anneeAcademique } = req.body
    if (!anneeAcademique) {
      return res.status(400).json({
        success: false,
        error: 'L\'année académique est requise'
      })
    }

    // Récupérer l'ID de l'agent connecté
    const agentId = req.user?.id
    if (!agentId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      })
    }

    // Parser le fichier Excel
    const dataBySheet = await parseExcelFile(req.file.buffer)
    
    if (Object.keys(dataBySheet).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée valide trouvée dans le fichier Excel'
      })
    }

    // Importer les étudiants
    const result = await importEtudiants(dataBySheet, anneeAcademique, agentId)

    res.json({
      success: true,
      message: `Import terminé: ${result.etudiantsCrees} étudiants créés, ${result.etudiantsExistant} déjà existants`,
      ...result
    })
  } catch (error) {
    console.error('Erreur lors de l\'import des étudiants:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'import du fichier Excel'
    })
  }
})

// Route pour uploader un document d'inscription
router.post('/inscriptions/:id/documents/:type', authenticate, uploadDocuments.single('document'), async (req, res) => {
  try {
    const { id, type } = req.params
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }
    
    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: { etudiant: true }
    })
    
    if (!inscription) {
      return res.status(404).json({
        success: false,
        error: 'Inscription introuvable'
      })
    }
    
    // Sauvegarder le document
    const documentUrl = await saveDocument(req.file, inscription.etudiantId, type)
    
    // Mettre à jour l'inscription
    await updateInscriptionDocument(id, type, documentUrl)
    
    res.json({
      success: true,
      message: 'Document uploadé avec succès',
      documentUrl
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload du document'
    })
  }
})

// Route pour supprimer un document d'inscription
router.delete('/inscriptions/:id/documents/:type', authenticate, async (req, res) => {
  try {
    const { id, type } = req.params
    
    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id }
    })
    
    if (!inscription) {
      return res.status(404).json({
        success: false,
        error: 'Inscription introuvable'
      })
    }
    
    // Supprimer le document
    const result = await deleteInscriptionDocument(id, type)
    
    res.json({
      success: true,
      message: result.message || 'Document supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du document'
    })
  }
})

// Route pour mettre à jour les informations de l'étudiant
router.put('/etudiants/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { email, telephone, adresse, nationalite } = req.body
    
    const updated = await updateEtudiantInfo(id, {
      email,
      telephone,
      adresse,
      nationalite
    })
    
    res.json({
      success: true,
      message: 'Informations mises à jour avec succès',
      etudiant: updated
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    })
  }
})

// Route pour uploader la photo de profil de l'étudiant
router.post('/etudiants/:id/photo', authenticate, uploadDocuments.single('photo'), async (req, res) => {
  try {
    const { id } = req.params
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }
    
    // Sauvegarder la photo
    const photoUrl = await saveDocument(req.file, id, 'photo')
    
    // Mettre à jour la photo de profil de l'étudiant
    await updateEtudiantInfo(id, { photo: photoUrl })
    
    // Synchroniser avec la photo d'identité dans l'inscription (si une inscription existe)
    const inscription = await prisma.inscription.findFirst({
      where: { etudiantId: id },
      orderBy: { dateInscription: 'desc' } // Prendre la plus récente
    })
    
    if (inscription) {
      await prisma.inscription.update({
        where: { id: inscription.id },
        data: { photoIdentite: photoUrl }
      })
    }
    
    res.json({
      success: true,
      message: 'Photo uploadée avec succès',
      photoUrl
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload de la photo'
    })
  }
})

// Route pour ajouter/mettre à jour un parent
router.post('/etudiants/:id/parents', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const parentData = req.body
    
    const parent = await upsertParent(id, parentData)
    
    res.json({
      success: true,
      message: 'Parent enregistré avec succès',
      parent
    })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du parent:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'enregistrement du parent'
    })
  }
})

// Route pour récupérer les parents d'un étudiant
router.get('/etudiants/:id/parents', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const parents = await getParents(id)
    
    res.json({
      success: true,
      parents
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des parents'
    })
  }
})

// Route pour récupérer le dossier complet d'un étudiant
router.get('/dossiers/:etudiantId/:inscriptionId', authenticate, async (req, res) => {
  try {
    const { etudiantId, inscriptionId } = req.params
    const dossier = await getDossierEtudiant(etudiantId, inscriptionId)
    
    res.json({
      success: true,
      dossier
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du dossier:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération du dossier'
    })
  }
})

// Route pour récupérer les informations de l'étudiant connecté
router.get('/etudiant/mon-profil', authenticate, async (req, res) => {
  try {
    const { getEtudiantByUserId } = await import('../../src/services/scolarite/etudiantService.js')
    
    // Vérifier que l'utilisateur est bien un étudiant
    if (req.user.role !== 'ETUDIANT') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Cette route est réservée aux étudiants.'
      })
    }

    const etudiant = await getEtudiantByUserId(req.user.id)
    
    res.json({
      success: true,
      etudiant
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du profil étudiant:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération du profil'
    })
  }
})

export default router

