import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticateUser, verifyToken, logoutUser, getUserById, changePassword, updateUserPhoto } from '../../src/services/authService.js'

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG, GIF, WEBP) sont autorisées'))
    }
  }
})

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Le fichier est trop volumineux (maximum 5MB)'
      })
    }
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }
  next()
}

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

// Route pour changer le mot de passe
router.post('/change-password', async (req, res) => {
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
        error: 'Token invalide'
      })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe actuel et le nouveau mot de passe sont requis'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      })
    }

    const changeResult = await changePassword(result.user.id, currentPassword, newPassword)

    if (!changeResult.success) {
      return res.status(400).json(changeResult)
    }

    res.json(changeResult)
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors du changement de mot de passe'
    })
  }
})

// Route pour uploader la photo de profil
router.post('/upload-photo', upload.single('photo'), handleMulterError, async (req, res) => {
  let uploadedFile = null
  try {
    const authHeader = req.headers.authorization
    console.log('Authorization header:', authHeader ? 'Présent' : 'Manquant')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    console.log('Token extrait:', token ? 'Présent' : 'Manquant', token ? `(${token.length} caractères)` : '')

    const result = await verifyToken(token)

    if (!result.valid) {
      console.error('Erreur de vérification du token:', result.error)
      return res.status(401).json({
        success: false,
        error: result.error || 'Token invalide'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    uploadedFile = req.file

    // Construire l'URL de la photo
    const photoUrl = `/uploads/profiles/${req.file.filename}`

    // Mettre à jour la photo de l'utilisateur
    const updateResult = await updateUserPhoto(result.user.id, photoUrl)

    if (!updateResult.success) {
      // Supprimer le fichier si la mise à jour échoue
      if (uploadedFile && uploadedFile.path) {
        try {
          fs.unlinkSync(uploadedFile.path)
        } catch (unlinkError) {
          console.error('Erreur lors de la suppression du fichier:', unlinkError)
        }
      }
      return res.status(400).json(updateResult)
    }

    res.json({
      success: true,
      photoUrl: photoUrl,
      message: 'Photo de profil mise à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error)
    // Supprimer le fichier en cas d'erreur
    if (uploadedFile && uploadedFile.path) {
      try {
        fs.unlinkSync(uploadedFile.path)
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression du fichier:', unlinkError)
      }
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Une erreur est survenue lors de l\'upload de la photo'
    })
  }
})

export default router

