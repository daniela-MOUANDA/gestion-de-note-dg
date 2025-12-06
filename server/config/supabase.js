import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfzxqijezruswblokrdn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenhxaWplenJ1c3dibG9rcmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTU5OTIsImV4cCI6MjA4MDU5MTk5Mn0.wrRUU3peipCEHZ8jEJK2rQ88jyaeOZzCqJ8E9Rbp_Cc'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenhxaWplenJ1c3dibG9rcmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAxNTk5MiwiZXhwIjoyMDgwNTkxOTkyfQ.1Jc53E7p_4U5u-hqNpFjEJVxqgclJvlpYABh-ImEI08'

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Variables d\'environnement Supabase manquantes!')
    console.error('Assurez-vous de définir SUPABASE_URL et SUPABASE_ANON_KEY dans votre fichier .env')
}

// Client Supabase pour le frontend (avec clé anonyme)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    }
)

// Client Supabase pour le backend avec privilèges élevés (service role)
// À utiliser uniquement côté serveur pour les opérations administratives
export const supabaseAdmin = supabaseServiceKey
    ? createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : supabase

export default supabase
