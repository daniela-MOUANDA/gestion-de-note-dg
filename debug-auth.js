import { supabaseAdmin } from './src/lib/supabase.js'

async function debugStudent(matricule) {
    console.log(`🔍 Debugging student: ${matricule}`)

    const { data: etudiant, error: etudError } = await supabaseAdmin
        .from('etudiants')
        .select('*')
        .eq('matricule', matricule)
        .single()

    if (etudError) {
        console.error('❌ Error fetching student:', etudError.message)
    } else {
        console.log('✅ Student found:', etudiant)

        const { data: inscriptions, error: inscError } = await supabaseAdmin
            .from('inscriptions')
            .select('*, promotions(*)')
            .eq('etudiant_id', etudiant.id)

        if (inscError) {
            console.error('❌ Error fetching inscriptions:', inscError.message)
        } else {
            console.log(`✅ Found ${inscriptions.length} inscriptions:`)
            inscriptions.forEach(i => {
                console.log(`- ID: ${i.id}, Statut: ${i.statut}, Promotion: ${i.promotions?.annee}`)
            })
        }
    }
}

debugStudent('26151')
