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

    const userRole = req.user.role
    // Normaliser le rôle pour la comparaison (enlever les espaces, mettre en majuscules)
    const normalizedUserRole = userRole?.trim().toUpperCase()
    const normalizedRoles = roles.map(r => r?.trim().toUpperCase())
    
    if (!normalizedRoles.includes(normalizedUserRole)) {
      console.log('Accès refusé par requireRole. Rôle utilisateur:', normalizedUserRole, 'Rôles autorisés:', normalizedRoles)
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Rôle insuffisant.'
      })
    }

    next()
  }
}

/** Rôles autorisés sur les routes « chef département » (API + saisie) : chef ou coordinateur pédagogique */
export const ROLES_DEPARTEMENT_PEDAGOGIQUE = ['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']

export const requireChefOuCoordinateurDepartement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    })
  }
  const code = req.user.role?.trim().toUpperCase()
  if (!ROLES_DEPARTEMENT_PEDAGOGIQUE.includes(code)) {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé au chef ou au coordinateur pédagogique du département.'
    })
  }
  next()
}

