import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  createChefDepartement,
  getAllChefsDepartement,
  updateChefDepartement,
  deleteChefDepartement,
  getDepartementEnseignants,
  getDepartementModules,
  getDepartementClasses,
  getDepartementFilieres,
  getDepartementStatsGlobales,
  getEtudiantsPourRepartition,
  createClassesFromRepartition,
  getNiveaux,
  getEtudiantsByClasse
} from '../../src/services/chefDepartementService.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// Middleware pour vérifier que l'utilisateur est un DEP (ADMIN ou un rôle spécifique)
// Pour l'instant, on accepte tous les utilisateurs authentifiés
// Vous pouvez ajouter une vérification de rôle spécifique ici
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    })
  }
  next()
})

// ============================================
// ROUTES DASHBOARD CHEF DEPARTEMENT
// ============================================

router.get('/enseignants', async (req, res) => {
  try {
    // Note: req.user.departementId vient du middleware authenticate
    // Si c'est un admin qui consulte, il faudrait peut-être passer l'ID en paramètre ?
    // Pour l'instant on suppose que c'est le chef connecté qui consulte SON département
    const departementId = req.user.departementId

    if (!departementId) {
      // Si c'est un admin, on autorise peut-être? Non, dashboard chef.
      return res.status(403).json({ success: false, error: "Aucun département associé à votre compte" });
    }

    const result = await getDepartementEnseignants(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/modules', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementModules(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/classes', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementClasses(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/filieres', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementFilieres(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementStatsGlobales(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/repartition/count', async (req, res) => {
  try {
    // Query params: filiereId, niveauId
    const { filiereId, niveauId } = req.query
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getEtudiantsPourRepartition(departementId, filiereId, niveauId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/repartition/create', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await createClassesFromRepartition(req.body)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/niveaux', async (req, res) => {
  try {
    const result = await getNiveaux()
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    return { success: false, error: error.message }
  }
})

router.get('/repartition/classes/:id/etudiants', async (req, res) => {
  try {
    const { id } = req.params
    const result = await getEtudiantsByClasse(id)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// ROUTES ADMINISTRATION (CRUD CHEFS)
// ============================================

// Obtenir tous les chefs de département
router.get('/', async (req, res) => {
  try {
    const result = await getAllChefsDepartement()

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      chefs: result.chefs
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des chefs de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des chefs de département'
    })
  }
})

// Créer un nouveau chef de département
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = req.body

    if (!nom || !prenom || !email || !departementId || !motDePasse) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      })
    }

    const result = await createChefDepartement(
      { nom, prenom, email, telephone, departementId, motDePasse, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json({
      success: true,
      chef: result.chef,
      message: 'Chef de département créé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la création du chef de département'
    })
  }
})

// Mettre à jour un chef de département
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = req.body

    const result = await updateChefDepartement(
      id,
      { nom, prenom, email, telephone, departementId, motDePasse, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      chef: result.chef,
      message: 'Chef de département modifié avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du chef de département'
    })
  }
})

// Supprimer un chef de département
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await deleteChefDepartement(id, req.user.id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      message: 'Chef de département supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la suppression du chef de département'
    })
  }
})

export default router

