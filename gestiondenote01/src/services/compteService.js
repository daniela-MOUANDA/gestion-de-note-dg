import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'

// Obtenir le roleId à partir d'un code de rôle
const getRoleIdByCode = async (roleCode) => {
  const role = await prisma.role.findUnique({
    where: { code: roleCode }
  })
  return role?.id || null
}

// Mapper les rôles de l'interface vers les codes de rôle
const mapRoleToCode = (role) => {
  const roleMap = {
    'Agent': 'AGENT_SCOLARITE',
    'SP-Scolarité': 'SP_SCOLARITE',
    'AGENT_SCOLARITE': 'AGENT_SCOLARITE',
    'SP_SCOLARITE': 'SP_SCOLARITE'
  }
  return roleMap[role] || role
}

// Mapper les codes de rôle vers l'interface
const mapRoleToDisplay = (roleCode) => {
  const roleMap = {
    'AGENT_SCOLARITE': 'Agent',
    'SP_SCOLARITE': 'SP-Scolarité'
  }
  return roleMap[roleCode] || roleCode
}

// Créer un nouveau compte
export const createCompte = async (data, createdBy) => {
  try {
    const { nom, prenom, email, username, password, role, actif } = data

    // Validation
    if (!nom || !prenom || !email || !username || !password) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase()

    // Vérifier si l'email existe déjà
    const emailExists = await prisma.utilisateur.findUnique({
      where: { email: normalizedEmail }
    })

    if (emailExists) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé'
      }
    }

    // Vérifier si le username existe déjà
    const usernameExists = await prisma.utilisateur.findUnique({
      where: { username: username.trim() }
    })

    if (usernameExists) {
      return {
        success: false,
        error: 'Ce nom d\'utilisateur est déjà utilisé'
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mapper le rôle et obtenir le roleId
    const roleCode = mapRoleToCode(role)
    const roleId = await getRoleIdByCode(roleCode)

    if (!roleId) {
      return {
        success: false,
        error: `Rôle ${roleCode} introuvable`
      }
    }

    // Créer l'utilisateur
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: normalizedEmail,
        username: username.trim(),
        password: hashedPassword,
        roleId: roleId,
        actif: actif !== undefined ? actif : true
      },
      include: { role: true }
    })

    // Enregistrer dans l'audit
    if (createdBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: createdBy,
          action: 'Création de compte',
          details: `Compte créé pour ${prenom} ${nom} (${roleCode})`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      compte: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: mapRoleToDisplay(userWithoutPassword.role?.code || 'UNKNOWN'),
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du compte'
    }
  }
}

// Obtenir tous les comptes (agents et SP-Scolarité uniquement)
export const getAllComptes = async () => {
  try {
    // Récupérer les IDs des rôles
    const roleAgent = await prisma.role.findUnique({ where: { code: 'AGENT_SCOLARITE' } })
    const roleSP = await prisma.role.findUnique({ where: { code: 'SP_SCOLARITE' } })

    if (!roleAgent || !roleSP) {
      return {
        success: false,
        error: 'Rôles introuvables'
      }
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        roleId: {
          in: [roleAgent.id, roleSP.id]
        }
      },
      include: {
        role: true
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    const comptes = utilisateurs.map(u => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      username: u.username,
      role: mapRoleToDisplay(u.role?.code || 'UNKNOWN'),
      actif: u.actif,
      dateCreation: u.dateCreation,
      derniereConnexion: u.derniereConnexion
    }))

    return {
      success: true,
      comptes
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des comptes'
    }
  }
}

// Mettre à jour un compte
export const updateCompte = async (id, data, updatedBy) => {
  try {
    const { nom, prenom, email, username, password, role, actif } = data

    // Vérifier si le compte existe
    const existingCompte = await prisma.utilisateur.findUnique({
      where: { id }
    })

    if (!existingCompte) {
      return {
        success: false,
        error: 'Compte introuvable'
      }
    }

    // Normaliser l'email
    const normalizedEmail = email?.trim().toLowerCase()

    // Vérifier si l'email est déjà utilisé par un autre compte
    if (normalizedEmail && normalizedEmail !== existingCompte.email) {
      const emailExists = await prisma.utilisateur.findUnique({
        where: { email: normalizedEmail }
      })

      if (emailExists) {
        return {
          success: false,
          error: 'Cet email est déjà utilisé'
        }
      }
    }

    // Vérifier si le username est déjà utilisé par un autre compte
    if (username && username.trim() !== existingCompte.username) {
      const usernameExists = await prisma.utilisateur.findUnique({
        where: { username: username.trim() }
      })

      if (usernameExists) {
        return {
          success: false,
          error: 'Ce nom d\'utilisateur est déjà utilisé'
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {}

    if (nom) updateData.nom = nom.trim()
    if (prenom) updateData.prenom = prenom.trim()
    if (normalizedEmail) updateData.email = normalizedEmail
    if (username) updateData.username = username.trim()
    if (actif !== undefined) updateData.actif = actif

    // Mettre à jour le rôle si fourni
    if (role) {
      const roleCode = mapRoleToCode(role)
      const roleId = await getRoleIdByCode(roleCode)
      if (roleId) {
        updateData.roleId = roleId
      }
    }

    // Hasher le nouveau mot de passe si fourni
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Mettre à jour le compte
    const utilisateur = await prisma.utilisateur.update({
      where: { id },
      data: updateData,
      include: { role: true }
    })

    // Enregistrer dans l'audit
    if (updatedBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: updatedBy,
          action: 'Modification de compte',
          details: `Compte modifié pour ${utilisateur.prenom} ${utilisateur.nom}`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      compte: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: mapRoleToDisplay(userWithoutPassword.role?.code || 'UNKNOWN'),
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du compte'
    }
  }
}

// Supprimer un compte
export const deleteCompte = async (id, deletedBy) => {
  try {
    // Vérifier si le compte existe
    const existingCompte = await prisma.utilisateur.findUnique({
      where: { id }
    })

    if (!existingCompte) {
      return {
        success: false,
        error: 'Compte introuvable'
      }
    }

    // Supprimer le compte
    await prisma.utilisateur.delete({
      where: { id }
    })

    // Enregistrer dans l'audit
    if (deletedBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: deletedBy,
          action: 'Suppression de compte',
          details: `Compte supprimé pour ${existingCompte.prenom} ${existingCompte.nom}`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    return {
      success: true,
      message: 'Compte supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du compte'
    }
  }
}

// Activer/Désactiver un compte
export const toggleActif = async (id, actif, updatedBy) => {
  try {
    const utilisateur = await prisma.utilisateur.update({
      where: { id },
      data: { actif }
    })

    // Enregistrer dans l'audit
    if (updatedBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: updatedBy,
          action: actif ? 'Activation de compte' : 'Désactivation de compte',
          details: `Compte ${actif ? 'activé' : 'désactivé'} pour ${utilisateur.prenom} ${utilisateur.nom}`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    return {
      success: true,
      compte: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        username: utilisateur.username,
        role: mapRoleToDisplay(utilisateur.role),
        actif: utilisateur.actif,
        dateCreation: utilisateur.dateCreation,
        derniereConnexion: utilisateur.derniereConnexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la modification du statut'
    }
  }
}

