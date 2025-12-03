import prisma from '../../lib/prisma.js'

// Obtenir les notes d'une classe pour un module
export const getNotesByClasseModule = async (classeId, moduleId, semestre, departementId) => {
  try {
    // Vérifier que la classe et le module appartiennent au département
    const [classe, module] = await Promise.all([
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

    // Récupérer les inscriptions de la classe
    const inscriptions = await prisma.inscription.findMany({
      where: {
        classeId,
        statut: 'VALIDEE'
      },
      include: {
        etudiant: true,
        notes: {
          where: {
            moduleId,
            semestre
          },
          include: {
            enseignant: true
          }
        }
      }
    })

    return {
      success: true,
      notes: inscriptions.map(ins => ({
        etudiant: {
          id: ins.etudiant.id,
          matricule: ins.etudiant.matricule,
          nom: ins.etudiant.nom,
          prenom: ins.etudiant.prenom
        },
        inscriptionId: ins.id,
        notes: ins.notes.map(note => ({
          id: note.id,
          typeNote: note.typeNote,
          valeur: note.valeur,
          coefficient: note.coefficient,
          commentaire: note.commentaire,
          enseignant: {
            id: note.enseignant.id,
            nom: note.enseignant.nom,
            prenom: note.enseignant.prenom
          },
          dateEvaluation: note.dateEvaluation
        }))
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des notes'
    }
  }
}

// Ajouter ou mettre à jour une note
export const saveNote = async (data, departementId) => {
  try {
    const { etudiantId, inscriptionId, moduleId, enseignantId, classeId, typeNote, valeur, coefficient, semestre, anneeAcademique, commentaire } = data

    if (!etudiantId || !inscriptionId || !moduleId || !enseignantId || !classeId || !typeNote || valeur === undefined || !semestre || !anneeAcademique) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que tout appartient au département
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

    // Vérifier si une note du même type existe déjà
    const existingNote = await prisma.note.findFirst({
      where: {
        inscriptionId,
        moduleId,
        typeNote,
        semestre
      }
    })

    let note
    if (existingNote) {
      // Mettre à jour
      note = await prisma.note.update({
        where: { id: existingNote.id },
        data: {
          valeur: parseFloat(valeur),
          coefficient: coefficient ? parseFloat(coefficient) : 1.0,
          commentaire,
          dateEvaluation: new Date()
        },
        include: {
          enseignant: true
        }
      })
    } else {
      // Créer
      note = await prisma.note.create({
        data: {
          etudiantId,
          inscriptionId,
          moduleId,
          enseignantId,
          classeId,
          typeNote,
          valeur: parseFloat(valeur),
          coefficient: coefficient ? parseFloat(coefficient) : 1.0,
          semestre,
          anneeAcademique,
          commentaire
        },
        include: {
          enseignant: true
        }
      })
    }

    return {
      success: true,
      note: {
        id: note.id,
        typeNote: note.typeNote,
        valeur: note.valeur,
        coefficient: note.coefficient,
        commentaire: note.commentaire,
        enseignant: {
          id: note.enseignant.id,
          nom: note.enseignant.nom,
          prenom: note.enseignant.prenom
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la note:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la sauvegarde de la note'
    }
  }
}

// Supprimer une note
export const deleteNote = async (noteId, departementId) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
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

    if (!note || note.classe.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Note introuvable ou n\'appartient pas à votre département'
      }
    }

    await prisma.note.delete({
      where: { id: noteId }
    })

    return {
      success: true,
      message: 'Note supprimée avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de la note'
    }
  }
}

