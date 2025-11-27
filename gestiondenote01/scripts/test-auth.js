import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔍 Test de l\'authentification...\n')

    // Récupérer les utilisateurs
    const users = await prisma.utilisateur.findMany({
      where: {
        username: {
          in: ['chef', 'sp', 'agent1']
        }
      }
    })

    console.log('📋 Utilisateurs trouvés :\n')
    
    for (const user of users) {
      console.log(`👤 ${user.username} (${user.email})`)
      console.log(`   Rôle: ${user.role}`)
      console.log(`   Mot de passe hashé: ${user.password.substring(0, 30)}...`)
      
      // Vérifier si le mot de passe est un hash bcrypt valide
      const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
      
      if (!isBcryptHash) {
        console.log(`   ⚠️  Le mot de passe n'est PAS un hash bcrypt valide !`)
        console.log(`   🔧 Mise à jour nécessaire...`)
        
        // Hasher le mot de passe selon le username
        let plainPassword = ''
        if (user.username === 'chef') plainPassword = 'chef123'
        else if (user.username === 'sp') plainPassword = 'sp123'
        else if (user.username === 'agent1') plainPassword = 'agent123'
        
        if (plainPassword) {
          const hashedPassword = await bcrypt.hash(plainPassword, 10)
          await prisma.utilisateur.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          })
          console.log(`   ✅ Mot de passe mis à jour avec succès`)
        }
      } else {
        // Tester la connexion
        let plainPassword = ''
        if (user.username === 'chef') plainPassword = 'chef123'
        else if (user.username === 'sp') plainPassword = 'sp123'
        else if (user.username === 'agent1') plainPassword = 'agent123'
        
        if (plainPassword) {
          const isValid = await bcrypt.compare(plainPassword, user.password)
          console.log(`   ${isValid ? '✅' : '❌'} Test de connexion: ${isValid ? 'SUCCÈS' : 'ÉCHEC'}`)
        }
      }
      console.log('')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Identifiants de connexion :')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👔 Chef de Service Scolarité :')
    console.log('   Email: chef.scolarite@inptic.ga')
    console.log('   Password: chef123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👩 SP-Scolarité :')
    console.log('   Email: sp.scolarite@inptic.ga')
    console.log('   Password: sp123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Agent Scolarité :')
    console.log('   Email: marie.nzamba@inptic.ga')
    console.log('   Password: agent123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()

