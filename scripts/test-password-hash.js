// Script pour tester le hash bcrypt et vérifier la base de données
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../src/lib/supabase.js';

const testPassword = 'password123';
const testEmail = 'chef.gestion@institution.ga';

async function testPasswordHash() {
    console.log('\n==============================================');
    console.log('TEST DE HASH BCRYPT');
    console.log('==============================================\n');

    // 1. Générer un nouveau hash
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('1. Nouveau hash généré:');
    console.log(`   ${newHash}\n`);

    // 2. Vérifier que le hash fonctionne
    const isValid = await bcrypt.compare(testPassword, newHash);
    console.log('2. Test du nouveau hash:');
    console.log(`   bcrypt.compare('${testPassword}', hash) = ${isValid}\n`);

    // 3. Récupérer l'utilisateur de la base de données
    console.log('3. Récupération de l\'utilisateur depuis la base de données...');
    const { data: user, error } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, nom, prenom, email, password')
        .eq('email', testEmail)
        .single();

    if (error || !user) {
        console.log(`   ❌ Utilisateur non trouvé: ${testEmail}`);
        console.log(`   Erreur: ${error?.message || 'Aucune erreur'}\n`);
        return;
    }

    console.log(`   ✅ Utilisateur trouvé: ${user.nom} ${user.prenom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Hash en base: ${user.password}\n`);

    // 4. Tester le hash en base de données
    const isValidDB = await bcrypt.compare(testPassword, user.password);
    console.log('4. Test du hash en base de données:');
    console.log(`   bcrypt.compare('${testPassword}', hashDB) = ${isValidDB}\n`);

    // 5. Comparer les hashs
    console.log('5. Comparaison des hashs:');
    console.log(`   Hash généré:  ${newHash}`);
    console.log(`   Hash en base: ${user.password}`);
    console.log(`   Identiques: ${newHash === user.password}\n`);

    // 6. Proposition de solution
    if (!isValidDB) {
        console.log('⚠️  PROBLÈME DÉTECTÉ:');
        console.log('   Le hash en base de données ne correspond pas au mot de passe de test.\n');
        console.log('💡 SOLUTIONS:');
        console.log('   1. Exécuter la migration SQL dans Supabase SQL Editor');
        console.log('   2. OU mettre à jour manuellement le hash avec le script suivant:\n');
        console.log('   UPDATE utilisateurs');
        console.log(`   SET password = '${newHash}'`);
        console.log(`   WHERE email = '${testEmail}';\n`);
    } else {
        console.log('✅ TOUT FONCTIONNE CORRECTEMENT!');
        console.log('   Le mot de passe de test correspond au hash en base de données.\n');
    }

    console.log('==============================================\n');
}

testPasswordHash().catch(console.error);
