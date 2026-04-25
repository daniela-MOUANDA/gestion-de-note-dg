import express from 'express'
import { supabaseAdmin } from '../../src/lib/supabase.js'
import { getBulletinData } from '../../src/services/chefDepartement/relevesService.js'
import { getMention } from '../utils/mentions.js'
import { verifyBulletinVerificationToken } from '../services/bulletinVerifyToken.js'
import { resolveSemestreForClasseLevel } from '../utils/bulletinSemestreResolve.js'

const router = express.Router()

/**
 * Vérification publique d'authenticité d'un bulletin (scan QR).
 * GET /api/public/verify-bulletin?token=...
 */
router.get('/verify-bulletin', async (req, res) => {
  try {
    const token = req.query.token
    const payload = verifyBulletinVerificationToken(token)
    if (!payload?.bid) {
      return res.status(400).json({
        success: false,
        error: 'Lien de vérification invalide ou expiré.'
      })
    }

    const { data: bulletin, error: bulletinError } = await supabaseAdmin
      .from('bulletins')
      .select(`
        id,
        etudiant_id,
        classe_id,
        semestre,
        date_generation,
        statut_visa,
        date_visa,
        etudiants (id, nom, prenom, matricule, photo, date_naissance, nationalite, sexe),
        classes (id, code, nom, niveaux (code), filieres (id, code, nom, departement_id)),
        promotions (annee)
      `)
      .eq('id', payload.bid)
      .single()

    if (bulletinError || !bulletin) {
      return res.status(404).json({
        success: false,
        error: 'Aucun bulletin officiel ne correspond à ce code.'
      })
    }

    const departementId = bulletin.classes?.filieres?.departement_id
    if (!departementId) {
      return res.status(500).json({
        success: false,
        error: 'Référence département manquante pour ce bulletin.'
      })
    }

    const semestreCalcul = resolveSemestreForClasseLevel(
      bulletin.semestre,
      bulletin.classes?.niveaux?.code,
      null
    )

    const bulletinDataResult = await getBulletinData(
      bulletin.classe_id,
      semestreCalcul,
      departementId
    )

    if (!bulletinDataResult.success) {
      return res.status(400).json({
        success: false,
        error: bulletinDataResult.error || 'Impossible de recalculer les données du bulletin.'
      })
    }

    const etudiantData = bulletinDataResult.data.find(
      (item) => item.etudiant?.id === bulletin.etudiant_id
    )

    if (!etudiantData) {
      return res.status(404).json({
        success: false,
        error: 'Données de l’étudiant introuvables pour ce bulletin.'
      })
    }

    const decision =
      etudiantData.avisJury ||
      (etudiantData.statut === 'VALIDE' ? 'Semestre valide' : 'Semestre non Valide')

    const creditsObtenus = (etudiantData.uesValidees || []).reduce(
      (s, ue) => s + (ue.credits || 0),
      0
    )
    const creditsRequis = (etudiantData.uesValidees || []).reduce(
      (s, ue) => s + (ue.totalCredits || 0),
      0
    )

    const etu = bulletin.etudiants || {}
    const cls = bulletin.classes || {}
    const fil = cls.filieres || {}
    const promo = bulletin.promotions || {}

    return res.json({
      success: true,
      authentic: true,
      institution: {
        nom: 'Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC)',
        service: 'Direction des Études et de la Pédagogie',
        pays: 'Gabon'
      },
      bulletin: {
        id: bulletin.id,
        etudiant: {
          nom: etu.nom || '',
          prenom: etu.prenom || '',
          matricule: etu.matricule || '',
          photo: etu.photo || null,
          dateNaissance: etu.date_naissance || null,
          nationalite: etu.nationalite || null,
          sexe: etu.sexe || null
        },
        classe: cls.nom || cls.code || '',
        filiere: fil.nom || fil.code || '',
        semestre: semestreCalcul,
        anneeUniversitaire: promo.annee || '',
        moyenneSemestre: etudiantData.moyenneGenerale ?? null,
        mention:
          etudiantData.mention || getMention(etudiantData.moyenneGenerale || 0),
        rang: etudiantData.rang ?? null,
        effectifClasse: bulletinDataResult.meta?.etudiantsCount ?? null,
        decision,
        creditsValides: creditsObtenus,
        creditsTotaux: creditsRequis,
        statutVisa: bulletin.statut_visa,
        dateVisa: bulletin.date_visa,
        dateGeneration: bulletin.date_generation
      },
      message:
        'Ce bulletin correspond à un enregistrement officiel dans le système de gestion des notes de l’INPTIC.'
    })
  } catch (error) {
    console.error('verify-bulletin:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
