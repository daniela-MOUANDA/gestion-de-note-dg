
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

async function renameMMI() {
    console.log('--- Renaming MMI to MTIC ---');

    const newCode = 'MTIC';
    const newName = 'Management des Techniques de l\'Information et de la Communication';

    // 1. Update Filiere MMI -> MTIC
    console.log('Searching for Filiere MMI...');
    const { data: filieres, error: searchError } = await supabase
        .from('filieres')
        .select('*')
        .or('code.eq.MMI,code.eq.MMIC,nom.ilike.%Multimedia%');

    if (searchError) {
        console.error('Error searching filieres:', searchError);
    } else if (filieres && filieres.length > 0) {
        for (const f of filieres) {
            console.log(`Updating Filiere: ${f.code} (${f.nom}) -> ${newCode} (${newName})`);
            const { error: updateError } = await supabase
                .from('filieres')
                .update({
                    code: newCode,
                    nom: newName
                })
                .eq('id', f.id);

            if (updateError) console.error(`Error updating filiere ${f.id}:`, updateError);
            else console.log(`Success updating filiere ${f.id}`);
        }
    } else {
        console.log('No MMI filieres found to update.');
    }

    // 2. Update Department MTIC Name if needed
    console.log('Checking Department MTIC...');
    const { data: dept } = await supabase
        .from('departements')
        .select('*')
        .eq('code', 'MTIC')
        .single();

    if (dept) {
        // The user specifically asked for "Management des Techniques..."
        // Current DB might have "Technologies". Let's unify.
        console.log(`Updating Department ${dept.code} name...`);
        const { error: deptError } = await supabase
            .from('departements')
            .update({
                nom: newName // Use same name for Dept and Filiere? Or distinct?
                // Usually Department is "Management..." and Filiere might be "Management..."
                // The user said "replace MMI by MTIC ... anywhere ... or it is abbreviated leave it abbreviated".
                // MMI was a Filiere. MTIC is a Department AND likely the Filiere code now.
            })
            .eq('id', dept.id);

        if (deptError) console.error('Error updating department:', deptError);
        else console.log('Department updated.');
    }

    console.log('--- Done ---');
}

renameMMI().catch(console.error);
