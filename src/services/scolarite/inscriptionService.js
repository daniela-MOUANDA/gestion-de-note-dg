import prisma from '../../lib/prisma.js'
import bcrypt from 'bcrypt'

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
      photo: inscription.etudiant.photo || null,
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
        pieceIdentite: inscription.pieceIdentite ? { nom: 'cni.pdf', uploaded: true, url: inscription.pieceIdentite } : null,
        releveBac: inscription.copieReleve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copieReleve } : null,
        attestationReussiteBac: inscription.copieDiplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copieDiplome } : null
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
      photo: inscription.etudiant.photo || null,
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
        pieceIdentite: inscription.pieceIdentite ? { nom: 'cni.pdf', uploaded: true, url: inscription.pieceIdentite } : null,
        releveBac: inscription.copieReleve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copieReleve } : null,
        attestationReussiteBac: inscription.copieDiplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copieDiplome } : null
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

// Générer un mot de passe aléatoire sécurisé
const generatePassword = () => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  let password = ''
  
  // S'assurer qu'il y a au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]
  
  // Remplir le reste avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Finaliser une inscription (scolarité soldée)
export const finaliserInscription = async (inscriptionId, agentId) => {
  try {
    // Récupérer l'inscription avec les données de l'étudiant
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        etudiant: true,
        promotion: {
          select: {
            annee: true
          }
        }
      }
    })

    if (!inscription) {
      throw new Error('Inscription non trouvée')
    }

    if (!inscription.etudiant) {
      throw new Error('Étudiant non trouvé pour cette inscription')
    }

    const etudiant = inscription.etudiant

    // Vérifier que l'étudiant a un email
    if (!etudiant.email || etudiant.email.trim() === '') {
      throw new Error('L\'étudiant doit avoir une adresse email pour recevoir ses identifiants de connexion')
    }

    // Générer un mot de passe automatique
    const generatedPassword = generatePassword()
    console.log(`🔑 Mot de passe généré pour ${etudiant.prenom} ${etudiant.nom}: ${generatedPassword}`)

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    // Vérifier si un compte Utilisateur existe déjà pour cet étudiant
    let utilisateur = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { email: etudiant.email.trim().toLowerCase() },
          { username: etudiant.matricule.trim() }
        ]
      }
    })

    // Créer ou mettre à jour le compte Utilisateur
    if (utilisateur) {
      // Mettre à jour le mot de passe si le compte existe déjà
      utilisateur = await prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          password: hashedPassword,
          email: etudiant.email.trim().toLowerCase(),
          actif: true,
          role: 'ETUDIANT'
        }
      })
      console.log('✅ Compte Utilisateur mis à jour pour l\'étudiant:', utilisateur.email)
    } else {
      // Créer un nouveau compte Utilisateur
      utilisateur = await prisma.utilisateur.create({
        data: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          email: etudiant.email.trim().toLowerCase(),
          username: etudiant.matricule.trim().toLowerCase(),
          password: hashedPassword,
          role: 'ETUDIANT',
          actif: true,
          photo: etudiant.photo || null,
          telephone: etudiant.telephone || null,
          adresse: etudiant.adresse || null
        }
      })
      console.log('✅ Compte Utilisateur créé pour l\'étudiant:', utilisateur.email)
    }

    // Mettre à jour le statut de l'inscription
    const inscriptionUpdated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        statut: 'INSCRIT',
        dateValidation: new Date(),
        agentValideurId: agentId
      }
    })

    // Retourner le mot de passe généré pour l'afficher à l'utilisateur
    // (L'envoi d'email est désactivé pour le moment)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ INSCRIPTION FINALISÉE AVEC SUCCÈS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Étudiant: ${etudiant.prenom} ${etudiant.nom}`)
    console.log(`📧 Email: ${etudiant.email}`)
    console.log(`🆔 Matricule: ${etudiant.matricule}`)
    console.log(`🔑 Mot de passe: ${generatedPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 IMPORTANT: Notez ces identifiants et communiquez-les à l\'étudiant')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Retourner aussi le mot de passe pour l'afficher dans l'interface
    return {
      ...inscriptionUpdated,
      password: generatedPassword, // Ajouter le mot de passe dans la réponse
      etudiantEmail: etudiant.email,
      etudiantMatricule: etudiant.matricule,
      etudiantNom: `${etudiant.prenom} ${etudiant.nom}`
    }
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

