
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Prefer service role key for admin updates

if (!supabaseUrl || (!supabaseKey && !serviceKey)) {
    console.error('Erreur: Les variables d\'environnement Supabase sont manquantes.');
    process.exit(1);
}

// Use service key if available to bypass RLS, otherwise anon key
const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

// --- Data Generators ---

const FIRST_NAMES_MALE = [
    'Jean', 'Pierre', 'Paul', 'Jacques', 'Michel', 'David', 'Emmanuel', 'Christian', 'Stéphane', 'Alain',
    'Mohamed', 'Moussa', 'Ibrahim', 'Abdoulaye', 'Youssef', 'Ousmane', 'Mamadou', 'Ali', 'Hassan', 'Omar',
    'Kévin', 'Thomas', 'Nicolas', 'Julien', 'Alexandre', 'Maxime', 'Antoine', 'Romain', 'Lucas', 'Hugo',
    'Franck', 'Brice', 'Landry', 'Guy', 'Serge', 'Wilfried', 'Hervé', 'Rodrigue', 'Junior', 'Grace'
];

const FIRST_NAMES_FEMALE = [
    'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Martine', 'Véronique', 'Françoise', 'Sandrine', 'Sophie',
    'Fatima', 'Amina', 'Aïcha', 'Khadija', 'Zahra', 'Mariam', 'Sarah', 'Leïla', 'Salma', 'Rania',
    'Julie', 'Camille', 'Léa', 'Manon', 'Chloé', 'Laura', 'Audrey', 'Céline', 'Emilie', 'Elodie',
    'Grace', 'Prisca', 'Vanessa', 'Sonia', 'Tatiana', 'Clarisse', 'Estelle', 'Raïssa', 'Diane', 'Audrey'
];

const LAST_NAMES = [
    'Mba', 'Nguema', 'Obiang', 'Nze', 'Ngoua', 'Bouassa', 'Mapangou', 'Moussavou', 'Kombila', 'Mickoto',
    'Ndong', 'Ondo', 'Abessolo', 'Emane', 'Biyoghe', 'Ntoutoume', 'Essono', 'Mezui', 'Mengue', 'Owono',
    'Diallo', 'Sow', 'Ba', 'Barry', 'Camara', 'Cissé', 'Diop', 'Fall', 'Diakité', 'Koné',
    'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent'
];

const CITIES = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou'];
const QUARTIERS = ['Louis', 'Montagne Sainte', 'Batterie 4', 'Glass', 'Oloumi', 'Nzeng-Ayong', 'PK8', 'Charbonnages', 'Alibandeng', 'Tahiti'];

const PROFESSIONS = [
    'Enseignant', 'Médecin', 'Ingénieur', 'Commerçant', 'Fonctionnaire', 'Agriculteur', 'Entrepreneur',
    'Infirmier', 'Comptable', 'Technicien', 'Chauffeur', 'Avocat', 'Militaire', 'Retraité'
];

const DOMAINS = ['gmail.com', 'yahoo.fr', 'hotmail.com', 'outlook.com', 'orange.ga'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    // Generate Gabonese style number: +241 07 XX XX XX or 06 XX XX XX
    const prefix = Math.random() > 0.5 ? '07' : '06';
    const part1 = Math.floor(Math.random() * 90 + 10);
    const part2 = Math.floor(Math.random() * 90 + 10);
    const part3 = Math.floor(Math.random() * 90 + 10);
    return `+241 ${prefix} ${part1} ${part2} ${part3}`;
}

function generateDateOfBirth() {
    // Age between 17 and 30 for students
    const age = Math.floor(Math.random() * 13) + 17;
    const year = new Date().getFullYear() - age;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1; // Simplify to max 28 to avoid invalid dates
    return new Date(year, month, day).toISOString().split('T')[0];
}

