import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addStatusColumns() {
    console.log('Début de l\'ajout des colonnes de statut...')

    const columnsToAdd = [
        // Pour chaque document existant, ajouter les colonnes de validation
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS photo_identite_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS photo_identite_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS photo_identite_date_validation TIMESTAMPTZ',

        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_acte_naissance_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_acte_naissance_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_acte_naissance_date_validation TIMESTAMPTZ',

        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_diplome_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_diplome_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_diplome_date_validation TIMESTAMPTZ',

        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_releve_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_releve_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS copie_releve_date_validation TIMESTAMPTZ',

        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS piece_identite_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS piece_identite_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS piece_identite_date_validation TIMESTAMPTZ',

        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS quittance_statut TEXT DEFAULT \'EN_ATTENTE\'',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS quittance_commentaire TEXT',
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS quittance_date_validation TIMESTAMPTZ',

        // Ajouter aussi le champ agent valideur s'il manque
        'ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS agent_valideur_id UUID REFERENCES utilisateurs(id)'
    ]

    for (const sql of columnsToAdd) {
        try {
            console.log(`Exécution: ${sql}`)
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
            if (error) {
                // Si exec_sql n'existe pas, on essaie une autre approche ou on informe
                console.error(`Erreur via RPC: ${error.message}`)
                console.log('Tentative via requête directe (peut ne pas fonctionner selon les permissions)...')
                // Supabase client ne permet pas de faire du DDL direct facilement hors RPC
            }
        } catch (err) {
            console.error(`Exception: ${err.message}`)
        }
    }
}

addStatusColumns()
