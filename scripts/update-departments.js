
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

async function updateDepartments() {
    console.log('--- Mise à jour structure Départements & Filières ---');

    /* 
       STRATÉGIE:
       1. Identifier les départements existants pour les mettre à jour plutôt que de supprimer/créer (pour garder les chefs).
       2. Mettre à jour INFO -> RSN (Code: RSN).
       3. Mettre à jour GEST -> MTIC (Code: MTIC).
       4. Créer/maj les filières GI, RT sous RSN.
       5. Créer/maj la filière MMI sous MTIC.
    */

    // --- 1. DEPARTEMENT RSN (ex INFO ou création) ---
    // Essayer de trouver INFO ou RSN
    let { data: rsnDept } = await supabase.from('departements').select('*').or('code.eq.INFO,code.eq.RSN').single();

    if (!rsnDept) {
        // Create if not exists
        console.log("Création département RSN...");
        const { data, error } = await supabase.from('departements').insert({
            code: 'RSN',
            nom: 'Reseaux et Systeme Numerique',
            description: 'Département Réseaux et Système Numérique'
        }).select().single();
        if (error) console.error("Erreur créa RSN:", error);
        rsnDept = data;
    } else {
        // Update
        console.log(`Mise à jour département ${rsnDept.code} -> RSN...`);
        const { data, error } = await supabase.from('departements').update({
            code: 'RSN', // Change code safely? If foreign keys cascade or restrict? database usually restricts.
            // If restricts, we might fail. But let's try.
            // Actually, filieres link to departement_id (UUID), not code. So updating code is safe!
            nom: 'Reseaux et Systeme Numerique',
            description: 'Département Réseaux et Système Numérique'
        }).eq('id', rsnDept.id).select().single();
        if (error) console.error("Erreur update RSN:", error);
        else rsnDept = data;
    }

    // --- 2. DEPARTEMENT MTIC (ex GEST ou création) ---
    let { data: mticDept } = await supabase.from('departements').select('*').or('code.eq.GEST,code.eq.MTIC').single();

    if (!mticDept) {
        console.log("Création département MTIC...");
        const { data, error } = await supabase.from('departements').insert({
            code: 'MTIC',
            nom: 'Management des Technologies de l\'information et de la Communication',
            description: 'Département MTIC'
        }).select().single();
        if (error) console.error("Erreur créa MTIC:", error);
        mticDept = data;
    } else {
        console.log(`Mise à jour département ${mticDept.code} -> MTIC...`);
        const { data, error } = await supabase.from('departements').update({
            code: 'MTIC',
            nom: 'Management des Technologies de l\'information et de la Communication',
            description: 'Département MTIC'
        }).eq('id', mticDept.id).select().single();
        if (error) console.error("Erreur update MTIC:", error);
        else mticDept = data;
    }

    // --- 3. FILIERES ---
    // On veut:
    // RSN -> GI, RT
    // MTIC -> MMI

    // Fonction helper
    const upsertFiliere = async (code, nom, deptId) => {
        // Try find by code
        const { data: existing } = await supabase.from('filieres').select('*').eq('code', code).single();
        if (existing) {
            console.log(`Mise à jour Filière ${code} -> ${deptId === rsnDept.id ? 'RSN' : 'MTIC'}`);
            const { error } = await supabase.from('filieres').update({
                nom: nom,
                departement_id: deptId
            }).eq('id', existing.id);
            if (error) console.error(`Erreur update filière ${code}:`, error);
        } else {
            console.log(`Création Filière ${code}`);
            const { error } = await supabase.from('filieres').insert({
                code: code,
                nom: nom,
                departement_id: deptId
            });
            if (error) console.error(`Erreur insert filière ${code}:`, error);
        }
    }

    if (rsnDept) {
        await upsertFiliere('GI', 'Genie Informatique', rsnDept.id);
        await upsertFiliere('RT', 'Réseaux et Télécom', rsnDept.id);
    }

    if (mticDept) {
        await upsertFiliere('MTIC', 'Management des Techniques de l\'Information et de la Communication', mticDept.id);
    }

    console.log('--- Terminé ---');
}

updateDepartments().catch(console.error);
