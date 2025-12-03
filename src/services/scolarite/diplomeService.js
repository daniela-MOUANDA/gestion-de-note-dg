import prisma from '../../lib/prisma.js'

// Récupérer les diplômes d'une classe et d'un type
export const getDiplomesParClasse = async (promotionId, classeId, typeDiplome) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        promotionId,
        classeId,
        statut: 'INSCRIT'
      },
      include: {
        etudiant: true,
        niveau: true
      }
    })
    
    // Filtrer selon le type de diplôme (DTS pour L2, Licence pour L3)
    const etudiantsEligibles = inscriptions.filter(inscription => {
      if (typeDiplome === 'DTS') {
        return inscription.niveau.code === 'L2'
      } else if (typeDiplome === 'LICENCE') {
        return inscription.niveau.code === 'L3'
      }
      return false
    })
    
    const diplomes = await prisma.diplome.findMany({
      where: {
        promotionId,
        classeId,
        typeDiplome
      },
      include: {
        etudiant: true
      }
    })
    
    // Créer les diplômes manquants pour les étudiants éligibles
    const diplomesManquants = etudiantsEligibles
      .filter(inscription => !diplomes.find(d => d.etudiantId === inscription.etudiantId))
      .map(inscription => ({
        id: null,
        etudiantId: inscription.etudiantId,
        etudiant: `${inscription.etudiant.nom} ${inscription.etudiant.prenom}`,
        matricule: inscription.etudiant.matricule,
        statut: 'NON_RECUPERE',
        dateRecuperation: null
      }))
    
    const diplomesExistants = diplomes.map(diplome => ({
      id: diplome.id,
      etudiantId: diplome.etudiantId,
      etudiant: `${diplome.etudiant.nom} ${diplome.etudiant.prenom}`,
      matricule: diplome.etudiant.matricule,
      statut: diplome.statut,
      dateRecuperation: diplome.dateRecuperation
    }))
    
    return [...diplomesExistants, ...diplomesManquants].sort((a, b) => 
      a.etudiant.localeCompare(b.etudiant)
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des diplômes:', error)
    throw error
  }
}

// Marquer un diplôme comme récupéré
export const marquerDiplomeRecupere = async (diplomeId, etudiantId, promotionId, classeId, typeDiplome, agentId) => {
  try {
    // Vérifier si le diplôme existe
    let diplome = await prisma.diplome.findUnique({
      where: { id: diplomeId }
    })
    
    if (!diplome) {
      // Créer le diplôme s'il n'existe pas
      const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } })
      diplome = await prisma.diplome.create({
        data: {
          etudiantId,
          promotionId,
          classeId,
          typeDiplome,
          anneeAcademique: promotion?.annee || '',
          statut: 'RECUPERE',
          dateRecuperation: new Date(),
          agentRecuperation: agentId
        }
      })
    } else {
      // Mettre à jour le diplôme existant
      diplome = await prisma.diplome.update({
        where: { id: diplomeId },
        data: {
          statut: 'RECUPERE',
          dateRecuperation: new Date(),
          agentRecuperation: agentId
        }
      })
    }
    
    return diplome
  } catch (error) {
    console.error('Erreur lors de la mise à jour du diplôme:', error)
    throw error
  }
}

