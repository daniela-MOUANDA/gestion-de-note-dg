import { supabaseAdmin } from '../lib/supabase.js'
import { sendNotificationEmail } from './emailService.js'

// Types de notifications
export const NOTIFICATION_TYPES = {
    ACADEMIQUE: 'ACADEMIQUE',
    INSCRIPTION: 'INSCRIPTION',
    SYSTEME: 'SYSTEME',
    PERSONNEL: 'PERSONNEL'
}

/**
 * Créer une nouvelle notification (In-app + Email)
 */
export const createNotification = async (etudiantId, type, titre, message, lien = null, metadata = null) => {
    try {
        // 1. Créer la notification dans la base de données
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                etudiant_id: etudiantId,
                type,
                titre,
                message,
                lien,
                metadata,
                lu: false
            })
            .select()
            .single()

        if (error) throw error

        console.log(`✅ Notification In-app créée pour l'étudiant ${etudiantId}: ${titre}`)

        // 2. Envoyer une notification par email en simultané
        // On récupère l'email de l'étudiant
        const { data: etudiant } = await supabaseAdmin
            .from('etudiants')
            .select('email, nom, prenom')
            .eq('id', etudiantId)
            .single()

        if (etudiant && etudiant.email) {
            // On envoie l'email de manière asynchrone (non bloquant pour la réponse API)
            sendNotificationEmail(etudiant.email, titre, message, lien)
                .then(res => {
                    if (res.success) console.log(`📧 Email envoyé avec succès à ${etudiant.email}`)
                })
                .catch(err => console.error(`❌ Erreur envoi email auto:`, err))
        }

        return { success: true, data }
    } catch (error) {
        console.error('❌ Erreur création notification:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Récupérer les notifications d'un étudiant
 */
export const getNotificationsByStudent = async (etudiantId, filters = {}) => {
    try {
        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('etudiant_id', etudiantId)
            .order('date_creation', { ascending: false })

        // Filtres optionnels
        if (filters.type) {
            query = query.eq('type', filters.type)
        }
        if (filters.lu !== undefined) {
            query = query.eq('lu', filters.lu)
        }
        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('❌ Erreur récupération notifications:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ lu: true })
            .eq('id', notificationId)
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('❌ Erreur marquage notification comme lue:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Marquer toutes les notifications d'un étudiant comme lues
 */
export const markAllAsRead = async (etudiantId) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ lu: true })
            .eq('etudiant_id', etudiantId)
            .eq('lu', false)
            .select()

        if (error) throw error

        return { success: true, count: data.length }
    } catch (error) {
        console.error('❌ Erreur marquage toutes notifications comme lues:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Supprimer une notification
 */
export const deleteNotification = async (notificationId) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', notificationId)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('❌ Erreur suppression notification:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Obtenir le nombre de notifications non lues
 */
export const getUnreadCount = async (etudiantId) => {
    try {
        const { count, error } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('etudiant_id', etudiantId)
            .eq('lu', false)

        if (error) throw error

        return { success: true, count }
    } catch (error) {
        console.error('❌ Erreur comptage notifications non lues:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Supprimer toutes les notifications d'un étudiant
 */
export const deleteAllNotifications = async (etudiantId) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('etudiant_id', etudiantId)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('❌ Erreur suppression toutes notifications:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// Fonctions helper pour créer des notifications spécifiques
// ============================================

/**
 * Notification: Inscription finalisée
 */
export const notifyInscriptionFinalisee = async (etudiantId, matricule) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.INSCRIPTION,
        '🎉 Inscription officiellement finalisée !',
        `Félicitations ! Votre inscription a été validée avec succès. Votre matricule est ${matricule}. Vous pouvez maintenant accéder à tous les services de l'établissement.`,
        '/student/dashboard',
        { event: 'inscription_finalisee', matricule }
    )
}

/**
 * Notification: Document validé
 */
export const notifyDocumentValide = async (etudiantId, documentLabel) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.INSCRIPTION,
        '✅ Document validé',
        `Votre document "${documentLabel}" a été validé par le service scolarité.`,
        '/student/mon-dossier',
        { event: 'document_valide', document: documentLabel }
    )
}

/**
 * Notification: Document rejeté
 */
export const notifyDocumentRejete = async (etudiantId, documentLabel, raison) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.INSCRIPTION,
        '❌ Document rejeté',
        `Votre document "${documentLabel}" a été rejeté. Raison: ${raison}. Veuillez le re-téléverser avec les corrections nécessaires.`,
        '/student/mon-dossier',
        { event: 'document_rejete', document: documentLabel, raison }
    )
}

/**
 * Notification: Dossier réouvert pour correction
 */
export const notifyDossierReouvert = async (etudiantId) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.INSCRIPTION,
        '🔄 Dossier réouvert pour correction',
        `Votre dossier d'inscription a été réouvert suite au rejet d'un ou plusieurs documents. Veuillez consulter votre dossier et apporter les corrections nécessaires.`,
        '/student/mon-dossier',
        { event: 'dossier_reouvert' }
    )
}

/**
 * Notification: Nouvelle note disponible
 */
export const notifyNouvelleNote = async (etudiantId, moduleNom, note) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.ACADEMIQUE,
        '📝 Nouvelle note disponible',
        `Une nouvelle note est disponible pour le module "${moduleNom}": ${note}/20`,
        '/student/notes',
        { event: 'nouvelle_note', module: moduleNom, note }
    )
}

