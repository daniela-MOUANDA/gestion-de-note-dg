import prisma from '../../lib/prisma.js'

// Obtenir les étudiants non répartis d'un département
export const getEtudiantsNonRepartis = async (departementId) => {
  try {
    // Récupérer les filières du département
    const filieres = await prisma.filiere.findMany({
      where: {
        departement: {
          id: departementId
        }
      },
      select: { id: true }
    })

    const filiereIds = filieres.map(f => f.id)

    // Récupérer les inscriptions validées mais sans classe assignée
    const inscriptions = await prisma.inscription.findMany({
      where: {
        filiereId: { in: filiereIds },
        statut: 'VALIDEE',
        classeId: null
      },
      include: {
        etudiant: true,
        filiere: true,
        niveau: true
      }
    })

    return {
      success: true,
      etudiants: inscriptions.map(ins => ({
        id: ins.etudiant.id,
        inscriptionId: ins.id,
        matricule: ins.etudiant.matricule,
        nom: ins.etudiant.nom,
        prenom: ins.etudiant.prenom,
        email: ins.etudiant.email,
        filiere: ins.filiere.code,
        niveau: ins.niveau.code,
        niveauId: ins.niveauId
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants non répartis:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des étudiants'
    }
  }
}

// Répartir un étudiant dans une classe
export const repartirEtudiant = async (inscriptionId, classeId, departementId) => {
  try {
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

    // Vérifier que l'inscription existe et appartient au département
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        filiere: {
          include: {
            departement: true
          }
        }
      }
    })

    if (!inscription || inscription.filiere.departement?.id !== departementId) {
      return {
        success: false,
        error: 'Inscription introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier que le niveau correspond
    if (inscription.niveauId !== classe.niveauId) {
      return {
        success: false,
        error: 'Le niveau de l\'étudiant ne correspond pas au niveau de la classe'
      }
    }

    // Mettre à jour l'inscription
    await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        classeId
      }
    })

    // Mettre à jour l'effectif de la classe
    await prisma.classe.update({
      where: { id: classeId },
      data: {
        effectif: {
          increment: 1
        }
      }
    })

    return {
      success: true,
      message: 'Étudiant réparti avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la répartition:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la répartition'
    }
  }
}

// Obtenir les étudiants d'une classe
export const getEtudiantsByClasse = async (classeId, departementId) => {
  try {
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        filiere: {
          include: {
            departement: true
          }
        },
        inscriptions: {
          where: {
            statut: 'VALIDEE'
          },
          include: {
            etudiant: true
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

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        effectif: classe.effectif
      },
      etudiants: classe.inscriptions.map(ins => ({
        id: ins.etudiant.id,
        inscriptionId: ins.id,
        matricule: ins.etudiant.matricule,
        nom: ins.etudiant.nom,
        prenom: ins.etudiant.prenom,
        email: ins.etudiant.email
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des étudiants'
    }
  }
}

