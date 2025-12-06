
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

async function verifyStructure() {
    console.log('--- Verification Struct ---');

    const { data: depts } = await supabase.from('departements').select('id, code, nom, filieres(code, nom)');

    depts.forEach(d => {
        console.log(`DEPT: ${d.code} - ${d.nom}`);
        if (d.filieres) {
            d.filieres.forEach(f => console.log(`  -> FILIERE: ${f.code} - ${f.nom}`));
        }
    });
}

verifyStructure();
