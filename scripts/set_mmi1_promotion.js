import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfzxqijezruswblokrdn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenhxaWplenJ1c3dibG9rcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAxNTk5MiwiZXhwIjoyMDgwNTkxOTkyfQ.1Jc53E7p_4U5u-hqNpFjEJVxqgclJvlpYABh-ImEI08'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const CLASSE_CIBLE_ID = '85c0bce7-a084-4543-bc87-f80915dc6f67' // MMI 1 FI2

async function main() {
  console.log('🔄 Mise à jour de l\'année académique pour MMI 1 FI2...')

  // 1. Vérifier ou créer la promotion 2023-2024
  let { data: promo } = await supabase
    .from('promotions')
    .select('id, annee, statut')
    .eq('annee', '2023-2024')
    .single()

  if (!promo) {
    console.log('Création de la promotion 2023-2024...')
    const { data: newPromo, error: promoError } = await supabase
      .from('promotions')
      .insert({ 
        annee: '2023-2024', 
        statut: 'ARCHIVE',
        date_debut: '2023-09-01',
        date_fin: '2024-07-31'
      })
      .select()
      .single()
      
    if (promoError) throw promoError
    promo = newPromo
    console.log('✅ Promotion 2023-2024 créée avec l\'ID:', promo.id)
  } else {
    console.log('✅ Promotion 2023-2024 trouvée avec l\'ID:', promo.id)
  }

  // 2. Mettre à jour les inscriptions de MMI 1 FI2
  console.log('\nMise à jour des inscriptions de la classe MMI 1 FI2...')
  const { error: updateInscError } = await supabase
    .from('inscriptions')
    .update({ promotion_id: promo.id })
    .eq('classe_id', CLASSE_CIBLE_ID)

  if (updateInscError) throw updateInscError
  
  // Compter combien ont été mis à jour
  const { count } = await supabase
    .from('inscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('classe_id', CLASSE_CIBLE_ID)
    .eq('promotion_id', promo.id)
    
  console.log(`✅ ${count} inscription(s) mise(s) à jour avec l'année 2023-2024`)

  // 3. Mettre à jour la classe elle-même (si elle a un promotion_id)
  const { error: updateClasseError } = await supabase
    .from('classes')
    .update({ promotion_id: promo.id })
    .eq('id', CLASSE_CIBLE_ID)

  if (updateClasseError) {
    console.log('Remarque: Impossible de mettre à jour la classe elle-même (ignoré)')
  } else {
    console.log('✅ Classe MMI 1 FI2 mise à jour avec l\'année 2023-2024')
  }

  console.log('\n✅ TERMINÉ AVEC SUCCÈS !')
}

main().catch(console.error)
