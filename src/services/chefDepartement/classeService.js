import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir toutes les classes d'un département
export const getClassesByDepartement = async (departementId) => {
  try {
    // Récupérer les filières du département
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id')
      .eq('departement_id', departementId)

    const filiereIds = (filieres || []).map(f => f.id)

    if (filiereIds.length === 0) {
      return { success: true, classes: [] }
    }

    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*), niveaux (*)')
      .in('filiere_id', filiereIds)
      .order('code', { ascending: true })

    if (error) throw error

    // Compter les inscriptions et modules pour chaque classe
    const classesWithCounts = await Promise.all((classes || []).map(async (classe) => {
      const { count: inscriptionsCount } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('classe_id', classe.id)

      const { count: modulesCount } = await supabaseAdmin
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('classe_id', classe.id)

      return {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveaux?.code,
        filiere: classe.filieres?.code,
        effectif: classe.effectif,
        nombreModules: modulesCount || 0,
        filiereId: classe.filiere_id,
        niveauId: classe.niveau_id
      }
    }))

    return {
      success: true,
      classes: classesWithCounts
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des classes'
    }
  }
}

// Créer une nouvelle classe
export const createClasse = async (data, departementId) => {
  try {
    const { code, nom, filiereId, niveauId } = data

    if (!code || !nom || !filiereId || !niveauId) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que la filière appartient au département
    const { data: filiere } = await supabaseAdmin
      .from('filieres')
      .select('*, departements (*)')
      .eq('id', filiereId)
      .single()

    if (!filiere || filiere.departement_id !== departementId) {
      return {
        success: false,
        error: 'Filière introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier l'unicité du code
    const { data: existingClasse } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('code', code)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .single()

    if (existingClasse) {
      return {
        success: false,
        error: 'Une classe avec ce code existe déjà pour cette filière et ce niveau'
      }
    }

    const { data: classe, error } = await supabaseAdmin
      .from('classes')
      .insert({
        code,
        nom,
        filiere_id: filiereId,
        niveau_id: niveauId,
        effectif: 0
      })
      .select('*, filieres (*), niveaux (*)')
      .single()

    if (error) throw error

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveaux?.code,
        filiere: classe.filieres?.code,
        effectif: classe.effectif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la classe'
    }
  }
}

// Mettre à jour une classe
export const updateClasse = async (id, data, departementId) => {
  try {
    const { data: existingClasse, error: fetchError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*, departements (*))')
      .eq('id', id)
      .single()

    if (fetchError || !existingClasse) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    if (existingClasse.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de modifier cette classe'
      }
    }

    const { data: classe, error } = await supabaseAdmin
      .from('classes')
      .update({
        code: data.code,
        nom: data.nom
      })
      .eq('id', id)
      .select('*, filieres (*), niveaux (*)')
      .single()

    if (error) throw error

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveaux?.code,
        filiere: classe.filieres?.code,
        effectif: classe.effectif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de la classe'
    }
  }
}

// Supprimer une classe
export const deleteClasse = async (id, departementId) => {
  try {
    const { data: existingClasse, error: fetchError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*, departements (*))')
      .eq('id', id)
      .single()

    if (fetchError || !existingClasse) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    if (existingClasse.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de supprimer cette classe'
      }
    }

    // Vérifier qu'il n'y a pas d'inscriptions
    const { count: inscriptionsCount } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('classe_id', id)

    // Vérifier qu'il n'y a pas de modules
    const { count: modulesCount } = await supabaseAdmin
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('classe_id', id)

    if ((inscriptionsCount || 0) > 0 || (modulesCount || 0) > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer une classe qui contient des étudiants ou des modules'
      }
    }

    const { error } = await supabaseAdmin
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Classe supprimée avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de la classe'
    }
  }
}
