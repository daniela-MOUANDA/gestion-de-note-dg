import express from 'express'
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
  getEtudiantsByClasse
} from '../../src/services/chefDepartementService.js'
import {
  getModulesByDepartement,
  createModule,
  updateModule as updateModuleService,
  deleteModule as deleteModuleService
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

const router = express.Router()

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
    // Query params: filiereId, niveauId
    const { filiereId, niveauId } = req.query
    const departementId = req.user.departementId

    if (!departementId) return res.status(403).json({ success: false, error: "Aucun département associé" });

    const result = await getEtudiantsPourRepartition(departementId, filiereId, niveauId)
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

export default router

