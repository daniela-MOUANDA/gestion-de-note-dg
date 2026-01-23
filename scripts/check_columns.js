import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans le .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    try {
        const { data, error } = await supabase
            .from('inscriptions')
            .select('*')
            .limit(1)

        if (error) {
            console.error('Erreur lors de la récupération des données:', error.message)
            return
        }

        if (data && data.length > 0) {
            console.log('Colonnes trouvées dans la table inscriptions:')
            console.log(Object.keys(data[0]).sort().join('\n'))
        } else {
            console.log('Aucune donnée trouvée dans la table inscriptions pour inspecter les colonnes.')

            // Essai via rpc si possible ou une autre méthode
            const { data: cols, error: colError } = await supabase
                .rpc('get_table_columns', { p_table_name: 'inscriptions' })

            if (colError) {
                console.error('Rpc get_table_columns non disponible ou a échoué:', colError.message)
            } else {
                console.log('Colonnes via RPC:', cols)
            }
        }
    } catch (err) {
        console.error('Exception:', err.message)
    }
}

checkColumns()
