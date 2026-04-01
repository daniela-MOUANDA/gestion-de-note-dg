import express from 'express'
import path from 'path'
import fs from 'fs'
import XLSX from 'xlsx'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import {
  createChefDepartement,
  getAllChefsDepartement,
  updateChefDepartement,
  deleteChefDepartement,
  getDepartementEnseignants,
  getDepartementModules,
  getDepartementClasses,
  getDepartementFilieres,
  getDepartementStatsGlobales,
  getEtudiantsPourRepartition,
  createClassesFromRepartition,
  getNiveaux,
  getEtudiantsByClasse,
  getEtudiantsPourRepartitionManuelle,
  reclasserEtudiantsManuellement
} from '../../src/services/chefDepartementService.js'
import {
  getModulesByDepartement,
  createModule,
  updateModule as updateModuleService,
  deleteModule as deleteModuleService,
  importModulesFromExcelBuffer
} from '../../src/services/chefDepartement/moduleService.js'
import {
  getClassesByDepartement,
  createClasse as createClasseService,
  updateClasse as updateClasseService,
  deleteClasse as deleteClasseService
} from '../../src/services/chefDepartement/classeService.js'
import {
  getEnseignantsByDepartement,
  createEnseignant,
  updateEnseignant as updateEnseignantService,
  deleteEnseignant as deleteEnseignantService,
  affecterModules
} from '../../src/services/chefDepartement/enseignantService.js'
import {
  getParametresNotation,
  saveParametresNotation,
  getNotesByModuleClasse,
  saveNotesBulk,
  deleteNote as deleteNoteService
} from '../../src/services/chefDepartement/noteService.js'
import {
  getEtudiantsParDepartement,
  getEtudiantDetailsChef
} from '../../src/services/chefDepartement/etudiantsService.js'
import {
  createEmploiDuTempsAvecPeriode,
  getEmploiDuTempsByPeriode,
  updateGroupeRecurrence,
  deleteGroupeRecurrence,
  deleteEmploiDuTempsById,
  updateEmploiDuTempsById,
  getHistoriqueEmploisDuTemps,
  deleteEmploiDuTempsPeriode
} from '../../src/services/chefDepartement/emploiDuTempsPeriodeService.js'

import { getBulletinData } from '../../src/services/chefDepartement/relevesService.js'
import { getMeilleursEtudiantsParFiliere } from '../../src/services/chefDepartementService.js'
import { verifierEtatBulletins, genererBulletins, getEtatBulletinsToutesClasses } from '../../src/services/chefDepartement/bulletinService.js'
import { supabaseAdmin } from '../../src/lib/supabase.js'
import { fetchPromotionForCurrentAcademicYear, getCurrentAcademicYearLabel } from '../../src/utils/academicYear.js'
import { getMention } from '../utils/mentions.js'
// Imports des générateurs PDF
import { generateBulletinPDF } from '../services/bulletinPDFGenerator.js'
import { generatePlanchePDF } from '../services/planchePDFGenerator.js'
import { generatePlancheAnnuelPDF } from '../services/plancheAnnuelPDFGenerator.js'
import { generatePlancheExcel, generateAnnualExcel } from '../services/plancheExcelGenerator.js'
import { getAnnualPlancheData } from '../../src/services/chefDepartement/plancheAnnuelService.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadModulesExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop())
    const mimetype =
      allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    if (mimetype && extname) return cb(null, true)
    cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'))
  }
})

const router = express.Router()

/** Nom affichable de la filière pour exports planches (query > relation embed > table filieres) */
async function resolveFiliereNomPourPlanche(classe, queryFiliereNom) {
  const q = String(queryFiliereNom ?? '').trim()
  if (q) return q
  const f = classe?.filieres
  const embedded = Array.isArray(f) ? f[0]?.nom : f?.nom
  if (embedded) return embedded
  if (classe?.filiere_id) {
    const { data } = await supabaseAdmin
      .from('filieres')
      .select('nom, code')
      .eq('id', classe.filiere_id)
      .maybeSingle()
    if (data?.nom) return data.nom
    if (data?.code) return data.code
  }
  return 'Filière inconnue'
}

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// Middleware pour vérifier que l'utilisateur est un DEP (ADMIN ou un rôle spécifique)
// Pour l'instant, on accepte tous les utilisateurs authentifiés
// Vous pouvez ajouter une vérification de rôle spécifique ici
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    })
  }
  next()
})

// ============================================
// ROUTES DASHBOARD CHEF DEPARTEMENT
// ============================================

