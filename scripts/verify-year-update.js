
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

const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function verifyUpdates() {
    console.log('--- Verification ---');

    // 1. Check Promotions
    const { data: promotions } = await supabase.from('promotions').select('annee').eq('annee', '2025-2026');
    console.log(`Promotions 2025-2026 trouvées: ${promotions ? promotions.length : 0}`);

    // 2. Check Matricules starting with 26
    const { count, error } = await supabase
        .from('etudiants')
        .select('*', { count: 'exact', head: true })
        .ilike('matricule', '26%');

    console.log(`Étudiants avec matricule 26... : ${count}`);

    // 3. Check old matricules 25
    const { count: countOld } = await supabase
        .from('etudiants')
        .select('*', { count: 'exact', head: true })
        .ilike('matricule', '25%');

    console.log(`Étudiants avec matricule 25... (devrait être 0): ${countOld}`);
}

verifyUpdates();
