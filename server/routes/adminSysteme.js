import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
    searchStudentsCredentials,
    updateStudentPassword,
    createStudentAccount,
    getFullAuditLogs,
    getAllUsersForAudit,
    getDashboardStats,
    getRecentSystemLogs
} from '../../src/services/adminSystemeService.js'

const router = express.Router()

// Middleware pour vérifier que l'utilisateur est un ADMIN_SYSTEME
const requireSystemAdmin = (req, res, next) => {
    const userRole = req.user?.role?.trim().toUpperCase()
    if (userRole !== 'ADMIN_SYSTEME') {
        return res.status(403).json({ error: 'Accès refusé. Réservé à l\'Administrateur Système.' })
    }
    next()
}

// Routes pour la gestion des identifiants étudiants
router.get('/students/search', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const { searchTerm } = req.query
        const result = await searchStudentsCredentials(searchTerm)
        if (result.success) {
            res.json(result.students)
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.put('/students/:userId/password', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const { userId } = req.params
        const { newPassword } = req.body
        const adminId = req.user.id

        const result = await updateStudentPassword(userId, newPassword, adminId)
        if (result.success) {
            res.json({ message: result.message })
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Créer manuellement un compte étudiant
router.post('/students/create-account', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const { studentId, password } = req.body
        const result = await createStudentAccount(studentId, password, req.user.id)

        if (result.success) {
            res.json({ message: result.message, userId: result.userId })
        } else {
            res.status(400).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Routes pour l'audit du système
router.get('/audit/logs', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const filters = {
            typeAction: req.query.typeAction,
            utilisateurId: req.query.utilisateurId,
            dateDebut: req.query.dateDebut,
            dateFin: req.query.dateFin,
            searchQuery: req.query.searchQuery,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        }

        const result = await getFullAuditLogs(filters)
        if (result.success) {
            res.json(result.logs)
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/audit/users', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const result = await getAllUsersForAudit()
        if (result.success) {
            res.json(result.users)
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Routes pour le dashboard
router.get('/dashboard/stats', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const result = await getDashboardStats()
        if (result.success) {
            res.json(result.stats)
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/dashboard/recent-logs', authenticate, requireSystemAdmin, async (req, res) => {
    try {
        const result = await getRecentSystemLogs(10)
        if (result.success) {
            res.json(result.logs)
        } else {
            res.status(500).json({ error: result.error })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