/**
 * Notification: Bulletin disponible
 */
export const notifyBulletinDisponible = async (etudiantId, semestre) => {
    return await createNotification(
        etudiantId,
        NOTIFICATION_TYPES.ACADEMIQUE,
        '📊 Bulletin disponible',
        `Votre bulletin du ${semestre} est maintenant disponible. Vous pouvez le consulter et le télécharger.`,
        '/student/notes',
        { event: 'bulletin_disponible', semestre }
    )
}

/**
 * Notifier toute une classe
 */
export const notifyClass = async (classeId, type, titre, message, lien = null, metadata = null) => {
    try {
        // Récupérer tous les étudiants inscrits dans cette classe
        const { data: inscriptions, error } = await supabaseAdmin
            .from('inscriptions')
            .select('etudiant_id')
            .eq('classe_id', classeId)
            .eq('statut', 'INSCRIT')

        if (error) throw error

        if (!inscriptions || inscriptions.length === 0) {
            console.log(`ℹ️ Aucun étudiant trouvé pour la classe ${classeId}`)
            return { success: true, count: 0 }
        }

        // Envoyer les notifications
        const promises = inscriptions.map(insc =>
            createNotification(insc.etudiant_id, type, titre, message, lien, metadata)
        )

        await Promise.all(promises)

        console.log(`✅ ${inscriptions.length} notifications envoyées à la classe ${classeId}`)
        return { success: true, count: inscriptions.length }
    } catch (error) {
        console.error('❌ Erreur notifyClass:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Notification: Nouveau cours programmé
 */
export const notifyNouveauCours = async (classeId, moduleNom, jour, heure) => {
    return await notifyClass(
        classeId,
        NOTIFICATION_TYPES.ACADEMIQUE,
        '📅 Nouvel emploi du temps',
        `Un nouveau cours de "${moduleNom}" a été programmé le ${jour} à ${heure}.`,
        '/student/emploi-du-temps',
        { event: 'nouveau_cours', module: moduleNom, jour, heure }
    )
}

/**
 * Notification: Changement d'emploi du temps
 */
export const notifyChangementEDT = async (classeId, details = '') => {
    return await notifyClass(
        classeId,
        NOTIFICATION_TYPES.ACADEMIQUE,
        '🔄 Emploi du temps mis à jour',
        `Votre emploi du temps a été modifié. ${details} Veuillez consulter les nouveaux horaires.`,
        '/student/emploi-du-temps',
        { event: 'changement_edt' }
    )
}

/**
 * Notification: Nouvelle évaluation programmée
 */
export const notifyNouvelleEvaluation = async (classeId, moduleNom, evaluationType) => {
    return await notifyClass(
        classeId,
        NOTIFICATION_TYPES.ACADEMIQUE,
        '📝 Nouvelle évaluation programmée',
        `Une évaluation de type "${evaluationType}" a été programmée pour le module "${moduleNom}".`,
        '/student/notes',
        { event: 'nouvelle_evaluation', module: moduleNom, type: evaluationType }
    )
}
