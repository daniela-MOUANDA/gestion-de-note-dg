import { supabaseAdmin } from '../../lib/supabase.js'

// Obtenir les paramètres de notation pour un module et semestre
export const getParametresNotation = async (moduleId, semestre) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('parametres_notation')
      .select('*')
      .eq('module_id', moduleId)
      .eq('semestre', semestre)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    
    return {
      success: true,
      parametres: data || null
    }
  } catch (error) {
    console.error('Erreur getParametresNotation:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des paramètres'
    }
  }
}

// Sauvegarder les paramètres de notation
export const saveParametresNotation = async (data) => {
  try {
    const { moduleId, semestre, evaluations } = data

    if (!moduleId || !semestre || !evaluations || evaluations.length === 0) {
      return {
        success: false,
        error: 'Données incomplètes'
      }
    }

    // Vérifier si des paramètres existent déjà
    const { data: existing } = await supabaseAdmin
      .from('parametres_notation')
      .select('id')
      .eq('module_id', moduleId)
      .eq('semestre', semestre)
      .single()

    const parametresData = {
      module_id: moduleId,
      semestre,
      evaluations: evaluations
    }

    let result
    if (existing) {
      // Mise à jour
      result = await supabaseAdmin
        .from('parametres_notation')
        .update(parametresData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Création
      result = await supabaseAdmin
        .from('parametres_notation')
        .insert(parametresData)
        .select()
        .single()
    }

    if (result.error) throw result.error

    return {
      success: true,
      parametres: result.data
    }
  } catch (error) {
    console.error('Erreur saveParametresNotation:', error)
    return {
      success: false,
      error: 'Erreur lors de la sauvegarde des paramètres'
    }
  }
}

// Obtenir les notes par module, classe et semestre
export const getNotesByModuleClasse = async (moduleId, classeId, semestre) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('module_id', moduleId)
      .eq('classe_id', classeId)
      .eq('semestre', semestre)

    if (error) throw error

    return {
      success: true,
      notes: data || []
    }
  } catch (error) {
    console.error('Erreur getNotesByModuleClasse:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des notes'
    }
  }
}

// Sauvegarder plusieurs notes en une fois
export const saveNotesBulk = async (notes, departementId) => {
  try {
    console.log('📝 saveNotesBulk appelé avec:', { notes, departementId })
    
    if (!notes || notes.length === 0) {
      console.error('❌ Erreur: Aucune note à enregistrer')
      return {
        success: false,
        error: 'Aucune note à enregistrer'
      }
    }

    // Vérifier la cohérence niveau-semestre
    const classeId = notes[0].classeId
    const semestre = notes[0].semestre
    const moduleId = notes[0].moduleId

    // Récupérer le niveau de la classe
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, niveaux(code)')
      .eq('id', classeId)
      .single()

    if (classeError || !classe) {
      return {
        success: false,
        error: 'Classe introuvable'
      }
    }

    // Vérifier la correspondance niveau-semestre
    const niveauCode = classe.niveaux?.code
    const correspondanceNiveauSemestre = {
      'L1': ['S1', 'S2'],
      'L2': ['S3', 'S4'],
      'L3': ['S5', 'S6']
    }

    const semestresAutorises = correspondanceNiveauSemestre[niveauCode] || []
    
    if (!semestresAutorises.includes(semestre)) {
      return {
        success: false,
        error: `Impossible d'enregistrer des notes de ${semestre} pour une classe de ${niveauCode}. Semestres autorisés: ${semestresAutorises.join(', ')}`
      }
    }

    // Vérifier que le module appartient au même semestre
    const { data: module, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select('semestre')
      .eq('id', moduleId)
      .single()

    if (moduleError || !module) {
      return {
        success: false,
        error: 'Module introuvable'
      }
    }

    if (module.semestre !== semestre) {
      return {
        success: false,
        error: `Le module sélectionné est de ${module.semestre}, pas de ${semestre}`
      }
    }

    // Préparer les notes pour l'insertion
    const notesToInsert = notes.map(note => {
      console.log('🔍 Traitement note:', note)
      return {
        etudiant_id: note.etudiantId,
        module_id: note.moduleId,
        classe_id: note.classeId,
        semestre: note.semestre,
        evaluation_id: note.evaluationId,
        valeur: parseFloat(note.valeur),
        annee_academique: note.anneeAcademique || '2024-2025'
      }
    })
    
    console.log('📤 Notes à insérer:', notesToInsert)

    // Supprimer les notes existantes pour ces étudiants/évaluations
    const etudiantIds = [...new Set(notes.map(n => n.etudiantId))]

    await supabaseAdmin
      .from('notes')
      .delete()
      .eq('module_id', moduleId)
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
      .in('etudiant_id', etudiantIds)

    // Insérer les nouvelles notes
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert(notesToInsert)
      .select()

    if (error) throw error

    return {
      success: true,
      notes: data
    }
  } catch (error) {
    console.error('Erreur saveNotesBulk:', error)
    return {
      success: false,
      error: 'Erreur lors de la sauvegarde des notes'
    }
  }
}

// Supprimer une note
export const deleteNote = async (noteId) => {
  try {
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
    console.error('Erreur deleteNote:', error)
    return {
      success: false,
      error: 'Erreur lors de la suppression de la note'
    }
  }
}
