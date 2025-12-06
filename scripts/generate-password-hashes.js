// Script pour générer les hashs bcrypt pour les utilisateurs de test
// Usage: node scripts/generate-password-hashes.js

import bcrypt from 'bcrypt';

const password = 'password123';
const saltRounds = 10;

async function generateHash() {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('\n==============================================');
        console.log('HASH BCRYPT GÉNÉRÉ');
        console.log('==============================================');
        console.log(`Mot de passe: ${password}`);
        console.log(`Hash: ${hash}`);
        console.log('\n✅ Copiez ce hash et remplacez "$2b$10$YourHashedPasswordHere" dans le fichier:');
        console.log('   supabase/migrations/002_insert_test_users.sql');
        console.log('==============================================\n');
    } catch (error) {
        console.error('Erreur lors de la génération du hash:', error);
    }
}

generateHash();
