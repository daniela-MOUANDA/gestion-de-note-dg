import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'

// Créer un nouveau chef de département
export const createChefDepartement = async (data, createdBy) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = data

    // Validation
    if (!nom || !prenom || !email || !departementId || !motDePasse) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que le département existe
    const departement = await prisma.departement.findUnique({
      where: { id: departementId }
    })

    if (!departement) {
      return {
        success: false,
        error: 'Département introuvable'
      }
    }

    // Vérifier si le département est déjà assigné à un autre chef de département
    const roleChef = await prisma.role.findUnique({
      where: { code: 'CHEF_DEPARTEMENT' }
    })

    if (roleChef) {
      const existingChef = await prisma.utilisateur.findFirst({
        where: {
          departementId: departementId,
          roleId: roleChef.id,
          actif: true
        }
      })

      if (existingChef) {
        return {
          success: false,
          error: `Ce département est déjà assigné à ${existingChef.prenom} ${existingChef.nom}. Un département ne peut être assigné qu'à un seul chef.`
        }
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

    // Générer un username à partir de l'email
    let username = normalizedEmail.split('@')[0]

    // Vérifier si le username existe déjà et générer un nouveau si nécessaire
    let usernameExists = await prisma.utilisateur.findUnique({
      where: { username }
    })

    if (usernameExists) {
      // Ajouter un suffixe si le username existe
      username = `${username}_${Date.now().toString().slice(-4)}`
      
      // Vérifier à nouveau (peu probable mais on vérifie quand même)
      usernameExists = await prisma.utilisateur.findUnique({
        where: { username }
      })
      
      if (usernameExists) {
        return {
          success: false,
          error: 'Impossible de générer un nom d\'utilisateur unique'
        }
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    // Récupérer le rôle CHEF_DEPARTEMENT
    const roleChefDepartement = await prisma.role.findUnique({
      where: { code: 'CHEF_DEPARTEMENT' }
    })

    if (!roleChefDepartement) {
      return {
        success: false,
        error: 'Rôle CHEF_DEPARTEMENT introuvable'
      }
    }

    // Créer l'utilisateur avec le rôle CHEF_DEPARTEMENT
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: normalizedEmail,
        username: username,
        password: hashedPassword,
        telephone: telephone?.trim() || null,
        roleId: roleChefDepartement.id,
        actif: actif !== undefined ? actif : true,
        departementId: departementId
      },
      include: {
        departement: true,
        role: true
      }
    })

    // Enregistrer dans l'audit
    if (createdBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: createdBy,
          action: 'Création de chef de département',
          details: `Chef de département créé : ${prenom} ${nom} (${departement.nom})`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      chef: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone,
        departementId: userWithoutPassword.departementId,
        departement: userWithoutPassword.departement ? {
          id: userWithoutPassword.departement.id,
          nom: userWithoutPassword.departement.nom,
          code: userWithoutPassword.departement.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.dateCreation
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du chef de département'
    }
  }
}

