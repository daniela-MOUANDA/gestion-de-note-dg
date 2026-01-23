import { supabaseAdmin } from '../../lib/supabase.js'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { notifyDocumentValide, notifyDocumentRejete, notifyDossierReouvert } from '../notificationService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Types de documents requis
export const DOCUMENT_TYPES = {
    PHOTO: 'PHOTO',
    ACTE_NAISSANCE: 'ACTE_NAISSANCE',
    ATTESTATION_BAC: 'ATTESTATION_BAC',
    RELEVE_BAC: 'RELEVE_BAC',
    PIECE_IDENTITE: 'PIECE_IDENTITE',
    QUITTANCE_PAIEMENT: 'QUITTANCE_PAIEMENT'
}

// Statuts des documents
export const DOCUMENT_STATUS = {
    EN_ATTENTE: 'EN_ATTENTE',
    VALIDE: 'VALIDE',
    REJETE: 'REJETE'
}

// Mapping des types vers des noms lisibles
export const DOCUMENT_LABELS = {
    PHOTO: 'Photo d\'identité',
    ACTE_NAISSANCE: 'Acte de naissance légalisé',
    ATTESTATION_BAC: 'Attestation du BAC légalisée',
    RELEVE_BAC: 'Relevé de notes du BAC légalisé',
    PIECE_IDENTITE: 'Pièce d\'identité',
    QUITTANCE_PAIEMENT: 'Quittance de paiement'
}

/**
 * Récupérer tous les documents d'un étudiant avec leurs statuts
 */
