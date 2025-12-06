
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

async function checkData() {
    const { data: student, error } = await supabase
        .from('etudiants')
        .select(`
            *,
            parents (*)
        `)
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching student:', error);
    } else {
        console.log('--- Random Student Check ---');
        console.log('Student:', student.prenom, student.nom);
        console.log('Tel:', student.telephone);
        console.log('Address:', student.adresse);
        console.log('Parents count:', student.parents.length);
        if (student.parents.length > 0) {
            console.log('Parent 1:', student.parents[0].prenom, student.parents[0].nom, '- Tel:', student.parents[0].telephone);
        }
    }
}

checkData();