router.get('/enseignants', async (req, res) => {
  try {
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé à votre compte" });
    }

    const result = await getEnseignantsByDepartement(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Créer un enseignant
router.post('/enseignants', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await createEnseignant(req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json(result)
  } catch (error) {
    console.error('Erreur création enseignant:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Modifier un enseignant
router.put('/enseignants/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await updateEnseignantService(id, req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur modification enseignant:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer un enseignant
router.delete('/enseignants/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await deleteEnseignantService(id, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur suppression enseignant:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Affecter des modules à un enseignant
router.post('/enseignants/:id/affecter-modules', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const { moduleIds } = req.body

    const result = await affecterModules(id, moduleIds, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur affectation modules:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// ROUTES MODULES
// ============================================

// Modèle Excel pour import groupé (en-têtes + lignes d'exemple + feuille d'aide)
router.get('/modules/import-template', async (req, res) => {
  try {
    if (!req.user.departementId) {
      return res.status(403).json({ success: false, error: 'Aucun département associé' })
    }

    const anneeEx = getCurrentAcademicYearLabel()

    const headers = [
      'filiere_code',
      'nom',
      'credit',
      'semestre',
      'ue',
      'nom_ue',
      'annee_academique',
      'actif'
    ]

    const exampleRows = [
      ['MMI-WM', 'Exemple : Base de données', 4, 'S5', 'UE1', 'Fondamentaux informatiques', anneeEx, 'Oui'],
      ['MMI-CD', 'Exemple : Programmation web', 5, 'S5', 'UE1', '', anneeEx, 'Oui']
    ]

    const aide = [
      ['Import groupé des modules (Chef de département)'],
      [''],
      [`• filiere_code : code exact du parcours (ex. MMI-WM), parmi les filières de votre département.`],
      [`• Si vous laissez filiere_code vide, choisissez une filière par défaut dans la fenêtre d'import.`],
      [`• Obligatoires : nom, credit, semestre, ue, annee_academique (même libellé qu'une promotion en base, ex. ${anneeEx}).`],
      [`• Le code module est généré automatiquement à l'import, comme depuis le formulaire.`],
      [`• actif : Oui ou Non (vide = Oui).`],
      [`• semestre : S1, S2, … S6. Supprimez les lignes « Exemple » avant d'importer.`]
    ]

    const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])
    wsData['!cols'] = [
      { wch: 14 },
      { wch: 34 },
      { wch: 8 },
      { wch: 10 },
      { wch: 8 },
      { wch: 30 },
      { wch: 18 },
      { wch: 8 }
    ]

    const wsAide = XLSX.utils.aoa_to_sheet(aide)
    wsAide['!cols'] = [{ wch: 92 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsData, 'Modules')
    XLSX.utils.book_append_sheet(wb, wsAide, 'Aide')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Disposition', 'attachment; filename="modele_import_modules.xlsx"')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.end(Buffer.from(buf))
  } catch (error) {
    console.error('Erreur modèle import modules:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtenir tous les modules du département
router.get('/modules', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getModulesByDepartement(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Créer un nouveau module
router.post('/modules', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await createModule(req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json(result)
  } catch (error) {
    console.error('Erreur création module:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/modules/import', (req, res, next) => {
  uploadModulesExcel.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Fichier invalide' })
    }
    next()
  })
}, async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Aucun département associé' })
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'Fichier manquant', created: 0, errors: [] })
    }
    const rawDefault = req.body?.defaultFiliereId
    const defaultFiliereId =
      rawDefault != null && String(rawDefault).trim() !== '' ? String(rawDefault).trim() : null
    const result = await importModulesFromExcelBuffer(req.file.buffer, departementId, defaultFiliereId)

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        created: result.created,
        errors: result.errors
      })
    }

    const failed = result.errors?.length > 0
    const ok = result.created > 0 && !failed
    const status = result.created === 0 ? 400 : 200
    res.status(status).json({
      success: ok,
      partial: result.created > 0 && failed,
      created: result.created,
      errors: result.errors || []
    })
  } catch (error) {
    console.error('Erreur import modules Excel:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Modifier un module
router.put('/modules/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await updateModuleService(id, req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur modification module:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer un module
router.delete('/modules/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await deleteModuleService(id, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur suppression module:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/classes', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getClassesByDepartement(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Créer une nouvelle classe
router.post('/classes', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await createClasseService(req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json(result)
  } catch (error) {
    console.error('Erreur création classe:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Modifier une classe
router.put('/classes/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await updateClasseService(id, req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur modification classe:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer une classe
router.delete('/classes/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await deleteClasseService(id, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur suppression classe:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/filieres', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementFilieres(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/** Liste des promotions (années académiques) pour les modules, bulletins, etc. */
router.get('/promotions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('id, annee, statut')
      .order('annee', { ascending: false })

    if (error) throw error
    res.json({ success: true, promotions: data || [] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getDepartementStatsGlobales(departementId)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/repartition/count', async (req, res) => {
  try {
    // Query params: filiereId, niveauId, formation
    const { filiereId, niveauId, formation } = req.query
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getEtudiantsPourRepartition(departementId, filiereId, niveauId, formation)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/repartition/create', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await createClassesFromRepartition(req.body)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/repartition/classes-existantes', async (req, res) => {
  try {
    const { filiereId, niveauId, formation } = req.query
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const { getClassesExistantes } = await import('../../src/services/chefDepartementService.js')
    const result = await getClassesExistantes(departementId, filiereId, niveauId, formation)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/repartition/affecter-classe', async (req, res) => {
  try {
    const { filiereId, niveauId, classeId, inscriptionIds, formation } = req.body
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const { affecterEtudiantsAClasse } = await import('../../src/services/chefDepartementService.js')
    const result = await affecterEtudiantsAClasse(departementId, filiereId, niveauId, classeId, inscriptionIds, formation)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/repartition/etudiants-tous', async (req, res) => {
  try {
    const { filiereId, niveauId, formation } = req.query
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getEtudiantsPourRepartitionManuelle(departementId, filiereId, niveauId, formation)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/repartition/reclasser-manuel', async (req, res) => {
  try {
    const { filiereId, niveauId, classeId, inscriptionIds, mode } = req.body
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await reclasserEtudiantsManuellement(departementId, filiereId, niveauId, classeId, inscriptionIds, mode)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/niveaux', async (req, res) => {
  try {
    const result = await getNiveaux()
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    return { success: false, error: error.message }
  }
})

router.get('/repartition/classes/:id/etudiants', async (req, res) => {
  try {
    const { id } = req.params
    const result = await getEtudiantsByClasse(id)
    if (!result.success) return res.status(400).json(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// ROUTES ADMINISTRATION (CRUD CHEFS)
// ============================================

// Obtenir tous les chefs de département
router.get('/', async (req, res) => {
  try {
    const result = await getAllChefsDepartement()

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      chefs: result.chefs
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des chefs de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération des chefs de département'
    })
  }
})

// Créer un nouveau chef de département
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = req.body

    if (!nom || !prenom || !email || !departementId || !motDePasse) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      })
    }

    const result = await createChefDepartement(
      { nom, prenom, email, telephone, departementId, motDePasse, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json({
      success: true,
      chef: result.chef,
      message: 'Chef de département créé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la création du chef de département'
    })
  }
})

// Mettre à jour un chef de département
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = req.body

    const result = await updateChefDepartement(
      id,
      { nom, prenom, email, telephone, departementId, motDePasse, actif },
      req.user.id
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      chef: result.chef,
      message: 'Chef de département modifié avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du chef de département'
    })
  }
})

// Supprimer un chef de département
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await deleteChefDepartement(id, req.user.id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      message: 'Chef de département supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du chef de département:', error)
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la suppression du chef de département'
    })
  }
})

// ============================================
// ROUTES NOTES ET PARAMÈTRES DE NOTATION
// ============================================

// Obtenir les paramètres de notation d'un module
router.get('/notes/parametres/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params
    const { semestre } = req.query

    const result = await getParametresNotation(moduleId, semestre)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Sauvegarder les paramètres de notation
router.post('/notes/parametres', async (req, res) => {
  try {
    const result = await saveParametresNotation(req.body)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtenir les notes par module et classe
router.get('/notes/module/:moduleId/classe/:classeId', async (req, res) => {
  try {
    const { moduleId, classeId } = req.params
    const { semestre } = req.query

    const result = await getNotesByModuleClasse(moduleId, classeId, semestre)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Sauvegarder plusieurs notes en une fois
router.post('/notes/bulk', async (req, res) => {
  try {
    const departementId = req.user.departementId
    const result = await saveNotesBulk(req.body.notes, departementId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer une note
router.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await deleteNoteService(id)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// ROUTES EMPLOI DU TEMPS AVEC PÉRIODE
// ============================================

// Créer un emploi du temps avec période et réplication automatique
router.post('/emploi-du-temps/periode', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await createEmploiDuTempsAvecPeriode(req.body, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.status(201).json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtenir l'emploi du temps par période
router.get('/emploi-du-temps/periode/:classeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId } = req.params
    const { semestre, dateDebut, dateFin } = req.query

    const result = await getEmploiDuTempsByPeriode(classeId, semestre, dateDebut, dateFin, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer un emploi du temps pour une période (Historique)
router.delete('/emploi-du-temps/periode', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId, dateDebut, dateFin } = req.query

    if (!classeId || !dateDebut || !dateFin) {
      return res.status(400).json({ success: false, error: "Paramètres manquants (classeId, dateDebut, dateFin)" })
    }

    const result = await deleteEmploiDuTempsPeriode(classeId, dateDebut, dateFin, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtenir l'historique des périodes
router.get('/emploi-du-temps/historique', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await getHistoriqueEmploisDuTemps(departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Mettre à jour un groupe de récurrence
router.put('/emploi-du-temps/groupe/:groupeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { groupeId } = req.params
    const result = await updateGroupeRecurrence(groupeId, req.body, departementId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer un groupe de récurrence
router.delete('/emploi-du-temps/groupe/:groupeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { groupeId } = req.params
    const result = await deleteGroupeRecurrence(groupeId, departementId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Supprimer une occurrence spécifique
router.delete('/emploi-du-temps/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await deleteEmploiDuTempsById(id, departementId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Mettre à jour une occurrence spécifique
router.put('/emploi-du-temps/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { id } = req.params
    const result = await updateEmploiDuTempsById(id, req.body, departementId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtenir le bulletin de notes (relevé)
router.get('/releves/bulletin/:classeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId } = req.params
    const { semestre } = req.query

    if (!semestre) {
      return res.status(400).json({ success: false, error: "Le paramètre semestre est requis" })
    }

    const result = await getBulletinData(classeId, semestre, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Récupérer les meilleurs étudiants par filière
router.get('/statistiques/meilleurs-etudiants', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const result = await getMeilleursEtudiantsParFiliere(departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Récupérer l'état des bulletins pour toutes les classes
router.get('/bulletins/etat-toutes-classes', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { semestre } = req.query

    const result = await getEtatBulletinsToutesClasses(departementId, semestre)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Vérifier l'état des bulletins pour une classe et un semestre
router.get('/bulletins/verifier/:classeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId } = req.params
    const { semestre } = req.query

    if (!semestre) {
      return res.status(400).json({ success: false, error: "Le paramètre semestre est requis" })
    }

    const result = await verifierEtatBulletins(classeId, semestre, departementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Générer les bulletins pour une classe et un semestre
router.post('/bulletins/generer/:classeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    const chefDepartementId = req.user.id
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId } = req.params
    const { semestre } = req.query

    if (!semestre) {
      return res.status(400).json({ success: false, error: "Le paramètre semestre est requis" })
    }

    const result = await genererBulletins(classeId, semestre, departementId, chefDepartementId)
    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Récupérer les bulletins générés pour une classe et un semestre
router.get('/bulletins/classe/:classeId', async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { classeId } = req.params
    const { semestre } = req.query

    if (!semestre) {
      return res.status(400).json({ success: false, error: "Le paramètre semestre est requis" })
    }

    const promotion = await fetchPromotionForCurrentAcademicYear(supabaseAdmin)

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Aucune promotion trouvée' })
    }

    // Récupérer les inscrits actifs de la classe
    const { data: inscriptions } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiant_id')
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')

    const validStudentIds = inscriptions ? inscriptions.map(i => i.etudiant_id) : []

    // Récupérer les bulletins
    const { data: bulletins, error: bulletinsError } = await supabaseAdmin
      .from('bulletins')
      .select(`
        id,
        etudiant_id,
        semestre,
        date_generation,
        statut_visa,
        etudiants!inner (
          id,
          nom,
          prenom,
          matricule
        )
      `)
      .eq('promotion_id', promotion.id)
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
      .in('etudiant_id', validStudentIds)

    if (bulletinsError) throw bulletinsError

    // Trier les bulletins par nom d'étudiant
    const bulletinsTries = (bulletins || []).sort((a, b) => {
      const nomA = `${a.etudiants?.nom || ''} ${a.etudiants?.prenom || ''}`.trim()
      const nomB = `${b.etudiants?.nom || ''} ${b.etudiants?.prenom || ''}`.trim()
      return nomA.localeCompare(nomB)
    })

    res.json({
      success: true,
      bulletins: bulletinsTries,
      nombreBulletins: bulletinsTries.length
    })
  } catch (error) {
    console.error('Erreur:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Récupérer le PDF d'un bulletin individuel
router.get('/bulletins/:bulletinId/pdf', authenticate, async (req, res) => {
  try {
    const departementId = req.user.departementId
    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    const { bulletinId } = req.params

    // Récupérer le bulletin
    const { data: bulletin, error: bulletinError } = await supabaseAdmin
      .from('bulletins')
      .select(`
        id,
        etudiant_id,
        classe_id,
        semestre,
        promotion_id,
        etudiants!inner (
          id,
          nom,
          prenom,
          matricule
        ),
        classes!inner (
          id,
          nom,
          code,
          filiere_id,
          filieres!inner (
            id,
            code,
            nom
          )
        )
      `)
      .eq('id', bulletinId)
      .single()

    if (bulletinError || !bulletin) {
      return res.status(404).json({ success: false, error: 'Bulletin non trouvé' })
    }

    // Vérifier que le bulletin appartient au département
    // (on peut vérifier via la classe qui devrait avoir le même département)

    // Récupérer les données du bulletin pour générer le PDF
    const bulletinDataResult = await getBulletinData(bulletin.classe_id, bulletin.semestre, departementId)

    if (!bulletinDataResult.success) {
      return res.status(400).json({ success: false, error: bulletinDataResult.error })
    }

    // Trouver les données de l'étudiant spécifique
    const etudiantData = bulletinDataResult.data.find(
      item => item.etudiant?.id === bulletin.etudiant_id
    )

    if (!etudiantData) {
      return res.status(404).json({ success: false, error: 'Données de l\'étudiant non trouvées' })
    }

    // Retourner les données JSON pour génération côté client
    return res.json({
      success: true,
      data: {
        ...etudiantData,
        classe: bulletin.classes?.nom || bulletin.classes?.code || 'N/A',
        filiere: bulletin.classes?.filieres?.nom || bulletin.classes?.filieres?.code || 'N/A'
      },
      meta: bulletinDataResult.meta,
      bulletin: {
        id: bulletin.id,
        semestre: bulletin.semestre,
        date_generation: bulletin.date_generation
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du PDF:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/releves/bulletin/:classeId', async (req, res) => {
  try {
    const { classeId } = req.params
    const { semestre } = req.query
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' })
    }

    const result = await getBulletinData(classeId, semestre, departementId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/releves/annual/:classeId', async (req, res) => {
  try {
    const { classeId } = req.params
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' })
    }

    const result = await getAnnualPlancheData(classeId, departementId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Télécharger le bulletin en PDF (template officiel INPTIC)
router.get('/bulletins/:id/download-pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: "Aucun département associé" })
    }

    // Récupérer les données du bulletin
    const { data: bulletin, error: bulletinError } = await supabaseAdmin
      .from('bulletins')
      .select(`
        *,
        etudiants (id, nom, prenom, matricule, date_naissance, lieu_naissance),
        classes (id, code, nom, filieres (code, nom), niveaux (code)),
        promotions (annee)
      `)
      .eq('id', id)
      .single()

    // Récupérer le DEP séparément si le bulletin a été visé
    let depUser = null
    if (bulletin && bulletin.dep_id) {
      const { data: dep } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, nom, prenom')
        .eq('id', bulletin.dep_id)
        .single()
      if (dep) {
        depUser = dep
      }
    }

    if (bulletin) {
      bulletin.dep = depUser
    }

    if (bulletinError) {
      console.error('Erreur lors de la récupération du bulletin:', bulletinError)
      return res.status(404).json({ success: false, error: `Bulletin non trouvé: ${bulletinError.message}` })
    }

    if (!bulletin) {
      console.error('Bulletin introuvable avec l\'ID:', id)
      return res.status(404).json({ success: false, error: 'Bulletin non trouvé' })
    }

    // Récupérer les données complètes du bulletin (notes, moyennes, etc.)
    const bulletinDataResult = await getBulletinData(
      bulletin.classe_id,
      bulletin.semestre,
      departementId
    )

    if (!bulletinDataResult.success) {
      return res.status(400).json({ success: false, error: bulletinDataResult.error })
    }

    // Trouver les données de l'étudiant
    const etudiantData = bulletinDataResult.data.find(
      item => item.etudiant?.id === bulletin.etudiant_id
    )

    if (!etudiantData) {
      return res.status(404).json({ success: false, error: 'Données de l\'étudiant non trouvées' })
    }

    // Préparer les données pour le PDF
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
          ? new Date(etudiant.date_naissance).toLocaleDateString('fr-FR')
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
        nom_ue: mod.nom_ue || '',
        nom: mod.nom || '',
        credits: mod.credit || 0,
        coefficient: mod.credit || 1, // Fix: Coefficient = Credit
        noteEtudiant: mod.moyenne || 0,
        moyenneClasse: mod.moyenneClasse || 0,
        status: mod.status || (mod.valide ? 'ACQUIS' : 'NON_ACQUIS')
      })),
      rubriqueMoyenne: {
        moyenneSemestre: etudiantData.moyenneGenerale || 0,
        moyenneClasse: bulletinDataResult.meta.moyenneGeneraleClasse || 0
      },
      moyenneSemestre: etudiantData.moyenneGenerale || 0,
      moyenneClasse: bulletinDataResult.meta.moyenneGeneraleClasse || 0, // Ajout moyenne générale classe
      rangEtudiant: etudiantData.rang || null,
      totalEtudiants: bulletinDataResult.meta.etudiantsCount || 0, // Ajout effectif classe
      mention: etudiantData.mention || getMention(etudiantData.moyenneGenerale || 0),
      penalitesAbsences: 0,
      uesValidees: etudiantData.uesValidees || [], // Utiliser les UEs calculées par le service
      decision: etudiantData.avisJury || (etudiantData.statut === 'VALIDE' ? 'Semestre valide' : 'Semestre non Valide'),
      dateGeneration: bulletin.date_generation || new Date().toISOString()
    }

    // Générer le PDF
    // Note: Le service de génération PDF doit être créé
    // Pour l'instant, retourner une erreur indiquant que le service n'est pas encore implémenté
    try {
      const outputPath = path.join(__dirname, '../uploads', `bulletin_${id}_${Date.now()}.pdf`)

      // S'assurer que le dossier uploads existe
      const uploadsDir = path.join(__dirname, '../uploads')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Inclure le cachet si le bulletin a été visé par le DEP
      // Le statut passe de 'EN_ATTENTE' à 'VISE' quand le DEP appose son visa
      const includeStamp = bulletin.statut_visa === 'VISE'

      // Préparer les informations du DEP si le bulletin a été visé
      let depInfo = null
      if (includeStamp && bulletin.dep) {
        depInfo = {
          dateVisa: bulletin.date_visa || null,
          nom: bulletin.dep.nom || '',
          prenom: bulletin.dep.prenom || '',
          titre: 'Directeur des Études et de la Pédagogie' // Titre du DEP
        }
      }

      await generateBulletinPDF(pdfData, outputPath, includeStamp, depInfo)

      // Envoyer le PDF en téléchargement
      const nomFichier = `Bulletin_${etudiant.nom || 'etudiant'}_${etudiant.prenom || ''}_${bulletin.semestre || 'S1'}.pdf`
      res.download(outputPath, nomFichier, (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du PDF:', err)
        }
        // Supprimer le fichier temporaire après l'envoi
        fs.unlink(outputPath, (unlinkErr) => {
          if (unlinkErr) console.error('Erreur lors de la suppression du fichier temporaire:', unlinkErr)
        })
      })
    } catch (importError) {
      console.error('Erreur lors de l\'import ou de la génération du PDF:', importError)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du PDF: ' + importError.message
      })
    }

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Générer et télécharger la planche (résultats de toute la classe) au format PDF
 */
router.get('/classes/:classeId/planches/:semestre/pdf', async (req, res) => {
  try {
    const { classeId, semestre } = req.params
    console.log(`📑 [Backend] Generation PDF Planche: Classe=${classeId}, Semestre=${semestre}`)
    const departementId = req.user?.departementId
    console.log(`👤 [Backend] User DEP ID:`, departementId)

    if (!departementId) {
      console.error('❌ [Backend] departementId manquant dans req.user')
      return res.status(403).json({ success: false, error: 'Accès non autorisé : Département non identifié' })
    }

    // charger les données consolidées via le service de relevés
    // On réutilise getBulletinData qui calcule déjà tout pour la classe
    const result = await getBulletinData(classeId, semestre, departementId)

    if (!result.success) {
      return res.status(500).json(result)
    }

    const { data: studentsData, meta } = result

    // Récupérer les infos de la classe et de sa promotion
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(nom, code, departements(code)), promotions(annee)')
      .eq('id', classeId)
      .single()

    if (classeError) throw classeError

    const filierePdf = await resolveFiliereNomPourPlanche(classe, '')

    console.log(`📊 [Backend] Students to map:`, studentsData.length)

    // Mapper les données pour le générateur de planche
    const plancheData = {
      classe: {
        nom: classe?.nom || 'Inconnue',
        filiere: filierePdf,
        departement: classe?.filieres?.departements?.code || ''
      },
      anneeUniversitaire: classe?.promotions?.annee || '2024-2025',
      students: studentsData.map(s => {
        if (!s.etudiant) console.warn('⚠️ [Backend] Étudiant manquant dans studentsData pour un item')
        return {
          nom: s.etudiant?.nom || 'N/A',
          prenom: s.etudiant?.prenom || '',
          // matricule: s.etudiant?.matricule,
          modules: (s.modules || []).map(m => ({
            id: m.id,
            nom: m.nom,
            code: m.code,
            noteEtudiant: m.moyenne,
            credit: m.credit
          })),
          uesValidees: s.uesValidees || [],
          moyenneSemestre: s.moyenneGenerale,
          totalCreditsValides: s.totalCreditsValides,
          rangEtudiant: s.rang,
          decision: s.avisJury || (s.statut === 'VALIDE' ? 'Semestre valide' : 'Semestre non Valide'),
          avisJuryKind: s.avisJuryKind || null
        }
      })
    }

    console.log(`📋 [Backend] PlancheData préparé. Nombre d'étudiants:`, plancheData.students.length)

    // Générer le PDF via le nouveau service
    const uploadsDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const outputPath = path.join(uploadsDir, `planche_${classeId}_${Date.now()}.pdf`)
    console.log(`🛠️ [Backend] Appel generatePlanchePDF vers ${outputPath}`)
    await generatePlanchePDF(plancheData, outputPath)

    // Télécharger le fichier
    const fileName = `Planche_${classe?.nom}_${semestre}.pdf`
    res.download(outputPath, fileName, (err) => {
      if (err) console.error('Erreur envoi PDF:', err)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    })

  } catch (error) {
    console.error('❌ [Backend] ERREUR CRITIQUE Planche PDF:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Générer et télécharger la planche au format Excel
 */
router.get('/classes/:classeId/planches/:semestre/excel', async (req, res) => {
  try {
    const { classeId, semestre } = req.params
    const { classeNom: queryClasseNom, filiereNom: queryFiliereNom, phaseLabel: queryPhaseLabel } = req.query
    const departementId = req.user?.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' })
    }

    const result = await getBulletinData(classeId, semestre, departementId)
    if (!result.success) return res.status(500).json(result)

    const { data: studentsData } = result
    const { data: classe } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(nom, code, departements(code)), promotions(annee)')
      .eq('id', classeId)
      .single()

    const filiereLabel = await resolveFiliereNomPourPlanche(classe, queryFiliereNom)
    const phaseLabel = String(queryPhaseLabel ?? '').trim()

    const plancheData = {
      classe: {
        nom: queryClasseNom || classe?.nom || 'Classe Inconnue',
        filiere: filiereLabel,
        departement: (Array.isArray(classe?.filieres) ? (Array.isArray(classe?.filieres[0]?.departements) ? classe?.filieres[0]?.departements[0]?.code : classe?.filieres[0]?.departements?.code) : classe?.filieres?.departements?.code) || 'INPTIC'
      },
      phaseLabel,
      anneeUniversitaire: classe?.promotions?.annee || '2024-2025',
      semestre: semestre,
      students: studentsData.map(s => ({
        nom: s.etudiant?.nom || 'N/A',
        prenom: s.etudiant?.prenom || '',
        modules: (s.modules || []).map(m => ({
          id: m.id,
          nom: m.nom,
          ue: m.ue,
          nom_ue: m.nom_ue,
          noteEtudiant: m.moyenne,
          credit: m.credit
        })),
        uesValidees: s.uesValidees || [],
        moyenneSemestre: s.moyenneGenerale,
        totalCreditsValides: s.totalCreditsValides,
        rangEtudiant: s.rang,
        decision: s.avisJury || (s.statut === 'VALIDE' ? 'Semestre valide' : 'Semestre non Valide'),
        avisJuryKind: s.avisJuryKind || null
      }))
    }

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const outputPath = path.join(tempDir, `planche_${classeId}_${Date.now()}.xlsx`)
    await generatePlancheExcel(plancheData, outputPath)

    res.download(outputPath, `Planche_${classe?.nom}_${semestre}.xlsx`, (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    })
  } catch (error) {
    console.error('❌ [Backend] Erreur Planche Excel:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Générer et télécharger la planche ANNUELLE au format PDF
 */
router.get('/classes/:classeId/planches/annuel/pdf', async (req, res) => {
  try {
    const { classeId } = req.params
    const departementId = req.user?.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' })
    }

    const result = await getAnnualPlancheData(classeId, departementId)
    if (!result.success) return res.status(500).json(result)

    // Infos classe pour l'en-tête
    const { data: classe } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(nom, code), promotions(annee)')
      .eq('id', classeId)
      .single()

    const filiereAnnuelle = await resolveFiliereNomPourPlanche(classe, '')

    const plancheData = {
      classe: {
        nom: classe?.nom,
        filiere: filiereAnnuelle
      },
      anneeUniversitaire: classe?.promotions?.annee,
      semA: result.meta?.semestreA || 'S1',
      semB: result.meta?.semestreB || 'S2',
      students: result.data.map(s => ({
        nom: s.etudiant.nom,
        prenom: s.etudiant.prenom,
        s1: s.s1,
        s2: s.s2,
        annuel: s.annuel
      }))
    }

    const uploadsDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const outputPath = path.join(uploadsDir, `planche_annuelle_${classeId}_${Date.now()}.pdf`)
    await generatePlancheAnnuelPDF(plancheData, outputPath)

    res.download(outputPath, `Planche_Annuelle_${classe?.nom}.pdf`, (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    })
  } catch (error) {
    console.error('❌ [Backend] Erreur Planche Annuelle PDF:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Générer et télécharger la planche ANNUELLE au format Excel
 */
router.get('/classes/:classeId/planches/annuel/excel', async (req, res) => {
  try {
    const { classeId } = req.params
    const { classeNom: queryClasseNom, filiereNom: queryFiliereNom, phaseLabel: queryPhaseLabel } = req.query
    const departementId = req.user?.departementId

    if (!departementId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' })
    }

    const result = await getAnnualPlancheData(classeId, departementId)
    if (!result.success) return res.status(500).json(result)

    const { data: classe } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(nom, code), promotions(annee)')
      .eq('id', classeId)
      .single()

    const filiereLabel = await resolveFiliereNomPourPlanche(classe, queryFiliereNom)
    const phaseLabel = String(queryPhaseLabel ?? '').trim()

    const plancheData = {
      classe: {
        nom: queryClasseNom || classe?.nom,
        filiere: filiereLabel
      },
      phaseLabel,
      anneeUniversitaire: classe?.promotions?.annee,
      semA: result.meta?.semestreA || 'S1',
      semB: result.meta?.semestreB || 'S2',
      students: result.data.map(s => ({
        nom: s.etudiant.nom,
        prenom: s.etudiant.prenom,
        s1: s.s1,
        s2: s.s2,
        annuel: s.annuel
      }))
    }

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const outputPath = path.join(tempDir, `planche_annuelle_${classeId}_${Date.now()}.xlsx`)
    await generateAnnualExcel(plancheData, outputPath)

    res.download(outputPath, `Planche_Annuelle_${classe?.nom}.xlsx`, (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    })
  } catch (error) {
    console.error('❌ [Backend] Erreur Planche Annuelle Excel:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// ROUTES ÉTUDIANTS CHEF DEPARTEMENT
// ============================================

// Obtenir tous les étudiants du département avec leurs moyennes (avec pagination)
router.get('/etudiants', async (req, res) => {
  try {
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({
        success: false,
        error: 'Aucun département associé à votre compte'
      })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const filiere = req.query.filiere || 'TOUS'
    const niveau = req.query.niveau || 'TOUS'
    const semestre = req.query.semestre || 'TOUS'
    const search = req.query.search || ''

    const result = await getEtudiantsParDepartement(departementId, page, limit, {
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

// Obtenir les détails d'un étudiant du département
router.get('/etudiants/:id', async (req, res) => {
  try {
    const departementId = req.user.departementId

    if (!departementId) {
      return res.status(403).json({
        success: false,
        error: 'Aucun département associé à votre compte'
      })
    }

    const { id } = req.params
    const semestre = req.query.semestre || null
    const result = await getEtudiantDetailsChef(id, departementId, semestre)

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

export default router

