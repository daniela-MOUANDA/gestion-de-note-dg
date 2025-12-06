
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceKey)) {
    console.error('Erreur: Variables Supabase manquantes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function updateDatabaseYear() {
    console.log('Début de la mise à jour de la base de données (Année & Matricules)...');

    // 1. Update Promotions / Global Year References
    // Assuming we have a 'promotions' table with an 'annee' column
    const { error: pError } = await supabase
        .from('promotions')
        .update({ annee: '2025-2026' })
        .eq('annee', '2024-2025');

    if (pError) console.error('Erreur update promotions:', pError);
    else console.log('Promotions mises à jour: 2024-2025 -> 2025-2026');

    // 2. Update Inscriptions, Attestations, Bulletins, Diplomes, etc.
    const tablesToUpdate = ['inscriptions', 'attestations', 'bulletins', 'diplomes', 'proces_verbaux', 'candidats_admis', 'emplois_du_temps', 'notes'];

    for (const table of tablesToUpdate) {
        // Check if table has annee_academique or similar. Based on schema:
        // inscriptions: ?? Schema said annee_academique? No, link to promotion.
        // attestations: annee_academique
        // bulletins: annee_academique
        // diplomes: annee_academique
        // proces_verbaux: annee_academique
        // candidats_admis: annee_academique
        // emplois_du_temps: annee_academique
        // notes: annee_academique

        let column = 'annee_academique';
        // Note: inscriptions table does NOT have annee_academique in schema file I read earlier? 
        // It references promotion_id.
        // If table has column, update it.

        // Try update, if it fails due to column missing, catch it.
        try {
            const { error } = await supabase
                .from(table)
                .update({ [column]: '2025-2026' })
                .eq(column, '2024-2025');

            if (error) {
                // Ignore if column doesn't exist error (PGRST204? No, simply won't match or invalid col)
                if (error.code === '42703') { // Undefined column
                    // Skip
                } else {
                    console.error(`Erreur update ${table}:`, error.message);
                }
            } else {
                console.log(`Table ${table} mise à jour.`);
            }
        } catch (e) {
            console.error(`Exception update ${table}:`, e);
        }
    }

    // 3. Update Matricules
    // "debuter par 26 ... et non 25"
    // Fetch students with matricule starting with '25'

    const { data: students, error: sError } = await supabase
        .from('etudiants')
        .select('id, matricule')
        .ilike('matricule', '25%'); // Starts with 25

    if (sError) {
        console.error('Erreur fetch etudiants matricule:', sError);
        return;
    }

    console.log(`${students.length} matricules à mettre à jour (25... -> 26...).`);

    for (const s of students) {
        if (s.matricule && s.matricule.startsWith('25')) {
            const newMatricule = '26' + s.matricule.substring(2);
            const { error: uError } = await supabase
                .from('etudiants')
                .update({ matricule: newMatricule })
                .eq('id', s.id);

            if (uError) console.error(`Erreur update matricule ${s.id}:`, uError);
        }
    }

    console.log('--- Terminée ---');
}

updateDatabaseYear().catch(console.error);
