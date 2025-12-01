import prisma from '../../lib/prisma.js'

// Récupérer les informations complètes d'un étudiant par son ID utilisateur
export const getEtudiantByUserId = async (userId) => {
  try {
    // Récupérer l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        nom: true,
        prenom: true,
        role: true
      }
    })

    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      throw new Error('Utilisateur non trouvé ou n\'est pas un étudiant')
    }

    // Chercher l'étudiant par matricule (le username est généralement le matricule)
    // ou par email
    let etudiant = await prisma.etudiant.findFirst({
      where: {
        OR: [
          { matricule: utilisateur.username },
          { email: utilisateur.email }
        ]
      },
      include: {
        inscriptions: {
          where: { statut: 'INSCRIT' },
          orderBy: { dateInscription: 'desc' },
          take: 1,
          include: {
            promotion: {
              select: {
                id: true,
                annee: true,
                statut: true
              }
            },
            formation: {
              select: {
                id: true,
                nom: true,
                code: true
              }
            },
            filiere: {
              select: {
                id: true,
                nom: true,
                code: true
              }
            },
            niveau: {
              select: {
                id: true,
                nom: true,
                code: true,
                ordinal: true
              }
            },
            classe: {
              select: {
                id: true,
                nom: true,
                code: true
              }
            }
          }
        },
        parents: {
          take: 2, // Prendre les 2 premiers parents
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
            lienParente: true
          }
        }
      }
    })

    if (!etudiant) {
      throw new Error('Étudiant non trouvé dans la base de données')
    }

    const inscription = etudiant.inscriptions[0] || null

    // Formater les données pour le frontend
    return {
      id: etudiant.id,
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email || utilisateur.email,
      telephone: etudiant.telephone || null,
      adresse: etudiant.adresse || null,
      photo: etudiant.photo || null,
      dateNaissance: etudiant.dateNaissance ? etudiant.dateNaissance.toISOString().split('T')[0] : null,
      lieuNaissance: etudiant.lieuNaissance || null,
      // Informations académiques
      filiere: inscription?.filiere?.nom || inscription?.filiere?.code || '',
      filiereCode: inscription?.filiere?.code || '',
      niveau: inscription?.niveau?.code || inscription?.niveau?.nom || '',
      niveauNom: inscription?.niveau?.nom || '',
      formation: inscription?.formation?.nom || '',
      classe: inscription?.classe?.nom || inscription?.classe?.code || '',
      anneeAcademique: inscription?.promotion?.annee || '',
      statutInscription: inscription?.statut || 'EN_ATTENTE',
      dateInscription: inscription?.dateInscription ? inscription.dateInscription.toISOString().split('T')[0] : null,
      // Informations parentales
      parents: etudiant.parents.map(parent => ({
        nom: `${parent.prenom || ''} ${parent.nom}`.trim(),
        telephone: parent.telephone || null,
        email: parent.email || null,
        lienParente: parent.lienParente || null
      })),
      // Informations calculées
      estActif: inscription?.statut === 'INSCRIT',
      programme: inscription ? `${inscription.filiere?.code || ''} ${inscription.promotion?.annee || ''} ${inscription.formation?.nom || ''}`.trim() : '',
      // Données par défaut (à calculer plus tard si nécessaire)
      moyenneGenerale: 0, // À calculer depuis les notes
      credits: 0, // À calculer depuis les modules
      totalModules: 0, // À compter depuis les modules
      rangClasse: 0, // À calculer depuis les moyennes
      estBoursier: false, // À vérifier depuis les données
      semestre: inscription?.niveau?.ordinal ? `Semestre ${parseInt(inscription.niveau.ordinal) * 2 - 1}` : ''
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'étudiant:', error)
    throw error
  }
}

