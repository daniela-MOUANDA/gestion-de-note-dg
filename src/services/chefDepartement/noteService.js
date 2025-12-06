import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir les notes d'une classe pour un module
export const getNotesByClasseModule = async (classeId, moduleId, semestre, departementId) => {
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

    // Vérifier que le module appartient au département
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

    // Récupérer les inscriptions de la classe
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        notes (*, enseignants (*))
      `)
      .eq('classe_id', classeId)
      .eq('statut', 'VALIDEE')

    if (error) throw error

    // Filtrer les notes pour le module et semestre
    const result = (inscriptions || []).map(ins => ({
      etudiant: {
        id: ins.etudiants.id,
        matricule: ins.etudiants.matricule,
        nom: ins.etudiants.nom,
        prenom: ins.etudiants.prenom
      },
      inscriptionId: ins.id,
      notes: (ins.notes || [])
        .filter(n => n.module_id === moduleId && n.semestre === semestre)
        .map(note => ({
          id: note.id,
          typeNote: note.type_note,
          valeur: note.valeur,
          coefficient: note.coefficient,
          commentaire: note.commentaire,
          enseignant: note.enseignants ? {
            id: note.enseignants.id,
            nom: note.enseignants.nom,
            prenom: note.enseignants.prenom
          } : null,
          dateEvaluation: note.date_evaluation
        }))
    }))

    return {
      success: true,
      notes: result
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des notes'
    }
  }
}

// Ajouter ou mettre à jour une note
export const saveNote = async (data, departementId) => {
  try {
    const { etudiantId, inscriptionId, moduleId, enseignantId, classeId, typeNote, valeur, coefficient, semestre, anneeAcademique, commentaire } = data

    if (!etudiantId || !inscriptionId || !moduleId || !enseignantId || !classeId || !typeNote || valeur === undefined || !semestre || !anneeAcademique) {
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

    // Vérifier si une note du même type existe déjà
    const { data: existingNote } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('inscription_id', inscriptionId)
      .eq('module_id', moduleId)
      .eq('type_note', typeNote)
      .eq('semestre', semestre)
      .single()

    let note
    if (existingNote) {
      // Mettre à jour
      const { data: updated, error } = await supabaseAdmin
        .from('notes')
        .update({
          valeur: parseFloat(valeur),
          coefficient: coefficient ? parseFloat(coefficient) : 1.0,
          commentaire,
          date_evaluation: new Date().toISOString()
        })
        .eq('id', existingNote.id)
        .select('*, enseignants (*)')
        .single()

      if (error) throw error
      note = updated
    } else {
      // Créer
      const { data: created, error } = await supabaseAdmin
        .from('notes')
        .insert({
          etudiant_id: etudiantId,
          inscription_id: inscriptionId,
          module_id: moduleId,
          enseignant_id: enseignantId,
          classe_id: classeId,
          type_note: typeNote,
          valeur: parseFloat(valeur),
          coefficient: coefficient ? parseFloat(coefficient) : 1.0,
          semestre,
          annee_academique: anneeAcademique,
          commentaire
        })
        .select('*, enseignants (*)')
        .single()

      if (error) throw error
      note = created
    }

    return {
      success: true,
      note: {
        id: note.id,
        typeNote: note.type_note,
        valeur: note.valeur,
        coefficient: note.coefficient,
        commentaire: note.commentaire,
        enseignant: note.enseignants ? {
          id: note.enseignants.id,
          nom: note.enseignants.nom,
          prenom: note.enseignants.prenom
        } : null
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la note:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la sauvegarde de la note'
    }
  }
}

// Supprimer une note
export const deleteNote = async (noteId, departementId) => {
  try {
    const { data: note } = await supabaseAdmin
      .from('notes')
      .select('*, classes (*, filieres (*, departements (*)))')
      .eq('id', noteId)
      .single()

    if (!note || note.classes?.filieres?.departement_id !== departementId) {
      return {
        success: false,
        error: 'Note introuvable ou n\'appartient pas à votre département'
      }
    }

    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return {
      success: true,
      message: 'Note supprimée avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de la note'
    }
  }
}
