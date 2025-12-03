import prisma from '../../lib/prisma.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Dossier d'upload des documents d'inscription
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inscriptions')

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Sauvegarder un fichier uploadé
export const saveDocument = async (file, etudiantId, documentType) => {
  try {
    const ext = path.extname(file.originalname)
    const filename = `${etudiantId}-${documentType}-${Date.now()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    
    // Écrire le fichier
    fs.writeFileSync(filepath, file.buffer)
    
    // Retourner l'URL relative
    return `/uploads/inscriptions/${filename}`
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du document:', error)
    throw new Error(`Erreur lors de la sauvegarde du document: ${error.message}`)
  }
}

// Supprimer un ancien document
export const deleteDocument = async (documentUrl) => {
  try {
    if (!documentUrl) return
    
    const filename = path.basename(documentUrl)
    const filepath = path.join(UPLOAD_DIR, filename)
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    // Ne pas throw, juste logger l'erreur
  }
}

// Supprimer un document d'inscription
export const deleteInscriptionDocument = async (inscriptionId, documentType) => {
  try {
    // Récupérer l'inscription pour obtenir l'URL du document
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId }
    })
    
    if (!inscription) {
      throw new Error('Inscription introuvable')
    }
    
    // Déterminer quel champ utiliser selon le type de document
    let fieldName = null
    switch (documentType) {
      case 'acteNaissance':
        fieldName = 'copieActeNaissance'
        break
      case 'photo':
        fieldName = 'photoIdentite'
        break
      case 'quittance':
        fieldName = 'quittance'
        break
      case 'pieceIdentite':
        fieldName = 'pieceIdentite'
        break
      case 'releveBac':
        fieldName = 'copieReleve'
        break
      case 'attestationReussiteBac':
        fieldName = 'copieDiplome'
        break
      default:
        throw new Error(`Type de document inconnu: ${documentType}`)
    }
    
    // Récupérer l'URL du document à supprimer
    const documentUrl = inscription[fieldName]
    
    if (!documentUrl) {
      // Le document n'existe pas déjà, rien à supprimer
      return { success: true, message: 'Document déjà absent' }
    }
    
    // Supprimer le fichier physique
    await deleteDocument(documentUrl)
    
    // Mettre à jour l'inscription pour supprimer la référence au document
    const updateData = { [fieldName]: null }
    await prisma.inscription.update({
      where: { id: inscriptionId },
      data: updateData
    })
    
    return { success: true, message: 'Document supprimé avec succès' }
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    throw error
  }
}

// Mettre à jour un document dans l'inscription
export const updateInscriptionDocument = async (inscriptionId, documentType, documentUrl) => {
  try {
    const updateData = {}
    
    switch (documentType) {
      case 'acteNaissance':
        updateData.copieActeNaissance = documentUrl
        break
      case 'photo':
        updateData.photoIdentite = documentUrl
        break
      case 'quittance':
        updateData.quittance = documentUrl
        break
      case 'pieceIdentite':
        // Pièce d'identité - utilise le champ dédié pieceIdentite
        updateData.pieceIdentite = documentUrl
        break
      case 'releveBac':
        // Copie légalisée du relevé de notes du bac - utilise copieReleve
        updateData.copieReleve = documentUrl
        break
      case 'attestationReussiteBac':
        // Copie légalisée de l'attestation de réussite au bac - on utilise copieDiplome
        updateData.copieDiplome = documentUrl
        break
      case 'diplome':
        updateData.copieDiplome = documentUrl
        break
      default:
        throw new Error(`Type de document inconnu: ${documentType}`)
    }
    
    // Récupérer l'inscription pour supprimer l'ancien document
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId }
    })
    
    if (!inscription) {
      throw new Error('Inscription introuvable')
    }
    
    // Supprimer l'ancien document si il existe
    const fieldName = Object.keys(updateData)[0]
    const oldDocumentUrl = inscription[fieldName]
    if (oldDocumentUrl) {
      await deleteDocument(oldDocumentUrl)
    }
    
    // Si on upload la photo d'identité, synchroniser avec la photo de profil de l'étudiant
    if (documentType === 'photo' && documentUrl) {
      await prisma.etudiant.update({
        where: { id: inscription.etudiantId },
        data: { photo: documentUrl }
      })
    }
    
    // Mettre à jour l'inscription
    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: updateData
    })
    
    return updated
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error)
    throw error
  }
}

// Mettre à jour les informations de l'étudiant
export const updateEtudiantInfo = async (etudiantId, data) => {
  try {
    const updateData = {}
    
    if (data.email !== undefined) updateData.email = data.email
    if (data.telephone !== undefined) updateData.telephone = data.telephone
    if (data.adresse !== undefined) updateData.adresse = data.adresse
    if (data.nationalite !== undefined) updateData.nationalite = data.nationalite
    
    // Mettre à jour la photo de profil si fournie
    if (data.photo !== undefined) {
      // Supprimer l'ancienne photo si elle existe
      const etudiant = await prisma.etudiant.findUnique({
        where: { id: etudiantId }
      })
      
      if (etudiant && etudiant.photo) {
        await deleteDocument(etudiant.photo)
      }
      
      updateData.photo = data.photo
    }
    
    const updated = await prisma.etudiant.update({
      where: { id: etudiantId },
      data: updateData
    })
    
    return updated
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations étudiant:', error)
    throw error
  }
}

// Récupérer ou créer un parent
export const upsertParent = async (etudiantId, parentData) => {
  try {
    // Vérifier si un parent de ce type existe déjà
    const existing = await prisma.parent.findFirst({
      where: {
        etudiantId,
        type: parentData.type
      }
    })
    
    if (existing) {
      // Mettre à jour
      return await prisma.parent.update({
        where: { id: existing.id },
        data: {
          nom: parentData.nom,
          prenom: parentData.prenom,
          telephone: parentData.telephone || null,
          email: parentData.email || null,
          profession: parentData.profession || null,
          adresse: parentData.adresse || null
        }
      })
    } else {
      // Créer
      return await prisma.parent.create({
        data: {
          etudiantId,
          type: parentData.type,
          nom: parentData.nom,
          prenom: parentData.prenom,
          telephone: parentData.telephone || null,
          email: parentData.email || null,
          profession: parentData.profession || null,
          adresse: parentData.adresse || null
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour du parent:', error)
    throw error
  }
}

// Récupérer les parents d'un étudiant
export const getParents = async (etudiantId) => {
  try {
    return await prisma.parent.findMany({
      where: { etudiantId },
      orderBy: { type: 'asc' }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error)
    throw error
  }
}

// Récupérer le dossier complet d'un étudiant
export const getDossierEtudiant = async (etudiantId, inscriptionId) => {
  try {
    const etudiant = await prisma.etudiant.findUnique({
      where: { id: etudiantId },
      include: {
        parents: true,
        inscriptions: {
          where: { id: inscriptionId },
          include: {
            promotion: true,
            formation: true,
            filiere: true,
            niveau: true,
            classe: true
          }
        }
      }
    })
    
    if (!etudiant) {
      throw new Error('Étudiant introuvable')
    }
    
    const inscription = etudiant.inscriptions[0]
    
    if (!inscription) {
      throw new Error(`Aucune inscription trouvée pour l'étudiant ${etudiantId} avec l'ID d'inscription ${inscriptionId}`)
    }
    
    // Synchroniser la photo : si la photo d'identité existe mais pas la photo de profil, utiliser la photo d'identité
    let photoProfil = etudiant.photo
    if (!photoProfil && inscription.photoIdentite) {
      photoProfil = inscription.photoIdentite
      // Mettre à jour la photo de profil de l'étudiant
      await prisma.etudiant.update({
        where: { id: etudiantId },
        data: { photo: inscription.photoIdentite }
      })
    }
    // Si la photo de profil existe mais pas la photo d'identité, synchroniser dans l'autre sens
    else if (photoProfil && !inscription.photoIdentite) {
      await prisma.inscription.update({
        where: { id: inscriptionId },
        data: { photoIdentite: photoProfil }
      })
    }
    
    return {
      etudiant: {
        id: etudiant.id,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        dateNaissance: etudiant.dateNaissance,
        lieuNaissance: etudiant.lieuNaissance,
        nationalite: etudiant.nationalite,
        email: etudiant.email,
        telephone: etudiant.telephone,
        adresse: etudiant.adresse,
        photo: photoProfil || etudiant.photo
      },
      inscription: {
        id: inscription.id,
        statut: inscription.statut,
        typeInscription: inscription.typeInscription,
        dateInscription: inscription.dateInscription,
        dateValidation: inscription.dateValidation,
        documents: {
          acteNaissance: inscription.copieActeNaissance,
          photo: inscription.photoIdentite || photoProfil,
          quittance: inscription.quittance,
          pieceIdentite: inscription.pieceIdentite,
          releveBac: inscription.copieReleve,
          attestationReussiteBac: inscription.copieDiplome,
          diplome: inscription.copieDiplome
        },
        promotion: inscription.promotion,
        formation: inscription.formation,
        filiere: inscription.filiere,
        niveau: inscription.niveau,
        classe: inscription.classe
      },
      parents: etudiant.parents || []
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du dossier:', error)
    throw error
  }
}

