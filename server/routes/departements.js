import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getAllDepartements,
  createDepartement,
  updateDepartement,
  deleteDepartement
} from '../../src/services/departementService.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// Obtenir tous les départements
router.get('/', async (req, res) => {
  try {
    const result = await getAllDepartements()
    
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      departements: result.departements
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des départements'
    })
  }
})

// Créer un nouveau département
router.post('/', async (req, res) => {
  try {
    const { nom, code, description, actif } = req.body

    if (!nom || !code) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et le code sont obligatoires'
      })
    }

    const result = await createDepartement({ nom, code, description, actif })

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json({
      success: true,
      departement: result.departement,
      message: 'Département créé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création du département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la création du département'
    })
  }
})

// Mettre à jour un département
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nom, code, description, actif } = req.body

    if (!nom || !code) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et le code sont obligatoires'
      })
    }

    const result = await updateDepartement(id, { nom, code, description, actif })

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      departement: result.departement,
      message: 'Département mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du département'
    })
  }
})

// Supprimer un département
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await deleteDepartement(id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      message: result.message || 'Département supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la suppression du département'
    })
  }
})

export default router

