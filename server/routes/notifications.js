import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
    getNotificationsByStudent,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    deleteAllNotifications
} from '../../src/services/notificationService.js'
import { getEtudiantByUserId } from '../../src/services/scolarite/etudiantService.js'

const router = express.Router()

/**
 * GET /api/notifications
 * Récupérer toutes les notifications de l'étudiant connecté
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id

        // Récupérer l'étudiant
        const etudiant = await getEtudiantByUserId(userId)
        if (!etudiant) {
            return res.status(404).json({ error: 'Étudiant non trouvé' })
        }

        // Filtres optionnels
        const filters = {}
        if (req.query.type) filters.type = req.query.type
        if (req.query.lu !== undefined) filters.lu = req.query.lu === 'true'
        if (req.query.limit) filters.limit = parseInt(req.query.limit)

        const result = await getNotificationsByStudent(etudiant.id, filters)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            notifications: result.data
        })
    } catch (error) {
        console.error('Erreur GET /notifications:', error)
        res.status(500).json({ error: 'Erreur lors de la récupération des notifications' })
    }
})

/**
 * GET /api/notifications/unread-count
 * Obtenir le nombre de notifications non lues
 */
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const userId = req.user.id

        // Récupérer l'étudiant
        const etudiant = await getEtudiantByUserId(userId)
        if (!etudiant) {
            return res.status(404).json({ error: 'Étudiant non trouvé' })
        }

        const result = await getUnreadCount(etudiant.id)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            count: result.count
        })
    } catch (error) {
        console.error('Erreur GET /notifications/unread-count:', error)
        res.status(500).json({ error: 'Erreur lors du comptage des notifications' })
    }
})

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params

        const result = await markAsRead(id)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            notification: result.data
        })
    } catch (error) {
        console.error('Erreur PUT /notifications/:id/read:', error)
        res.status(500).json({ error: 'Erreur lors du marquage de la notification' })
    }
})

/**
 * PUT /api/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/read-all', authenticate, async (req, res) => {
    try {
        const userId = req.user.id

        // Récupérer l'étudiant
        const etudiant = await getEtudiantByUserId(userId)
        if (!etudiant) {
            return res.status(404).json({ error: 'Étudiant non trouvé' })
        }

        const result = await markAllAsRead(etudiant.id)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            count: result.count
        })
    } catch (error) {
        console.error('Erreur PUT /notifications/read-all:', error)
        res.status(500).json({ error: 'Erreur lors du marquage de toutes les notifications' })
    }
})

/**
 * DELETE /api/notifications/:id
 * Supprimer une notification
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params

        const result = await deleteNotification(id)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            message: 'Notification supprimée'
        })
    } catch (error) {
        console.error('Erreur DELETE /notifications/:id:', error)
        res.status(500).json({ error: 'Erreur lors de la suppression de la notification' })
    }
})

/**
 * DELETE /api/notifications
 * Supprimer toutes les notifications
 */
router.delete('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id

        // Récupérer l'étudiant
        const etudiant = await getEtudiantByUserId(userId)
        if (!etudiant) {
            return res.status(404).json({ error: 'Étudiant non trouvé' })
        }

        const result = await deleteAllNotifications(etudiant.id)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }

        res.json({
            success: true,
            message: 'Toutes les notifications ont été supprimées'
        })
    } catch (error) {
        console.error('Erreur DELETE /notifications:', error)
        res.status(500).json({ error: 'Erreur lors de la suppression des notifications' })
    }
})

export default router
