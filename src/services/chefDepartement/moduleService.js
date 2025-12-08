import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir tous les modules d'un département
export const getModulesByDepartement = async (departementId, filiereId = null) => {
  try {
    let query = supabaseAdmin
      .from('modules')
      .select(`
        *,
        filieres (code, nom),
        affectations_module_enseignant (*, enseignants (*))
      `)
      .eq('departement_id', departementId)
      .order('code', { ascending: true })

    if (filiereId) {
      query = query.eq('filiere_id', filiereId)
    }

    const { data: modules, error } = await query

    if (error) throw error

    return {
      success: true,
      modules: (modules || []).map(mod => {
        // Gérer le cas où affectations_module_enseignant n'est pas un tableau
        const affectations = Array.isArray(mod.affectations_module_enseignant) 
          ? mod.affectations_module_enseignant 
          : (mod.affectations_module_enseignant ? [mod.affectations_module_enseignant] : [])
        
        return {
          id: mod.id,
          code: mod.code,
          nom: mod.nom,
          credit: mod.credit,
          semestre: mod.semestre,
          filiere: mod.filieres ? `${mod.filieres.code} - ${mod.filieres.nom}` : '-',
          filiereId: mod.filiere_id,
          ue: mod.ue || 'UE1',
          enseignants: affectations.map(aff => ({
            id: aff.enseignants?.id,
            nom: aff.enseignants?.nom,
            prenom: aff.enseignants?.prenom
          })),
          actif: mod.actif
        }
      })
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modules:', error)
    console.error('❌ Message d\'erreur:', error.message)
    console.error('❌ Stack:', error.stack)
    return {
      success: false,
      error: `Erreur lors de la récupération des modules: ${error.message}`
    }
  }
}

// Créer un nouveau module
export const createModule = async (data, departementId) => {
  try {
    const { code, nom, credit, semestre, filiereId, ue } = data

    if (!code || !nom || !credit || !semestre || !filiereId || !ue) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la filière appartient au département
    const { data: filiere } = await supabaseAdmin
      .from('filieres')
      .select('*')
      .eq('id', filiereId)
      .eq('departement_id', departementId)
      .single()

    if (!filiere) {
      return {
        success: false,
        error: 'Filière introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier l'unicité
    const { data: existing } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('code', code)
      .eq('filiere_id', filiereId)
      .eq('semestre', semestre)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'Un module avec ce code existe déjà pour cette filière et ce semestre'
      }
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .insert({
        code,
        nom,
        credit: parseInt(credit),
        semestre,
        filiere_id: filiereId,
        departement_id: departementId,
        ue,
        actif: data.actif !== undefined ? data.actif : true
      })
      .select('*, filieres (*)')
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
        filiere: module.filieres ? `${module.filieres.code} - ${module.filieres.nom}` : '-',
        filiereId: module.filiere_id,
        ue: module.ue,
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
      ue: data.ue || existing.ue || 'UE1',
      actif: data.actif !== undefined ? data.actif : existing.actif
    }

    // Si filiereId est fourni et différent, vérifier qu'elle appartient au département
    if (data.filiereId && data.filiereId !== existing.filiere_id) {
      const { data: filiere } = await supabaseAdmin
        .from('filieres')
        .select('*')
        .eq('id', data.filiereId)
        .eq('departement_id', departementId)
        .single()

      if (!filiere) {
        return {
          success: false,
          error: 'Filière introuvable ou n\'appartient pas à votre département'
        }
      }

      // Vérifier l'unicité du code dans la nouvelle filière
      const { data: existingCode } = await supabaseAdmin
        .from('modules')
        .select('id')
        .eq('code', data.code)
        .eq('filiere_id', data.filiereId)
        .eq('semestre', data.semestre)
        .neq('id', id)
        .single()

      if (existingCode) {
        return {
          success: false,
          error: 'Un module avec ce code existe déjà pour cette filière et ce semestre'
        }
      }

      updateData.filiere_id = data.filiereId
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select('*, filieres (*)')
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
        filiere: module.filieres ? `${module.filieres.code} - ${module.filieres.nom}` : '-',
        filiereId: module.filiere_id,
        ue: module.ue,
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
