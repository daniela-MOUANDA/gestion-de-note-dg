import prisma from '../../lib/prisma.js'

// Générer le prochain numéro d'attestation
const genererNumeroAttestation = async (annee) => {
  try {
    const dernierNumero = await prisma.attestation.findFirst({
      where: {
        numero: {
          startsWith: `N°`
        }
      },
      orderBy: {
        numero: 'desc'
      }
    })
    
    let numero = 1
    if (dernierNumero) {
      // Extraire le numéro du dernier attestation (format: N°0460/INPTIC/DG/DSE/2024)
      const match = dernierNumero.numero.match(/N°(\d+)/)
      if (match) {
        numero = parseInt(match[1]) + 1
      }
    }
    
    return `N°${String(numero).padStart(4, '0')}/INPTIC/DG/DSE/${annee}`
  } catch (error) {
    console.error('Erreur lors de la génération du numéro:', error)
    throw error
  }
}

// Créer une attestation
export const creerAttestation = async (etudiantId, promotionId, anneeAcademique) => {
  try {
    const annee = new Date().getFullYear()
    const numero = await genererNumeroAttestation(annee)
    
    return await prisma.attestation.create({
      data: {
        numero,
        etudiantId,
        promotionId,
        anneeAcademique,
        lieu: 'Libreville',
        archivee: true,
        dateArchivage: new Date()
      },
      include: {
        etudiant: true,
        promotion: true
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'attestation:', error)
    throw error
  }
}

// Récupérer les étudiants inscrits par filière et niveau (sans classe)
export const getEtudiantsInscritsParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        promotionId,
        filiereId,
        niveauId,
        formationId,
        statut: 'INSCRIT' // Seulement les étudiants inscrits
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
    
    const etudiantIds = inscriptions.map(inscription => inscription.etudiantId)
    const attestations = etudiantIds.length
      ? await prisma.attestation.findMany({
          where: {
            promotionId,
            etudiantId: {
              in: etudiantIds
            }
          },
          select: {
            id: true,
            etudiantId: true,
            promotionId: true,
            numero: true,
            archivee: true,
            dateGeneration: true,
            dateArchivage: true
          }
        })
      : []

    const attestationMap = new Map()
    attestations.forEach(attestation => {
      attestationMap.set(`${attestation.etudiantId}-${attestation.promotionId}`, attestation)
    })
    
    return inscriptions.map(inscription => {
      const key = `${inscription.etudiantId}-${inscription.promotionId}`
      const attestation = attestationMap.get(key)
      return {
        id: inscription.etudiant.id,
        inscriptionId: inscription.id,
        nom: inscription.etudiant.nom,
        prenom: inscription.etudiant.prenom,
        matricule: inscription.etudiant.matricule,
        formation: inscription.formation.nom,
        filiere: inscription.filiere.nom,
        niveau: inscription.niveau.nom,
        niveauCode: inscription.niveau.code,
        niveauOrdinal: inscription.niveau.ordinal,
        estInscrit: inscription.statut === 'INSCRIT',
        attestationExiste: !!attestation,
        attestationId: attestation?.id || null,
        attestationNumero: attestation?.numero || null,
        attestationArchivee: attestation?.archivee || false,
        attestationDate: attestation?.dateGeneration || null
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants inscrits:', error)
    throw error
  }
}

// Récupérer les attestations d'une classe
export const getAttestationsParClasse = async (promotionId, filiereId, niveauId, classeId) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        promotionId,
        classeId,
        statut: 'INSCRIT' // Seulement les étudiants inscrits
      },
      include: {
        etudiant: true,
        formation: true,
        filiere: true,
        niveau: true
      }
    })
    
    const attestations = await prisma.attestation.findMany({
      where: {
        promotionId,
        etudiantId: {
          in: inscriptions.map(i => i.etudiantId)
        }
      },
      include: {
        etudiant: true
      }
    })
    
    return inscriptions.map(inscription => {
      const attestation = attestations.find(a => a.etudiantId === inscription.etudiantId)
      return {
        id: attestation?.id || null,
        etudiant: `${inscription.etudiant.nom} ${inscription.etudiant.prenom}`,
        matricule: inscription.etudiant.matricule,
        formation: inscription.formation.nom,
        dateGeneration: attestation?.dateGeneration ? 
          attestation.dateGeneration.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 
          null,
        numero: attestation?.numero || null,
        existe: !!attestation
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des attestations:', error)
    throw error
  }
}

// Archiver une attestation
export const archiverAttestation = async (attestationId) => {
  try {
    return await prisma.attestation.update({
      where: { id: attestationId },
      data: {
        archivee: true,
        dateArchivage: new Date()
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'archivage de l\'attestation:', error)
    throw error
  }
}

// Récupérer les attestations archivées par filière et niveau (sans classe, sans formation)
export const getAttestationsArchiveesParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId = null) => {
  try {
    console.log('Recherche des inscriptions avec les paramètres:', { promotionId, filiereId, niveauId, formationId });
    
    // Construire la condition where
    const whereCondition = {
      promotionId,
      filiereId,
      niveauId,
      statut: 'INSCRIT'
    }
    
    // Ajouter formationId seulement si fourni
    if (formationId) {
      whereCondition.formationId = formationId
    }
    
    const inscriptions = await prisma.inscription.findMany({
      where: whereCondition,
      include: {
        etudiant: true,
        formation: true,
        filiere: true,
        niveau: true
      }
    })
    
    console.log('Inscriptions trouvées:', inscriptions.length);
    if (inscriptions.length === 0) {
      console.log('Aucune inscription trouvée avec ces critères');
      return [];
    }
    
    const attestations = await prisma.attestation.findMany({
      where: {
        promotionId,
        archivee: true,
        etudiantId: {
          in: inscriptions.map(i => i.etudiantId)
        }
      },
      include: {
        etudiant: true
      },
      orderBy: {
        dateGeneration: 'desc'
      }
    })
    
    return attestations.map(attestation => {
      const inscription = inscriptions.find(i => i.etudiantId === attestation.etudiantId)
      return {
        id: attestation.id,
        etudiant: inscription?.etudiant || attestation.etudiant,
        matricule: attestation.etudiant.matricule,
        formation: inscription?.formation?.nom || '',
        filiere: inscription?.filiere?.nom || '',
        niveau: inscription?.niveau?.nom || inscription?.niveau?.code || '',
        dateGeneration: attestation.dateGeneration.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        dateGenerationISO: attestation.dateGeneration.toISOString(),
        numero: attestation.numero,
        anneeAcademique: attestation.anneeAcademique
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des attestations archivées:', error)
    throw error
  }
}
