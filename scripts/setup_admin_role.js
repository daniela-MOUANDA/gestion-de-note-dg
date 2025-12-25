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

async function setupAdminRole() {
    console.log('Checking if ADMIN_SYSTEME role exists...')

    const { data: existingRole, error: fetchError } = await supabase
        .from('roles')
        .select('*')
        .eq('code', 'ADMIN_SYSTEME')
        .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching role:', fetchError)
        return
    }

    if (existingRole) {
        console.log('Role ADMIN_SYSTEME already exists:', existingRole)
        return
    }

    console.log('Creating ADMIN_SYSTEME role...')

    const { data: newRole, error: insertError } = await supabase
        .from('roles')
        .insert({
            code: 'ADMIN_SYSTEME',
            nom: 'Administrateur Système',
            description: 'Gestion des comptes, audit et maintenance du système',
            route_dashboard: '/admin-systeme/dashboard',
            actif: true
        })
        .select()
        .single()

    if (insertError) {
        console.error('Error creating role:', insertError)
        return
    }

    console.log('Role ADMIN_SYSTEME created successfully:', newRole)
}

setupAdminRole()
