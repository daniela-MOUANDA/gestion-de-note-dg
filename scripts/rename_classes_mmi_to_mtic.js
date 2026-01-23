
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

async function renameClasses() {
    console.log('--- Renaming MMI Classes to MTIC ---');

    console.log('Searching for Classes with MMI in code...');
    const { data: classes, error: searchError } = await supabase
        .from('classes')
        .select('*')
        .ilike('code', '%MMI%');

    if (searchError) {
        console.error('Error searching classes:', searchError);
    } else if (classes && classes.length > 0) {
        for (const c of classes) {
            const newCode = c.code.replace(/MMI/i, 'MTIC');
            const newNom = c.nom.replace(/MMI/i, 'MTIC'); // Assuming Nom captures similar structure, or replace acronym if present

            console.log(`Updating Class: ${c.code} -> ${newCode}`);
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    code: newCode,
                    // Only update name if it contains MMI
                    ...(c.nom.match(/MMI/i) ? { nom: newNom } : {})
                })
                .eq('id', c.id);

            if (updateError) console.error(`Error updating class ${c.id}:`, updateError);
            else console.log(`Success updating class ${c.id}`);
        }
    } else {
        console.log('No MMI classes found to update.');
    }

    console.log('--- Done ---');
}

renameClasses().catch(console.error);
