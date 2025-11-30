import prisma from '../../lib/prisma.js'

const MONTHS_WINDOW = 4

const capitalize = (value = '') => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatMonthLabel = (date) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
  return capitalize(formatter.format(date).replace('.', ''))
}

const getAcademicYear = (referenceDate = new Date()) => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0 = janvier
  if (month >= 7) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

export const getSPDashboardStats = async () => {
  const now = new Date()
  const academicYear = getAcademicYear(now)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_WINDOW - 1), 1)

  const [generated, thisMonth, pending] = await Promise.all([
    prisma.attestation.count({
      where: { anneeAcademique: academicYear }
    }),
    prisma.attestation.count({
      where: {
        anneeAcademique: academicYear,
        dateGeneration: { gte: startOfMonth }
      }
    }),
    prisma.inscription.count({
      where: { statut: 'EN_ATTENTE' }
    })
  ])

  // Préparer les paires étudiant/promotion ayant déjà une attestation
  const attestationPairs = await prisma.attestation.findMany({
    select: { etudiantId: true, promotionId: true }
  })
  const attestationSet = new Set(
    attestationPairs.map((attestation) => `${attestation.etudiantId}-${attestation.promotionId}`)
  )

  const validatedLite = await prisma.inscription.findMany({
    where: { statut: 'VALIDEE' },
    select: { id: true, etudiantId: true, promotionId: true }
  })

  const availableInscriptionIds = validatedLite
    .filter((inscription) => !attestationSet.has(`${inscription.etudiantId}-${inscription.promotionId}`))
    .map((inscription) => inscription.id)

  const available = availableInscriptionIds.length

  let alerts = []
  if (availableInscriptionIds.length > 0) {
    const alertsRaw = await prisma.inscription.findMany({
      where: { id: { in: availableInscriptionIds } },
      orderBy: { dateValidation: 'desc' },
      take: 5,
      include: {
        etudiant: { select: { nom: true, prenom: true } },
        filiere: { select: { code: true, nom: true } },
        classe: { select: { code: true, nom: true } },
        niveau: { select: { code: true, nom: true } }
      }
    })

    alerts = alertsRaw.map((item) => ({
      id: item.id,
      nom: `${item.etudiant?.nom ?? ''} ${item.etudiant?.prenom ?? ''}`.trim(),
      filiere: item.filiere?.code || item.filiere?.nom || 'N/A',
      classe: item.classe?.code || item.classe?.nom || item.niveau?.code || 'N/A',
      date: item.dateValidation
        ? item.dateValidation.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : item.dateInscription
          ? item.dateInscription.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
          : ''
    }))
  }

  const recentAttestations = await prisma.attestation.findMany({
    where: {
      anneeAcademique: academicYear,
      dateGeneration: { gte: periodStart }
    },
    select: { dateGeneration: true }
  })

  const monthlyMap = recentAttestations.reduce((acc, item) => {
    const date = item.dateGeneration
    const key = `${date.getFullYear()}-${date.getMonth()}`
    acc.set(key, (acc.get(key) || 0) + 1)
    return acc
  }, new Map())

  const monthly = []
  for (let i = MONTHS_WINDOW - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthly.push({
      mois: formatMonthLabel(date),
      generes: monthlyMap.get(key) || 0
    })
  }

  const filiereDistribution = await prisma.inscription.groupBy({
    by: ['filiereId'],
    where: {
      statut: {
        in: ['INSCRIT', 'VALIDEE']
      }
    },
    _count: {
      _all: true
    }
  })

  const filiereIds = filiereDistribution.map((item) => item.filiereId)
  const filiereInfos = filiereIds.length
    ? await prisma.filiere.findMany({
        where: { id: { in: filiereIds } },
        select: { id: true, code: true, nom: true }
      })
    : []
  const filiereMap = new Map(filiereInfos.map((filiere) => [filiere.id, filiere]))

  const byFiliere = filiereDistribution
    .map((entry) => {
      const filiere = filiereMap.get(entry.filiereId)
      return {
        id: entry.filiereId,
        code: filiere?.code || 'N/A',
        nom: filiere?.nom || 'Non défini',
        value: entry._count._all
      }
    })
    .sort((a, b) => b.value - a.value)

  return {
    stats: {
      attestationsGenerees: generated,
      attestationsDisponibles: available,
      attestationsCeMois: thisMonth,
      enAttente: pending
    },
    monthly,
    byFiliere,
    alerts
  }
}


