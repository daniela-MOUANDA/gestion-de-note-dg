import { supabaseAdmin } from './src/lib/supabase.js'

async function debugSpecificStudent(matricule) {
    console.log(`🔍 DEBUGGING MATRICULE: ${matricule}`)

    // 1. Check Utilisateurs table
    console.log('\n--- Utilisateurs Table ---')
    const { data: users, error: userError } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, email, username, nom, prenom, roles(code), actif')
        .or(`username.eq.${matricule}, email.ilike.%${matricule}%`)

    if (userError) {
        console.error('❌ Error in Utilisateurs:', userError.message)
    } else if (users && users.length > 0) {
        console.log(`✅ Found ${users.length} matching user(s):`)
        users.forEach(u => console.log(JSON.stringify(u, null, 2)))
    } else {
        console.log('❌ No matching user found in Utilisateurs table.')
    }

    // 2. Check Etudiants table
    console.log('\n--- Etudiants Table ---')
    const { data: students, error: studError } = await supabaseAdmin
        .from('etudiants')
        .select('*, inscriptions(*)')
        .eq('matricule', matricule)

    if (studError) {
        console.error('❌ Error in Etudiants:', studError.message)
    } else if (students && students.length > 0) {
        console.log(`✅ Found ${students.length} matching student(s):`)
        students.forEach(s => {
            const { inscriptions, ...rest } = s
            console.log('Student:', JSON.stringify(rest, null, 2))
            console.log(`Inscriptions (${inscriptions?.length || 0}):`, JSON.stringify(inscriptions, null, 2))
        })
    } else {
        console.log('❌ No matching student found in Etudiants table.')
    }
}

debugSpecificStudent('26151')
