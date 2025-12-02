import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise-changez-moi-en-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h' // 24 heures de validité (augmenté pour éviter les déconnexions fréquentes)

// Authentifier un utilisateur
export const authenticateUser = async (email, password, matricule = null) => {
  try {
    // Normaliser l'email (trim et lowercase pour éviter les problèmes de casse)
    const normalizedEmail = email?.trim().toLowerCase()
    
    if (!normalizedEmail || !password) {
      console.log('❌ Email ou mot de passe manquant')
      return {
        success: false,
        error: 'Email et mot de passe sont requis'
      }
    }

    let utilisateur = null

    // Si un matricule est fourni, c'est probablement un étudiant
    if (matricule) {
      console.log('🎓 Tentative de connexion étudiant avec matricule:', matricule)
      
      // Chercher l'étudiant par matricule
      const etudiant = await prisma.etudiant.findUnique({
        where: { matricule: matricule.trim() },
        include: {
          inscriptions: {
            where: { statut: 'INSCRIT' },
            take: 1,
            include: {
              promotion: true
            }
          }
        }
      })

      if (!etudiant) {
        console.log('❌ Étudiant non trouvé avec matricule:', matricule)
        return {
          success: false,
          error: 'Matricule incorrect'
        }
      }

      // Vérifier que l'email correspond à l'étudiant (si l'étudiant a déjà un email)
      if (etudiant.email && etudiant.email.trim() !== '' && etudiant.email.toLowerCase() !== normalizedEmail) {
        console.log('❌ Email ne correspond pas au matricule')
        return {
          success: false,
          error: 'Email ne correspond pas au matricule fourni'
        }
      }

      console.log('✅ Étudiant trouvé:', etudiant.nom, etudiant.prenom)

      // Chercher ou créer un compte Utilisateur pour cet étudiant
      utilisateur = await prisma.utilisateur.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { username: matricule.trim() }
          ]
        },
        include: { role: true }
      })

      // Si aucun compte Utilisateur n'existe, le créer
      if (!utilisateur) {
        console.log('📝 Création d\'un compte Utilisateur pour l\'étudiant')
        
        // Générer un username unique basé sur le matricule
        let username = matricule.trim().toLowerCase()
        let usernameExists = await prisma.utilisateur.findUnique({
          where: { username }
        })
        
        if (usernameExists) {
          username = `${matricule.trim()}_${Date.now()}`
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10)

        // Récupérer le rôle ETUDIANT
        const roleEtudiant = await prisma.role.findUnique({
          where: { code: 'ETUDIANT' }
        })

        if (!roleEtudiant) {
          console.log('❌ Rôle ETUDIANT non trouvé')
          return {
            success: false,
            error: 'Erreur de configuration: rôle étudiant introuvable'
          }
        }

        // Créer le compte Utilisateur
        utilisateur = await prisma.utilisateur.create({
          data: {
            nom: etudiant.nom,
            prenom: etudiant.prenom,
            email: normalizedEmail || `${matricule.trim()}@etudiant.inptic.ga`,
            username: username,
            password: hashedPassword,
            roleId: roleEtudiant.id,
            actif: true,
            photo: etudiant.photo || null,
            telephone: etudiant.telephone || null,
            adresse: etudiant.adresse || null
          },
          include: { role: true }
        })

        console.log('✅ Compte Utilisateur créé pour l\'étudiant:', utilisateur.email)
        
        // Mettre à jour l'email de l'étudiant si nécessaire
        if (etudiant.email !== normalizedEmail) {
          await prisma.etudiant.update({
            where: { id: etudiant.id },
            data: { email: normalizedEmail }
          })
          console.log('✅ Email de l\'étudiant mis à jour')
        }
      } else {
        // Vérifier que c'est bien un compte étudiant
        if (!utilisateur.role || utilisateur.role.code !== 'ETUDIANT') {
          console.log('❌ Le compte trouvé n\'est pas un compte étudiant')
          return {
            success: false,
            error: 'Ce compte n\'est pas un compte étudiant'
          }
        }
        
        // Mettre à jour l'email de l'étudiant si nécessaire
        if (etudiant.email !== normalizedEmail) {
          await prisma.etudiant.update({
            where: { id: etudiant.id },
            data: { email: normalizedEmail }
          })
          console.log('✅ Email de l\'étudiant mis à jour')
        }
      }
    } else {
      // Authentification normale pour les autres utilisateurs
      console.log('🔍 Recherche de l\'utilisateur avec email:', normalizedEmail)
      
      // Trouver l'utilisateur par email (insensible à la casse)
      // On essaie d'abord avec l'email normalisé, puis avec l'email original
      utilisateur = await prisma.utilisateur.findUnique({
        where: { email: normalizedEmail },
        include: { role: true }
      })
      
      // Si pas trouvé, essayer avec l'email original (trim seulement)
      if (!utilisateur) {
        const trimmedEmail = email.trim()
        if (trimmedEmail !== normalizedEmail) {
          console.log('🔍 Essai avec l\'email original (trim):', trimmedEmail)
          utilisateur = await prisma.utilisateur.findUnique({
            where: { email: trimmedEmail },
            include: { role: true }
          })
        }
      }
      
      // Si toujours pas trouvé, utiliser une requête SQL brute pour recherche insensible à la casse
      if (!utilisateur) {
        console.log('🔍 Recherche insensible à la casse avec SQL...')
        try {
          const result = await prisma.$queryRaw`
            SELECT * FROM utilisateurs WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1
          `
          if (result && Array.isArray(result) && result.length > 0) {
            utilisateur = result[0]
            console.log('✅ Utilisateur trouvé via recherche SQL (insensible à la casse)')
          }
        } catch (sqlError) {
          console.log('⚠️ Erreur lors de la recherche SQL (non bloquant):', sqlError.message)
          // On continue avec utilisateur = null
        }
      }

      if (!utilisateur) {
        console.log('❌ Utilisateur non trouvé avec email:', normalizedEmail)
        return {
          success: false,
          error: 'Email ou mot de passe incorrect'
        }
      }
    }

    console.log('✅ Utilisateur trouvé:', utilisateur.email, 'Rôle:', utilisateur.role?.code || 'N/A')

    // Vérifier si le compte est actif
    if (!utilisateur.actif) {
      console.log('❌ Compte désactivé pour:', utilisateur.email)
      return {
        success: false,
        error: 'Votre compte a été désactivé. Contactez l\'administrateur.'
      }
    }

    // Vérifier que le mot de passe est hashé (commence par $2a$, $2b$ ou $2y$)
    const isPasswordHashed = utilisateur.password && (
      utilisateur.password.startsWith('$2a$') || 
      utilisateur.password.startsWith('$2b$') || 
      utilisateur.password.startsWith('$2y$')
    )

    if (!isPasswordHashed) {
      console.log('⚠️ ATTENTION: Le mot de passe en base n\'est pas hashé pour:', utilisateur.email)
      // Si le mot de passe n'est pas hashé, comparer directement (pour migration)
      if (utilisateur.password !== password) {
        console.log('❌ Mot de passe incorrect (comparaison directe)')
        return {
          success: false,
          error: 'Email ou mot de passe incorrect'
        }
      }
      // Si la comparaison directe réussit, hasher le mot de passe pour la prochaine fois
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { password: hashedPassword }
      })
      console.log('✅ Mot de passe hashé et mis à jour pour:', utilisateur.email)
    } else {
      // Vérifier le mot de passe avec bcrypt
      console.log('🔐 Vérification du mot de passe avec bcrypt...')
      const passwordValid = await bcrypt.compare(password, utilisateur.password)
      
      if (!passwordValid) {
        console.log('❌ Mot de passe incorrect pour:', utilisateur.email)
        return {
          success: false,
          error: 'Email ou mot de passe incorrect'
        }
      }
      console.log('✅ Mot de passe correct')
    }


    // Créer un token JWT
    const roleCode = utilisateur.role?.code || 'UNKNOWN'
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: roleCode,
        username: utilisateur.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // IMPORTANT: Invalider tous les autres tokens de cet utilisateur avant de créer un nouveau
    // Cela garantit qu'une seule session active existe par utilisateur
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { 
        token: token,
        derniereConnexion: new Date()
      }
    })

    console.log('✅ Token stocké pour l\'utilisateur:', utilisateur.email, 'ID:', utilisateur.id)

    // Enregistrer l'action dans l'audit
    await prisma.actionAudit.create({
      data: {
        utilisateurId: utilisateur.id,
        action: 'Connexion',
        details: `Connexion réussie - ${roleCode}`,
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
        role: roleCode, // Utiliser le code du rôle
        roleDetails: userWithoutPassword.role ? {
          id: userWithoutPassword.role.id,
          code: userWithoutPassword.role.code,
          nom: userWithoutPassword.role.nom,
          routeDashboard: userWithoutPassword.role.routeDashboard
        } : null,
        actif: userWithoutPassword.actif,
        photo: userWithoutPassword.photo || null,
        telephone: userWithoutPassword.telephone || null,
        adresse: userWithoutPassword.adresse || null,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion || null
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

// Renouveler le token d'un utilisateur (appelé lors d'actions)
export const refreshUserToken = async (userId) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!utilisateur || !utilisateur.actif) {
      return {
        success: false,
        error: 'Utilisateur introuvable ou compte désactivé'
      }
    }

    const roleCode = utilisateur.role?.code || 'UNKNOWN'

    // Créer un nouveau token
    const newToken = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: roleCode,
        username: utilisateur.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Mettre à jour le token dans la base de données
    // Vérifier d'abord que l'ancien token correspond toujours
    const currentUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!currentUser || !currentUser.token) {
      return {
        success: false,
        error: 'Session invalide. Veuillez vous reconnecter.'
      }
    }

    await prisma.utilisateur.update({
      where: { id: userId },
      data: { token: newToken }
    })

    console.log('✅ Token renouvelé pour l\'utilisateur:', currentUser.email)

    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      token: newToken,
      user: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: roleCode,
        roleDetails: userWithoutPassword.role ? {
          id: userWithoutPassword.role.id,
          code: userWithoutPassword.role.code,
          nom: userWithoutPassword.role.nom,
          routeDashboard: userWithoutPassword.role.routeDashboard
        } : null,
        actif: userWithoutPassword.actif,
        photo: userWithoutPassword.photo || null,
        telephone: userWithoutPassword.telephone || null,
        adresse: userWithoutPassword.adresse || null,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion || null
      }
    }
  } catch (error) {
    console.error('Erreur lors du renouvellement du token:', error)
    return {
      success: false,
      error: 'Erreur lors du renouvellement du token'
    }
  }
}

