import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import { supabaseAdmin } from '../src/lib/supabase.js'

const checkUser = async (email) => {
    console.log(`🔍 Listing users in utilisateurs table...`)
    const { data: users, error: listError } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, email, username, roles(code)')
        .limit(10)

    if (listError) console.error('Error listing users:', listError)
    else console.log('First 10 users:', JSON.stringify(users, null, 2))

    console.log(`🔍 Checking specific user: ${email}`)
    const { data: user, error: userError } = await supabaseAdmin
        .from('utilisateurs')
        .select('*, roles (*)')
        .ilike('email', email)

    if (userError) console.error('Error fetching from utilisateurs:', userError)
    console.log('Utilisateurs found:', user)
}

checkUser('katrin@gmail.com')
