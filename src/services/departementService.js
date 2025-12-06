import { supabaseAdmin } from '../lib/supabase.js'

// Obtenir tous les départements
export const getAllDepartements = async () => {
  try {
    const { data: departements, error } = await supabaseAdmin
      .from('departements')
      .select('*')
      .order('nom', { ascending: true })

    if (error) throw error

    return {
      success: true,
      departements
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des départements'
    }
  }
}

// Créer un département
export const createDepartement = async (data) => {
  try {
    const { nom, code, description, actif } = data

    if (!nom || !code) {
      return {
        success: false,
        error: 'Le nom et le code sont obligatoires'
      }
    }

    // Vérifier si le code existe déjà
    const { data: codeExists } = await supabaseAdmin
      .from('departements')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (codeExists) {
      return {
        success: false,
        error: 'Ce code de département existe déjà'
      }
    }

    // Vérifier si le nom existe déjà
    const { data: nomExists } = await supabaseAdmin
      .from('departements')
      .select('id')
      .eq('nom', nom.trim())
      .single()

    if (nomExists) {
      return {
        success: false,
        error: 'Ce nom de département existe déjà'
      }
    }

    const { data: departement, error } = await supabaseAdmin
      .from('departements')
      .insert({
        nom: nom.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        actif: actif !== undefined ? actif : true
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      departement
    }
  } catch (error) {
    console.error('Erreur lors de la création du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du département'
    }
  }
}

// Mettre à jour un département
export const updateDepartement = async (id, data) => {
  try {
    const { nom, code, description, actif } = data

    // Vérifier que le département existe
    const { data: existingDepartement, error: fetchError } = await supabaseAdmin
      .from('departements')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingDepartement) {
      return {
        success: false,
        error: 'Département non trouvé'
      }
    }

    // Vérifier si le code existe déjà (pour un autre département)
    if (code && code.trim().toUpperCase() !== existingDepartement.code) {
      const { data: codeExists } = await supabaseAdmin
        .from('departements')
        .select('id')
        .eq('code', code.trim().toUpperCase())
        .neq('id', id)
        .single()

      if (codeExists) {
        return {
          success: false,
          error: 'Ce code de département existe déjà'
        }
      }
    }

    // Vérifier si le nom existe déjà (pour un autre département)
    if (nom && nom.trim() !== existingDepartement.nom) {
      const { data: nomExists } = await supabaseAdmin
        .from('departements')
        .select('id')
        .eq('nom', nom.trim())
        .neq('id', id)
        .single()

      if (nomExists) {
        return {
          success: false,
          error: 'Ce nom de département existe déjà'
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {}
    if (nom) updateData.nom = nom.trim()
    if (code) updateData.code = code.trim().toUpperCase()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (actif !== undefined) updateData.actif = actif

    const { data: departement, error } = await supabaseAdmin
      .from('departements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      departement
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du département'
    }
  }
}

// Supprimer un département
export const deleteDepartement = async (id) => {
  try {
    // Vérifier que le département existe
    const { data: existingDepartement, error: fetchError } = await supabaseAdmin
      .from('departements')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingDepartement) {
      return {
        success: false,
        error: 'Département non trouvé'
      }
    }

    // Vérifier s'il y a des chefs de département associés
    const { count: chefsCount } = await supabaseAdmin
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })
      .eq('departement_id', id)

    if (chefsCount && chefsCount > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer ce département car il contient des chefs de département'
      }
    }

    const { error } = await supabaseAdmin
      .from('departements')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Département supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du département'
    }
  }
}
