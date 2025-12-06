import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir tous les modules d'un département
export const getModulesByDepartement = async (departementId, classeId = null) => {
  try {
    let query = supabaseAdmin
      .from('modules')
      .select(`
        *,
        classes (*, filieres (*), niveaux (*)),
        affectations_module_enseignant (*, enseignants (*))
      `)
      .eq('departement_id', departementId)
      .order('code', { ascending: true })

    if (classeId) {
      query = query.eq('classe_id', classeId)
    }

    const { data: modules, error } = await query

    if (error) throw error

    return {
      success: true,
      modules: (modules || []).map(mod => ({
        id: mod.id,
        code: mod.code,
        nom: mod.nom,
        credit: mod.credit,
        semestre: mod.semestre,
        classe: mod.classes?.code,
        classeId: mod.classe_id,
        enseignants: (mod.affectations_module_enseignant || []).map(aff => ({
          id: aff.enseignants?.id,
          nom: aff.enseignants?.nom,
          prenom: aff.enseignants?.prenom
        })),
        actif: mod.actif
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des modules'
    }
  }
}

// Créer un nouveau module
export const createModule = async (data, departementId) => {
  try {
    const { code, nom, credit, semestre, classeId } = data

    if (!code || !nom || !credit || !semestre || !classeId) {
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

    // Vérifier l'unicité
    const { data: existing } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('code', code)
      .eq('classe_id', classeId)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'Un module avec ce code existe déjà pour cette classe'
      }
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .insert({
        code,
        nom,
        credit: parseInt(credit),
        semestre,
        classe_id: classeId,
        departement_id: departementId,
        actif: true
      })
      .select('*, classes (*)')
      .single()

    if (error) throw error

    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        classe: module.classes?.code,
        classeId: module.classe_id,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création du module'
    }
  }
}

// Mettre à jour un module
export const updateModule = async (id, data, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    let updateData = {
      code: data.code,
      nom: data.nom,
      credit: data.credit ? parseInt(data.credit) : existing.credit,
      semestre: data.semestre,
      actif: data.actif !== undefined ? data.actif : existing.actif
    }

    // Si classeId est fourni et différent, vérifier qu'elle appartient au département
    if (data.classeId && data.classeId !== existing.classe_id) {
      const { data: classe } = await supabaseAdmin
        .from('classes')
        .select('*, filieres (*, departements (*))')
        .eq('id', data.classeId)
        .single()

      if (!classe || classe.filieres?.departement_id !== departementId) {
        return {
          success: false,
          error: 'Classe introuvable ou n\'appartient pas à votre département'
        }
      }

      // Vérifier l'unicité du code dans la nouvelle classe
      const { data: existingCode } = await supabaseAdmin
        .from('modules')
        .select('id')
        .eq('code', data.code)
        .eq('classe_id', data.classeId)
        .neq('id', id)
        .single()

      if (existingCode) {
        return {
          success: false,
          error: 'Un module avec ce code existe déjà pour cette classe'
        }
      }

      updateData.classe_id = data.classeId
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select('*, classes (*)')
      .single()

    if (error) throw error

    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        classe: module.classes?.code,
        classeId: module.classe_id,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du module'
    }
  }
}

// Supprimer un module
export const deleteModule = async (id, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier les notes
    const { count: notesCount } = await supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', id)

    if ((notesCount || 0) > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un module qui contient des notes'
      }
    }

    const { error } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Module supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du module'
    }
  }
}
