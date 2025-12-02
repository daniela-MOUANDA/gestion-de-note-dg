import prisma from '../lib/prisma.js'

// Obtenir tous les départements
export const getAllDepartements = async () => {
  try {
    const departements = await prisma.departement.findMany({
      orderBy: {
        nom: 'asc'
      }
      // Note: Les filières seront ajoutées plus tard quand la relation sera créée dans le schéma
    })

    return {
      success: true,
      departements
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des départements'
    }
  }
}

// Créer un département
export const createDepartement = async (data) => {
  try {
    const { nom, code, description, actif } = data

    if (!nom || !code) {
      return {
        success: false,
        error: 'Le nom et le code sont obligatoires'
      }
    }

    // Vérifier si le code existe déjà
    const codeExists = await prisma.departement.findUnique({
      where: { code: code.trim().toUpperCase() }
    })

    if (codeExists) {
      return {
        success: false,
        error: 'Ce code de département existe déjà'
      }
    }

    // Vérifier si le nom existe déjà
    const nomExists = await prisma.departement.findUnique({
      where: { nom: nom.trim() }
    })

    if (nomExists) {
      return {
        success: false,
        error: 'Ce nom de département existe déjà'
      }
    }

    const departement = await prisma.departement.create({
      data: {
        nom: nom.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        actif: actif !== undefined ? actif : true
      }
    })

    return {
      success: true,
      departement
    }
  } catch (error) {
    console.error('Erreur lors de la création du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du département'
    }
  }
}

// Mettre à jour un département
export const updateDepartement = async (id, data) => {
  try {
    const { nom, code, description, actif } = data

    // Vérifier que le département existe
    const existingDepartement = await prisma.departement.findUnique({
      where: { id }
    })

    if (!existingDepartement) {
      return {
        success: false,
        error: 'Département non trouvé'
      }
    }

    // Vérifier si le code existe déjà (pour un autre département)
    if (code && code.trim().toUpperCase() !== existingDepartement.code) {
      const codeExists = await prisma.departement.findUnique({
        where: { code: code.trim().toUpperCase() }
      })

      if (codeExists) {
        return {
          success: false,
          error: 'Ce code de département existe déjà'
        }
      }
    }

    // Vérifier si le nom existe déjà (pour un autre département)
    if (nom && nom.trim() !== existingDepartement.nom) {
      const nomExists = await prisma.departement.findUnique({
        where: { nom: nom.trim() }
      })

      if (nomExists) {
        return {
          success: false,
          error: 'Ce nom de département existe déjà'
        }
      }
    }

    const departement = await prisma.departement.update({
      where: { id },
      data: {
        nom: nom ? nom.trim() : undefined,
        code: code ? code.trim().toUpperCase() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        actif: actif !== undefined ? actif : undefined
      },
      // Note: Les filières seront ajoutées plus tard quand la relation sera créée dans le schéma
    })

    return {
      success: true,
      departement
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du département'
    }
  }
}

// Supprimer un département
export const deleteDepartement = async (id) => {
  try {
    // Vérifier que le département existe
    const existingDepartement = await prisma.departement.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            chefs: true
          }
        }
      }
    })

    if (!existingDepartement) {
      return {
        success: false,
        error: 'Département non trouvé'
      }
    }

    // Vérifier s'il y a des chefs de département associés
    if (existingDepartement._count.chefs > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer ce département car il contient des chefs de département'
      }
    }

    await prisma.departement.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Département supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du département'
    }
  }
}

