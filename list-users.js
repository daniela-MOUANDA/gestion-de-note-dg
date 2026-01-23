import { supabaseAdmin } from './src/lib/supabase.js'

async function listUsers() {
    console.log('🔍 Listing all users in `utilisateurs` table...')

    const { data: users, error } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, email, username, nom, prenom, roles(code)')

    if (error) {
        console.error('❌ Error fetching users:', error.message)
        return
    }

    console.log(`✅ Found ${users.length} users:`)
    users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Username: ${u.username}, Role: ${u.roles?.code}, Name: ${u.prenom} ${u.nom}`)
    });

    console.log('\n🔍 Searching for student with matricule 26151 in `etudiants`...')
    const { data: student } = await supabaseAdmin
        .from('etudiants')
        .select('*')
        .eq('matricule', '26151')
        .single()

    if (student) {
        console.log('✅ Student 26151 found in `etudiants`:', student)
    } else {
        console.log('❌ Student 26151 NOT found in `etudiants`')
    }
}

listUsers()
