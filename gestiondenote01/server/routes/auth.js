import express from 'express'
import { authenticateUser, verifyToken, logoutUser, getUserById } from '../../src/services/authService.js'

const router = express.Router()

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe sont requis'
      })
    }

    const result = await authenticateUser(email, password)

    if (!result.success) {
      return res.status(401).json(result)
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user
    })
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la connexion'
    })
  }
})

// Route de vérification du token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        valid: false,
        error: 'Token manquant'
      })
    }

    const result = await verifyToken(token)

    if (!result.valid) {
      return res.status(401).json(result)
    }

    res.json({
      valid: true,
      user: result.user
    })
  } catch (error) {
    console.error('Erreur lors de la vérification:', error)
    res.status(500).json({
      valid: false,
      error: 'Erreur lors de la vérification du token'
    })
  }
})

// Route de déconnexion
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      const { verifyToken } = await import('../../src/services/authService.js')
      const result = await verifyToken(token)
      
      if (result.valid) {
        await logoutUser(result.user.id)
      }
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    })
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déconnexion'
    })
  }
})

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      })
    }

    const result = await verifyToken(token)

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error
      })
    }

    const user = await getUserById(result.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'utilisateur'
    })
  }
})

export default router

