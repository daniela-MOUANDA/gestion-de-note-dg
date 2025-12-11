import { supabaseAdmin } from '../../lib/supabase.js'

/**
 * Calcule toutes les dates correspondant à un jour de la semaine dans une période
 */
const getDatesForWeekday = (jour, dateDebut, dateFin) => {
    const jourMap = {
        'LUNDI': 1,
        'MARDI': 2,
        'MERCREDI': 3,
        'JEUDI': 4,
        'VENDREDI': 5,
        'SAMEDI': 6,
        'DIMANCHE': 0
    }

    const dates = []
    const targetDay = jourMap[jour]
    const start = new Date(dateDebut)
    const end = new Date(dateFin)

    // Trouver le premier jour correspondant
    let current = new Date(start)
    while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1)
    }

    // Ajouter toutes les occurrences
    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 7) // Ajouter 7 jours
    }

    return dates
}

/**
 * Créer un emploi du temps avec réplication automatique sur une période
 */
export const createEmploiDuTempsAvecPeriode = async (data, departementId) => {
    try {
        const {
            classeId,
            moduleId,
            enseignantId,
            jour,
            heureDebut,
            heureFin,
            salle,
            semestre,
            anneeAcademique,
            dateDebut,
            dateFin,
            typeActivite = 'COURS',
            estRecurrent = true,
            dateSpecifique = null
        } = data

        // Validation des champs obligatoires
        if (!classeId || !moduleId || !enseignantId || !jour || !heureDebut || !heureFin || !semestre || !anneeAcademique) {
            return {
                success: false,
                error: 'Tous les champs obligatoires doivent être remplis'
            }
        }

        if (!dateDebut || !dateFin) {
            return {
                success: false,
                error: 'Les dates de début et de fin sont obligatoires'
            }
        }

        if (new Date(dateFin) < new Date(dateDebut)) {
            return {
                success: false,
                error: 'La date de fin doit être après la date de début'
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

        // Générer un UUID pour le groupe de récurrence
        const groupeRecurrence = estRecurrent ? crypto.randomUUID() : null

        // Préparer les entrées à insérer
        let emploisToInsert = []

        if (estRecurrent) {
            // Cours récurrent : créer une entrée pour chaque occurrence
            const dates = getDatesForWeekday(jour, dateDebut, dateFin)

            if (dates.length === 0) {
                return {
                    success: false,
                    error: 'Aucune occurrence trouvée pour ce jour dans la période spécifiée'
                }
            }

            emploisToInsert = dates.map(date => ({
                classe_id: classeId,
                module_id: moduleId,
                enseignant_id: enseignantId,
                jour,
                heure_debut: heureDebut,
                heure_fin: heureFin,
                salle,
                semestre,
                annee_academique: anneeAcademique,
                date_debut: dateDebut,
                date_fin: dateFin,
                type_activite: typeActivite,
                est_recurrent: false, // On met false pour passer la contrainte DB (car date_specifique est set), mais le groupe_recurrence indique la série
                date_specifique: date.toISOString().split('T')[0],
                groupe_recurrence: groupeRecurrence
            }))
        } else {
            // Devoir ponctuel : créer une seule entrée
            if (!dateSpecifique) {
                return {
                    success: false,
                    error: 'Une date spécifique est requise pour les devoirs ponctuels'
                }
            }

            emploisToInsert = [{
                classe_id: classeId,
                module_id: moduleId,
                enseignant_id: enseignantId,
                jour,
                heure_debut: heureDebut,
                heure_fin: heureFin,
                salle,
                semestre,
                annee_academique: anneeAcademique,
                date_debut: dateDebut,
                date_fin: dateFin,
                type_activite: typeActivite,
                est_recurrent: false,
                date_specifique: dateSpecifique,
                groupe_recurrence: null
            }]
        }

        // Vérifier les conflits d'horaires pour chaque entrée
        for (const emploi of emploisToInsert) {
            const { data: conflits } = await supabaseAdmin
                .from('emplois_du_temps')
                .select('id')
                .eq('classe_id', classeId)
                .eq('date_specifique', emploi.date_specifique)
                .or(`and(heure_debut.lte.${heureDebut},heure_fin.gt.${heureDebut}),and(heure_debut.lt.${heureFin},heure_fin.gte.${heureFin})`)

            if (conflits && conflits.length > 0) {
                return {
                    success: false,
                    error: `Conflit d'horaire détecté pour le ${emploi.date_specifique}`
                }
            }
        }

        // Insérer toutes les entrées
        const { data: emploisInseres, error } = await supabaseAdmin
            .from('emplois_du_temps')
            .insert(emploisToInsert)
            .select('*')

        if (error) throw error

        return {
            success: true,
            message: `${emploisInseres.length} cours ajouté(s) avec succès`,
            emploisTemps: emploisInseres,
            groupeRecurrence
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'emploi du temps:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la création de l\'emploi du temps'
        }
    }
}

/**
 * Obtenir l'emploi du temps d'une classe pour une période donnée
 */
export const getEmploiDuTempsByPeriode = async (classeId, semestre, dateDebut, dateFin, departementId) => {
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

        let query = supabaseAdmin
            .from('emplois_du_temps')
            .select('*, modules (*), enseignants (*)')
            .eq('classe_id', classeId)
            .eq('semestre', semestre)
            .order('date_specifique', { ascending: true })
            .order('heure_debut', { ascending: true })

        // Filtrer par période si spécifiée
        if (dateDebut && dateFin) {
            query = query
                .gte('date_specifique', dateDebut)
                .lte('date_specifique', dateFin)
        }

        const { data: emploisTemps, error } = await query

        if (error) throw error

        return {
            success: true,
            emploisTemps: (emploisTemps || []).map(edt => ({
                id: edt.id,
                jour: edt.jour,
                heureDebut: edt.heure_debut,
                heureFin: edt.heure_fin,
                salle: edt.salle,
                dateDebut: edt.date_debut,
                dateFin: edt.date_fin,
                typeActivite: edt.type_activite,
                estRecurrent: !!edt.groupe_recurrence || edt.est_recurrent,
                dateSpecifique: edt.date_specifique,
                groupeRecurrence: edt.groupe_recurrence,
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

/**
 * Mettre à jour toutes les occurrences d'un groupe de récurrence
 */
export const updateGroupeRecurrence = async (groupeRecurrence, updates, departementId) => {
    try {
        if (!groupeRecurrence) {
            return {
                success: false,
                error: 'Groupe de récurrence invalide'
            }
        }

        // Vérifier que le groupe appartient au département
        const { data: existing } = await supabaseAdmin
            .from('emplois_du_temps')
            .select('*, classes (*, filieres (*, departements (*)))')
            .eq('groupe_recurrence', groupeRecurrence)
            .limit(1)
            .single()

        if (!existing || existing.classes?.filieres?.departement_id !== departementId) {
            return {
                success: false,
                error: 'Emploi du temps introuvable ou n\'appartient pas à votre département'
            }
        }

        // Préparer les mises à jour
        const updateData = {}
        if (updates.heureDebut) updateData.heure_debut = updates.heureDebut
        if (updates.heureFin) updateData.heure_fin = updates.heureFin
        if (updates.salle !== undefined) updateData.salle = updates.salle
        if (updates.enseignantId) updateData.enseignant_id = updates.enseignantId

        const { data, error } = await supabaseAdmin
            .from('emplois_du_temps')
            .update(updateData)
            .eq('groupe_recurrence', groupeRecurrence)
            .select('*')

        if (error) throw error

        return {
            success: true,
            message: `${data.length} occurrence(s) mise(s) à jour`,
            emploisTemps: data
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du groupe:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la mise à jour'
        }
    }
}

/**
 * Supprimer toutes les occurrences d'un groupe de récurrence
 */
export const deleteGroupeRecurrence = async (groupeRecurrence, departementId) => {
    try {
        if (!groupeRecurrence) {
            return {
                success: false,
                error: 'Groupe de récurrence invalide'
            }
        }

        // Vérifier que le groupe appartient au département
        const { data: existing } = await supabaseAdmin
            .from('emplois_du_temps')
            .select('*, classes (*, filieres (*, departements (*)))')
            .eq('groupe_recurrence', groupeRecurrence)
            .limit(1)
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
            .eq('groupe_recurrence', groupeRecurrence)

        if (error) throw error

        return {
            success: true,
            message: 'Toutes les occurrences ont été supprimées'
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du groupe:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la suppression'
        }
    }
}

/**
 * Supprimer une occurrence spécifique (pour les devoirs ou une seule occurrence)
 */
export const deleteEmploiDuTempsById = async (id, departementId) => {
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
        console.error('Erreur lors de la suppression:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la suppression'
        }
    }
}

/**
 * Mettre à jour une occurrence spécifique
 */
export const updateEmploiDuTempsById = async (id, updates, departementId) => {
    try {
        // Vérifier que l'entrée existe et appartient au département
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

        // Préparer les mises à jour
        const updateData = {}
        if (updates.heureDebut) updateData.heure_debut = updates.heureDebut
        if (updates.heureFin) updateData.heure_fin = updates.heureFin
        if (updates.salle !== undefined) updateData.salle = updates.salle
        if (updates.enseignantId) updateData.enseignant_id = updates.enseignantId
        if (updates.dateSpecifique) updateData.date_specifique = updates.dateSpecifique
        if (updates.moduleId) updateData.module_id = updates.moduleId
        if (updates.typeActivite) updateData.type_activite = updates.typeActivite

        const { data, error } = await supabaseAdmin
            .from('emplois_du_temps')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error

        return {
            success: true,
            message: 'Mise à jour effectuée avec succès',
            emploiTemps: data
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la mise à jour'
        }
    }
}

/**
 * Supprimer un emploi du temps complet pour une période (nettoyage historique)
 */
export const deleteEmploiDuTempsPeriode = async (classeId, dateDebut, dateFin, departementId) => {
    try {
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

        // Supprimer tous les cours de la classe sur la période
        const { error, count } = await supabaseAdmin
            .from('emplois_du_temps')
            .delete({ count: 'exact' })
            .eq('classe_id', classeId)
            .gte('date_specifique', dateDebut)
            .lte('date_specifique', dateFin)

        if (error) throw error

        return {
            success: true,
            message: `${count} cours supprimés pour la période du ${dateDebut} au ${dateFin}`
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la période:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la suppression'
        }
    }
}

/**
 * Obtenir l'historique des périodes d'emploi du temps
 */
export const getHistoriqueEmploisDuTemps = async (departementId) => {
    try {
        // On récupère les combinaisons uniques de classe/période
        // Note: Supabase JS ne supporte pas directement DISTINCT sur plusieurs colonnes facilement avec select()
        // On va récupérer les données et filtrer en JS ou utiliser .rpc() si on avait une fonction stockée
        // Ici on fait une requête optimisée sur les champs nécessaires

        const { data, error } = await supabaseAdmin
            .from('emplois_du_temps')
            .select(`
                classe_id,
                semestre,
                date_debut,
                date_fin,
                classes!inner (
                    id,
                    nom,
                    filieres!inner (
                        departement_id
                    )
                )
            `)
            .eq('classes.filieres.departement_id', departementId)
            .order('date_debut', { ascending: false })

        if (error) throw error

        // Filtrer pour ne garder que les entrées uniques
        // On utilise un Map avec une clé composée
        const uniqueMap = new Map()

        data.forEach(item => {
            if (!item.date_debut || !item.date_fin) return

            const key = `${item.classe_id}-${item.semestre}-${item.date_debut}-${item.date_fin}`
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    classeId: item.classe_id,
                    classeNom: item.classes.nom,
                    semestre: item.semestre,
                    dateDebut: item.date_debut,
                    dateFin: item.date_fin
                })
            }
        })

        return {
            success: true,
            historique: Array.from(uniqueMap.values())
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la récupération de l\'historique'
        }
    }
}
