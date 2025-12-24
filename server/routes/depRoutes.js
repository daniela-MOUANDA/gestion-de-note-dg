import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
    getBulletinsEnAttente,
    getBulletinsVises,
    viserBulletin
} from '../../src/services/depService.js'
import { getDashboardStats } from '../../src/services/dep/dashboardService.js'
import { getAllEtudiantsAvecMoyennes, getEtudiantDetails } from '../../src/services/dep/etudiantsService.js'
import { getMeilleursEtudiants } from '../../src/services/dep/meilleursEtudiantsService.js'
import { getStatistiquesDEP } from '../../src/services/dep/statistiquesService.js'
import { getBulletinData } from '../../src/services/chefDepartement/relevesService.js'
import { generateBulletinPDF } from '../services/bulletinPDFGenerator.js'
import { supabaseAdmin } from '../../src/lib/supabase.js'
import { getMention } from '../utils/mentions.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Authentification requise pour toutes les routes
router.use(authenticate)

// Obtenir les statistiques du dashboard
router.get('/dashboard/stats', async (req, res) => {
    try {
        const result = await getDashboardStats()
        if (result.success) {
            res.json(result)
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du dashboard:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// Obtenir tous les étudiants avec leurs moyennes (avec pagination)
router.get('/etudiants', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const filiere = req.query.filiere || 'TOUS'
        const niveau = req.query.niveau || 'TOUS'
        const semestre = req.query.semestre || 'TOUS'
        const search = req.query.search || ''

        const result = await getAllEtudiantsAvecMoyennes(page, limit, {
            filiere,
            niveau,
            semestre,
            search
        })

        if (result.success) {
            res.json(result)
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// Obtenir les détails d'un étudiant
router.get('/etudiants/:id', async (req, res) => {
    try {
        const { id } = req.params
        const semestre = req.query.semestre || null
        const result = await getEtudiantDetails(id, semestre)

        if (result.success) {
            res.json(result)
        } else {
            res.status(404).json(result)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'étudiant:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// Obtenir les meilleurs étudiants
router.get('/meilleurs-etudiants', async (req, res) => {
    try {
        const filiere = req.query.filiere || 'TOUS'
        const niveau = req.query.niveau || 'TOUS'
        const semestre = req.query.semestre || 'TOUS'
        const limit = parseInt(req.query.limit) || 50

        const result = await getMeilleursEtudiants({
            filiere,
            niveau,
            semestre,
            limit
        })

        if (result.success) {
            res.json(result)
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des meilleurs étudiants:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// Obtenir les statistiques complètes
router.get('/statistiques', async (req, res) => {
    try {
        const result = await getStatistiquesDEP()

        if (result.success) {
            res.json(result)
        } else {
            res.status(500).json(result)
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// Vérification du rôle (optionnel - à activer selon besoins)
// router.use((req, res, next) => {
//   // Vérifier si l'utilisateur a le rôle DEP ou ADMIN
//   next()
// })

// Obtenir les bulletins en attente
router.get('/bulletins/en-attente', async (req, res) => {
    const result = await getBulletinsEnAttente()
    if (result.success) {
        res.json(result)
    } else {
        res.status(500).json(result)
    }
})

// Obtenir l'historique des bulletins visés
router.get('/bulletins/vises', async (req, res) => {
    const result = await getBulletinsVises()
    if (result.success) {
        res.json(result)
    } else {
        res.status(500).json(result)
    }
})

// Viser un bulletin
router.post('/bulletins/:id/viser', async (req, res) => {
    const { id } = req.params
    const depId = req.user.id // ID de l'utilisateur connecté

    const result = await viserBulletin(id, depId)
    if (result.success) {
        res.json(result)
    } else {
        res.status(500).json(result)
    }
})

// Prévisualiser un bulletin (le premier du lot)
router.get('/bulletins/:id/preview', async (req, res) => {
    try {
        const { id } = req.params

        // 1. Récupérer les infos du lot
        const { data: lot, error: lotError } = await supabaseAdmin
            .from('bulletins_generes')
            .select('*')
            .eq('id', id)
            .single()

        if (lotError || !lot) {
            return res.status(404).json({ success: false, error: 'Lot introuvable' })
        }

        // 2. Trouver un bulletin représentatif (le premier étudiant) avec les infos du DEP
        const { data: bulletin, error: bulletinError } = await supabaseAdmin
            .from('bulletins')
            .select(`
                *,
                etudiants (id, nom, prenom, matricule, date_naissance, lieu_naissance),
                classes (id, code, nom, filieres (code, nom), niveaux (code)),
                promotions (annee),
                dep:utilisateurs!bulletins_dep_id_fkey (id, nom, prenom)
            `)
            .eq('classe_id', lot.classeId)
            .eq('semestre', lot.semestre)
            .eq('annee_academique', lot.anneeAcademique)
            .limit(1)
            .single()

        if (bulletinError || !bulletin) {
            return res.status(404).json({ success: false, error: 'Aucun bulletin individuel trouvé pour ce lot' })
        }

        // 3. Récupérer les données complètes
        const bulletinDataResult = await getBulletinData(
            bulletin.classe_id,
            bulletin.semestre,
            lot.departementId
        )

        if (!bulletinDataResult.success) {
            return res.status(400).json({ success: false, error: bulletinDataResult.error })
        }

        // 4. Extraire les données de l'étudiant
        const etudiantData = bulletinDataResult.data.find(
            item => item.etudiant?.id === bulletin.etudiant_id
        )

        if (!etudiantData) {
            return res.status(404).json({ success: false, error: 'Données calculées non trouvées' })
        }

        // 5. Préparer les données PDF (Logique copiée de chefsDepartement.js)
        const etudiant = bulletin.etudiants || {}
        const classe = bulletin.classes || {}
        const promotion = bulletin.promotions || {}
        const modules = etudiantData.modules || []

        const pdfData = {
            student: {
                nom: etudiant.nom || '',
                prenom: etudiant.prenom || '',
                matricule: etudiant.matricule || '',
                dateNaissance: etudiant.date_naissance
                    ? new Date(etudiant.date_naissance).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })
                    : 'N/A',
                lieuNaissance: etudiant.lieu_naissance || 'N/A'
            },
            classe: {
                code: classe.code || '',
                nom: classe.nom || '',
                option: classe.filieres?.nom || ''
            },
            semestre: bulletin.semestre || '',
            anneeUniversitaire: promotion.annee || '',
            modules: modules.map(mod => ({
                ue: mod.ue || 'UE',
                nom: mod.nom || '',
                credits: mod.credit || 0,
                coefficient: mod.credit || 1, // Fix: Coefficient = Credit
                noteEtudiant: mod.moyenne || 0,
                moyenneClasse: mod.moyenneClasse || 0,
                status: mod.status || (mod.valide ? 'ACQUIS' : 'NON_ACQUIS')
            })),
            moyenneSemestre: etudiantData.moyenneGenerale || 0,
            rangEtudiant: etudiantData.rang || null,
            mention: etudiantData.mention || getMention(etudiantData.moyenneGenerale || 0),
            penalitesAbsences: 0,
            uesValidees: etudiantData.uesValidees || [],
            decision: etudiantData.statut === 'VALIDE'
                ? `Semestre ${bulletin.semestre === 'S1' ? '1' : '2'} validé`
                : `Semestre ${bulletin.semestre === 'S1' ? '1' : '2'} ajourné`,
            dateGeneration: new Date().toISOString()
        }

        // 6. Générer le PDF
        const uploadsDir = path.join(__dirname, '../../uploads')
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

        const timestamp = Date.now()
        const outputPath = path.join(uploadsDir, `preview_${id}_${timestamp}.pdf`)
        // DEP : toujours inclure le cachet car c'est le DEP qui l'appose
        const includeStamp = true

        // Préparer les informations du DEP pour le cachet
        // Utiliser le DEP connecté ou celui qui a visé le bulletin
        let depInfo = null
        if (req.user && req.user.role === 'DEP') {
            // Utiliser les informations du DEP connecté
            depInfo = {
                dateVisa: lot.dateVisa || bulletin?.date_visa || new Date().toISOString(),
                nom: req.user.nom || '',
                prenom: req.user.prenom || '',
                titre: 'Directeur des Études et de la Pédagogie' // Titre du DEP
            }
        } else if (bulletin && bulletin.dep) {
            // Utiliser les informations du DEP qui a visé le bulletin
            depInfo = {
                dateVisa: bulletin.date_visa || lot.dateVisa || new Date().toISOString(),
                nom: bulletin.dep.nom || '',
                prenom: bulletin.dep.prenom || '',
                titre: 'Directeur des Études et de la Pédagogie' // Titre du DEP
            }
        }

        await generateBulletinPDF(pdfData, outputPath, includeStamp, depInfo)

        // 7. Envoyer et supprimer
        res.download(outputPath, `Apercu_${lot.semestre}_${classe.code}.pdf`, (err) => {
            if (err) console.error('Erreur download:', err)
            // Nettoyage asynchrone
            setTimeout(() => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
            }, 60000) // Garder 1 min max
        })

    } catch (error) {
        console.error('Erreur preview:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
