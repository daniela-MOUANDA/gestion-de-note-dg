import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des anciens codes de rôle vers les nouveaux rôles avec leurs routes
const rolesData = [
  {
    code: 'AGENT_SCOLARITE',
    nom: 'Agent Scolarité',
    description: 'Agent du service scolarité',
    routeDashboard: '/scolarite/dashboard',
    actif: true
  },
  {
    code: 'SP_SCOLARITE',
    nom: 'SP-Scolarité',
    description: 'Secrétaire Particulière du service scolarité',
    routeDashboard: '/sp-scolarite/dashboard',
    actif: true
  },
  {
    code: 'CHEF_SERVICE_SCOLARITE',
    nom: 'Chef de Service Scolarité',
    description: 'Chef du service scolarité',
    routeDashboard: '/chef-scolarite/dashboard',
    actif: true
  },
  {
    code: 'CHEF_DEPARTEMENT',
    nom: 'Chef de Département',
    description: 'Chef d\'un département académique',
    routeDashboard: '/chef/dashboard',
    actif: true
  },
  {
    code: 'DEP',
    nom: 'Directeur des Études et de la Pédagogie',
    description: 'Directeur des Études et de la Pédagogie',
    routeDashboard: '/dep/dashboard',
    actif: true
  },
  {
    code: 'ETUDIANT',
    nom: 'Étudiant',
    description: 'Étudiant inscrit',
    routeDashboard: '/dashboard',
    actif: true
  },
  {
    code: 'ENSEIGNANT',
    nom: 'Enseignant',
    description: 'Enseignant',
    routeDashboard: '/login',
    actif: true
  },
  {
    code: 'ADMIN',
    nom: 'Administrateur',
    description: 'Administrateur système',
    routeDashboard: '/admin/dashboard',
    actif: true
  }
]

async function main() {
  console.log('🌱 Initialisation des rôles...\n')

  try {
    // Créer tous les rôles
    for (const roleData of rolesData) {
      const role = await prisma.role.upsert({
        where: { code: roleData.code },
        update: {
          nom: roleData.nom,
          description: roleData.description,
          routeDashboard: roleData.routeDashboard,
          actif: roleData.actif
        },
        create: roleData
      })
      console.log(`✅ Rôle créé/mis à jour: ${role.nom} (${role.code})`)
    }

    console.log('\n🎉 Initialisation des rôles terminée avec succès!')
    console.log('\n📋 Rôles disponibles:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    rolesData.forEach(role => {
      console.log(`   - ${role.nom} (${role.code})`)
      console.log(`     Route: ${role.routeDashboard}`)
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des rôles:', error)
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