function generateEmail(prenom, nom) {
    const cleanPrenom = prenom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
    const cleanNom = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
    const rand = Math.floor(Math.random() * 1000);
    return `${cleanPrenom}.${cleanNom}${rand}@${getRandomElement(DOMAINS)}`;
}

// --- Main Script ---

async function fillStudentData() {
    console.log('Début du remplissage des données étudiants...');

    // 1. Fetch all students
    const { data: students, error: fetchError } = await supabase
        .from('etudiants')
        .select('*');

    if (fetchError) {
        console.error('Erreur lors de la récupération des étudiants:', fetchError);
        return;
    }

    console.log(`${students.length} étudiants trouvés.`);

    let updatedCount = 0;
    let parentsCreatedCount = 0;

    for (const student of students) {
        // --- Update Student Info ---
        const updates = {};
        let needsUpdate = false;

        if (!student.telephone) {
            updates.telephone = generatePhone();
            needsUpdate = true;
        }
        if (!student.adresse) {
            updates.adresse = `${getRandomElement(QUARTIERS)}, ${getRandomElement(CITIES)}`;
            needsUpdate = true;
        }
        if (!student.date_naissance) {
            updates.date_naissance = generateDateOfBirth();
            needsUpdate = true;
        }
        if (!student.lieu_naissance) {
            updates.lieu_naissance = getRandomElement(CITIES);
            needsUpdate = true;
        }
        if (!student.nationalite) {
            updates.nationalite = 'Gabonaise';
            needsUpdate = true;
        }
        // Ensure email exists (critical for data)
        if (!student.email || student.email === '') {
            updates.email = generateEmail(student.prenom, student.nom);
            needsUpdate = true;
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('etudiants')
                .update(updates)
                .eq('id', student.id);

            if (updateError) {
                console.error(`Erreur mise à jour étudiant ${student.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }

        // --- Create/Update Parents ---
        // Check if student has parents
        const { data: parents, error: parentError } = await supabase
            .from('parents')
            .select('*')
            .eq('etudiant_id', student.id);

        if (parentError) {
            console.error(`Erreur check parents pour ${student.id}:`, parentError);
            continue;
        }

        if (parents.length === 0) {
            // Create 1 or 2 parents
            const numParents = Math.random() > 0.3 ? 2 : 1;

            // Parent 1 (Father usually)
            const lastName = student.nom; // Often same name
            const firstName = getRandomElement(FIRST_NAMES_MALE);

            const parent1 = {
                etudiant_id: student.id,
                type: 'PERE',
                nom: lastName,
                prenom: firstName,
                telephone: generatePhone(),
                email: generateEmail(firstName, lastName),
                profession: getRandomElement(PROFESSIONS),
                adresse: updates.adresse || student.adresse || `${getRandomElement(QUARTIERS)}, Librevile`
            };

            const { error: p1Error } = await supabase.from('parents').insert(parent1);
            if (!p1Error) parentsCreatedCount++;
            else console.error('Erreur création père:', p1Error);

            if (numParents === 2) {
                // Parent 2 (Mother)
                const lastNameMother = getRandomElement(LAST_NAMES);
                const firstNameMother = getRandomElement(FIRST_NAMES_FEMALE);

                const parent2 = {
                    etudiant_id: student.id,
                    type: 'MERE',
                    nom: lastNameMother,
                    prenom: firstNameMother,
                    telephone: generatePhone(),
                    email: generateEmail(firstNameMother, lastNameMother),
                    profession: getRandomElement(PROFESSIONS),
                    adresse: updates.adresse || student.adresse || `${getRandomElement(QUARTIERS)}, Librevile`
                };

                const { error: p2Error } = await supabase.from('parents').insert(parent2);
                if (!p2Error) parentsCreatedCount++;
                else console.error('Erreur création mère:', p2Error);
            }
        }
    }

    console.log('--- Terminée ---');
    console.log(`Étudiants mis à jour: ${updatedCount}`);
    console.log(`Parents créés: ${parentsCreatedCount}`);
}

fillStudentData().catch(console.error);