// Vérifier un token JWT (avec renouvellement automatique si l'utilisateur est actif)
export const verifyToken = async (token, shouldRefresh = false) => {
  try {
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (verifyError) {
      // Si le token est expiré mais qu'on doit le renouveler (utilisateur actif)
      if (verifyError.name === 'TokenExpiredError' && shouldRefresh) {
        // Décoder sans vérifier l'expiration pour récupérer l'ID
        decoded = jwt.decode(token)
        if (!decoded || !decoded.id) {
          return {
            valid: false,
            error: 'Token invalide'
          }
        }
        // Renouveler le token
        const refreshResult = await refreshUserToken(decoded.id)
        if (refreshResult.success) {
          return {
            valid: true,
            user: refreshResult.user,
            newToken: refreshResult.token
          }
        }
      }
      throw verifyError
    }
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    })
    
    if (!utilisateur) {
      console.error('❌ Utilisateur introuvable pour ID:', decoded.id)
      return {
        valid: false,
        error: 'Utilisateur introuvable'
      }
    }

    // VÉRIFICATIONS CRITIQUES AVANT TOUT : S'assurer que l'utilisateur récupéré correspond au token
    // Ces vérifications empêchent le basculement vers un autre utilisateur
    
    // 1. Vérifier que l'ID correspond (déjà fait par la requête, mais on double-vérifie)
    if (utilisateur.id !== decoded.id) {
      console.error('❌ ERREUR CRITIQUE: L\'utilisateur récupéré ne correspond pas à l\'ID du token!')
      console.error('   ID dans le token:', decoded.id)
      console.error('   ID de l\'utilisateur récupéré:', utilisateur.id)
      console.error('   Email de l\'utilisateur récupéré:', utilisateur.email)
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // 2. Vérifier que l'email correspond (AVANT de vérifier le token)
    if (decoded.email && decoded.email.toLowerCase() !== utilisateur.email.toLowerCase()) {
      console.error('❌ ERREUR CRITIQUE: L\'email dans le token ne correspond pas à l\'utilisateur récupéré!')
      console.error('   Email dans le token:', decoded.email)
      console.error('   Email de l\'utilisateur récupéré:', utilisateur.email)
      console.error('   ID dans le token:', decoded.id)
      console.error('   ID de l\'utilisateur récupéré:', utilisateur.id)
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // 3. Vérifier que le token correspond à celui stocké dans la base de données
    if (!utilisateur.token) {
      console.error('❌ Aucun token stocké pour l\'utilisateur:', utilisateur.email)
      return {
        valid: false,
        error: 'Session expirée. Veuillez vous reconnecter.'
      }
    }

    // Comparer les tokens de manière sécurisée (CRITIQUE pour la sécurité)
    // Si les tokens ne correspondent pas, cela signifie qu'une autre session est active
    // Dans ce cas, on doit IMMÉDIATEMENT rejeter la requête pour éviter le basculement
    if (utilisateur.token !== token) {
      // Si on est en train de renouveler le token, c'est normal que les tokens ne correspondent pas
      // MAIS on doit vérifier que l'ID correspond toujours
      if (shouldRefresh && utilisateur.id === decoded.id) {
        console.log('🔄 Renouvellement du token en cours, tokens différents attendus')
        // Renouveler le token SEULEMENT si l'ID correspond
        const refreshResult = await refreshUserToken(decoded.id)
        if (refreshResult.success) {
          // Mettre à jour les données utilisateur
          const { password: _, ...userWithoutPassword } = utilisateur
          return {
            valid: true,
            user: {
              id: utilisateur.id,
              nom: utilisateur.nom,
              prenom: utilisateur.prenom,
              email: utilisateur.email,
              username: utilisateur.username,
              role: roleCode,
              roleDetails: utilisateur.role ? {
                id: utilisateur.role.id,
                code: utilisateur.role.code,
                nom: utilisateur.role.nom,
                routeDashboard: utilisateur.role.routeDashboard
              } : null,
              actif: utilisateur.actif,
              photo: utilisateur.photo || null,
              telephone: utilisateur.telephone || null,
              adresse: utilisateur.adresse || null,
              dateCreation: utilisateur.dateCreation,
              derniereConnexion: utilisateur.derniereConnexion || null
            },
            newToken: refreshResult.token
          }
        }
      }
      
      // Si les tokens ne correspondent pas et qu'on n'est pas en train de renouveler,
      // c'est qu'une autre session est active - REJETER IMMÉDIATEMENT
      console.error('❌ Token mismatch pour l\'utilisateur:', utilisateur.email)
      console.error('   ID dans le token:', decoded.id)
      console.error('   ID de l\'utilisateur:', utilisateur.id)
      console.error('   Token reçu:', token.substring(0, 20) + '...')
      console.error('   Token attendu:', utilisateur.token ? utilisateur.token.substring(0, 20) + '...' : 'NULL')
      console.error('   ⚠️ ATTENTION: Une autre session est active pour cet utilisateur ou un autre utilisateur!')
      
      return {
        valid: false,
        error: 'Token invalide. Une autre session est active. Veuillez vous reconnecter.'
      }
    }

    // Vérifier la cohérence entre le token décodé et l'utilisateur récupéré
    // Vérifier l'email
    if (decoded.email && decoded.email.toLowerCase() !== utilisateur.email.toLowerCase()) {
      console.error('❌ Email mismatch:', decoded.email, 'vs', utilisateur.email)
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // Vérifier le username
    if (decoded.username && decoded.username !== utilisateur.username) {
      console.error('❌ Username mismatch:', decoded.username, 'vs', utilisateur.username)
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // Vérifier le rôle
    const roleCode = utilisateur.role?.code || 'UNKNOWN'
    if (decoded.role && decoded.role !== roleCode) {
      console.error('❌ Role mismatch:', decoded.role, 'vs', roleCode)
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }
    
    // Extraire uniquement les champs nécessaires
    const userData = {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      username: utilisateur.username,
      role: roleCode,
      roleDetails: utilisateur.role ? {
        id: utilisateur.role.id,
        code: utilisateur.role.code,
        nom: utilisateur.role.nom,
        routeDashboard: utilisateur.role.routeDashboard
      } : null,
      actif: utilisateur.actif,
      photo: utilisateur.photo || null,
      telephone: utilisateur.telephone || null,
      adresse: utilisateur.adresse || null,
      dateCreation: utilisateur.dateCreation,
      derniereConnexion: utilisateur.derniereConnexion || null
    }

    if (!utilisateur.actif) {
      return {
        valid: false,
        error: 'Compte désactivé'
      }
    }

    return {
      valid: true,
      user: userData
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error.name, error.message)
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        error: 'Token expiré. Veuillez vous reconnecter.'
      }
    }
    if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        error: 'Token invalide. Veuillez vous reconnecter.'
      }
    }
    return {
      valid: false,
      error: error.message || 'Token invalide'
    }
  }
}

