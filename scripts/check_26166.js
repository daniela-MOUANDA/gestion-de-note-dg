import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

async function check() {
    try {
        const matricule = '26166'
        console.log(`Checking student with matricule: ${matricule}`)

        const { data: etudiant, error: eError } = await supabaseAdmin
            .from('etudiants')
            .select('*')
            .ilike('matricule', matricule)
            .single()

        if (eError) {
            console.log('Error fetching etudiant:', eError.message)
        } else {
            console.log('Etudiant found:', etudiant.id, etudiant.nom, etudiant.prenom)

            const { data: insc, error: iError } = await supabaseAdmin
                .from('inscriptions')
                .select(`
          *,
          promotions (id, annee, statut),
          formations (id, nom, code),
          filieres (id, nom, code),
          niveaux (id, nom, code, ordinal),
          classes (id, nom, code)
        `)
                .eq('etudiant_id', etudiant.id)

            if (iError) {
                console.log('Error fetching inscriptions:', iError.message)
            } else {
                console.log(`Found ${insc.length} inscriptions:`)
                insc.forEach((i, idx) => console.log(`  [${idx}] Statut: ${i.statut}, Classe: ${i.classes?.nom || 'N/A'}`))
            }
        }

        const { data: user, error: uError } = await supabaseAdmin
            .from('utilisateurs')
            .select('*, roles(code)')
            .ilike('username', matricule)
            .single()

        if (uError) {
            console.log('Error fetching user:', uError.message)
        } else {
            console.log('User found:', user.id, 'Username:', user.username, 'Role:', user.roles?.code)
        }

    } catch (error) {
        console.error('Fatal error:', error)
    }
}

check()
