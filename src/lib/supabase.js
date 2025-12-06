import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Variables d\'environnement Supabase manquantes!')
  console.error('Assurez-vous de définir SUPABASE_URL et SUPABASE_ANON_KEY dans votre fichier .env')
}

// Client Supabase pour le frontend (avec clé anonyme)
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Client Supabase pour le backend avec privilèges élevés (service role)
// À utiliser uniquement côté serveur pour les opérations administratives
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl || '', supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

export default supabase

