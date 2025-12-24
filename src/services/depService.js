import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Récupère les bulletins en attente de visa pour le DEP
 */
export const getBulletinsEnAttente = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('bulletins_generes')
            .select(`
        *,
        classes (code, nom),
        departements (nom),
        utilisateurs!bulletins_generes_chefDepartementId_fkey (nom, prenom)
      `)
            .eq('statut', 'EN_ATTENTE')
            .order('dateGeneration', { ascending: false })

        if (error) throw error

        return {
            success: true,
            bulletins: data
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des bulletins en attente:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Récupère l'historique des bulletins visés
 */
export const getBulletinsVises = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('bulletins_generes')
            .select(`
        *,
        classes (code, nom),
        departements (nom),
        utilisateurs!bulletins_generes_chefDepartementId_fkey (nom, prenom),
        dep:utilisateurs!bulletins_generes_depId_fkey (nom, prenom)
      `)
            .eq('statut', 'VISE')
            .order('dateVisa', { ascending: false })
            .limit(50)

        if (error) throw error

        return {
            success: true,
            bulletins: data
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des bulletins visés:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Appose le visa sur un lot de bulletins
 * @param {string} id - ID du lot (bulletins_generes)
 * @param {string} depId - ID de l'utilisateur DEP
 */
export const viserBulletin = async (id, depId) => {
    try {
        // 1. Mettre à jour le statut dans bulletins_generes
        const { data: lot, error: updateError } = await supabaseAdmin
            .from('bulletins_generes')
            .update({
                statut: 'VISE',
                dateVisa: new Date().toISOString(),
                depId: depId
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        // 2. Mettre à jour TOUS les bulletins individuels de la classe pour ce semestre
        // Cela inclut tous les bulletins, même ceux régénérés après le premier visa
        const { error: bulletinsError } = await supabaseAdmin
            .from('bulletins')
            .update({
                statut_visa: 'VISE',
                date_visa: new Date().toISOString(),
                dep_id: depId
            })
            .eq('classe_id', lot.classeId)
            .eq('semestre', lot.semestre)
            // Ne pas filtrer par annee_academique pour inclure tous les bulletins,
            // même ceux régénérés avec une année académique différente

        if (bulletinsError) throw bulletinsError

        return {
            success: true,
            message: 'Bulletin visé avec succès',
            bulletin: lot
        }
    } catch (error) {
        console.error('Erreur lors du visa du bulletin:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
