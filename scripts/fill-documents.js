
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurer l'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceKey)) {
    console.error('Erreur: Les variables d\'environnement Supabase sont manquantes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

// URLs de test
const DUMMY_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const PLACEHOLDER_IMG_DOC = 'https://placehold.co/600x800/png?text=Document+Officiel';

async function fillDocuments() {
    console.log('Début du remplissage des documents...');

    // 1. Update Etudiants Photos
    const { data: students, error: sError } = await supabase.from('etudiants').select('id, nom, prenom, photo');

    if (sError) {
        console.error('Erreur fetch etudiants:', sError);
        return;
    }

    let photoCount = 0;
    for (const s of students) {
        if (!s.photo || s.photo.includes('placehold') || s.photo === '') { // Update empty or old placeholder
            const initiales = `${s.prenom[0]}${s.nom[0]}`;
            const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.prenom + ' ' + s.nom)}&background=random&color=fff&size=512`;

            const { error: uError } = await supabase
                .from('etudiants')
                .update({ photo: photoUrl })
                .eq('id', s.id);

            if (!uError) photoCount++;
        }
    }
    console.log(`Photos mises à jour pour ${photoCount} étudiants.`);

    // 2. Update Inscriptions Documents & Status
    const { data: inscriptions, error: iError } = await supabase.from('inscriptions').select('id, etudiant_id, statut');

    if (iError) {
        console.error('Erreur fetch inscriptions:', iError);
        return;
    }

    console.log(`${inscriptions.length} inscriptions trouvées.`);

    let docCount = 0;

    for (const ins of inscriptions) {
        // Decide status: 90% INSCRIT, 10% EN_ATTENTE (to have some test cases for validation)
        // But user asked "pour qu'ils puissent passer est considerer comme inscrit", implies primarily success case.
        // Let's force 95% INSCRIT.
        const newStatut = Math.random() > 0.05 ? 'INSCRIT' : 'EN_ATTENTE';

        // Update documents
        const updates = {
            copie_releve: DUMMY_PDF,
            copie_diplome: DUMMY_PDF,
            copie_acte_naissance: PLACEHOLDER_IMG_DOC,
            photo_identite: PLACEHOLDER_IMG_DOC, // Typically same as student photo but file link
            piece_identite: PLACEHOLDER_IMG_DOC,
            quittance: PLACEHOLDER_IMG_DOC,
            statut: newStatut, // Force status update to allow graphs to work
            date_validation: newStatut === 'INSCRIT' ? new Date().toISOString() : null
        };

        const { error: uError } = await supabase
            .from('inscriptions')
            .update(updates)
            .eq('id', ins.id);

        if (!uError) docCount++;
        else console.error(`Erreur update inscription ${ins.id}:`, uError);
    }

    console.log(`Documents et statuts mis à jour pour ${docCount} inscriptions.`);
    console.log('--- Terminé ---');
}

fillDocuments().catch(console.error);
