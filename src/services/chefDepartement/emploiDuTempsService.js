import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir l'emploi du temps d'une classe
export const getEmploiDuTempsByClasse = async (classeId, semestre, departementId) => {
  try {
    const { data: classe } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*, departements (*))')
      .eq('id', classeId)
      .single()

    if (!classe || classe.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Classe introuvable ou n\'appartient pas à votre département'
      }
    }

    const { data: emploisTemps, error } = await supabaseAdmin
      .from('emplois_du_temps')
      .select('*, modules (*), enseignants (*)')
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
      .order('jour', { ascending: true })
      .order('heure_debut', { ascending: true })

    if (error) throw error

    return {
      success: true,
      emploisTemps: (emploisTemps || []).map(edt => ({
        id: edt.id,
        jour: edt.jour,
        heureDebut: edt.heure_debut,
        heureFin: edt.heure_fin,
        salle: edt.salle,
        module: edt.modules ? {
          id: edt.modules.id,
          code: edt.modules.code,
          nom: edt.modules.nom
        } : null,
        enseignant: edt.enseignants ? {
          id: edt.enseignants.id,
          nom: edt.enseignants.nom,
          prenom: edt.enseignants.prenom
        } : null
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération de l\'emploi du temps'
    }
  }
}

// Créer un emploi du temps
export const createEmploiDuTemps = async (data, departementId) => {
  try {
    const { classeId, moduleId, enseignantId, jour, heureDebut, heureFin, salle, semestre, anneeAcademique } = data

    if (!classeId || !moduleId || !enseignantId || !jour || !heureDebut || !heureFin || !semestre || !anneeAcademique) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la classe appartient au département
    const { data: classe } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*, departements (*))')
      .eq('id', classeId)
      .single()

    if (!classe || classe.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Classe introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier le module
    const { data: module } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (!module || module.departement_id !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier l'enseignant
    const { data: enseignant } = await supabaseAdmin
      .from('enseignants')
      .select('*')
      .eq('id', enseignantId)
      .single()

    if (!enseignant || enseignant.departement_id !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier les conflits d'horaires
    const { data: conflits } = await supabaseAdmin
      .from('emplois_du_temps')
      .select('id')
      .eq('classe_id', classeId)
      .eq('jour', jour)
      .eq('semestre', semestre)
      .or(`and(heure_debut.lte.${heureDebut},heure_fin.gt.${heureDebut}),and(heure_debut.lt.${heureFin},heure_fin.gte.${heureFin})`)

    if (conflits && conflits.length > 0) {
      return {
        success: false,
        error: 'Conflit d\'horaire détecté pour cette classe'
      }
    }

    const { data: emploiDuTemps, error } = await supabaseAdmin
      .from('emplois_du_temps')
      .insert({
        classe_id: classeId,
        module_id: moduleId,
        enseignant_id: enseignantId,
        jour,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        salle,
        semestre,
        annee_academique: anneeAcademique
      })
      .select('*, modules (*), enseignants (*)')
      .single()

    if (error) throw error

    return {
      success: true,
      emploiDuTemps: {
        id: emploiDuTemps.id,
        jour: emploiDuTemps.jour,
        heureDebut: emploiDuTemps.heure_debut,
        heureFin: emploiDuTemps.heure_fin,
        salle: emploiDuTemps.salle,
        module: emploiDuTemps.modules ? {
          id: emploiDuTemps.modules.id,
          code: emploiDuTemps.modules.code,
          nom: emploiDuTemps.modules.nom
        } : null,
        enseignant: emploiDuTemps.enseignants ? {
          id: emploiDuTemps.enseignants.id,
          nom: emploiDuTemps.enseignants.nom,
          prenom: emploiDuTemps.enseignants.prenom
        } : null
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'emploi du temps'
    }
  }
}

// Supprimer un emploi du temps
export const deleteEmploiDuTemps = async (id, departementId) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('emplois_du_temps')
      .select('*, classes (*, filieres (*, departements (*)))')
      .eq('id', id)
      .single()

    if (!existing || existing.classes?.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Emploi du temps introuvable ou n\'appartient pas à votre département'
      }
    }

    const { error } = await supabaseAdmin
      .from('emplois_du_temps')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Emploi du temps supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'emploi du temps:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'emploi du temps'
    }
  }
}
