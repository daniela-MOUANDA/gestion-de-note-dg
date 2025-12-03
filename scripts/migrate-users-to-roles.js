import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migration des utilisateurs vers la table Role...\n')

  try {
    // 1. Vérifier que les rôles existent
    const roles = await prisma.role.findMany()
    if (roles.length === 0) {
      console.log('❌ Aucun rôle trouvé. Exécutez d\'abord: node scripts/init-roles.js')
      return
    }

    console.log(`✅ ${roles.length} rôles trouvés`)

    // Créer un map des codes de rôle vers les IDs
    const roleMap = new Map()
    roles.forEach(role => {
      roleMap.set(role.code, role.id)
    })

    // 2. Récupérer tous les utilisateurs
    const utilisateurs = await prisma.$queryRaw`
      SELECT id, email, "role"::text as role_code
      FROM utilisateurs
      WHERE "roleId" IS NULL
    `

    console.log(`\n📋 ${utilisateurs.length} utilisateurs à migrer`)

    if (utilisateurs.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà un roleId')
      return
    }

    // 3. Migrer chaque utilisateur
    let migrated = 0
    let errors = 0

    for (const user of utilisateurs) {
      const roleId = roleMap.get(user.role_code)
      
      if (!roleId) {
        console.log(`⚠️  Rôle non trouvé pour ${user.email}: ${user.role_code}`)
        errors++
        continue
      }

      try {
        await prisma.$executeRaw`
          UPDATE utilisateurs
          SET "roleId" = ${roleId}
          WHERE id = ${user.id}
        `
        console.log(`✅ ${user.email} → ${user.role_code}`)
        migrated++
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 Résumé de la migration:')
    console.log(`   ✅ Migrés: ${migrated}`)
    console.log(`   ❌ Erreurs: ${errors}`)

    // 4. Vérifier le résultat
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT("roleId") as avec_roleId,
        COUNT(*) - COUNT("roleId") as sans_roleId
      FROM utilisateurs
    `

    console.log('\n📋 État final:')
    console.log(`   Total utilisateurs: ${result[0].total}`)
    console.log(`   Avec roleId: ${result[0].avec_roleId}`)
    console.log(`   Sans roleId: ${result[0].sans_roleId}`)

    if (result[0].sans_roleId > 0) {
      console.log('\n⚠️  Certains utilisateurs n\'ont pas de roleId. Vérifiez manuellement.')
    } else {
      console.log('\n✅ Tous les utilisateurs ont un roleId!')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
