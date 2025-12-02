import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Création du DEP et des départements...\n')

  try {
    // 1. Créer les départements
    console.log('📁 Création des départements...')
    
    const rsn = await prisma.departement.upsert({
      where: { code: 'RSN' },
      update: {},
      create: {
        nom: 'Réseaux et Système Numérique',
        code: 'RSN',
        description: 'Département de Réseaux et Système Numérique. Contient les filières : Génie Informatique (GI) et Réseaux et Télécommunications (RT)',
        actif: true
      }
    })

    const mtic = await prisma.departement.upsert({
      where: { code: 'MTIC' },
      update: {},
      create: {
        nom: 'Management des Techniques de l\'Information et de la Communication',
        code: 'MTIC',
        description: 'Département de Management des Techniques de l\'Information et de la Communication. Contient la filière MTIC',
        actif: true
      }
    })

    console.log('✅ Départements créés:')
    console.log(`   - ${rsn.nom} (${rsn.code})`)
    console.log(`   - ${mtic.nom} (${mtic.code})`)

    // 2. Créer le DEP
    console.log('\n👤 Création du DEP...')
    
    const passwordDEP = await bcrypt.hash('gildas', 10)

    const dep = await prisma.utilisateur.upsert({
      where: { email: 'gildas@gmail.com' },
      update: {
        password: passwordDEP,
        role: 'DEP',
        actif: true
      },
      create: {
        nom: 'MOUKAGNI',
        prenom: 'Gildas',
        email: 'gildas@gmail.com',
        username: 'gildas',
        password: passwordDEP,
        role: 'DEP',
        actif: true
      }
    })

    console.log('✅ DEP créé:')
    console.log(`   - Nom: ${dep.prenom} ${dep.nom}`)
    console.log(`   - Email: ${dep.email}`)
    console.log(`   - Username: ${dep.username}`)
    console.log(`   - Mot de passe: gildas`)
    console.log(`   - Rôle: ${dep.role}`)

    console.log('\n🎉 Configuration terminée avec succès!')
    console.log('\n📋 Récapitulatif:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 DEP (Directeur des Études et de la Pédagogie):')
    console.log('   Email: gildas@gmail.com')
    console.log('   Mot de passe: gildas')
    console.log('   Rôle: DEP')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📁 Départements créés:')
    console.log(`   - ${rsn.nom} (${rsn.code})`)
    console.log(`   - ${mtic.nom} (${mtic.code})`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
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

