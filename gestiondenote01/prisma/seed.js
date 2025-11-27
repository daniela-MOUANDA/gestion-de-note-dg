import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer les formations
  const initial1 = await prisma.formation.upsert({
    where: { code: 'INITIAL_1' },
    update: {},
    create: {
      code: 'INITIAL_1',
      nom: 'Formation Initiale 1'
    }
  })

  const initial2 = await prisma.formation.upsert({
    where: { code: 'INITIAL_2' },
    update: {},
    create: {
      code: 'INITIAL_2',
      nom: 'Formation Initiale 2'
    }
  })

  console.log('✅ Formations créées')

  // Créer les filières
  const rt = await prisma.filiere.upsert({
    where: { code: 'RT' },
    update: {},
    create: {
      code: 'RT',
      nom: 'Réseau et Télécom'
    }
  })

  const gi = await prisma.filiere.upsert({
    where: { code: 'GI' },
    update: {},
    create: {
      code: 'GI',
      nom: 'Génie Informatique'
    }
  })

  const mtic = await prisma.filiere.upsert({
    where: { code: 'MTIC' },
    update: {},
    create: {
      code: 'MTIC',
      nom: 'Métiers des TIC'
    }
  })

  const av = await prisma.filiere.upsert({
    where: { code: 'AV' },
    update: {},
    create: {
      code: 'AV',
      nom: 'Audiovisuel'
    }
  })

  console.log('✅ Filières créées')

  // Créer les niveaux
  const l1 = await prisma.niveau.upsert({
    where: { code: 'L1' },
    update: {},
    create: {
      code: 'L1',
      nom: '1ère année',
      ordinal: '1ère'
    }
  })

  const l2 = await prisma.niveau.upsert({
    where: { code: 'L2' },
    update: {},
    create: {
      code: 'L2',
      nom: '2ème année',
      ordinal: '2ème'
    }
  })

  const l3 = await prisma.niveau.upsert({
    where: { code: 'L3' },
    update: {},
    create: {
      code: 'L3',
      nom: '3ème année',
      ordinal: '3ème'
    }
  })

  console.log('✅ Niveaux créés')

  // Créer les promotions
  const promo2024 = await prisma.promotion.upsert({
    where: { annee: '2024-2025' },
    update: {},
    create: {
      annee: '2024-2025',
      statut: 'EN_COURS',
      dateDebut: new Date('2024-09-01'),
      dateFin: new Date('2025-08-31')
    }
  })

  const promo2023 = await prisma.promotion.upsert({
    where: { annee: '2023-2024' },
    update: {},
    create: {
      annee: '2023-2024',
      statut: 'ARCHIVE',
      dateDebut: new Date('2023-09-01'),
      dateFin: new Date('2024-08-31')
    }
  })

  const promo2022 = await prisma.promotion.upsert({
    where: { annee: '2022-2023' },
    update: {},
    create: {
      annee: '2022-2023',
      statut: 'ARCHIVE',
      dateDebut: new Date('2022-09-01'),
      dateFin: new Date('2023-08-31')
    }
  })

  console.log('✅ Promotions créées')

  // Créer quelques classes
  const classes = [
    { code: 'RT-1A', filiere: rt.id, niveau: l1.id },
    { code: 'RT-1B', filiere: rt.id, niveau: l1.id },
    { code: 'RT-2A', filiere: rt.id, niveau: l2.id },
    { code: 'GI-1A', filiere: gi.id, niveau: l1.id },
    { code: 'GI-1B', filiere: gi.id, niveau: l1.id },
    { code: 'GI-2A', filiere: gi.id, niveau: l2.id },
    { code: 'GI-3A', filiere: gi.id, niveau: l3.id },
    { code: 'MTIC-1A', filiere: mtic.id, niveau: l1.id },
    { code: 'MTIC-2A', filiere: mtic.id, niveau: l2.id },
    { code: 'AV-1A', filiere: av.id, niveau: l1.id }
  ]

  for (const classe of classes) {
    await prisma.classe.upsert({
      where: {
        code_filiereId_niveauId: {
          code: classe.code,
          filiereId: classe.filiere,
          niveauId: classe.niveau
        }
      },
      update: {},
      create: {
        code: classe.code,
        nom: classe.code,
        filiereId: classe.filiere,
        niveauId: classe.niveau,
        effectif: 0
      }
    })
  }

  console.log('✅ Classes créées')

  // Créer des utilisateurs de test
  const chefService = await prisma.utilisateur.upsert({
    where: { username: 'chef' },
    update: {},
    create: {
      nom: 'ABDALLAH',
      prenom: 'Junior',
      email: 'chef.scolarite@inptic.ga',
      username: 'chef',
      password: '$2b$10$rK8X8X8X8X8X8X8X8X8X8u8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', // chef123
      role: 'CHEF_SERVICE_SCOLARITE',
      actif: true
    }
  })

  const sp = await prisma.utilisateur.upsert({
    where: { username: 'sp' },
    update: {},
    create: {
      nom: 'OBIANG',
      prenom: 'Jeanne',
      email: 'sp.scolarite@inptic.ga',
      username: 'sp',
      password: '$2b$10$rK8X8X8X8X8X8X8X8X8u8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', // sp123
      role: 'SP_SCOLARITE',
      actif: true
    }
  })

  const agent1 = await prisma.utilisateur.upsert({
    where: { username: 'agent1' },
    update: {},
    create: {
      nom: 'NZAMBA',
      prenom: 'Marie',
      email: 'marie.nzamba@inptic.ga',
      username: 'agent1',
      password: '$2b$10$rK8X8X8X8X8X8X8X8X8u8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', // agent123
      role: 'AGENT_SCOLARITE',
      actif: true
    }
  })

  console.log('✅ Utilisateurs créés')

  console.log('🎉 Seeding terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