export const getStudentDocuments = async (etudiantId, inscriptionId) => {
    try {
        const { data: inscription, error } = await supabaseAdmin
            .from('inscriptions')
            .select('*')
            .eq('id', inscriptionId)
            .eq('etudiant_id', etudiantId)
            .single()

        if (error) throw error
        if (!inscription) throw new Error('Inscription non trouvée')

        // Structure des documents avec leurs statuts (utilisant les vrais noms de colonnes)
        const documents = {
            photo: {
                type: DOCUMENT_TYPES.PHOTO,
                label: DOCUMENT_LABELS.PHOTO,
                url: inscription.photo_identite,
                statut: inscription.photo_identite_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.photo_identite_commentaire || null,
                date_validation: inscription.photo_identite_date_validation || null
            },
            acteNaissance: {
                type: DOCUMENT_TYPES.ACTE_NAISSANCE,
                label: DOCUMENT_LABELS.ACTE_NAISSANCE,
                url: inscription.copie_acte_naissance,
                statut: inscription.copie_acte_naissance_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.copie_acte_naissance_commentaire || null,
                date_validation: inscription.copie_acte_naissance_date_validation || null
            },
            attestationBac: {
                type: DOCUMENT_TYPES.ATTESTATION_BAC,
                label: DOCUMENT_LABELS.ATTESTATION_BAC,
                url: inscription.copie_diplome,
                statut: inscription.copie_diplome_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.copie_diplome_commentaire || null,
                date_validation: inscription.copie_diplome_date_validation || null
            },
            releveBac: {
                type: DOCUMENT_TYPES.RELEVE_BAC,
                label: DOCUMENT_LABELS.RELEVE_BAC,
                url: inscription.copie_releve,
                statut: inscription.copie_releve_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.copie_releve_commentaire || null,
                date_validation: inscription.copie_releve_date_validation || null
            },
            pieceIdentite: {
                type: DOCUMENT_TYPES.PIECE_IDENTITE,
                label: DOCUMENT_LABELS.PIECE_IDENTITE,
                url: inscription.piece_identite,
                statut: inscription.piece_identite_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.piece_identite_commentaire || null,
                date_validation: inscription.piece_identite_date_validation || null
            },
            quittancePaiement: {
                type: DOCUMENT_TYPES.QUITTANCE_PAIEMENT,
                label: DOCUMENT_LABELS.QUITTANCE_PAIEMENT,
                url: inscription.quittance,
                statut: inscription.quittance_statut || DOCUMENT_STATUS.EN_ATTENTE,
                commentaire: inscription.quittance_commentaire || null,
                date_validation: inscription.quittance_date_validation || null
            }
        }

        // Calculer la progression
        const totalDocuments = Object.keys(documents).length
        const documentsUploaded = Object.values(documents).filter(d => d.url).length
        const documentsValides = Object.values(documents).filter(d => d.statut === DOCUMENT_STATUS.VALIDE).length
        const documentsRejetes = Object.values(documents).filter(d => d.statut === DOCUMENT_STATUS.REJETE).length

        return {
            success: true,
            documents,
            progression: {
                total: totalDocuments,
                uploaded: documentsUploaded,
                valides: documentsValides,
                rejetes: documentsRejetes,
                enAttente: documentsUploaded - documentsValides - documentsRejetes
            },
            inscription
        }
    } catch (error) {
        console.error('Erreur getStudentDocuments:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Sauvegarder un fichier document
 */
const saveDocumentFile = async (file, etudiantId, documentType) => {
    try {
        const uploadsDir = path.join(__dirname, '../../../uploads/inscriptions', etudiantId.toString())

        // Créer le dossier s'il n'existe pas
        await fs.mkdir(uploadsDir, { recursive: true })

        // Générer un nom de fichier unique
        const timestamp = Date.now()
        const extension = file.originalname.split('.').pop()
        const filename = `${documentType.toLowerCase()}_${timestamp}.${extension}`
        const filepath = path.join(uploadsDir, filename)

        // Sauvegarder le fichier
        await fs.writeFile(filepath, file.buffer)

        // Retourner le chemin relatif
        return `/uploads/inscriptions/${etudiantId}/${filename}`
    } catch (error) {
        console.error('Erreur saveDocumentFile:', error)
        throw error
    }
}

/**
 * Téléverser un document pour un étudiant
 */
export const uploadStudentDocument = async (etudiantId, inscriptionId, documentType, file) => {
    try {
        // Vérifier que le type de document est valide
        if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
            throw new Error(`Type de document invalide: ${documentType}`)
        }

        // Sauvegarder le fichier
        const documentUrl = await saveDocumentFile(file, etudiantId, documentType)

        // Mapping des types vers les colonnes de la base de données (corrigé selon schéma réel)
        const columnMapping = {
            [DOCUMENT_TYPES.PHOTO]: 'photo_identite',
            [DOCUMENT_TYPES.ACTE_NAISSANCE]: 'copie_acte_naissance',
            [DOCUMENT_TYPES.ATTESTATION_BAC]: 'copie_diplome',
            [DOCUMENT_TYPES.RELEVE_BAC]: 'copie_releve',
            [DOCUMENT_TYPES.PIECE_IDENTITE]: 'piece_identite',
            [DOCUMENT_TYPES.QUITTANCE_PAIEMENT]: 'quittance'
        }

        const column = columnMapping[documentType]
        const statusColumn = `${column}_statut`
        const dateColumn = `${column}_date_validation`
        const commentaireColumn = `${column}_commentaire`

        // 1. Mise à jour de base (URL du document) - Toujours nécessaire
        const baseUpdate = { [column]: documentUrl }
        const { error: baseError } = await supabaseAdmin
            .from('inscriptions')
            .update(baseUpdate)
            .eq('id', inscriptionId)
            .eq('etudiant_id', etudiantId)

        if (baseError) throw baseError

        // 2. Mise à jour des métadonnées de statut (Optionnelle pour resilience)
        try {
            const metaUpdate = {
                [statusColumn]: DOCUMENT_STATUS.EN_ATTENTE,
                [dateColumn]: null,
                [commentaireColumn]: null
            }
            await supabaseAdmin
                .from('inscriptions')
                .update(metaUpdate)
                .eq('id', inscriptionId)
        } catch (metaError) {
            console.warn(`⚠️ Colonnes de statut manquantes pour ${column}, mise à jour ignorée.`)
        }

        // Si c'est la photo, mettre aussi à jour le profil étudiant
        if (documentType === DOCUMENT_TYPES.PHOTO) {
            await supabaseAdmin
                .from('etudiants')
                .update({ photo: documentUrl })
                .eq('id', etudiantId)
        }

        return {
            success: true,
            message: `${DOCUMENT_LABELS[documentType]} téléversé avec succès`,
            documentUrl
        }
    } catch (error) {
        console.error('Erreur uploadStudentDocument:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Valider ou rejeter un document
 */
export const validateDocument = async (inscriptionId, documentType, statut, agentId, commentaire = null) => {
    try {
        if (!Object.values(DOCUMENT_STATUS).includes(statut)) {
            throw new Error(`Statut invalide: ${statut}`)
        }

        if (statut === DOCUMENT_STATUS.REJETE && !commentaire) {
            throw new Error('Un commentaire est requis pour rejeter un document')
        }

        const columnMapping = {
            [DOCUMENT_TYPES.PHOTO]: 'photo_identite',
            [DOCUMENT_TYPES.ACTE_NAISSANCE]: 'copie_acte_naissance',
            [DOCUMENT_TYPES.ATTESTATION_BAC]: 'copie_diplome',
            [DOCUMENT_TYPES.RELEVE_BAC]: 'copie_releve',
            [DOCUMENT_TYPES.PIECE_IDENTITE]: 'piece_identite',
            [DOCUMENT_TYPES.QUITTANCE_PAIEMENT]: 'quittance'
        }

        const column = columnMapping[documentType]
        const statusColumn = `${column}_statut`
        const dateColumn = `${column}_date_validation`
        const commentaireColumn = `${column}_commentaire`

        const updateData = {
            [statusColumn]: statut,
            [dateColumn]: new Date().toISOString(),
            [commentaireColumn]: commentaire,
            agent_valideur_id: agentId
        }

        const { data, error } = await supabaseAdmin
            .from('inscriptions')
            .update(updateData)
            .eq('id', inscriptionId)
            .select('*')
            .single()

        if (error) {
            if (error.code === '42703' || error.message?.includes('column')) {
                throw new Error(`Erreur de base de données : La colonne '${statusColumn}' ou une autre colonne de validation est manquante. Veuillez exécuter le script de migration SQL.`)
            }
            throw error
        }

        // Vérifier si tous les documents sont validés (avec sécurité si colonnes absentes)
        let allValidated = false;
        try {
            allValidated =
                data.photo_identite_statut === DOCUMENT_STATUS.VALIDE &&
                data.copie_acte_naissance_statut === DOCUMENT_STATUS.VALIDE &&
                data.copie_diplome_statut === DOCUMENT_STATUS.VALIDE &&
                data.copie_releve_statut === DOCUMENT_STATUS.VALIDE &&
                data.piece_identite_statut === DOCUMENT_STATUS.VALIDE &&
                data.quittance_statut === DOCUMENT_STATUS.VALIDE

            // Si tous validés, marquer l'inscription comme INSCRIT
            if (allValidated && data.statut !== 'INSCRIT') {
                await supabaseAdmin
                    .from('inscriptions')
                    .update({ statut: 'INSCRIT' })
                    .eq('id', inscriptionId)

                console.log(`✅ Inscription ${inscriptionId} marquée comme INSCRIT - tous documents validés`)
            } else if (!allValidated && data.statut === 'INSCRIT') {
                // Si au moins un document est rejeté et que l'inscription était INSCRIT
                // on la repasse en statut 'VALIDE' pour débloquer les modifications
                await supabaseAdmin
                    .from('inscriptions')
                    .update({ statut: 'VALIDE' })
                    .eq('id', inscriptionId)

                console.log(`⚠️ Inscription ${inscriptionId} repassée en VALIDE car un document a été rejeté`)

                // Notifier l'étudiant que son dossier a été réouvert
                try {
                    await notifyDossierReouvert(data.etudiant_id)
                } catch (notifError) {
                    console.error('⚠️ Erreur notification dossier réouvert:', notifError)
                }
            }
        } catch (e) {
            console.warn("Impossible de vérifier la validation globale : colonnes manquantes.")
        }

        // Créer une notification pour l'étudiant
        try {
            const documentLabel = DOCUMENT_LABELS[documentType]
            if (statut === DOCUMENT_STATUS.VALIDE) {
                await notifyDocumentValide(data.etudiant_id, documentLabel)
            } else if (statut === DOCUMENT_STATUS.REJETE) {
                await notifyDocumentRejete(data.etudiant_id, documentLabel, commentaire || 'Aucune raison spécifiée')
            }
        } catch (notifError) {
            console.error('⚠️ Erreur création notification document:', notifError)
            // Ne pas bloquer la validation si la notification échoue
        }

        return {
            success: true,
            message: `Document ${statut === DOCUMENT_STATUS.VALIDE ? 'validé' : 'rejeté'} avec succès`,
            data,
            allDocumentsValidated: allValidated
        }
    } catch (error) {
        console.error('Erreur validateDocument:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Obtenir les documents en attente de validation
 */
export const getPendingDocuments = async () => {
    try {
        const { data: inscriptions, error } = await supabaseAdmin
            .from('inscriptions')
            .select(`
        *,
        etudiants (id, matricule, nom, prenom, email),
        filieres (nom, code),
        niveaux (nom, code),
        promotions (annee)
      `)
            .or(`
        photo_identite_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE},
        copie_acte_naissance_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE},
        copie_diplome_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE},
        copie_releve_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE},
        piece_identite_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE},
        quittance_statut.eq.${DOCUMENT_STATUS.EN_ATTENTE}
      `)
            .order('date_inscription', { ascending: false })

        if (error) throw error

        // Transformer les données pour un affichage plus facile
        const pending = inscriptions.map(insc => {
            const documents = []

            if (insc.photo_identite && insc.photo_identite_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.PHOTO, label: DOCUMENT_LABELS.PHOTO, url: insc.photo_identite })
            }
            if (insc.copie_acte_naissance && insc.copie_acte_naissance_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.ACTE_NAISSANCE, label: DOCUMENT_LABELS.ACTE_NAISSANCE, url: insc.copie_acte_naissance })
            }
            if (insc.copie_diplome && insc.copie_diplome_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.ATTESTATION_BAC, label: DOCUMENT_LABELS.ATTESTATION_BAC, url: insc.copie_diplome })
            }
            if (insc.copie_releve && insc.copie_releve_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.RELEVE_BAC, label: DOCUMENT_LABELS.RELEVE_BAC, url: insc.copie_releve })
            }
            if (insc.piece_identite && insc.piece_identite_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.PIECE_IDENTITE, label: DOCUMENT_LABELS.PIECE_IDENTITE, url: insc.piece_identite })
            }
            if (insc.quittance && insc.quittance_statut === DOCUMENT_STATUS.EN_ATTENTE) {
                documents.push({ type: DOCUMENT_TYPES.QUITTANCE_PAIEMENT, label: DOCUMENT_LABELS.QUITTANCE_PAIEMENT, url: insc.quittance })
            }

            return {
                inscriptionId: insc.id,
                etudiant: insc.etudiants,
                filiere: insc.filieres,
                niveau: insc.niveaux,
                promotion: insc.promotions,
                documentsEnAttente: documents,
                nombreDocumentsEnAttente: documents.length
            }
        }).filter(item => item.nombreDocumentsEnAttente > 0)

        return {
            success: true,
            data: pending,
            total: pending.length
        }
    } catch (error) {
        console.error('Erreur getPendingDocuments:', error)
        return { success: false, error: error.message }
    }
}
