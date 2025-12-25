import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erreur: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définis dans le fichier .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createAdminUser(nom, prenom, email, username, password) {
    try {
        console.log(`🚀 Création de l'administrateur: ${prenom} ${nom}...`)

        // 1. Récupérer l'ID du rôle ADMIN_SYSTEME
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('code', 'ADMIN_SYSTEME')
            .single()

        if (roleError || !role) {
            console.error('❌ Erreur: Rôle ADMIN_SYSTEME introuvable dans la base de données.')
            return
        }

        // 2. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Insérer l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('utilisateurs')
            .insert({
                nom,
                prenom,
                email,
                username,
                password: hashedPassword,
                role_id: role.id,
                actif: true
            })
            .select()
            .single()

        if (userError) {
            if (userError.code === '23505') {
                console.error('❌ Erreur: Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà.')
            } else {
                console.error('❌ Erreur lors de la création:', userError.message)
            }
            return
        }

        console.log('✅ Succès! L\'administrateur système a été créé.')
        console.log('-----------------------------------')
        console.log(`Email: ${email}`)
        console.log(`Nom d'utilisateur: ${username}`)
        console.log('-----------------------------------')
        console.log('Vous pouvez maintenant vous connecter sur /login')

    } catch (error) {
        console.error('❌ Une erreur inattendue est survenue:', error.message)
    }
}

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2)
if (args.length < 5) {
    console.log('Usage: node scripts/create_admin_user.js <nom> <prenom> <email> <username> <password>')
    console.log('Exemple: node scripts/create_admin_user.js "Dupont" "Jean" "admin@ecole.com" "admin_sys" "MonMotDePasse123"')
} else {
    createAdminUser(args[0], args[1], args[2], args[3], args[4])
}