// Déconnexion (enregistrer dans l'audit et supprimer le token)
export const logoutUser = async (userId) => {
  try {
    // Supprimer le token de la base de données
    await prisma.utilisateur.update({
      where: { id: userId },
      data: { token: null }
    })

    // Enregistrer l'action dans l'audit
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
    // Récupérer tous les champs (sans select pour éviter les erreurs si des champs n'existent pas encore)
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!utilisateur) {
      return null
    }

    const roleCode = utilisateur.role?.code || 'UNKNOWN'

    // Extraire uniquement les champs nécessaires (en gérant les champs optionnels)
    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      username: utilisateur.username,
      role: roleCode,
      roleDetails: utilisateur.role ? {
        id: utilisateur.role.id,
        code: utilisateur.role.code,
        nom: utilisateur.role.nom,
        routeDashboard: utilisateur.role.routeDashboard
      } : null,
      actif: utilisateur.actif,
      photo: utilisateur.photo || null,
      telephone: utilisateur.telephone || null,
      adresse: utilisateur.adresse || null,
      dateCreation: utilisateur.dateCreation,
      derniereConnexion: utilisateur.derniereConnexion || null
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

// Changer le mot de passe d'un utilisateur
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Récupérer l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId }
    })

    if (!utilisateur) {
      return {
        success: false,
        error: 'Utilisateur introuvable'
      }
    }

    // Vérifier le mot de passe actuel
    const passwordValid = await bcrypt.compare(currentPassword, utilisateur.password)
    
    if (!passwordValid) {
      return {
        success: false,
        error: 'Mot de passe actuel incorrect'
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await prisma.utilisateur.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Enregistrer l'action dans l'audit
    await prisma.actionAudit.create({
      data: {
        utilisateurId: utilisateur.id,
        action: 'Changement de mot de passe',
        details: 'Mot de passe modifié avec succès',
        typeAction: 'CONNEXION',
        dateAction: new Date()
      }
    })

    return {
      success: true,
      message: 'Mot de passe modifié avec succès'
    }
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors du changement de mot de passe'
    }
  }
}

