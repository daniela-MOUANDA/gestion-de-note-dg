import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getEtudiantByUserId } from '../../src/services/scolarite/etudiantService.js'

const router = express.Router()

// Route pour récupérer les informations de l'étudiant connecté
router.get('/me', authenticate, async (req, res) => {
    try {
        // req.user contient les infos de l'utilisateur authentifié (grâce au middleware)
        const userId = req.user.id

        // Vérifier que l'utilisateur est bien un étudiant
        if (req.user.role !== 'ETUDIANT') {
            return res.status(403).json({
                success: false,
                error: 'Accès refusé. Vous devez être un étudiant pour accéder à cette ressource.'
            })
        }

        // Récupérer les données complètes de l'étudiant
        const etudiantData = await getEtudiantByUserId(userId)

        res.json({
            success: true,
            data: etudiantData
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des données de l\'étudiant:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la récupération des données de l\'étudiant'
        })
    }
})

export default router
