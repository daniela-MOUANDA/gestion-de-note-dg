import { supabaseAdmin } from './src/lib/supabase.js'

async function checkDuplicates(matricule) {
    console.log(`🔍 Checking for duplicates for matricule: ${matricule}`)

    const { data: users, error } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, email, username, nom, prenom, roles(code)')
        .or(`username.eq.${matricule}, email.ilike.%${matricule}%`)

    if (error) {
        console.error('❌ Error:', error.message)
        return
    }

    console.log(`✅ Found ${users.length} match(es):`)
    users.forEach(u => {
        console.log(JSON.stringify(u, null, 2))
    })
}

checkDuplicates('26151')
