import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePasswords() {
  try {
    console.log('🔐 Mise à jour des mots de passe...\n')

    // Mots de passe en clair
    const passwords = {
      chef: 'chef123',
      sp: 'sp123',
      agent1: 'agent123'
    }

    // Hasher les mots de passe
    const hashedPasswords = {}
    for (const [username, password] of Object.entries(passwords)) {
      hashedPasswords[username] = await bcrypt.hash(password, 10)
      console.log(`✅ ${username}: ${password} -> ${hashedPasswords[username].substring(0, 30)}...`)
    }

    // Mettre à jour dans la base de données
    await prisma.utilisateur.update({
      where: { username: 'chef' },
      data: { password: hashedPasswords.chef }
    })

    await prisma.utilisateur.update({
      where: { username: 'sp' },
      data: { password: hashedPasswords.sp }
    })

    await prisma.utilisateur.update({
      where: { username: 'agent1' },
      data: { password: hashedPasswords.agent1 }
    })

    console.log('\n🎉 Mots de passe mis à jour avec succès!')
    console.log('\n📋 Récapitulatif des identifiants :')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👔 Chef de Service Scolarité :')
    console.log('   Username: chef')
    console.log('   Password: chef123')
    console.log('   Email: chef.scolarite@inptic.ga')
    console.log('   URL: http://localhost:5173/login-chef-scolarite')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👩 SP-Scolarité :')
    console.log('   Username: sp')
    console.log('   Password: sp123')
    console.log('   Email: sp.scolarite@inptic.ga')
    console.log('   URL: http://localhost:5173/login-sp')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Agent Scolarité :')
    console.log('   Username: agent1')
    console.log('   Password: agent123')
    console.log('   Email: marie.nzamba@inptic.ga')
    console.log('   URL: http://localhost:5173/login-scolarite')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updatePasswords()

