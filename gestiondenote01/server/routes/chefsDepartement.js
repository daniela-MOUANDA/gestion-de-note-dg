import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  createChefDepartement,
  getAllChefsDepartement,
  updateChefDepartement,
  deleteChefDepartement
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

