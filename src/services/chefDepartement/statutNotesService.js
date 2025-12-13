import { supabaseAdmin } from '../../lib/supabase.js'

/**
 * Met à jour le statut des notes pour une classe et un semestre
 * Cette fonction calcule et stocke le nombre de modules avec notes saisies
 */
export const mettreAJourStatutNotes = async (classeId, semestre) => {
  try {
    console.log(`🔄 Mise à jour du statut des notes pour classe ${classeId}, semestre ${semestre}`)

    // 1. Récupérer tous les étudiants de la classe
    const { data: inscriptions, error: inscriptionsError } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiant_id')
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')

    if (inscriptionsError) throw inscriptionsError

    const etudiantIds = (inscriptions || []).map(i => i.etudiant_id)
    const nombreEtudiants = etudiantIds.length

    if (nombreEtudiants === 0) {
      console.log(`⚠️ Aucun étudiant trouvé pour la classe ${classeId}`)
      // Mettre à jour avec des valeurs à zéro
      await upsertStatutNotes(classeId, semestre, 0, 0, 0, 0)
      return { success: true }
    }

    // 2. Récupérer tous les modules de la classe pour ce semestre
    // Essayer d'abord par classe_id, puis par filiere_id si pas de résultats
    let { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id, classe_id, filiere_id')
      .eq('classe_id', classeId)
      .eq('semestre', semestre)

    // Si pas de modules trouvés par classe_id, chercher par filiere_id
    if ((!modules || modules.length === 0)) {
      // Récupérer la filière de la classe
      const { data: classe, error: classeError } = await supabaseAdmin
        .from('classes')
        .select('filiere_id')
        .eq('id', classeId)
        .single()

      if (!classeError && classe?.filiere_id) {
        const { data: modulesByFiliere, error: modulesErrorByFiliere } = await supabaseAdmin
          .from('modules')
          .select('id, classe_id, filiere_id')
          .eq('filiere_id', classe.filiere_id)
          .eq('semestre', semestre)

        if (!modulesErrorByFiliere && modulesByFiliere) {
          modules = modulesByFiliere
          modulesError = null
        }
      }
    }

    if (modulesError) throw modulesError

    const moduleIds = (modules || []).map(m => m.id)
    const nombreModulesDisponibles = moduleIds.length

    console.log(`📚 Modules trouvés pour la classe ${classeId}, semestre ${semestre}: ${nombreModulesDisponibles}`)

    if (nombreModulesDisponibles === 0) {
      console.log(`⚠️ Aucun module trouvé pour la classe ${classeId}, semestre ${semestre}`)
      await upsertStatutNotes(classeId, semestre, 0, 0, 0, 0)
      return { success: true }
    }

    // 3. Pour chaque module, vérifier s'il a des notes
    let modulesAvecNotes = 0
    let modulesComplets = 0
    const etudiantsAvecNotesSet = new Set()
    const etudiantsCompletsSet = new Set()

    for (const moduleId of moduleIds) {
      // Récupérer les notes pour ce module
      const { data: notes, error: notesError } = await supabaseAdmin
        .from('notes')
        .select('etudiant_id, evaluation_id')
        .eq('module_id', moduleId)
        .eq('classe_id', classeId)
        .eq('semestre', semestre)
        .in('etudiant_id', etudiantIds.length > 0 ? etudiantIds : [''])

      if (notesError) {
        console.error(`❌ Erreur lors de la récupération des notes pour le module ${moduleId}:`, notesError)
        continue
      }

      // Grouper les notes par étudiant
      const notesParEtudiant = {}
      notes?.forEach(note => {
        const etudiantId = note.etudiant_id
        if (!etudiantId) return

        if (!notesParEtudiant[etudiantId]) {
          notesParEtudiant[etudiantId] = new Set()
        }
        if (note.evaluation_id) {
          notesParEtudiant[etudiantId].add(note.evaluation_id)
        }
      })

      // Vérifier si le module a au moins une note
      const nombreEtudiantsAvecNotes = Object.keys(notesParEtudiant).length
      const nombreTotalNotes = notes?.length || 0
      const moduleAvecNotes = nombreEtudiantsAvecNotes > 0 || nombreTotalNotes > 0
      
      console.log(`   Module ${moduleId}: ${nombreTotalNotes} notes trouvées, ${nombreEtudiantsAvecNotes} étudiants avec notes`)
      
      if (moduleAvecNotes) {
        modulesAvecNotes++
        console.log(`   ✅ Module ${moduleId} compté comme ayant des notes (${modulesAvecNotes}/${nombreModulesDisponibles})`)
        
        // Ajouter les étudiants qui ont des notes pour ce module
        Object.keys(notesParEtudiant).forEach(etudiantId => {
          etudiantsAvecNotesSet.add(etudiantId)
        })

        // Vérifier si tous les étudiants ont des notes pour ce module
        const tousEtudiantsOntNotes = nombreEtudiantsAvecNotes === nombreEtudiants && nombreEtudiants > 0
        
        if (tousEtudiantsOntNotes) {
          // Vérifier si le module est complet (tous les étudiants ont toutes leurs notes)
          // Pour simplifier, on considère qu'un module est complet si tous les étudiants ont au moins une note
          // On pourrait améliorer cela en vérifiant les paramètres de notation
          modulesComplets++
          console.log(`   ✅ Module ${moduleId} compté comme complet (${modulesComplets}/${nombreModulesDisponibles})`)
          
          // Ajouter les étudiants complets
          Object.keys(notesParEtudiant).forEach(etudiantId => {
            etudiantsCompletsSet.add(etudiantId)
          })
        }
      } else {
        console.log(`   ⚠️ Module ${moduleId} n'a pas de notes`)
      }
    }

    // 4. Mettre à jour la table statut_notes_classes
    await upsertStatutNotes(
      classeId,
      semestre,
      modulesAvecNotes,
      modulesComplets,
      etudiantsAvecNotesSet.size,
      etudiantsCompletsSet.size
    )

    console.log(`✅ Statut mis à jour: ${modulesAvecNotes}/${nombreModulesDisponibles} modules avec notes, ${etudiantsAvecNotesSet.size}/${nombreEtudiants} étudiants avec notes`)

    return {
      success: true,
      modulesAvecNotes,
      modulesComplets,
      nombreModulesDisponibles,
      etudiantsAvecNotes: etudiantsAvecNotesSet.size,
      etudiantsComplets: etudiantsCompletsSet.size,
      nombreEtudiants
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut des notes:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du statut'
    }
  }
}

/**
 * Insère ou met à jour le statut des notes dans la table
 */
const upsertStatutNotes = async (classeId, semestre, modulesAvecNotes, modulesComplets, etudiantsAvecNotes, etudiantsComplets) => {
  try {
    const { error } = await supabaseAdmin
      .from('statut_notes_classes')
      .upsert({
        classe_id: classeId,
        semestre,
        nombre_modules_avec_notes: modulesAvecNotes,
        nombre_modules_complets: modulesComplets,
        nombre_etudiants_avec_notes: etudiantsAvecNotes,
        nombre_etudiants_complets: etudiantsComplets,
        date_mise_a_jour: new Date().toISOString()
      }, {
        onConflict: 'classe_id,semestre'
      })

    if (error) {
      // Si la table n'existe pas encore, on log l'erreur mais on ne fait pas échouer
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Table statut_notes_classes n\'existe pas encore. Veuillez exécuter la migration 009_statut_notes_classes.sql')
        return
      }
      console.error('Erreur lors de l\'upsert du statut:', error)
      throw error
    }
    console.log(`✅ Statut sauvegardé: ${modulesAvecNotes} modules avec notes, ${etudiantsAvecNotes} étudiants avec notes`)
  } catch (error) {
    console.error('Erreur lors de l\'upsert du statut:', error)
    // Ne pas faire échouer la mise à jour du statut si la table n'existe pas
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('⚠️ Table statut_notes_classes n\'existe pas encore')
      return
    }
    throw error
  }
}

/**
 * Récupère le statut des notes pour une classe et un semestre
 */
export const getStatutNotes = async (classeId, semestre) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('statut_notes_classes')
      .select('*')
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return {
      success: true,
      statut: data || null
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération du statut'
    }
  }
}

