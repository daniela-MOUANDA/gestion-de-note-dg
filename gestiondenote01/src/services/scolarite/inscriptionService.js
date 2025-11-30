import prisma from '../../lib/prisma.js'

// Récupérer toutes les formations
export const getFormations = async () => {
  try {
    return await prisma.formation.findMany({
      orderBy: { code: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error)
    throw error
  }
}

// Récupérer toutes les filières
export const getFilieres = async () => {
  try {
    return await prisma.filiere.findMany({
      orderBy: { code: 'asc' }
  })
  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error)
    throw error
  }
}

// Récupérer les niveaux disponibles selon la formation et la filière
export const getNiveauxDisponibles = async (formationId, filiereId) => {
  try {
    // Pour Initial 2, tous les niveaux sauf MTIC n'ont que L1
    // Pour MTIC Initial 2, tous les niveaux sont disponibles
    const formation = await prisma.formation.findUnique({
      where: { id: formationId }
    })
    
    if (formation?.code === 'INITIAL_2') {
      const filiere = await prisma.filiere.findUnique({
        where: { id: filiereId }
      })
      
      if (filiere?.code === 'MTIC') {
        // MTIC Initial 2 a tous les niveaux
        return await prisma.niveau.findMany({
          orderBy: { code: 'asc' }
        })
      } else {
        // Autres filières Initial 2 n'ont que L1
        return await prisma.niveau.findMany({
          where: { code: 'L1' }
        })
      }
    } else {
      // Initial 1 a tous les niveaux
      return await prisma.niveau.findMany({
        orderBy: { code: 'asc' }
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error)
    throw error
  }
}

// Récupérer les classes d'une filière et d'un niveau
export const getClasses = async (filiereId, niveauId) => {
  try {
    return await prisma.classe.findMany({
      where: {
        filiereId,
        niveauId
      },
      include: {
        filiere: true,
        niveau: true
      },
      orderBy: { code: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    throw error
  }
}

// Récupérer les étudiants par filière et niveau (sans classe)
export const getEtudiantsParFiliereNiveau = async (filiereId, niveauId, promotionId, formationId, typeInscription) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        filiereId,
        niveauId,
        promotionId,
        formationId,
        typeInscription: typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION'
      },
      include: {
        etudiant: true,
        formation: true,
        filiere: true,
        niveau: true
      },
      orderBy: {
        etudiant: {
          nom: 'asc'
        }
      }
    })
    
    return inscriptions.map(inscription => ({
      id: inscription.etudiant.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiant.matricule,
      nom: inscription.etudiant.nom,
      prenom: inscription.etudiant.prenom,
      email: inscription.etudiant.email,
      telephone: inscription.etudiant.telephone,
      dateNaissance: inscription.etudiant.dateNaissance ? 
        inscription.etudiant.dateNaissance.toISOString().split('T')[0] : null,
      lieuNaissance: inscription.etudiant.lieuNaissance || null,
      adresse: inscription.etudiant.adresse || null,
      formation: inscription.formation.nom,
      filiere: inscription.filiere.nom,
      niveau: inscription.niveau.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.dateInscription,
      documents: {
        acteNaissance: inscription.copieActeNaissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copieActeNaissance } : null,
        photo: inscription.photoIdentite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photoIdentite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.copieReleve ? { nom: 'cni.pdf', uploaded: true, url: inscription.copieReleve } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

// Récupérer les étudiants d'une classe avec leur statut d'inscription (gardé pour compatibilité)
export const getEtudiantsParClasse = async (classeId, promotionId, typeInscription) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        classeId,
        promotionId,
        typeInscription: typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION'
      },
      include: {
        etudiant: true,
        formation: true,
        filiere: true,
        niveau: true
      },
      orderBy: {
        etudiant: {
          nom: 'asc'
        }
      }
    })
    
    return inscriptions.map(inscription => ({
      id: inscription.etudiant.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiant.matricule,
      nom: inscription.etudiant.nom,
      prenom: inscription.etudiant.prenom,
      email: inscription.etudiant.email,
      telephone: inscription.etudiant.telephone,
      dateNaissance: inscription.etudiant.dateNaissance ? 
        inscription.etudiant.dateNaissance.toISOString().split('T')[0] : null,
      lieuNaissance: inscription.etudiant.lieuNaissance || null,
      adresse: inscription.etudiant.adresse || null,
      formation: inscription.formation.nom,
      filiere: inscription.filiere.nom,
      niveau: inscription.niveau.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.dateInscription,
      documents: {
        acteNaissance: inscription.copieActeNaissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copieActeNaissance } : null,
        photo: inscription.photoIdentite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photoIdentite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.copieReleve ? { nom: 'cni.pdf', uploaded: true, url: inscription.copieReleve } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

// Valider une inscription
export const validerInscription = async (inscriptionId, agentId) => {
  try {
    return await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        statut: 'VALIDEE',
        dateValidation: new Date(),
        agentValideurId: agentId
      }
    })
  } catch (error) {
    console.error('Erreur lors de la validation de l\'inscription:', error)
    throw error
  }
}

// Finaliser une inscription (scolarité soldée)
export const finaliserInscription = async (inscriptionId, agentId) => {
  try {
    return await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        statut: 'INSCRIT',
        dateValidation: new Date(),
        agentValideurId: agentId
      }
    })
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'inscription:', error)
    throw error
  }
}

// Récupérer toutes les promotions
export const getPromotions = async () => {
  try {
    return await prisma.promotion.findMany({
      orderBy: { annee: 'desc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error)
    throw error
  }
}

