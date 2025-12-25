import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoles() {
    const { data: roles, error } = await supabase
        .from('roles')
        .select('*')

    if (error) {
        console.error('Error fetching roles:', error)
        return
    }

    console.log('Current Roles:')
    console.log(JSON.stringify(roles, null, 2))
}

checkRoles()
