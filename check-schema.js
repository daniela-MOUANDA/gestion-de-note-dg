import { supabaseAdmin } from './src/lib/supabase.js'

async function checkSchema() {
    console.log('🔍 Checking utilisateurs and roles schema...')

    // Get one user to see column names
    const { data: user, error: userError } = await supabaseAdmin
        .from('utilisateurs')
        .select('*')
        .limit(1)
        .single()

    if (userError) {
        console.error('❌ Error fetching user:', userError.message)
    } else {
        console.log('✅ User columns:', Object.keys(user))
    }

    // Get one role to see column names
    const { data: role, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('*')
        .limit(1)
        .single()

    if (roleError) {
        console.error('❌ Error fetching role:', roleError.message)
    } else {
        console.log('✅ Role columns:', Object.keys(role))
    }
}

checkSchema()
