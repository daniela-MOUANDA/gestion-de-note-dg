// Script pour mettre à jour les mots de passe des utilisateurs de test
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../src/lib/supabase.js';

const testPassword = 'password123';

// Liste des utilisateurs à mettre à jour
const usersToUpdate = [
    'dg@institution.ga',
    'dep@institution.ga',
    'chef.scolarite@institution.ga',
    'agent.scolarite@institution.ga',
    'sp.scolarite@institution.ga',
    'chef.info@institution.ga',
    'chef.gestion@institution.ga',
    'alex.nguema@student.ga',
    'sarah.mabika@student.ga'
];

async function updatePasswords() {
    console.log('\n==============================================');
    console.log('MISE À JOUR DES MOTS DE PASSE');
    console.log('==============================================\n');
    console.log(`Mot de passe pour tous les utilisateurs: ${testPassword}\n`);

    // Générer le hash une seule fois
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log(`Hash généré: ${hashedPassword}\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const email of usersToUpdate) {
        try {
            // Vérifier si l'utilisateur existe
            const { data: user, error: fetchError } = await supabaseAdmin
                .from('utilisateurs')
                .select('id, nom, prenom, email')
                .eq('email', email)
                .single();

            if (fetchError || !user) {
                console.log(`❌ ${email} - Non trouvé`);
                notFound++;
                continue;
            }

            // Mettre à jour le mot de passe
            const { error: updateError } = await supabaseAdmin
                .from('utilisateurs')
                .update({ password: hashedPassword })
                .eq('id', user.id);

            if (updateError) {
                console.log(`❌ ${email} - Erreur: ${updateError.message}`);
                errors++;
            } else {
                console.log(`✅ ${email} - Mot de passe mis à jour (${user.nom} ${user.prenom})`);
                updated++;
            }
        } catch (error) {
            console.log(`❌ ${email} - Exception: ${error.message}`);
            errors++;
        }
    }

    console.log('\n==============================================');
    console.log('RÉSUMÉ');
    console.log('==============================================');
    console.log(`✅ Mis à jour: ${updated}`);
    console.log(`❌ Non trouvés: ${notFound}`);
    console.log(`⚠️  Erreurs: ${errors}`);
    console.log(`📊 Total: ${usersToUpdate.length}`);
    console.log('==============================================\n');

    if (updated > 0) {
        console.log('🎉 Vous pouvez maintenant vous connecter avec:');
        console.log(`   Email: n'importe quel email ci-dessus`);
        console.log(`   Mot de passe: ${testPassword}\n`);
    }
}

updatePasswords().catch(console.error);
