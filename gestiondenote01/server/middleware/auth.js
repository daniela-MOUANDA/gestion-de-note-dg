import { verifyToken } from '../../src/services/authService.js'

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      })
    }

    const result = await verifyToken(token)

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error
      })
    }

    // Ajouter l'utilisateur à la requête
    req.user = result.user
    next()
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de l\'authentification'
    })
  }
}

// Middleware pour vérifier le rôle
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle insuffisant.'
      })
    }

    next()
  }
}

