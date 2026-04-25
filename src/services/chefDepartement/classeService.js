import { supabaseAdmin } from '../../lib/supabase.js'
import { getScopedFiliereIdsForDepartement, isFiliereInDepartementScope } from './filiereScopeService.js'

// Obtenir toutes les classes d'un département
export const getClassesByDepartement = async (departementId) => {
  try {
    const filiereIds = await getScopedFiliereIdsForDepartement(departementId)

    if (filiereIds.length === 0) {
      return { success: true, classes: [] }
    }

    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*), niveaux (*), formations (*)')
      .in('filiere_id', filiereIds)
      .order('code', { ascending: true })

    if (error) throw error

    const promotionIds = [...new Set((classes || []).map((c) => c.promotion_id).filter(Boolean))]
    let promotionsById = new Map()

    if (promotionIds.length > 0) {
      const { data: promotionsData, error: promotionsError } = await supabaseAdmin
        .from('promotions')
        .select('id, annee, statut')
        .in('id', promotionIds)

      if (!promotionsError && Array.isArray(promotionsData)) {
        promotionsById = new Map(promotionsData.map((p) => [p.id, p]))
      }
    }

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

      const promotion = promotionsById.get(classe.promotion_id)

      return {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveaux?.code,
        filiere: classe.filieres?.code,
        filieres: classe.filieres
          ? {
              id: classe.filieres.id,
              nom: classe.filieres.nom,
              code: classe.filieres.code
            }
          : null,
        effectif: classe.effectif,
        nombreModules: classe.nombre_modules || 0,
        filiereId: classe.filiere_id,
        niveauId: classe.niveau_id,
        formationId: classe.formation_id,
        formation: classe.formations ? {
          id: classe.formations.id,
          code: classe.formations.code,
          nom: classe.formations.nom
        } : null,
        promotion: promotion
          ? {
              id: promotion.id,
              annee: promotion.annee,
              statut: promotion.statut
            }
          : null
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
    const { code, nom, filiereId, niveauId, formationId } = data

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

    const filiereInScope = filiere ? await isFiliereInDepartementScope(departementId, filiere.id) : false
    if (!filiere || !filiereInScope) {
      return {
        success: false,
        error: 'Filière introuvable ou n\'appartient pas à votre département'
      }
    }

    if (filiere.type_filiere === 'groupe') {
      return {
        success: false,
        error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.'
      }
    }

    // Vérifier l'unicité du code (incluant la formation maintenant)
    let query = supabaseAdmin
      .from('classes')
      .select('id')
      .eq('code', code)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
    
    if (formationId) {
      query = query.eq('formation_id', formationId)
    } else {
      query = query.is('formation_id', null)
    }
    
    const { data: existingClasse } = await query.single()

    if (existingClasse) {
      return {
        success: false,
        error: 'Une classe avec ce code existe déjà pour cette filière, ce niveau et cette formation'
      }
    }

    const { data: classe, error } = await supabaseAdmin
      .from('classes')
      .insert({
        code,
        nom,
        filiere_id: filiereId,
        niveau_id: niveauId,
        formation_id: formationId || null, // Inclure la formation si fournie
        effectif: 0,
        nombre_modules: data.nombreModules || 0
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
        effectif: classe.effectif,
        nombreModules: classe.nombre_modules || 0
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

    // Convertir nombreModules en entier pour s'assurer que c'est un nombre
    const nombreModulesValue = parseInt(data.nombreModules) || 0
    
    const { data: classe, error } = await supabaseAdmin
      .from('classes')
      .update({
        code: data.code,
        nom: data.nom,
        nombre_modules: nombreModulesValue
      })
      .eq('id', id)
      .select('*, filieres (*), niveaux (*)')
      .single()
    
    console.log(`✅ Classe ${classe?.code} mise à jour: nombre_modules = ${nombreModulesValue}`)

    if (error) throw error

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: classe.niveaux?.code,
        filiere: classe.filieres?.code,
        effectif: classe.effectif,
        nombreModules: classe.nombre_modules || 0
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
