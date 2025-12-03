import prisma from '../../lib/prisma.js'

// Obtenir toutes les classes d'un département
export const getClassesByDepartement = async (departementId) => {
  try {
    const classes = await prisma.classe.findMany({
      where: {
        filiere: {
          departement: {
            id: departementId
          }
        }
      },
      include: {
        filiere: true,
        niveau: true,
        _count: {
          select: {
            inscriptions: true,
            modules: true
          }
        }
      },
      orderBy: [
        { niveau: { ordinal: 'asc' } },
        { code: 'asc' }
      ]
    })

    return {
      success: true,
      classes: classes.map(classe => ({
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveau.code,
        filiere: classe.filiere.code,
        effectif: classe.effectif,
        nombreModules: classe._count.modules,
        filiereId: classe.filiereId,
        niveauId: classe.niveauId
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des classes'
    }
  }
}

// Créer une nouvelle classe
export const createClasse = async (data, departementId) => {
  try {
    const { code, nom, filiereId, niveauId } = data

    // Validation
    if (!code || !nom || !filiereId || !niveauId) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la filière appartient au département
    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: { departement: true }
    })

    if (!filiere || filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Filière introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier l'unicité du code
    const existingClasse = await prisma.classe.findFirst({
      where: {
        code,
        filiereId,
        niveauId
      }
    })

    if (existingClasse) {
      return {
        success: false,
        error: 'Une classe avec ce code existe déjà pour cette filière et ce niveau'
      }
    }

    // Créer la classe
    const classe = await prisma.classe.create({
      data: {
        code,
        nom,
        filiereId,
        niveauId,
        effectif: 0
      },
      include: {
        filiere: true,
        niveau: true
      }
    })

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveau.code,
        filiere: classe.filiere.code,
        effectif: classe.effectif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la classe'
    }
  }
}

// Mettre à jour une classe
export const updateClasse = async (id, data, departementId) => {
  try {
    // Vérifier que la classe appartient au département
    const existingClasse = await prisma.classe.findUnique({
      where: { id },
      include: {
        filiere: {
          include: {
            departement: true
          }
        }
      }
    })

    if (!existingClasse) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    if (existingClasse.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de modifier cette classe'
      }
    }

    // Mettre à jour
    const classe = await prisma.classe.update({
      where: { id },
      data: {
        code: data.code,
        nom: data.nom
      },
      include: {
        filiere: true,
        niveau: true
      }
    })

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveau.code,
        filiere: classe.filiere.code,
        effectif: classe.effectif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de la classe'
    }
  }
}

// Supprimer une classe
export const deleteClasse = async (id, departementId) => {
  try {
    // Vérifier que la classe appartient au département
    const existingClasse = await prisma.classe.findUnique({
      where: { id },
      include: {
        filiere: {
          include: {
            departement: true
          }
        },
        _count: {
          select: {
            inscriptions: true,
            modules: true
          }
        }
      }
    })

    if (!existingClasse) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    if (existingClasse.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de supprimer cette classe'
      }
    }

    // Vérifier qu'il n'y a pas d'inscriptions ou de modules
    if (existingClasse._count.inscriptions > 0 || existingClasse._count.modules > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer une classe qui contient des étudiants ou des modules'
      }
    }

    // Supprimer
    await prisma.classe.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Classe supprimée avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de la classe'
    }
  }
}

