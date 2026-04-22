import express from 'express'
import multer from 'multer'
import XLSX from 'xlsx'
import { supabaseAdmin } from '../config/supabase.js'
import {
  getFormations,
  getFilieres,
  getNiveauxDisponibles,
  getClasses,
  getEtudiantsParClasse,
  getEtudiantsParFiliereNiveau,
  getListeEtudiantsInscriptions,
  validerInscription,
  finaliserInscription,
  bulkFinaliserInscriptionsCompletes,
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
import { parseExcelFile, importEtudiants, creerEtudiantManuel } from '../../src/services/scolarite/importService.js'
import {
  saveDocument,
  updateInscriptionDocument,
  updateEtudiantInfo,
  upsertParent,
  getParents,
  getDossierEtudiant,
  deleteInscriptionDocument,
  bulkFillPlaceholderInscriptionDocuments
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
    const excludeGroupes =
      req.query.sansGroupes === '1' || req.query.sansGroupes === 'true'
    const filieres = await getFilieres({ excludeGroupes })
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
      const { data: niveaux, error } = await supabaseAdmin
        .from('niveaux')
        .select('*')
        .order('code', { ascending: true })

      if (error) throw error
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

/** Liste globale des étudiants (via inscriptions) pour la scolarité — filtres optionnels. */
router.get('/etudiants/liste', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role?.trim().toUpperCase()
    const allowed = ['AGENT_SCOLARITE', 'SP_SCOLARITE', 'CHEF_SERVICE_SCOLARITE']
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Accès refusé.' })
    }

    const { promotionId, filiereId, niveauId } = req.query
    const data = await getListeEtudiantsInscriptions({
      promotionId: promotionId || undefined,
      filiereId: filiereId || undefined,
      niveauId: niveauId || undefined
    })

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erreur liste étudiants:', error)
    res.status(500).json({ success: false, error: error.message || 'Erreur serveur' })
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

// Remplissage groupé des pièces manquantes par fichiers modèles (scolarité)
router.post('/inscriptions/bulk-documents-placeholder', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role?.trim().toUpperCase()
    const allowed = ['AGENT_SCOLARITE', 'SP_SCOLARITE', 'CHEF_SERVICE_SCOLARITE']
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle insuffisant.'
      })
    }

    const {
      filiereId,
      niveauId,
      promotionId,
      formationId,
      typeInscription
    } = req.body || {}

    const result = await bulkFillPlaceholderInscriptionDocuments({
      filiereId,
      niveauId,
      promotionId,
      formationId,
      typeInscription: typeInscription || 'inscription'
    })

    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Erreur remplissage documents modèles:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    })
  }
})

