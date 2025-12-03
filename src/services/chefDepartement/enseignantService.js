import prisma from '../../lib/prisma.js'

// Obtenir tous les enseignants d'un département
export const getEnseignantsByDepartement = async (departementId) => {
  try {
    const enseignants = await prisma.enseignant.findMany({
      where: {
        departementId,
        actif: true
      },
      include: {
        affectations: {
          include: {
            module: {
              include: {
                classe: true
              }
            }
          }
        },
        _count: {
          select: {
            affectations: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    })

    return {
      success: true,
      enseignants: enseignants.map(ens => ({
        id: ens.id,
        nom: ens.nom,
        prenom: ens.prenom,
        email: ens.email,
        telephone: ens.telephone,
        modules: ens.affectations.map(aff => ({
          id: aff.module.id,
          code: aff.module.code,
          nom: aff.module.nom,
          classe: aff.module.classe.code
        })),
        nombreModules: ens._count.affectations,
        actif: ens.actif
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des enseignants:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des enseignants'
    }
  }
}

// Créer un nouvel enseignant
export const createEnseignant = async (data, departementId) => {
  try {
    const { nom, prenom, email, telephone } = data

    if (!nom || !prenom || !email) {
      return {
        success: false,
        error: 'Nom, prénom et email sont obligatoires'
      }
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.enseignant.findUnique({
      where: { email }
    })

    if (existing) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé'
      }
    }

    const enseignant = await prisma.enseignant.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        departementId,
        actif: true
      }
    })

    return {
      success: true,
      enseignant: {
        id: enseignant.id,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        email: enseignant.email,
        telephone: enseignant.telephone,
        modules: [],
        nombreModules: 0,
        actif: enseignant.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'enseignant'
    }
  }
}

// Mettre à jour un enseignant
export const updateEnseignant = async (id, data, departementId) => {
  try {
    const existing = await prisma.enseignant.findUnique({
      where: { id }
    })

    if (!existing || existing.departementId !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    const enseignant = await prisma.enseignant.update({
      where: { id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        actif: data.actif !== undefined ? data.actif : existing.actif
      },
      include: {
        affectations: {
          include: {
            module: {
              include: {
                classe: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      enseignant: {
        id: enseignant.id,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        email: enseignant.email,
        telephone: enseignant.telephone,
        modules: enseignant.affectations.map(aff => ({
          id: aff.module.id,
          code: aff.module.code,
          nom: aff.module.nom,
          classe: aff.module.classe.code
        })),
        nombreModules: enseignant.affectations.length,
        actif: enseignant.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de l\'enseignant'
    }
  }
}

// Supprimer un enseignant
export const deleteEnseignant = async (id, departementId) => {
  try {
    const existing = await prisma.enseignant.findUnique({
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
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    if (existing._count.affectations > 0 || existing._count.notes > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un enseignant qui a des affectations ou des notes'
      }
    }

    await prisma.enseignant.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Enseignant supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'enseignant'
    }
  }
}

// Affecter un enseignant à un ou plusieurs modules
export const affecterModules = async (enseignantId, moduleIds, departementId) => {
  try {
    // Vérifier que l'enseignant appartient au département
    const enseignant = await prisma.enseignant.findUnique({
      where: { id: enseignantId }
    })

    if (!enseignant || enseignant.departementId !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier que tous les modules appartiennent au département
    const modules = await prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        departementId
      }
    })

    if (modules.length !== moduleIds.length) {
      return {
        success: false,
        error: 'Certains modules n\'existent pas ou n\'appartiennent pas à votre département'
      }
    }

    // Supprimer les anciennes affectations
    await prisma.affectationModuleEnseignant.deleteMany({
      where: { enseignantId }
    })

    // Créer les nouvelles affectations
    const affectations = await Promise.all(
      moduleIds.map(moduleId =>
        prisma.affectationModuleEnseignant.create({
          data: {
            moduleId,
            enseignantId
          },
          include: {
            module: {
              include: {
                classe: true
              }
            }
          }
        })
      )
    )

    return {
      success: true,
      affectations: affectations.map(aff => ({
        id: aff.module.id,
        code: aff.module.code,
        nom: aff.module.nom,
        classe: aff.module.classe.code
      }))
    }
  } catch (error) {
    console.error('Erreur lors de l\'affectation des modules:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'affectation des modules'
    }
  }
}

