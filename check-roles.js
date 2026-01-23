import { supabaseAdmin } from './src/lib/supabase.js'

async function checkRoles() {
    console.log('🔍 Checking Roles table...')
    const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('*')

    if (error) {
        console.error('❌ Error:', error.message)
        return
    }

    console.log('✅ Roles found:')
    roles.forEach(r => console.log(`- ID: ${r.id}, Code: "${r.code}", Name: "${r.nom}"`))
}

checkRoles()
