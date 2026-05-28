import { supabaseAdmin } from '../../lib/supabase.js'
import {
  getFiliereIdsForClassesListing,
  isFiliereInDepartementScope
} from './filiereScopeService.js'

// Obtenir toutes les classes d'un département
export const getClassesByDepartement = async (departementId) => {
  try {
    const filiereIds = await getFiliereIdsForClassesListing(departementId)

    if (filiereIds.length === 0) {
      return { success: true, classes: [] }
    }

    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (*), niveaux (*), formations (*)')
      .in('filiere_id', filiereIds)
      .order('code', { ascending: true })

    if (error) throw error

    const classeIds = (classes || []).map((c) => c.id)
    const promotionDominanteParClasse = new Map()

    if (classeIds.length > 0) {
      const { data: insPromoRows, error: insPromoError } = await supabaseAdmin
        .from('inscriptions')
        .select('classe_id, promotion_id, promotions(id, annee, statut)')
        .in('classe_id', classeIds)
        .eq('statut', 'INSCRIT')
        .not('promotion_id', 'is', null)

      if (!insPromoError && Array.isArray(insPromoRows)) {
        const tally = new Map()
        for (const row of insPromoRows) {
          const cid = row.classe_id
          const pid = row.promotion_id
          if (!cid || !pid) continue
          if (!tally.has(cid)) tally.set(cid, new Map())
          const counts = tally.get(cid)
          counts.set(pid, (counts.get(pid) || 0) + 1)
        }

        for (const [classeId, pidCounts] of tally) {
          let bestPid = null
          let bestCount = 0
          for (const [pid, count] of pidCounts) {
            if (count > bestCount) {
              bestCount = count
              bestPid = pid
            }
          }
          const sample = insPromoRows.find(
            (r) => r.classe_id === classeId && r.promotion_id === bestPid
          )
          const promoEmbed = sample?.promotions
          const promo = Array.isArray(promoEmbed) ? promoEmbed[0] : promoEmbed
          if (promo) promotionDominanteParClasse.set(classeId, promo)
        }
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

      const filiereEmbed = Array.isArray(classe.filieres) ? classe.filieres[0] : classe.filieres
      const niveauEmbed = Array.isArray(classe.niveaux) ? classe.niveaux[0] : classe.niveaux
      const formationEmbed = Array.isArray(classe.formations) ? classe.formations[0] : classe.formations

      const promotion = promotionDominanteParClasse.get(classe.id) || null
      const promotionId = promotion?.id || null

      return {
        id: classe.id,
        code: classe.code,
        nom: classe.nom,
        niveau: niveauEmbed?.code,
        filiere: filiereEmbed?.code,
        filieres: filiereEmbed
          ? {
              id: filiereEmbed.id,
              nom: filiereEmbed.nom,
              code: filiereEmbed.code
            }
          : null,
        effectif: classe.effectif,
        nombreModules: classe.nombre_modules || 0,
        filiereId: classe.filiere_id,
        niveauId: classe.niveau_id,
        formationId: classe.formation_id,
        formation: formationEmbed
          ? {
              id: formationEmbed.id,
              code: formationEmbed.code,
              nom: formationEmbed.nom
            }
          : null,
        promotion_id: promotionId,
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