// Obtenir tous les chefs de département
export const getAllChefsDepartement = async () => {
  try {
    // Récupérer le rôle CHEF_DEPARTEMENT
    const roleChef = await prisma.role.findUnique({
      where: { code: 'CHEF_DEPARTEMENT' }
    })

    if (!roleChef) {
      return {
        success: false,
        error: 'Rôle CHEF_DEPARTEMENT introuvable'
      }
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        roleId: roleChef.id
      },
      include: {
        departement: true,
        role: true
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    const chefs = utilisateurs.map(u => {
      const { password: _, ...userWithoutPassword } = u
      return {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone || '',
        departementId: userWithoutPassword.departementId,
        departement: userWithoutPassword.departement ? {
          id: userWithoutPassword.departement.id,
          nom: userWithoutPassword.departement.nom,
          code: userWithoutPassword.departement.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion
      }
    })

    return {
      success: true,
      chefs
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des chefs de département:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des chefs de département'
    }
  }
}

// Mettre à jour un chef de département
export const updateChefDepartement = async (id, data, updatedBy) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = data

    // Vérifier si le chef existe
    const existingChef = await prisma.utilisateur.findUnique({
      where: { id },
      include: { role: true }
    })

    if (!existingChef) {
      return {
        success: false,
        error: 'Chef de département introuvable'
      }
    }

    // Vérifier que c'est bien un chef de département
    if (!existingChef.role || existingChef.role.code !== 'CHEF_DEPARTEMENT') {
      return {
        success: false,
        error: 'Cet utilisateur n\'est pas un chef de département'
      }
    }

    // Normaliser l'email
    const normalizedEmail = email?.trim().toLowerCase()

    // Vérifier si l'email est déjà utilisé par un autre compte
    if (normalizedEmail && normalizedEmail !== existingChef.email) {
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

    // Vérifier que le département existe si fourni
    if (departementId) {
      const departement = await prisma.departement.findUnique({
        where: { id: departementId }
      })

      if (!departement) {
        return {
          success: false,
          error: 'Département introuvable'
        }
      }

      // Vérifier si le département est déjà assigné à un autre chef de département
      // (différent de celui qu'on modifie)
      if (departementId !== existingChef.departementId) {
        const roleChef = await prisma.role.findUnique({
          where: { code: 'CHEF_DEPARTEMENT' }
        })

        if (roleChef) {
          const existingChefWithDept = await prisma.utilisateur.findFirst({
            where: {
              departementId: departementId,
              roleId: roleChef.id,
              id: { not: id }, // Exclure le chef qu'on modifie
              actif: true
            }
          })

          if (existingChefWithDept) {
            return {
              success: false,
              error: `Ce département est déjà assigné à ${existingChefWithDept.prenom} ${existingChefWithDept.nom}. Un département ne peut être assigné qu'à un seul chef.`
            }
          }
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {}

    if (nom) updateData.nom = nom.trim()
    if (prenom) updateData.prenom = prenom.trim()
    if (normalizedEmail) updateData.email = normalizedEmail
    if (telephone !== undefined) updateData.telephone = telephone?.trim() || null
    if (departementId) updateData.departementId = departementId
    if (actif !== undefined) updateData.actif = actif

    // Hasher le nouveau mot de passe si fourni
    if (motDePasse && motDePasse.trim() !== '') {
      updateData.password = await bcrypt.hash(motDePasse, 10)
    }

    // Mettre à jour le chef
    const utilisateur = await prisma.utilisateur.update({
      where: { id },
      data: updateData,
      include: {
        departement: true
      }
    })

    // Enregistrer dans l'audit
    if (updatedBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: updatedBy,
          action: 'Modification de chef de département',
          details: `Chef de département modifié : ${utilisateur.prenom} ${utilisateur.nom}`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      chef: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone,
        departementId: userWithoutPassword.departementId,
        departement: userWithoutPassword.departement ? {
          id: userWithoutPassword.departement.id,
          nom: userWithoutPassword.departement.nom,
          code: userWithoutPassword.departement.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.dateCreation,
        derniereConnexion: userWithoutPassword.derniereConnexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du chef de département'
    }
  }
}

// Supprimer un chef de département
export const deleteChefDepartement = async (id, deletedBy) => {
  try {
    // Vérifier si le chef existe
    const existingChef = await prisma.utilisateur.findUnique({
      where: { id },
      include: { role: true }
    })

    if (!existingChef) {
      return {
        success: false,
        error: 'Chef de département introuvable'
      }
    }

    // Vérifier que c'est bien un chef de département
    if (!existingChef.role || existingChef.role.code !== 'CHEF_DEPARTEMENT') {
      return {
        success: false,
        error: 'Cet utilisateur n\'est pas un chef de département'
      }
    }

    // Supprimer le chef
    await prisma.utilisateur.delete({
      where: { id }
    })

    // Enregistrer dans l'audit
    if (deletedBy) {
      await prisma.actionAudit.create({
        data: {
          utilisateurId: deletedBy,
          action: 'Suppression de chef de département',
          details: `Chef de département supprimé : ${existingChef.prenom} ${existingChef.nom}`,
          typeAction: 'CONNEXION',
          dateAction: new Date()
        }
      })
    }

    return {
      success: true,
      message: 'Chef de département supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du chef de département'
    }
  }
}

