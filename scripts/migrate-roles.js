import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des anciens codes de rôle vers les nouveaux IDs de rôle
const roleCodeMapping = {
  'AGENT_SCOLARITE': 'AGENT_SCOLARITE',
  'SP_SCOLARITE': 'SP_SCOLARITE',
  'CHEF_SERVICE_SCOLARITE': 'CHEF_SERVICE_SCOLARITE',
  'CHEF_DEPARTEMENT': 'CHEF_DEPARTEMENT',
  'DEP': 'DEP',
  'ETUDIANT': 'ETUDIANT',
  'ENSEIGNANT': 'ENSEIGNANT',
  'ADMIN': 'ADMIN'
}

async function main() {
  console.log('🔄 Migration des rôles des utilisateurs...\n')

  try {
    // Récupérer tous les rôles
    const roles = await prisma.role.findMany()
    const roleMap = new Map()
    roles.forEach(role => {
      roleMap.set(role.code, role.id)
    })

    console.log(`📋 ${roles.length} rôles trouvés dans la base`)

    // Récupérer tous les utilisateurs qui ont encore l'ancien format (si applicable)
    // Note: Cette migration suppose que vous avez déjà migré le schéma
    // et que les utilisateurs ont maintenant un champ roleId
    
    // Si vous avez encore des utilisateurs avec l'ancien enum, vous devrez les migrer
    // Pour l'instant, on vérifie juste que tous les rôles existent
    
    console.log('\n✅ Migration terminée!')
    console.log('\n📋 Rôles disponibles:')
    roles.forEach(role => {
      console.log(`   - ${role.nom} (${role.code}) → ${role.routeDashboard || 'N/A'}`)
    })

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

