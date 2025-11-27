import prisma from '../../lib/prisma.js'

// Récupérer les bulletins d'une classe et d'un semestre
export const getBulletinsParClasse = async (promotionId, classeId, semestre) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        promotionId,
        classeId,
        statut: 'INSCRIT'
      },
      include: {
        etudiant: true
      }
    })
    
    const bulletins = await prisma.bulletin.findMany({
      where: {
        promotionId,
        classeId,
        semestre
      },
      include: {
        etudiant: true
      }
    })
    
    // Créer les bulletins manquants pour les étudiants inscrits
    const bulletinsManquants = inscriptions
      .filter(inscription => !bulletins.find(b => b.etudiantId === inscription.etudiantId))
      .map(inscription => ({
        id: null,
        etudiantId: inscription.etudiantId,
        etudiant: `${inscription.etudiant.nom} ${inscription.etudiant.prenom}`,
        matricule: inscription.etudiant.matricule,
        statut: 'NON_RECUPERE',
        dateRecuperation: null
      }))
    
    const bulletinsExistants = bulletins.map(bulletin => ({
      id: bulletin.id,
      etudiantId: bulletin.etudiantId,
      etudiant: `${bulletin.etudiant.nom} ${bulletin.etudiant.prenom}`,
      matricule: bulletin.etudiant.matricule,
      statut: bulletin.statut,
      dateRecuperation: bulletin.dateRecuperation
    }))
    
    return [...bulletinsExistants, ...bulletinsManquants].sort((a, b) => 
      a.etudiant.localeCompare(b.etudiant)
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des bulletins:', error)
    throw error
  }
}

// Marquer un bulletin comme récupéré
export const marquerBulletinRecupere = async (bulletinId, etudiantId, promotionId, classeId, semestre, agentId) => {
  try {
    // Vérifier si le bulletin existe
    let bulletin = await prisma.bulletin.findUnique({
      where: { id: bulletinId }
    })
    
    if (!bulletin) {
      // Créer le bulletin s'il n'existe pas
      bulletin = await prisma.bulletin.create({
        data: {
          etudiantId,
          promotionId,
          classeId,
          semestre,
          anneeAcademique: (await prisma.promotion.findUnique({ where: { id: promotionId } }))?.annee || '',
          statut: 'RECUPERE',
          dateRecuperation: new Date(),
          agentRecuperation: agentId
        }
      })
    } else {
      // Mettre à jour le bulletin existant
      bulletin = await prisma.bulletin.update({
        where: { id: bulletinId },
        data: {
          statut: 'RECUPERE',
          dateRecuperation: new Date(),
          agentRecuperation: agentId
        }
      })
    }
    
    return bulletin
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bulletin:', error)
    throw error
  }
}

