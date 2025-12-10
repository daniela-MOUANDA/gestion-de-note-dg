import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../src/lib/supabase.js'

/**
 * Script pour mettre à jour le mot de passe d'un étudiant
 * Usage: node scripts/update-student-password.js
 */

async function updateStudentPassword() {
    try {
        const matricule = '26933'
        const email = 'van.abaghe660@outlook.com'
        const newPassword = '1234'

        console.log('🔐 Mise à jour du mot de passe pour l\'étudiant...')
        console.log('📧 Email:', email)
        console.log('🎓 Matricule:', matricule)
        console.log('🔑 Nouveau mot de passe:', newPassword)
        console.log('')

        // Générer le hash bcrypt du nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        console.log('✅ Hash bcrypt généré:', hashedPassword.substring(0, 30) + '...')
        console.log('')

        // Trouver l'utilisateur par email
        const { data: user, error: userError } = await supabaseAdmin
            .from('utilisateurs')
            .select('id, email, nom, prenom, roles (code)')
            .ilike('email', email)
            .single()

        if (userError || !user) {
            console.error('❌ Utilisateur non trouvé avec l\'email:', email)
            console.error('Erreur:', userError)
            return
        }

        console.log('✅ Utilisateur trouvé:', user.nom, user.prenom)
        console.log('   ID:', user.id)
        console.log('   Rôle:', user.roles?.code)
        console.log('')

        // Mettre à jour le mot de passe
        const { error: updateError } = await supabaseAdmin
            .from('utilisateurs')
            .update({ password: hashedPassword })
            .eq('id', user.id)

        if (updateError) {
            console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError)
            return
        }

        console.log('✅ Mot de passe mis à jour avec succès !')
        console.log('')
        console.log('🎉 Vous pouvez maintenant vous connecter avec :')
        console.log('   Email:', email)
        console.log('   Matricule:', matricule)
        console.log('   Mot de passe:', newPassword)
        console.log('')

    } catch (error) {
        console.error('❌ Erreur:', error)
    }
}

// Exécuter le script
updateStudentPassword()
    .then(() => {
        console.log('✅ Script terminé')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error)
        process.exit(1)
    })
