import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise-changez-moi-en-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// Authentifier un utilisateur
export const authenticateUser = async (email, password) => {
  try {
    // Trouver l'utilisateur par email
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email }
    })

    if (!utilisateur) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      }
    }

    // Vérifier si le compte est actif
    if (!utilisateur.actif) {
      return {
        success: false,
        error: 'Votre compte a été désactivé. Contactez l\'administrateur.'
      }
    }

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(password, utilisateur.password)
    
    if (!passwordValid) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      }
    }

    // Mettre à jour la dernière connexion
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniereConnexion: new Date() }
    })

    // Créer un token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        username: utilisateur.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Enregistrer l'action dans l'audit
    await prisma.actionAudit.create({
      data: {
        utilisateurId: utilisateur.id,
        action: 'Connexion',
        details: `Connexion réussie - ${utilisateur.role}`,
        typeAction: 'CONNEXION',
        dateAction: new Date()
      }
    })

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      token,
      user: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: userWithoutPassword.role,
        actif: userWithoutPassword.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'authentification'
    }
  }
}

// Vérifier un token JWT
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        username: true,
        role: true,
        actif: true
      }
    })

    if (!utilisateur || !utilisateur.actif) {
      return {
        valid: false,
        error: 'Utilisateur introuvable ou compte désactivé'
      }
    }

    return {
      valid: true,
      user: utilisateur
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        error: 'Token expiré'
      }
    }
    return {
      valid: false,
      error: 'Token invalide'
    }
  }
}

// Déconnexion (enregistrer dans l'audit)
export const logoutUser = async (userId) => {
  try {
    await prisma.actionAudit.create({
      data: {
        utilisateurId: userId,
        action: 'Déconnexion',
        details: 'Déconnexion réussie',
        typeAction: 'DECONNEXION',
        dateAction: new Date()
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return {
      success: false,
      error: 'Erreur lors de la déconnexion'
    }
  }
}

// Obtenir les informations d'un utilisateur par ID
export const getUserById = async (userId) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        username: true,
        role: true,
        actif: true,
        dateCreation: true,
        derniereConnexion: true
      }
    })

    return utilisateur
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

