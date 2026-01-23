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

    // Notification facultative : on pourrait ici notifier les classes qui suivent ce module.
    // Pour l'instant, priorité aux emplois du temps.

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

    // Séparer les notes à insérer (avec valeur valide) des notes vides (à supprimer)
    const notesAvecValeur = notes
      .filter(note => {
        const valeur = note.valeur
        // Garder seulement les notes avec une valeur valide (non null, non vide, non NaN)
        return valeur !== null && valeur !== undefined && valeur !== '' && !isNaN(parseFloat(valeur))
      })
      .map(note => ({
        etudiant_id: note.etudiantId,
        module_id: note.moduleId,
        classe_id: note.classeId,
        semestre: note.semestre,
        evaluation_id: note.evaluationId,
        valeur: parseFloat(note.valeur),
        annee_academique: note.anneeAcademique || '2024-2025'
      }))

    console.log('📤 Notes à insérer:', notesAvecValeur.length)
    console.log('🗑️ Notes à supprimer (vides):', notes.length - notesAvecValeur.length)

    // Supprimer spécifiquement les notes pour les combinaisons étudiant/evaluation envoyées
    // Cela permet de supprimer les notes vides sans toucher aux autres notes
    for (const note of notes) {
      await supabaseAdmin
        .from('notes')
        .delete()
        .eq('module_id', moduleId)
        .eq('classe_id', classeId)
        .eq('semestre', semestre)
        .eq('etudiant_id', note.etudiantId)
        .eq('evaluation_id', note.evaluationId)
    }

    // Insérer seulement les notes avec des valeurs valides
    let data = []
    if (notesAvecValeur.length > 0) {
      const { data: insertedData, error } = await supabaseAdmin
        .from('notes')
        .insert(notesAvecValeur)
        .select()

      if (error) throw error
      data = insertedData
      console.log('✅ Notes insérées:', data.length)

      // Notifier chaque étudiant individuellement
      import('./notificationService.js').then(({ notifyNouvelleNote }) => {
        const moduleNom = module?.nom || 'Inconnu'
        notesAvecValeur.forEach(note => {
          notifyNouvelleNote(note.etudiant_id, moduleNom, note.valeur)
        })
      }).catch(err => console.error('Erreur notifications notes:', err))
    } else {
      console.log('ℹ️ Aucune note à insérer (toutes les notes ont été supprimées)')
    }

    // Mettre à jour le statut des notes pour cette classe et ce semestre
    // On fait cela de manière asynchrone pour ne pas bloquer la réponse
    // et éviter les problèmes de mémoire si beaucoup de requêtes simultanées
    import('./statutNotesService.js').then(({ mettreAJourStatutNotes }) => {
      mettreAJourStatutNotes(classeId, semestre).then(() => {
        console.log('✅ Statut des notes mis à jour après sauvegarde')
      }).catch(err => {
        console.error('❌ Erreur lors de la mise à jour du statut (non bloquant):', err)
      })
    }).catch(err => {
      console.error('❌ Erreur lors de l\'import du service de statut (non bloquant):', err)
    })

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
