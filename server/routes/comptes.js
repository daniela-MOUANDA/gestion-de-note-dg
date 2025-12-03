import express from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import {
  createCompte,
  getAllComptes,
  updateCompte,
  deleteCompte,
  toggleActif
} from '../../src/services/compteService.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// Middleware personnalisé pour vérifier le rôle (CHEF_SERVICE_SCOLARITE ou CHEF_DEPARTEMENT)
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    })
  }

  // Permettre l'accès aux CHEF_SERVICE_SCOLARITE et CHEF_DEPARTEMENT
  const userRole = req.user.role
  console.log('Vérification du rôle pour la gestion des comptes. Rôle de l\'utilisateur:', userRole)
  
  if (userRole !== 'CHEF_SERVICE_SCOLARITE' && userRole !== 'CHEF_DEPARTEMENT') {
    console.log('Accès refusé. Rôle insuffisant:', userRole)
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Rôle insuffisant.'
    })
  }

  next()
})

// Obtenir tous les comptes
router.get('/', async (req, res) => {
  try {
    const result = await getAllComptes()
    
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      comptes: result.comptes
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des comptes'
    })
  }
})

// Créer un nouveau compte
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, email, username, password, role, actif } = req.body

    if (!nom || !prenom || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      })
    }

    const result = await createCompte(
      { nom, prenom, email, username, password, role, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json({
      success: true,
      compte: result.compte,
      message: 'Compte créé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la création du compte'
    })
  }
})

// Mettre à jour un compte
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, email, username, password, role, actif } = req.body

    const result = await updateCompte(
      id,
      { nom, prenom, email, username, password, role, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      compte: result.compte,
      message: 'Compte modifié avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du compte'
    })
  }
})

// Supprimer un compte
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await deleteCompte(id, req.user.id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la suppression du compte'
    })
  }
})

// Activer/Désactiver un compte
router.patch('/:id/toggle-actif', async (req, res) => {
  try {
    const { id } = req.params
    const { actif } = req.body

    if (typeof actif !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Le statut actif doit être un booléen'
      })
    }

    const result = await toggleActif(id, actif, req.user.id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      compte: result.compte,
      message: `Compte ${actif ? 'activé' : 'désactivé'} avec succès`
    })
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la modification du statut'
    })
  }
})

export default router

