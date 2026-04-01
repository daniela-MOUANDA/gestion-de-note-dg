import { supabaseAdmin } from '../../lib/supabase.js'
import { getScopedFiliereIdsForDepartement } from './filiereScopeService.js'

// Obtenir les étudiants non répartis d'un département
export const getEtudiantsNonRepartis = async (departementId) => {
  try {
    const filiereIds = await getScopedFiliereIdsForDepartement(departementId)

    if (filiereIds.length === 0) {
      return { success: true, etudiants: [] }
    }

    // Récupérer les inscriptions validées mais sans classe assignée
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select('*, etudiants (*), filieres (*), niveaux (*)')
      .in('filiere_id', filiereIds)
      .eq('statut', 'VALIDEE')
      .is('classe_id', null)

    if (error) throw error

    return {
      success: true,
      etudiants: (inscriptions || []).map(ins => ({
        id: ins.etudiants.id,
        inscriptionId: ins.id,
        matricule: ins.etudiants.matricule,
        nom: ins.etudiants.nom,
        prenom: ins.etudiants.prenom,
        email: ins.etudiants.email,
        filiere: ins.filieres?.code,
        niveau: ins.niveaux?.code,
        niveauId: ins.niveau_id
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants non répartis:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des étudiants'
    }
  }
}

// Répartir un étudiant dans une classe
export const repartirEtudiant = async (inscriptionId, classeId, departementId) => {
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

    // Vérifier que l'inscription existe et appartient au département
    const { data: inscription } = await supabaseAdmin
      .from('inscriptions')
      .select('*, filieres (*, departements (*))')
      .eq('id', inscriptionId)
      .single()

    if (!inscription || inscription.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Inscription introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier que le niveau correspond
    if (inscription.niveau_id !== classe.niveau_id) {
      return {
        success: false,
        error: 'Le niveau de l\'étudiant ne correspond pas au niveau de la classe'
      }
    }

    // Mettre à jour l'inscription
    const { error: updateError } = await supabaseAdmin
      .from('inscriptions')
      .update({ classe_id: classeId })
      .eq('id', inscriptionId)

    if (updateError) throw updateError

    // Mettre à jour l'effectif de la classe
    const { error: effectifError } = await supabaseAdmin
      .from('classes')
      .update({ effectif: classe.effectif + 1 })
      .eq('id', classeId)

    if (effectifError) throw effectifError

    return {
      success: true,
      message: 'Étudiant réparti avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la répartition:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la répartition'
    }
  }
}

// Obtenir les étudiants d'une classe
export const getEtudiantsByClasse = async (classeId, departementId) => {
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

    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select('*, etudiants (*)')
      .eq('classe_id', classeId)
      .eq('statut', 'VALIDEE')

    if (error) throw error

    return {
      success: true,
      classe: {
        id: classe.id,
        code: classe.code,
        effectif: classe.effectif
      },
      etudiants: (inscriptions || []).map(ins => ({
        id: ins.etudiants.id,
        inscriptionId: ins.id,
        matricule: ins.etudiants.matricule,
        nom: ins.etudiants.nom,
        prenom: ins.etudiants.prenom,
        email: ins.etudiants.email
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des étudiants'
    }
  }
}
