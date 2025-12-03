import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getStudents() {
  try {
    const etudiants = await prisma.etudiant.findMany({
      take: 10,
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        email: true
      },
      orderBy: {
        matricule: 'asc'
      }
    })

    console.log('\n📚 Étudiants disponibles dans la base de données:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (etudiants.length === 0) {
      console.log('❌ Aucun étudiant trouvé dans la base de données.')
      console.log('   Vous devez d\'abord importer des étudiants via l\'interface d\'administration.')
    } else {
      etudiants.forEach((e, index) => {
        console.log(`${index + 1}. Matricule: ${e.matricule}`)
        console.log(`   Nom: ${e.nom} ${e.prenom}`)
        console.log(`   Email: ${e.email || 'Non défini (vous pouvez utiliser n\'importe quel email)'}`)
        console.log('')
      })
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n💡 Pour vous connecter en tant qu\'étudiant:')
      console.log('   1. Allez sur: http://localhost:5173/login-etudiant')
      console.log('   2. Utilisez le matricule d\'un étudiant ci-dessus')
      console.log('   3. Utilisez l\'email de l\'étudiant (ou n\'importe quel email si non défini)')
      console.log('   4. Définissez un mot de passe (sera créé lors de la première connexion)')
      console.log('\n⚠️  Note: Lors de la première connexion, un compte Utilisateur sera créé automatiquement.')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getStudents()

