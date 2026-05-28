/**
 * Script de promotion : Ajouter les étudiants de la classe "MMI 2 FI2" 
 * dans la classe "MMI 1 FI2" (nouvelle classe L1 pour saisie de notes)
 * 
 * Classes identifiées :
 * - SOURCE : "MMI 2 FI2" (L2, Formation Initiale 2, 37 étudiants) - ID: 17c49c25-073f-47cc-b554-a4ab89e3568d
 * - CIBLE  : "MMI 1 FI2" (L1, Formation Initiale 2, 0 étudiants)  - ID: 85c0bce7-a084-4543-bc87-f80915dc6f67
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfzxqijezruswblokrdn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenhxaWplenJ1c3dibG9rcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAxNTk5MiwiZXhwIjoyMDgwNTkxOTkyfQ.1Jc53E7p_4U5u-hqNpFjEJVxqgclJvlpYABh-ImEI08'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// IDs identifiés dans la base de données
const CLASSE_SOURCE_ID = '17c49c25-073f-47cc-b554-a4ab89e3568d'  // MMI 2 FI2 (L2)
const CLASSE_CIBLE_ID  = '85c0bce7-a084-4543-bc87-f80915dc6f67'  // MMI 1 FI2 (L1)

async function main() {
  console.log('==============================================')
  console.log('🎓 PROMOTION ÉTUDIANTS : MMI 2 FI2 → MMI 1 FI2')
  console.log('==============================================\n')

  // ── ÉTAPE 1 : Vérifier les deux classes ──
  console.log('📋 Étape 1 : Vérification des classes...\n')

  const { data: classeSource, error: srcErr } = await supabase
    .from('classes')
    .select('id, code, nom, effectif, filiere_id, niveau_id, formation_id, filieres(code, nom), niveaux(code, nom), formations(code, nom)')
    .eq('id', CLASSE_SOURCE_ID)
    .single()

  if (srcErr || !classeSource) {
    console.error('❌ Classe source introuvable:', srcErr)
    process.exit(1)
  }

  const { data: classeCible, error: tgtErr } = await supabase
    .from('classes')
    .select('id, code, nom, effectif, filiere_id, niveau_id, formation_id, filieres(code, nom), niveaux(code, nom), formations(code, nom)')
    .eq('id', CLASSE_CIBLE_ID)
    .single()

  if (tgtErr || !classeCible) {
    console.error('❌ Classe cible introuvable:', tgtErr)
    process.exit(1)
  }

  console.log(`✅ Classe SOURCE : ${classeSource.code} (${classeSource.nom})`)
  console.log(`   Filière: ${classeSource.filieres?.code}, Niveau: ${classeSource.niveaux?.code}, Formation: ${classeSource.formations?.code}, Effectif: ${classeSource.effectif}`)
  console.log()
  console.log(`✅ Classe CIBLE  : ${classeCible.code} (${classeCible.nom})`)
  console.log(`   Filière: ${classeCible.filieres?.code}, Niveau: ${classeCible.niveaux?.code}, Formation: ${classeCible.formations?.code}, Effectif: ${classeCible.effectif}`)
  console.log()

  // ── ÉTAPE 2 : Récupérer les étudiants de la classe source ──
  console.log('📋 Étape 2 : Récupération des étudiants de MMI 2 FI2...\n')

  const { data: inscriptionsSource, error: inscErr } = await supabase
    .from('inscriptions')
    .select(`
      id,
      etudiant_id,
      filiere_id,
      niveau_id,
      classe_id,
      formation_id,
      promotion_id,
      type_inscription,
      statut,
      etudiants (
        id,
        matricule,
        nom,
        prenom,
        email
      )
    `)
    .eq('classe_id', CLASSE_SOURCE_ID)
    .eq('statut', 'INSCRIT')

  if (inscErr) {
    console.error('❌ Erreur récupération inscriptions:', inscErr)
    process.exit(1)
  }

  if (!inscriptionsSource || inscriptionsSource.length === 0) {
    console.log('⚠️ Aucun étudiant INSCRIT trouvé dans MMI 2 FI2.')
    
    // Vérifier avec tous les statuts
    const { data: allInsc } = await supabase
      .from('inscriptions')
      .select('id, statut, etudiants(matricule, nom, prenom)')
      .eq('classe_id', CLASSE_SOURCE_ID)

    if (allInsc && allInsc.length > 0) {
      console.log(`\n📊 ${allInsc.length} inscription(s) avec d'autres statuts :`)
      allInsc.forEach(i => {
        console.log(`   - ${i.etudiants?.matricule} ${i.etudiants?.nom} ${i.etudiants?.prenom} | Statut: ${i.statut}`)
      })
    }
    process.exit(1)
  }

  console.log(`✅ ${inscriptionsSource.length} étudiant(s) trouvé(s) :\n`)
  inscriptionsSource.forEach((insc, index) => {
    const e = insc.etudiants
    console.log(`   ${String(index + 1).padStart(2)}. ${e?.matricule || 'N/A'} - ${e?.nom || '?'} ${e?.prenom || '?'}`)
  })
  console.log()

  // ── ÉTAPE 3 : Vérifier les doublons ──
  console.log('📋 Étape 3 : Vérification des doublons...\n')

  const etudiantIds = inscriptionsSource.map(i => i.etudiant_id)

  const { data: inscExistantes } = await supabase
    .from('inscriptions')
    .select('etudiant_id')
    .eq('classe_id', CLASSE_CIBLE_ID)
    .in('etudiant_id', etudiantIds)

  const dejaInscrits = new Set((inscExistantes || []).map(i => i.etudiant_id))
  const etudiantsAPromouvoir = inscriptionsSource.filter(i => !dejaInscrits.has(i.etudiant_id))

  if (dejaInscrits.size > 0) {
    console.log(`⚠️ ${dejaInscrits.size} étudiant(s) déjà inscrit(s) dans ${classeCible.code}, seront ignorés.`)
  }

  if (etudiantsAPromouvoir.length === 0) {
    console.log('✅ Tous les étudiants sont déjà dans la classe cible. Rien à faire.')
    process.exit(0)
  }

  console.log(`📊 ${etudiantsAPromouvoir.length} étudiant(s) à ajouter dans ${classeCible.code}\n`)

  // ── ÉTAPE 4 : Créer les nouvelles inscriptions ──
  console.log('📋 Étape 4 : Création des inscriptions dans MMI 1 FI2...\n')

  const nouvellesInscriptions = etudiantsAPromouvoir.map(insc => ({
    etudiant_id: insc.etudiant_id,
    filiere_id: classeCible.filiere_id,
    niveau_id: classeCible.niveau_id,
    classe_id: classeCible.id,
    formation_id: classeCible.formation_id || insc.formation_id,
    promotion_id: insc.promotion_id,
    type_inscription: insc.type_inscription || 'INSCRIPTION',
    statut: 'INSCRIT',
    date_inscription: new Date().toISOString()
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('inscriptions')
    .insert(nouvellesInscriptions)
    .select('id, etudiant_id')

  if (insertError) {
    console.error('❌ Erreur lors de l\'insertion:', insertError)
    process.exit(1)
  }

  console.log(`✅ ${inserted.length} nouvelle(s) inscription(s) créée(s)\n`)

  // ── ÉTAPE 5 : Mettre à jour l'effectif ──
  console.log('📋 Étape 5 : Mise à jour de l\'effectif de la classe cible...\n')

  const { count: nouvelEffectif } = await supabase
    .from('inscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('classe_id', CLASSE_CIBLE_ID)
    .eq('statut', 'INSCRIT')

  await supabase
    .from('classes')
    .update({ effectif: nouvelEffectif || 0 })
    .eq('id', CLASSE_CIBLE_ID)

  console.log(`✅ Effectif de ${classeCible.code} : ${nouvelEffectif} étudiants\n`)

  // ── Résumé final ──
  console.log('==============================================')
  console.log('✅ OPÉRATION TERMINÉE AVEC SUCCÈS !')
  console.log('==============================================')
  console.log(`   Source  : ${classeSource.code} (${classeSource.niveaux?.code}) — ${inscriptionsSource.length} étudiants`)
  console.log(`   Cible   : ${classeCible.code} (${classeCible.niveaux?.code}) — ${nouvelEffectif} étudiants`)
  console.log(`   Promus  : ${inserted.length}`)
  if (dejaInscrits.size > 0) {
    console.log(`   Ignorés : ${dejaInscrits.size} (déjà présents)`)
  }
  console.log()
  console.log('ℹ️  Les inscriptions d\'origine dans MMI 2 FI2 sont préservées')
  console.log('   (historique des notes conservé).')
  console.log('==============================================\n')
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