// Finalisation groupée : dossiers complets (documents + infos perso + parent) → INSCRIT
router.post('/inscriptions/bulk-finaliser-complets', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role?.trim().toUpperCase()
    const allowed = ['AGENT_SCOLARITE', 'SP_SCOLARITE', 'CHEF_SERVICE_SCOLARITE']
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle insuffisant.'
      })
    }

    const agentId = req.user?.id
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Utilisateur non identifié (agent).'
      })
    }

    const {
      filiereId,
      niveauId,
      promotionId,
      formationId,
      typeInscription
    } = req.body || {}

    const result = await bulkFinaliserInscriptionsCompletes({
      filiereId,
      niveauId,
      promotionId,
      formationId,
      typeInscription: typeInscription || 'inscription',
      agentId
    })

    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Erreur finalisation groupée:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    })
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

    const { anneeAcademique, formationId, niveauId, filiereId } = req.body
    if (!anneeAcademique) {
      return res.status(400).json({
        success: false,
        error: 'L\'année académique est requise'
      })
    }
    if (!formationId || !niveauId) {
      return res.status(400).json({
        success: false,
        error: 'La formation et le niveau sont requis'
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

    const forcedFiliereId =
      filiereId && String(filiereId).trim() !== '' ? String(filiereId).trim() : null

    const result = await importEtudiants(dataBySheet, anneeAcademique, agentId, formationId, niveauId, {
      forcedFiliereId
    })

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

// Route pour télécharger le modèle Excel d'import
// niveauId (obligatoire) : L1/L2 => feuilles tronc commun uniquement ; L3 => une feuille par option (sous-parcours), plus les filières sans option (ex. TC, AV).
router.get('/template-excel', authenticate, async (req, res) => {
  try {
    const { niveauId } = req.query
    if (!niveauId || String(niveauId).trim() === '') {
      return res.status(400).json({ error: 'Le paramètre niveauId est requis pour générer le modèle adapté.' })
    }

    const { data: niveau, error: nErr } = await supabaseAdmin
      .from('niveaux')
      .select('id, code')
      .eq('id', niveauId)
      .single()

    if (nErr || !niveau) {
      return res.status(400).json({ error: 'Niveau introuvable.' })
    }

    const niveauCode = String(niveau.code || '').toUpperCase()

    const { data: filieresRows, error: fErr } = await supabaseAdmin
      .from('filieres')
      .select('id, code, nom, parent_filiere_id, type_filiere')
      .neq('type_filiere', 'groupe')
      .order('code', { ascending: true })

    if (fErr) throw fErr

    const rows = filieresRows || []
    const roots = rows.filter((f) => !f.parent_filiere_id)
    const children = rows.filter((f) => f.parent_filiere_id)

    /** @type {{ id: string, code: string, nom: string }[]} */
    let sheetFilieres = []

    if (niveauCode === 'L3') {
      for (const root of roots) {
        const opts = children.filter((c) => c.parent_filiere_id === root.id)
          .sort((a, b) => (a.code || '').localeCompare(b.code || '', 'fr'))
        if (opts.length > 0) {
          sheetFilieres.push(...opts)
        } else {
          sheetFilieres.push(root)
        }
      }
    } else {
      sheetFilieres = [...roots].sort((a, b) => (a.code || '').localeCompare(b.code || '', 'fr'))
    }

    const seen = new Set()
    sheetFilieres = sheetFilieres.filter((f) => {
      if (seen.has(f.id)) return false
      seen.add(f.id)
      return true
    })

    if (sheetFilieres.length === 0) {
      return res.status(500).json({ error: 'Aucune filière disponible pour générer le modèle.' })
    }

    const wb = XLSX.utils.book_new()

    const headers = ['N°', 'Nom(s)', 'Prénom(s) (optionnel)', 'Date de naissance', 'Lieu de naissance', 'Nationalité', 'Série du BAC', "Année d'obtention", 'Sexe', 'Email', 'Téléphone', 'Adresse']
    const colWidths = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 28 }, { wch: 14 }, { wch: 25 }]
    const exemple = ['1', 'MOUANDA', 'Daniela', '10/05/2004', 'Brazzaville', 'Congolaise', 'D', '2022', 'F', 'daniela.mouanda@email.com', '074000001', 'Brazzaville']

    const usedSheetNames = new Set()
    const safeSegment = niveauCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'niveau'

    for (const f of sheetFilieres) {
      let base = String(f.code || f.nom || 'Filiere').trim() || 'Filiere'
      base = base.replace(/[\\/*?:\[\]]/g, '-')
      let sheetName = base.length > 31 ? base.substring(0, 31) : base
      let n = 2
      while (usedSheetNames.has(sheetName)) {
        const suffix = `_${n}`
        sheetName =
          base.length + suffix.length > 31
            ? base.substring(0, Math.max(1, 31 - suffix.length)) + suffix
            : base + suffix
        n++
      }
      usedSheetNames.add(sheetName)

      const ws = XLSX.utils.aoa_to_sheet([headers, exemple])
      ws['!cols'] = colWidths
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="modele_import_candidats_${safeSegment}.xlsx"`
    )
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return res.end(buffer)
  } catch (error) {
    console.error('Erreur lors de la génération du modèle Excel:', error)
    return res.status(500).json({ error: 'Erreur lors de la génération du modèle' })
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
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('*, etudiants (*)')
      .eq('id', id)
      .single()

    if (inscError || !inscription) {
      return res.status(404).json({
        success: false,
        error: 'Inscription introuvable'
      })
    }

    // Sauvegarder le document
    const documentUrl = await saveDocument(req.file, inscription.etudiant_id, type)

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
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('id', id)
      .single()

    if (inscError || !inscription) {
      return res.status(404).json({
        success: false,
        error: 'Inscription introuvable'
      })
    }

    // Supprimer le document
    const agentId = req.user?.id
    const { raison } = req.body || {}
    const result = await deleteInscriptionDocument(id, type, agentId, raison || 'Supprimé par la scolarité pour re-téléversement')

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

// Route pour créer un étudiant manuellement
router.post('/etudiants', authenticate, async (req, res) => {
  try {
    const agentId = req.user?.id
    if (!agentId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      })
    }

    const result = await creerEtudiantManuel(req.body, agentId)

    res.json({
      success: true,
      message: result.message,
      etudiant: result.etudiant,
      inscription: result.inscription
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'étudiant:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l\'étudiant'
    })
  }
})

// Route pour mettre à jour les informations de l'étudiant
router.put('/etudiants/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, email, telephone, adresse, nationalite } = req.body

    const updated = await updateEtudiantInfo(id, {
      nom,
      prenom,
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

    // Synchroniser avec la photo d'identité dans l'inscription
    const { data: inscription } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('etudiant_id', id)
      .order('date_inscription', { ascending: false })
      .limit(1)
      .single()

    if (inscription) {
      await supabaseAdmin
        .from('inscriptions')
        .update({ photo_identite: photoUrl })
        .eq('id', inscription.id)
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

// Route pour récupérer les notes de l'étudiant connecté
router.get('/etudiant/mes-notes', authenticate, async (req, res) => {
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
      notes: etudiant.grades || [],
      moyenneGenerale: etudiant.moyenneGenerale || 0,
      credits: etudiant.nbrCredits || 0,
      totalModules: etudiant.totalModules || 0,
      modulesValides: (etudiant.grades || []).filter(g => g.statut === 'Validé').length,
      semestre: etudiant.semestreActuel || ''
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des notes'
    })
  }
})

// Route pour supprimer un étudiant
router.delete('/etudiants/:id', authenticate, async (req, res) => {
  try {
    const { deleteEtudiant } = await import('../../src/services/scolarite/etudiantService.js')
    const { id } = req.params

    const result = await deleteEtudiant(id)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'étudiant:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression de l\'étudiant'
    })
  }
})

// =====================================================
// ROUTES POUR LE SYSTÈME DE VALIDATION DES DOCUMENTS
// =====================================================

import {
  getStudentDocuments,
  uploadStudentDocument,
  validateDocument,
  getPendingDocuments,
  DOCUMENT_TYPES
} from '../../src/services/scolarite/documentValidationService.js'
import { sendDocumentRejectionNotification } from '../../src/services/emailService.js'

// Configuration multer pour les documents d'étudiants
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max par document
  fileFilter: (req, file, cb) => {
    // Accepter seulement images et PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Type de fichier non autorisé. Seulement JPG, PNG et PDF sont acceptés.'))
    }
  }
})

// [ÉTUDIANT] Récupérer tous ses documents avec statuts
router.get('/student/documents/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const { getEtudiantByUserId } = await import('../../src/services/scolarite/etudiantService.js')

    // Récupérer l'étudiant via le service (avec synchronisation user_id si besoin)
    let etudiant;
    try {
      etudiant = await getEtudiantByUserId(userId)
    } catch (e) {
      return res.status(404).json({ error: 'Étudiant non trouvé' })
    }

    // Récupérer l'inscription active
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('etudiant_id', etudiant.id)
      .order('date_inscription', { ascending: false })
      .limit(1)
      .single()

    if (inscError || !inscription) {
      return res.status(404).json({ error: 'Aucune inscription trouvée' })
    }

    const result = await getStudentDocuments(etudiant.id, inscription.id)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur GET /student/documents/status:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' })
  }
})

// [ÉTUDIANT] Téléverser un document
router.post('/student/documents/upload', authenticate, documentUpload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id
    const { documentType } = req.body
    const { getEtudiantByUserId } = await import('../../src/services/scolarite/etudiantService.js')

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' })
    }

    if (!documentType || !Object.values(DOCUMENT_TYPES).includes(documentType)) {
      return res.status(400).json({ error: 'Type de document invalide' })
    }

    // Récupérer l'étudiant via le service (avec synchronisation user_id si besoin)
    let etudiant;
    try {
      etudiant = await getEtudiantByUserId(userId)
    } catch (e) {
      return res.status(404).json({ error: 'Étudiant non trouvé' })
    }

    // Récupérer l'inscription active
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('etudiant_id', etudiant.id)
      .order('date_inscription', { ascending: false })
      .limit(1)
      .single()

    if (inscError || !inscription) {
      return res.status(404).json({ error: 'Aucune inscription trouvée' })
    }

    const result = await uploadStudentDocument(etudiant.id, inscription.id, documentType, req.file)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur POST /student/documents/upload:', error)
    res.status(500).json({ error: 'Erreur lors du téléversement du document' })
  }
})

// [AGENT] Récupérer tous les documents en attente de validation
router.get('/agent/documents/pending', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un agent de scolarité
    const userRole = req.user.role_name
    if (!['SUPER_ADMIN', 'SCOLARITE'].includes(userRole)) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }

    const result = await getPendingDocuments()

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur GET /agent/documents/pending:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des documents en attente' })
  }
})

// [AGENT] Valider un document
router.post('/agent/documents/validate', authenticate, async (req, res) => {
  try {
    const { inscriptionId, documentType, statut, commentaire } = req.body
    const agentId = req.user.id

    // Vérifier que l'utilisateur est un agent de scolarité
    const userRole = req.user.role_name
    if (!['SUPER_ADMIN', 'SCOLARITE'].includes(userRole)) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }

    if (!inscriptionId || !documentType || !statut) {
      return res.status(400).json({ error: 'Paramètres manquants' })
    }

    const result = await validateDocument(inscriptionId, documentType, statut, agentId, commentaire)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    // Si le document est rejeté, envoyer un email à l'étudiant
    if (statut === 'REJETE' && result.data && result.data.etudiants) {
      const etudiant = result.data.etudiants
      const documentLabel = {
        PHOTO: 'Photo d\'identité',
        ACTE_NAISSANCE: 'Acte de naissance légalisé',
        ATTESTATION_BAC: 'Attestation et relevé légalisé BAC',
        PIECE_IDENTITE: 'Pièce d\'identité',
        QUITTANCE_PAIEMENT: 'Quittance de paiement'
      }[documentType]

      // Envoyer email en arrière-plan (fire-and-forget)
      sendDocumentRejectionNotification(
        etudiant,
        [{ label: documentLabel, commentaire }],
        etudiant.matricule
      ).catch(err => console.error('Erreur envoi email rejet:', err))
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur POST /agent/documents/validate:', error)
    res.status(500).json({ error: 'Erreur lors de la validation du document' })
  }
})

// [AGENT] Rejeter plusieurs documents en une fois
router.post('/agent/documents/reject-multiple', authenticate, async (req, res) => {
  try {
    const { inscriptionId, rejections } = req.body // rejections = [{ documentType, commentaire }]
    const agentId = req.user.id

    // Vérifier que l'utilisateur est un agent de scolarité
    const userRole = req.user.role_name
    if (!['SUPER_ADMIN', 'SCOLARITE'].includes(userRole)) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }

    if (!inscriptionId || !rejections || !Array.isArray(rejections) || rejections.length === 0) {
      return res.status(400).json({ error: 'Paramètres manquants ou invalides' })
    }

    const results = []
    let etudiantData = null

    for (const rejection of rejections) {
      const result = await validateDocument(
        inscriptionId,
        rejection.documentType,
        'REJETE',
        agentId,
        rejection.commentaire
      )
      results.push(result)

      // Garder les infos de l'étudiant pour l'email
      if (result.success && result.data && result.data.etudiants) {
        etudiantData = result.data.etudiants
      }
    }

    // Envoyer UN SEUL email avec tous les documents rejetés
    if (etudiantData) {
      const documentLabels = {
        PHOTO: 'Photo d\'identité',
        ACTE_NAISSANCE: 'Acte de naissance légalisé',
        ATTESTATION_BAC: 'Attestation et relevé légalisé BAC',
        PIECE_IDENTITE: 'Pièce d\'identité',
        QUITTANCE_PAIEMENT: 'Quittance de paiement'
      }

      const documentsRejetes = rejections.map(r => ({
        label: documentLabels[r.documentType],
        commentaire: r.commentaire
      }))

      sendDocumentRejectionNotification(
        etudiantData,
        documentsRejetes,
        etudiantData.matricule
      ).catch(err => console.error('Erreur envoi email rejet multiple:', err))
    }

    res.json({ success: true, results })
  } catch (error) {
    console.error('Erreur POST /agent/documents/reject-multiple:', error)
    res.status(500).json({ error: 'Erreur lors du rejet des documents' })
  }
})

export default router

