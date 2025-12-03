import prisma from '../src/lib/prisma.js'

async function fixChefDepartementRoute() {
  try {
    console.log('🔍 Vérification de la route du dashboard pour CHEF_DEPARTEMENT...\n')
    
    // Récupérer le rôle CHEF_DEPARTEMENT
    const role = await prisma.role.findUnique({
      where: { code: 'CHEF_DEPARTEMENT' }
    })

    if (!role) {
      console.error('❌ Rôle CHEF_DEPARTEMENT introuvable dans la base de données')
      return
    }

    console.log('Route actuelle:', role.routeDashboard || 'NULL')
    
    // Vérifier si la route est incorrecte
    if (role.routeDashboard !== '/chef/departement/dashboard') {
      console.log('⚠️  Route incorrecte détectée. Correction en cours...')
      
      // Corriger la route
      await prisma.role.update({
        where: { code: 'CHEF_DEPARTEMENT' },
        data: { routeDashboard: '/chef/departement/dashboard' }
      })

      console.log('✅ Route corrigée avec succès: /chef/departement/dashboard')
    } else {
      console.log('✅ La route est déjà correcte: /chef/departement/dashboard')
    }

    // Vérifier après correction
    const updatedRole = await prisma.role.findUnique({
      where: { code: 'CHEF_DEPARTEMENT' }
    })

    console.log('\n📋 État final:')
    console.log('   Code:', updatedRole.code)
    console.log('   Nom:', updatedRole.nom)
    console.log('   Route Dashboard:', updatedRole.routeDashboard)
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixChefDepartementRoute()

