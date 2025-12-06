import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase.js'

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
      const { data: etudiant, error: etudiantError } = await supabaseAdmin
        .from('etudiants')
        .select(`
          *,
          inscriptions!inner (
            *,
            promotions (*)
          )
        `)
        .eq('matricule', matricule.trim())
        .eq('inscriptions.statut', 'INSCRIT')
        .single()

      if (etudiantError || !etudiant) {
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
      const { data: existingUser, error: userSearchError } = await supabaseAdmin
        .from('utilisateurs')
        .select('*, roles (*)')
        .or(`email.eq.${normalizedEmail},username.eq.${matricule.trim()}`)
        .single()

      utilisateur = existingUser

      // Si aucun compte Utilisateur n'existe, le créer
      if (!utilisateur) {
        console.log('📝 Création d\'un compte Utilisateur pour l\'étudiant')
        
        // Générer un username unique basé sur le matricule
        let username = matricule.trim().toLowerCase()
        const { data: usernameExists } = await supabaseAdmin
          .from('utilisateurs')
          .select('id')
          .eq('username', username)
          .single()
        
        if (usernameExists) {
          username = `${matricule.trim()}_${Date.now()}`
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10)

        // Récupérer le rôle ETUDIANT
        const { data: roleEtudiant, error: roleError } = await supabaseAdmin
          .from('roles')
          .select('*')
          .eq('code', 'ETUDIANT')
          .single()

        if (roleError || !roleEtudiant) {
          console.log('❌ Rôle ETUDIANT non trouvé')
          return {
            success: false,
            error: 'Erreur de configuration: rôle étudiant introuvable'
          }
        }

        // Créer le compte Utilisateur
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('utilisateurs')
          .insert({
            nom: etudiant.nom,
            prenom: etudiant.prenom,
            email: normalizedEmail || `${matricule.trim()}@etudiant.inptic.ga`,
            username: username,
            password: hashedPassword,
            role_id: roleEtudiant.id,
            actif: true,
            photo: etudiant.photo || null,
            telephone: etudiant.telephone || null,
            adresse: etudiant.adresse || null
          })
          .select('*, roles (*)')
          .single()

        if (createError) {
          console.error('❌ Erreur lors de la création du compte:', createError)
          return {
            success: false,
            error: 'Erreur lors de la création du compte'
          }
        }

        utilisateur = newUser
        console.log('✅ Compte Utilisateur créé pour l\'étudiant:', utilisateur.email)
        
        // Mettre à jour l'email de l'étudiant si nécessaire
        if (etudiant.email !== normalizedEmail) {
          await supabaseAdmin
            .from('etudiants')
            .update({ email: normalizedEmail })
            .eq('id', etudiant.id)
          console.log('✅ Email de l\'étudiant mis à jour')
        }
      } else {
        // Vérifier que c'est bien un compte étudiant
        if (!utilisateur.roles || utilisateur.roles.code !== 'ETUDIANT') {
          console.log('❌ Le compte trouvé n\'est pas un compte étudiant')
          return {
            success: false,
            error: 'Ce compte n\'est pas un compte étudiant'
          }
        }
        
        // Mettre à jour l'email de l'étudiant si nécessaire
        if (etudiant.email !== normalizedEmail) {
          await supabaseAdmin
            .from('etudiants')
            .update({ email: normalizedEmail })
            .eq('id', etudiant.id)
          console.log('✅ Email de l\'étudiant mis à jour')
        }
      }
    } else {
      // Authentification normale pour les autres utilisateurs
      console.log('🔍 Recherche de l\'utilisateur avec email:', normalizedEmail)
      
      // Trouver l'utilisateur par email
      const { data: user, error: userError } = await supabaseAdmin
        .from('utilisateurs')
        .select('*, roles (*)')
        .ilike('email', normalizedEmail)
        .single()

      if (userError || !user) {
        console.log('❌ Utilisateur non trouvé avec email:', normalizedEmail)
        return {
          success: false,
          error: 'Email ou mot de passe incorrect'
        }
      }

      utilisateur = user
    }

    console.log('✅ Utilisateur trouvé:', utilisateur.email, 'Rôle:', utilisateur.roles?.code || 'N/A')

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
      await supabaseAdmin
        .from('utilisateurs')
        .update({ password: hashedPassword })
        .eq('id', utilisateur.id)
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
    const roleCode = utilisateur.roles?.code || 'UNKNOWN'
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
    await supabaseAdmin
      .from('utilisateurs')
      .update({ 
        token: token,
        derniere_connexion: new Date().toISOString()
      })
      .eq('id', utilisateur.id)

    console.log('✅ Token stocké pour l\'utilisateur:', utilisateur.email, 'ID:', utilisateur.id)

    // Enregistrer l'action dans l'audit
    await supabaseAdmin
      .from('actions_audit')
      .insert({
        utilisateur_id: utilisateur.id,
        action: 'Connexion',
        details: `Connexion réussie - ${roleCode}`,
        type_action: 'CONNEXION',
        date_action: new Date().toISOString()
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
        roleDetails: userWithoutPassword.roles ? {
          id: userWithoutPassword.roles.id,
          code: userWithoutPassword.roles.code,
          nom: userWithoutPassword.roles.nom,
          routeDashboard: userWithoutPassword.roles.route_dashboard
        } : null,
        actif: userWithoutPassword.actif,
        photo: userWithoutPassword.photo || null,
        telephone: userWithoutPassword.telephone || null,
        adresse: userWithoutPassword.adresse || null,
        departementId: userWithoutPassword.departement_id || null,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion || null
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
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .eq('id', userId)
      .single()

    if (error || !utilisateur || !utilisateur.actif) {
      return {
        success: false,
        error: 'Utilisateur introuvable ou compte désactivé'
      }
    }

    const roleCode = utilisateur.roles?.code || 'UNKNOWN'

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

    // Vérifier que l'ancien token correspond toujours
    if (!utilisateur.token) {
      return {
        success: false,
        error: 'Session invalide. Veuillez vous reconnecter.'
      }
    }

    await supabaseAdmin
      .from('utilisateurs')
      .update({ token: newToken })
      .eq('id', userId)

    console.log('✅ Token renouvelé pour l\'utilisateur:', utilisateur.email)

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
        roleDetails: userWithoutPassword.roles ? {
          id: userWithoutPassword.roles.id,
          code: userWithoutPassword.roles.code,
          nom: userWithoutPassword.roles.nom,
          routeDashboard: userWithoutPassword.roles.route_dashboard
        } : null,
        actif: userWithoutPassword.actif,
        photo: userWithoutPassword.photo || null,
        telephone: userWithoutPassword.telephone || null,
        adresse: userWithoutPassword.adresse || null,
        departementId: userWithoutPassword.departement_id || null,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion || null
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
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .eq('id', decoded.id)
      .single()
    
    if (error || !utilisateur) {
      console.error('❌ Utilisateur introuvable pour ID:', decoded.id)
      return {
        valid: false,
        error: 'Utilisateur introuvable'
      }
    }

    // VÉRIFICATIONS CRITIQUES AVANT TOUT : S'assurer que l'utilisateur récupéré correspond au token
    if (utilisateur.id !== decoded.id) {
      console.error('❌ ERREUR CRITIQUE: L\'utilisateur récupéré ne correspond pas à l\'ID du token!')
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // Vérifier que l'email correspond
    if (decoded.email && decoded.email.toLowerCase() !== utilisateur.email.toLowerCase()) {
      console.error('❌ ERREUR CRITIQUE: L\'email dans le token ne correspond pas à l\'utilisateur récupéré!')
      return {
        valid: false,
        error: 'Incohérence de session détectée. Veuillez vous reconnecter.'
      }
    }

    // Vérifier que le token correspond à celui stocké dans la base de données
    if (!utilisateur.token) {
      console.error('❌ Aucun token stocké pour l\'utilisateur:', utilisateur.email)
      return {
        valid: false,
        error: 'Session expirée. Veuillez vous reconnecter.'
      }
    }

    // Comparer les tokens
    if (utilisateur.token !== token) {
      if (shouldRefresh && utilisateur.id === decoded.id) {
        console.log('🔄 Renouvellement du token en cours, tokens différents attendus')
        const refreshResult = await refreshUserToken(decoded.id)
        if (refreshResult.success) {
          return {
            valid: true,
            user: refreshResult.user,
            newToken: refreshResult.token
          }
        }
      }
      
      console.error('❌ Token mismatch pour l\'utilisateur:', utilisateur.email)
      return {
        valid: false,
        error: 'Token invalide. Une autre session est active. Veuillez vous reconnecter.'
      }
    }

    // Vérifier le rôle
    const roleCode = utilisateur.roles?.code || 'UNKNOWN'
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
      roleDetails: utilisateur.roles ? {
        id: utilisateur.roles.id,
        code: utilisateur.roles.code,
        nom: utilisateur.roles.nom,
        routeDashboard: utilisateur.roles.route_dashboard
      } : null,
      actif: utilisateur.actif,
      photo: utilisateur.photo || null,
      telephone: utilisateur.telephone || null,
      adresse: utilisateur.adresse || null,
      departementId: utilisateur.departement_id || null,
      dateCreation: utilisateur.date_creation,
      derniereConnexion: utilisateur.derniere_connexion || null
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
    await supabaseAdmin
      .from('utilisateurs')
      .update({ token: null })
      .eq('id', userId)

    // Enregistrer l'action dans l'audit
    await supabaseAdmin
      .from('actions_audit')
      .insert({
        utilisateur_id: userId,
        action: 'Déconnexion',
        details: 'Déconnexion réussie',
        type_action: 'DECONNEXION',
        date_action: new Date().toISOString()
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
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .eq('id', userId)
      .single()

    if (error || !utilisateur) {
      return null
    }

    const roleCode = utilisateur.roles?.code || 'UNKNOWN'

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      username: utilisateur.username,
      role: roleCode,
      roleDetails: utilisateur.roles ? {
        id: utilisateur.roles.id,
        code: utilisateur.roles.code,
        nom: utilisateur.roles.nom,
        routeDashboard: utilisateur.roles.route_dashboard
      } : null,
      actif: utilisateur.actif,
      photo: utilisateur.photo || null,
      telephone: utilisateur.telephone || null,
      adresse: utilisateur.adresse || null,
      departementId: utilisateur.departement_id || null,
      dateCreation: utilisateur.date_creation,
      derniereConnexion: utilisateur.derniere_connexion || null
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
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !utilisateur) {
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
    await supabaseAdmin
      .from('utilisateurs')
      .update({ password: hashedPassword })
      .eq('id', userId)

    // Enregistrer l'action dans l'audit
    await supabaseAdmin
      .from('actions_audit')
      .insert({
        utilisateur_id: utilisateur.id,
        action: 'Changement de mot de passe',
        details: 'Mot de passe modifié avec succès',
        type_action: 'CONNEXION',
        date_action: new Date().toISOString()
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
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !utilisateur) {
      return {
        success: false,
        error: 'Utilisateur introuvable'
      }
    }

    // Supprimer l'ancienne photo si elle existe (gestion locale)
    if (utilisateur.photo && !utilisateur.photo.startsWith('http')) {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const { fileURLToPath } = await import('url')
        const { dirname } = await import('path')
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        const photoFileName = utilisateur.photo.split('/').pop()
        const oldPhotoPath = path.join(__dirname, '..', '..', 'uploads', 'profiles', photoFileName)
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath)
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'ancienne photo:', err)
      }
    }

    // Mettre à jour la photo
    const { error: updateError } = await supabaseAdmin
      .from('utilisateurs')
      .update({ photo: photoUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Erreur SQL lors de la mise à jour de la photo:', updateError)
      return {
        success: false,
        error: 'Erreur lors de la mise à jour de la photo'
      }
    }

    // Enregistrer l'action dans l'audit
    await supabaseAdmin
      .from('actions_audit')
      .insert({
        utilisateur_id: utilisateur.id,
        action: 'Mise à jour photo de profil',
        details: 'Photo de profil modifiée',
        type_action: 'CONNEXION',
        date_action: new Date().toISOString()
      })

    return {
      success: true,
      message: 'Photo de profil mise à jour avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour de la photo'
    }
  }
}
