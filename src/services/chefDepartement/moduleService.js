import prisma from '../../lib/prisma.js'

// Obtenir tous les modules d'un département
export const getModulesByDepartement = async (departementId, classeId = null) => {
  try {
    const where = { departementId }
    if (classeId) {
      where.classeId = classeId
    }

    const modules = await prisma.module.findMany({
      where,
      include: {
        classe: {
          include: {
            filiere: true,
            niveau: true
          }
        },
        affectations: {
          include: {
            enseignant: true
          }
        }
      },
      orderBy: [
        { classe: { code: 'asc' } },
        { code: 'asc' }
      ]
    })

    return {
      success: true,
      modules: modules.map(mod => ({
        id: mod.id,
        code: mod.code,
        nom: mod.nom,
        credit: mod.credit,
        semestre: mod.semestre,
        classe: mod.classe.code,
        classeId: mod.classeId,
        enseignants: mod.affectations.map(aff => ({
          id: aff.enseignant.id,
          nom: aff.enseignant.nom,
          prenom: aff.enseignant.prenom
        })),
        actif: mod.actif
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des modules'
    }
  }
}

// Créer un nouveau module
export const createModule = async (data, departementId) => {
  try {
    const { code, nom, credit, semestre, classeId } = data

    if (!code || !nom || !credit || !semestre || !classeId) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la classe appartient au département
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        filiere: {
          include: {
            departement: true
          }
        }
      }
    })

    if (!classe || classe.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Classe introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier l'unicité
    const existing = await prisma.module.findFirst({
      where: {
        code,
        classeId
      }
    })

    if (existing) {
      return {
        success: false,
        error: 'Un module avec ce code existe déjà pour cette classe'
      }
    }

    const module = await prisma.module.create({
      data: {
        code,
        nom,
        credit: parseInt(credit),
        semestre,
        classeId,
        departementId,
        actif: true
      },
      include: {
        classe: true
      }
    })

    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        classe: module.classe.code,
        classeId: module.classeId,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création du module'
    }
  }
}

// Mettre à jour un module
export const updateModule = async (id, data, departementId) => {
  try {
    const existing = await prisma.module.findUnique({
      where: { id }
    })

    if (!existing || existing.departementId !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier si la classe change
    let updateData = {
      code: data.code,
      nom: data.nom,
      credit: data.credit ? parseInt(data.credit) : existing.credit,
      semestre: data.semestre,
      actif: data.actif !== undefined ? data.actif : existing.actif
    }

    // Si classeId est fourni et différent, vérifier qu'elle appartient au département
    if (data.classeId && data.classeId !== existing.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
        include: {
          filiere: {
            include: {
              departement: true
            }
          }
        }
      })

      if (!classe || classe.filiere.departement?.id !== departementId) {
        return {
          success: false,
          error: 'Classe introuvable ou n\'appartient pas à votre département'
        }
      }

      // Vérifier l'unicité du code dans la nouvelle classe
      const existingCode = await prisma.module.findFirst({
        where: {
          code: data.code,
          classeId: data.classeId,
          id: { not: id }
        }
      })

      if (existingCode) {
        return {
          success: false,
          error: 'Un module avec ce code existe déjà pour cette classe'
        }
      }

      updateData.classeId = data.classeId
    }

    const module = await prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        classe: true
      }
    })

    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        classe: module.classe.code,
        classeId: module.classeId,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du module'
    }
  }
}

// Supprimer un module
export const deleteModule = async (id, departementId) => {
  try {
    const existing = await prisma.module.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            affectations: true,
            notes: true
          }
        }
      }
    })

    if (!existing || existing.departementId !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    if (existing._count.notes > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un module qui contient des notes'
      }
    }

    await prisma.module.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Module supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du module'
    }
  }
}

