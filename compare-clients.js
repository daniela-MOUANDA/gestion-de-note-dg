import { supabaseAdmin as admin1 } from './server/config/supabase.js'
import { supabaseAdmin as admin2 } from './src/lib/supabase.js'

async function compareClients() {
    console.log('🔍 Testing Client 1 (server/config/supabase.js)...')
    const { data: data1, error: error1 } = await admin1.from('utilisateurs').select('count').limit(1)
    if (error1) console.error('❌ Client 1 Error:', error1.message)
    else console.log('✅ Client 1 works')

    console.log('🔍 Testing Client 2 (src/lib/supabase.js)...')
    const { data: data2, error: error2 } = await admin2.from('utilisateurs').select('count', { count: 'exact', head: true })
    if (error2) console.error('❌ Client 2 Error:', error2.message)
    else console.log('✅ Client 2 works')

    const id = "561733a9-19d9-45ac-96df-fe973b72b94b"
    console.log(`🔍 Specifically testing lookup for ID ${id} with Client 2...`)
    const { data: user, error: userError } = await admin2
        .from('utilisateurs')
        .select('*, roles (*)')
        .eq('id', id)
        .single()

    if (userError) console.error('❌ Client 2 lookup error:', userError.message)
    else console.log('✅ Client 2 lookup works:', user.email)
}

compareClients()
