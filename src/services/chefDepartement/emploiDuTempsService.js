import prisma from '../../lib/prisma.js'

// Obtenir l'emploi du temps d'une classe
export const getEmploiDuTempsByClasse = async (classeId, semestre, departementId) => {
  try {
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

    const emploisTemps = await prisma.emploiDuTemps.findMany({
      where: {
        classeId,
        semestre
      },
      include: {
        module: true,
        enseignant: true
      },
      orderBy: [
        { jour: 'asc' },
        { heureDebut: 'asc' }
      ]
    })

    return {
      success: true,
      emploisTemps: emploisTemps.map(edt => ({
        id: edt.id,
        jour: edt.jour,
        heureDebut: edt.heureDebut,
        heureFin: edt.heureFin,
        salle: edt.salle,
        module: {
          id: edt.module.id,
          code: edt.module.code,
          nom: edt.module.nom
        },
        enseignant: {
          id: edt.enseignant.id,
          nom: edt.enseignant.nom,
          prenom: edt.enseignant.prenom
        }
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération de l\'emploi du temps'
    }
  }
}

// Créer un emploi du temps
export const createEmploiDuTemps = async (data, departementId) => {
  try {
    const { classeId, moduleId, enseignantId, jour, heureDebut, heureFin, salle, semestre, anneeAcademique } = data

    if (!classeId || !moduleId || !enseignantId || !jour || !heureDebut || !heureFin || !semestre || !anneeAcademique) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la classe, le module et l'enseignant appartiennent au département
    const [classe, module, enseignant] = await Promise.all([
      prisma.classe.findUnique({
        where: { id: classeId },
        include: {
          filiere: {
            include: {
              departement: true
            }
          }
        }
      }),
      prisma.module.findUnique({
        where: { id: moduleId }
      }),
      prisma.enseignant.findUnique({
        where: { id: enseignantId }
      })
    ])

    if (!classe || classe.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Classe introuvable ou n\'appartient pas à votre département'
      }
    }

    if (!module || module.departementId !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    if (!enseignant || enseignant.departementId !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier les conflits d'horaires
    const conflit = await prisma.emploiDuTemps.findFirst({
      where: {
        classeId,
        jour,
        OR: [
          {
            AND: [
              { heureDebut: { lte: heureDebut } },
              { heureFin: { gt: heureDebut } }
            ]
          },
          {
            AND: [
              { heureDebut: { lt: heureFin } },
              { heureFin: { gte: heureFin } }
            ]
          }
        ],
        semestre
      }
    })

    if (conflit) {
      return {
        success: false,
        error: 'Conflit d\'horaire détecté pour cette classe'
      }
    }

    const emploiDuTemps = await prisma.emploiDuTemps.create({
      data: {
        classeId,
        moduleId,
        enseignantId,
        jour,
        heureDebut,
        heureFin,
        salle,
        semestre,
        anneeAcademique
      },
      include: {
        module: true,
        enseignant: true
      }
    })

    return {
      success: true,
      emploiDuTemps: {
        id: emploiDuTemps.id,
        jour: emploiDuTemps.jour,
        heureDebut: emploiDuTemps.heureDebut,
        heureFin: emploiDuTemps.heureFin,
        salle: emploiDuTemps.salle,
        module: {
          id: emploiDuTemps.module.id,
          code: emploiDuTemps.module.code,
          nom: emploiDuTemps.module.nom
        },
        enseignant: {
          id: emploiDuTemps.enseignant.id,
          nom: emploiDuTemps.enseignant.nom,
          prenom: emploiDuTemps.enseignant.prenom
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'emploi du temps'
    }
  }
}

// Supprimer un emploi du temps
export const deleteEmploiDuTemps = async (id, departementId) => {
  try {
    const existing = await prisma.emploiDuTemps.findUnique({
      where: { id },
      include: {
        classe: {
          include: {
            filiere: {
              include: {
                departement: true
              }
            }
          }
        }
      }
    })

    if (!existing || existing.classe.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Emploi du temps introuvable ou n\'appartient pas à votre département'
      }
    }

    await prisma.emploiDuTemps.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Emploi du temps supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'emploi du temps'
    }
  }
}

