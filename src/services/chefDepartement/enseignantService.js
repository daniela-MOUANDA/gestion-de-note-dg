import { supabaseAdmin } from '../../lib/supabase.js'
import { validateTelephone } from '../../utils/validation.js'

// Obtenir tous les enseignants d'un département
export const getEnseignantsByDepartement = async (departementId) => {
  try {
    const { data: enseignants, error } = await supabaseAdmin
      .from('enseignants')
      .select(`
        *,
        affectations_module_enseignant (
          *,
          modules (*, classes (*))
        )
      `)
      .eq('departement_id', departementId)
      .eq('actif', true)
      .order('nom', { ascending: true })

    if (error) throw error

    return {
      success: true,
      enseignants: (enseignants || []).map(ens => ({
        id: ens.id,
        nom: ens.nom,
        prenom: ens.prenom,
        email: ens.email,
        telephone: ens.telephone,
        statut: ens.statut || 'PERMANENT',
        grade: ens.grade,
        modules: (ens.affectations_module_enseignant || []).map(aff => ({
          id: aff.modules?.id,
          code: aff.modules?.code,
          nom: aff.modules?.nom,
          classe: aff.modules?.classes?.code
        })),
        nombreModules: (ens.affectations_module_enseignant || []).length,
        actif: ens.actif
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des enseignants:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des enseignants'
    }
  }
}

// Créer un nouvel enseignant
export const createEnseignant = async (data, departementId) => {
  try {
    const { nom, prenom, email, telephone, statut, grade } = data

    if (!nom || !prenom || !email) {
      return {
        success: false,
        error: 'Nom, prénom et email sont obligatoires'
      }
    }

    // Valider le téléphone si fourni
    if (telephone) {
      const telValidation = validateTelephone(telephone)
      if (!telValidation.isValid) {
        return {
          success: false,
          error: telValidation.error
        }
      }
    }

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabaseAdmin
      .from('enseignants')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé'
      }
    }

    const { data: enseignant, error } = await supabaseAdmin
      .from('enseignants')
      .insert({
        nom,
        prenom,
        email,
        telephone,
        statut: statut || 'PERMANENT',
        grade: grade || null,
        departement_id: departementId,
        actif: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      enseignant: {
        id: enseignant.id,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        email: enseignant.email,
        telephone: enseignant.telephone,
        modules: [],
        nombreModules: 0,
        actif: enseignant.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'enseignant'
    }
  }
}

// Mettre à jour un enseignant
export const updateEnseignant = async (id, data, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('enseignants')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Valider le téléphone si fourni
    if (data.telephone) {
      const telValidation = validateTelephone(data.telephone)
      if (!telValidation.isValid) {
        return {
          success: false,
          error: telValidation.error
        }
      }
    }

    const { data: enseignant, error } = await supabaseAdmin
      .from('enseignants')
      .update({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        statut: data.statut || existing.statut || 'PERMANENT',
        grade: data.grade !== undefined ? data.grade : existing.grade,
        actif: data.actif !== undefined ? data.actif : existing.actif
      })
      .eq('id', id)
      .select(`
        *,
        affectations_module_enseignant (
          *,
          modules (*, classes (*))
        )
      `)
      .single()

    if (error) throw error

    return {
      success: true,
      enseignant: {
        id: enseignant.id,
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        email: enseignant.email,
        telephone: enseignant.telephone,
        modules: (enseignant.affectations_module_enseignant || []).map(aff => ({
          id: aff.modules?.id,
          code: aff.modules?.code,
          nom: aff.modules?.nom,
          classe: aff.modules?.classes?.code
        })),
        nombreModules: (enseignant.affectations_module_enseignant || []).length,
        actif: enseignant.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de l\'enseignant'
    }
  }
}

// Supprimer un enseignant
export const deleteEnseignant = async (id, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('enseignants')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier les affectations
    const { count: affectationsCount } = await supabaseAdmin
      .from('affectations_module_enseignant')
      .select('*', { count: 'exact', head: true })
      .eq('enseignant_id', id)

    // Vérifier les notes
    const { count: notesCount } = await supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('enseignant_id', id)

    if ((affectationsCount || 0) > 0 || (notesCount || 0) > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un enseignant qui a des affectations ou des notes'
      }
    }

    const { error } = await supabaseAdmin
      .from('enseignants')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Enseignant supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enseignant:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'enseignant'
    }
  }
}

// Affecter un enseignant à un ou plusieurs modules
export const affecterModules = async (enseignantId, moduleIds, departementId) => {
  try {
    const { data: enseignant, error: ensError } = await supabaseAdmin
      .from('enseignants')
      .select('*')
      .eq('id', enseignantId)
      .single()

    if (ensError || !enseignant || enseignant.departement_id !== departementId) {
      return {
        success: false,
        error: 'Enseignant introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier que tous les modules appartiennent au département
    const { data: modules, error: modError } = await supabaseAdmin
      .from('modules')
      .select('id')
      .in('id', moduleIds)
      .eq('departement_id', departementId)

    if (modError) throw modError

    if ((modules || []).length !== moduleIds.length) {
      return {
        success: false,
        error: 'Certains modules n\'existent pas ou n\'appartiennent pas à votre département'
      }
    }

    // Vérifier qu'aucun module n'est déjà affecté à un autre enseignant
    const { data: existingAffectations, error: affError } = await supabaseAdmin
      .from('affectations_module_enseignant')
      .select('module_id, enseignants(nom, prenom)')
      .in('module_id', moduleIds)
      .neq('enseignant_id', enseignantId)

    if (affError) throw affError

    if (existingAffectations && existingAffectations.length > 0) {
      // Récupérer les détails des modules déjà affectés
      const modulesDejaAffectes = await supabaseAdmin
        .from('modules')
        .select('code, nom')
        .in('id', existingAffectations.map(aff => aff.module_id))

      const nomModules = (modulesDejaAffectes.data || []).map(m => m.code).join(', ')
      const enseignant = existingAffectations[0].enseignants
      
      return {
        success: false,
        error: `Les module(s) ${nomModules} sont déjà affectés à un autre enseignant (${enseignant?.nom} ${enseignant?.prenom}). Un module ne peut être affecté qu'à un seul enseignant à la fois.`
      }
    }

    // Supprimer les anciennes affectations de cet enseignant
    await supabaseAdmin
      .from('affectations_module_enseignant')
      .delete()
      .eq('enseignant_id', enseignantId)

    // Créer les nouvelles affectations
    const affectationsToInsert = moduleIds.map(moduleId => ({
      module_id: moduleId,
      enseignant_id: enseignantId
    }))

    const { error: insertError } = await supabaseAdmin
      .from('affectations_module_enseignant')
      .insert(affectationsToInsert)

    if (insertError) throw insertError

    // Récupérer les affectations avec les détails
    const { data: affectations, error: fetchError } = await supabaseAdmin
      .from('affectations_module_enseignant')
      .select('*, modules (*, classes (*))')
      .eq('enseignant_id', enseignantId)

    if (fetchError) throw fetchError

    return {
      success: true,
      affectations: (affectations || []).map(aff => ({
        id: aff.modules?.id,
        code: aff.modules?.code,
        nom: aff.modules?.nom,
        classe: aff.modules?.classes?.code
      }))
    }
  } catch (error) {
    console.error('Erreur lors de l\'affectation des modules:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'affectation des modules'
    }
  }
}