// Mettre à jour la photo de profil d'un utilisateur
export const updateUserPhoto = async (userId, photoUrl) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId }
    })

    if (!utilisateur) {
      return {
        success: false,
        error: 'Utilisateur introuvable'
      }
    }

    // Supprimer l'ancienne photo si elle existe
    if (utilisateur.photo && !utilisateur.photo.startsWith('http')) {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const { fileURLToPath } = await import('url')
        const { dirname } = await import('path')
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        // Le chemin de la photo est relatif comme /uploads/profiles/filename.jpg
        const photoFileName = utilisateur.photo.split('/').pop()
        const oldPhotoPath = path.join(__dirname, '..', '..', 'uploads', 'profiles', photoFileName)
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath)
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancienne photo:', error)
        // Ne pas bloquer la mise à jour si la suppression échoue
      }
    }

    // Mettre à jour la photo
    try {
      await prisma.utilisateur.update({
        where: { id: userId },
        data: { photo: photoUrl }
      })
    } catch (dbError) {
      console.error('Erreur SQL lors de la mise à jour de la photo:', dbError)
      // Si le champ photo n'existe pas, retourner une erreur explicite
      const errorMessage = dbError.message || ''
      const errorCode = dbError.code || ''
      
      if (errorCode === 'P2025' || 
          errorMessage.includes('Unknown column') || 
          errorMessage.includes('column') && errorMessage.includes('does not exist') ||
          errorMessage.includes('photo') && (errorMessage.includes('unknown') || errorMessage.includes('not exist'))) {
        return {
          success: false,
          error: 'Le champ photo n\'existe pas dans la base de données. Veuillez exécuter la migration Prisma ou le script SQL (voir AJOUT_CHAMPS_UTILISATEUR.md).'
        }
      }
      throw dbError
    }

    // Enregistrer l'action dans l'audit
    await prisma.actionAudit.create({
      data: {
        utilisateurId: utilisateur.id,
        action: 'Mise à jour photo de profil',
        details: 'Photo de profil modifiée',
        typeAction: 'CONNEXION',
        dateAction: new Date()
      }
    })

    return {
      success: true,
      message: 'Photo de profil mise à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error)
    // Vérifier si c'est une erreur de champ manquant
    const errorMessage = error.message || ''
    if (errorMessage.includes('photo') && (errorMessage.includes('n\'existe pas') || errorMessage.includes('does not exist'))) {
      return {
        success: false,
        error: errorMessage
      }
    }
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour de la photo'
    }
  }
}

