/**
 * Script pour initialiser le statut des notes pour toutes les classes
 * À exécuter après avoir créé la table statut_notes_classes
 */

import { supabaseAdmin } from '../src/lib/supabase.js'
import { mettreAJourStatutNotes } from '../src/services/chefDepartement/statutNotesService.js'

async function initStatutNotes() {
  try {
    console.log('🚀 Initialisation du statut des notes pour toutes les classes...')

    // Récupérer toutes les classes
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select('id, code, niveaux(code)')

    if (classesError) throw classesError

    if (!classes || classes.length === 0) {
      console.log('⚠️ Aucune classe trouvée')
      return
    }

    console.log(`📚 ${classes.length} classes trouvées`)

    // Pour chaque classe, mettre à jour le statut pour chaque semestre
    const correspondanceNiveauSemestre = {
      'L1': ['S1', 'S2'],
      'L2': ['S3', 'S4'],
      'L3': ['S5', 'S6']
    }

    let totalTraite = 0
    let totalErreurs = 0

    for (const classe of classes) {
      const niveauCode = classe.niveaux?.code
      const semestres = correspondanceNiveauSemestre[niveauCode] || []

      for (const semestre of semestres) {
        try {
          console.log(`\n📊 Traitement: ${classe.code} - ${semestre}`)
          const result = await mettreAJourStatutNotes(classe.id, semestre)
          
          if (result.success) {
            console.log(`✅ ${classe.code} - ${semestre}: ${result.modulesAvecNotes}/${result.nombreModulesDisponibles} modules avec notes`)
            totalTraite++
          } else {
            console.error(`❌ ${classe.code} - ${semestre}: ${result.error}`)
            totalErreurs++
          }
        } catch (error) {
          console.error(`❌ Erreur pour ${classe.code} - ${semestre}:`, error.message)
          totalErreurs++
        }
      }
    }

    console.log(`\n✅ Initialisation terminée: ${totalTraite} statuts mis à jour, ${totalErreurs} erreurs`)
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  }
}

initStatutNotes()


