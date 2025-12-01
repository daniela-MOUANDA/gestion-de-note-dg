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

// Statistiques pour le Chef de Service de la Scolarité
export const getChefDashboardStats = async () => {
  try {
    // Compter les agents actifs
    const totalAgents = await prisma.utilisateur.count({
      where: {
        role: 'AGENT_SCOLARITE',
        actif: true
      }
    })

    // Compter les SP actives
    const totalSP = await prisma.utilisateur.count({
      where: {
        role: 'SP_SCOLARITE',
        actif: true
      }
    })

    // Compter les candidats admis (tous ceux avec typeInscription: 'INSCRIPTION')
    const candidatsAdmis = await prisma.inscription.count({
      where: {
        typeInscription: 'INSCRIPTION'
      }
    })

    // Compter les étudiants inscrits (statut: 'INSCRIT') - ce qui doit être affiché
    const etudiantsInscrits = await prisma.inscription.count({
      where: {
        statut: 'INSCRIT'
      }
    })

    // Compter les inscriptions en attente
    const inscriptionsEnAttente = await prisma.inscription.count({
      where: {
        statut: 'EN_ATTENTE'
      }
    })

    // Compter les attestations générées ce mois
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const academicYear = getAcademicYear(now)
    
    const activePromotions = await prisma.promotion.findMany({
      where: { statut: 'EN_COURS' },
      select: { annee: true }
    })
    
    const possibleAcademicYears = activePromotions.map(p => p.annee)
    if (!possibleAcademicYears.includes(academicYear)) {
      possibleAcademicYears.push(academicYear)
    }
    
    const academicYearFilter = possibleAcademicYears.length > 0
      ? { anneeAcademique: { in: possibleAcademicYears } }
      : {}

    const attestationsCeMois = await prisma.attestation.count({
      where: {
        ...academicYearFilter,
        dateGeneration: { gte: startOfMonth }
      }
    })

    // Récupérer les dernières connexions (agents et SP)
    const dernieresConnexions = await prisma.utilisateur.findMany({
      where: {
        role: {
          in: ['AGENT_SCOLARITE', 'SP_SCOLARITE']
        },
        derniereConnexion: {
          not: null
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: true,
        derniereConnexion: true,
        actif: true
      },
      orderBy: {
        derniereConnexion: 'desc'
      },
      take: 5
    })

    // Récupérer les actions récentes depuis ActionAudit
    const actionsRecentes = await prisma.actionAudit.findMany({
      where: {
        utilisateur: {
          role: {
            in: ['AGENT_SCOLARITE', 'SP_SCOLARITE']
          }
        }
      },
      include: {
        utilisateur: {
          select: {
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        dateAction: 'desc'
      },
      take: 5
    })

    // Statistiques des inscriptions par semaine (dernières 5 semaines)
    const inscriptionsParSemaine = []
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      // Compter les inscriptions finalisées (statut INSCRIT) par semaine
      const count = await prisma.inscription.count({
        where: {
          statut: 'INSCRIT',
          dateInscription: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })

      inscriptionsParSemaine.push({
        semaine: `Sem ${5 - i}`,
        inscriptions: count
      })
    }

    // Récupérer l'année académique actuelle depuis la promotion active
    const currentPromotion = await prisma.promotion.findFirst({
      where: { statut: 'EN_COURS' },
      orderBy: { annee: 'desc' }
    })
    
    // Pour l'année 2025, forcer l'année académique à 2025-2026
    // Même si une promotion avec une autre année est active
    const currentYear = now.getFullYear()
    let anneeAcademique
    
    if (currentYear === 2025) {
      // En 2025, l'année académique est toujours 2025-2026
      anneeAcademique = '2025-2026'
    } else if (currentYear === 2026) {
      // En 2026, on vérifie le mois pour déterminer l'année académique
      const currentMonth = now.getMonth() // 0 = janvier
      if (currentMonth < 7) {
        // Avant juillet 2026, on est encore en 2025-2026
        anneeAcademique = '2025-2026'
      } else {
        // À partir de juillet 2026, on passe à 2026-2027
        anneeAcademique = '2026-2027'
      }
    } else if (currentPromotion?.annee) {
      // Pour les autres années, utiliser l'année de la promotion active si elle existe
      anneeAcademique = currentPromotion.annee
    } else {
      // Sinon, utiliser le calcul normal
      anneeAcademique = getAcademicYear(now)
    }

    // Calculer le taux d'activité (basé sur les connexions des 7 derniers jours)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    
    const totalUsers = totalAgents + totalSP
    const usersActifs7Jours = await prisma.utilisateur.count({
      where: {
        role: {
          in: ['AGENT_SCOLARITE', 'SP_SCOLARITE']
        },
        derniereConnexion: {
          gte: sevenDaysAgo
        }
      }
    })
    
    const tauxActivite = totalUsers > 0 
      ? Math.round((usersActifs7Jours / totalUsers) * 100)
      : 0

    // Calculer le taux d'activité de la semaine précédente pour la comparaison
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(now.getDate() - 14)
    
    const usersActifsSemainePrecedente = await prisma.utilisateur.count({
      where: {
        role: {
          in: ['AGENT_SCOLARITE', 'SP_SCOLARITE']
        },
        derniereConnexion: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo
        }
      }
    })
    
    const tauxActiviteSemainePrecedente = totalUsers > 0
      ? Math.round((usersActifsSemainePrecedente / totalUsers) * 100)
      : 0
    
    const variationTauxActivite = tauxActivite - tauxActiviteSemainePrecedente

    // Récupérer les connexions d'aujourd'hui par tranche horaire
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const connexionsAujourdhui = []
    
    // Créer des tranches horaires (8h, 10h, 12h, 14h, 16h, 18h)
    const tranchesHoraires = [8, 10, 12, 14, 16, 18]
    
    for (const heure of tranchesHoraires) {
      const heureDebut = new Date(todayStart)
      heureDebut.setHours(heure, 0, 0, 0)
      const heureFin = new Date(todayStart)
      heureFin.setHours(heure + 1, 0, 0, 0)
      
      // Compter les connexions uniques dans cette tranche horaire
      const connexions = await prisma.utilisateur.findMany({
        where: {
          role: {
            in: ['AGENT_SCOLARITE', 'SP_SCOLARITE']
          },
          derniereConnexion: {
            gte: heureDebut,
            lt: heureFin
          }
        },
        select: {
          id: true
        }
      })
      
      connexionsAujourdhui.push({
        heure: `${heure}h`,
        connexions: connexions.length
      })
    }

    return {
      stats: {
        totalAgents,
        agentsActifs: totalAgents,
        totalSP,
        spActives: totalSP,
        candidatsAdmis, // Tous les candidats admis
        etudiantsInscrits, // Seulement ceux avec statut INSCRIT
        inscriptionsEnAttente, // Ceux en attente de finalisation
        attestationsGenerees: attestationsCeMois,
        messagesNonLus: 0, // À implémenter si nécessaire
        tauxActivite,
        variationTauxActivite,
        anneeAcademique
      },
      connexionsAujourdhui,
      dernieresConnexions: dernieresConnexions.map(u => ({
        id: u.id,
        nom: `${u.prenom} ${u.nom}`,
        role: u.role === 'AGENT_SCOLARITE' ? 'Agent' : 'SP-Scolarité',
        date: u.derniereConnexion ? u.derniereConnexion.toLocaleDateString('fr-FR') : 'N/A',
        heure: u.derniereConnexion ? u.derniereConnexion.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        statut: u.actif ? 'actif' : 'inactif'
      })),
      actionsRecentes: actionsRecentes.map(a => ({
        id: a.id,
        agent: `${a.utilisateur?.prenom || ''} ${a.utilisateur?.nom || ''}`.trim(),
        action: a.action,
        details: a.details || '',
        date: a.dateAction.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: a.typeAction === 'SUCCESS' ? 'success' : a.typeAction === 'WARNING' ? 'warning' : 'info'
      })),
      inscriptionsParSemaine
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du Chef:', error)
    throw error
  }
}

// Statistiques détaillées pour la page Statistiques du Chef
export const getChefStatistiques = async () => {
  try {
    const now = new Date()
    
    // Inscriptions par mois (12 derniers mois)
    const inscriptionsParMois = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      const count = await prisma.inscription.count({
        where: {
          typeInscription: 'INSCRIPTION',
          dateInscription: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
      const monthName = monthNames[monthStart.getMonth()]
      
      inscriptionsParMois.push({
        mois: monthName,
        total: count
      })
    }
    
    // Répartition par filière
    const inscriptionsParFiliere = await prisma.inscription.groupBy({
      by: ['filiereId'],
      where: {
        typeInscription: 'INSCRIPTION'
      },
      _count: {
        _all: true
      }
    })
    
    // Récupérer les détails des filières
    const filiereIds = inscriptionsParFiliere.map(item => item.filiereId).filter(id => id !== null)
    const filieres = filiereIds.length > 0 ? await prisma.filiere.findMany({
      where: {
        id: {
          in: filiereIds
        }
      },
      select: {
        id: true,
        code: true,
        nom: true
      }
    }) : []
    
    const dataFilieres = inscriptionsParFiliere.map((item) => {
      const filiere = filieres.find(f => f.id === item.filiereId)
      return {
        name: filiere?.code || filiere?.nom || 'Non défini',
        value: item._count._all
      }
    }).filter(item => item.name !== 'Non défini').sort((a, b) => b.value - a.value)
    
    return {
      inscriptionsParMois,
      repartitionFilieres: dataFilieres
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    throw error
  }
}

export const getSPDashboardStats = async () => {
  const now = new Date()
  const academicYear = getAcademicYear(now)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_WINDOW - 1), 1)

  // Récupérer les promotions actives pour obtenir les années académiques possibles
  const activePromotions = await prisma.promotion.findMany({
    where: {
      statut: 'EN_COURS'
    },
    select: { annee: true }
  })
  
  // Créer une liste des années académiques possibles
  const possibleAcademicYears = activePromotions.map(p => p.annee)
  // Ajouter aussi l'année calculée au cas où
  if (!possibleAcademicYears.includes(academicYear)) {
    possibleAcademicYears.push(academicYear)
  }

  // Si aucune promotion active, compter toutes les attestations
  // Sinon, filtrer par les années académiques des promotions actives
  const academicYearFilter = possibleAcademicYears.length > 0
    ? { anneeAcademique: { in: possibleAcademicYears } }
    : {}

  console.log('Calcul des statistiques SP - Années académiques:', possibleAcademicYears, 'Filtre:', academicYearFilter)

  const [generated, thisMonth, pending] = await Promise.all([
    prisma.attestation.count({
      where: academicYearFilter
    }),
    prisma.attestation.count({
      where: {
        ...academicYearFilter,
        dateGeneration: { gte: startOfMonth }
      }
    }),
    prisma.inscription.count({
      where: { statut: 'EN_ATTENTE' }
    })
  ])

  console.log('Statistiques calculées - Générées:', generated, 'Ce mois:', thisMonth)

  // Préparer les paires étudiant/promotion ayant déjà une attestation
  const attestationPairs = await prisma.attestation.findMany({
    select: { etudiantId: true, promotionId: true }
  })
  const attestationSet = new Set(
    attestationPairs.map((attestation) => `${attestation.etudiantId}-${attestation.promotionId}`)
  )

  // Compter les étudiants inscrits (statut INSCRIT ou VALIDEE) qui n'ont pas encore d'attestation
  const validatedLite = await prisma.inscription.findMany({
    where: { 
      statut: {
        in: ['INSCRIT', 'VALIDEE'] // Inclure les étudiants inscrits ET validés
      }
    },
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
      orderBy: [
        { dateValidation: 'desc' },
        { dateInscription: 'desc' }
      ],
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
      ...academicYearFilter,
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

// Récupérer les statistiques du dashboard des agents
export const getAgentDashboardStats = async () => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Compter les inscriptions totales (candidats admis)
    const totalInscriptions = await prisma.inscription.count({
      where: {
        typeInscription: 'INSCRIPTION'
      }
    })

    // Compter les étudiants inscrits (statut INSCRIT)
    const etudiantsInscrits = await prisma.inscription.count({
      where: {
        statut: 'INSCRIT'
      }
    })

    // Compter les inscriptions en attente
    const enAttente = await prisma.inscription.count({
      where: {
        statut: 'EN_ATTENTE'
      }
    })

    // Compter les inscriptions finalisées aujourd'hui (statut INSCRIT)
    // On compte celles qui ont dateValidation aujourd'hui OU celles qui ont été créées aujourd'hui et sont INSCRIT
    const inscriptionsAujourdhui = await prisma.inscription.count({
      where: {
        statut: 'INSCRIT',
        OR: [
          {
            // Inscriptions finalisées aujourd'hui (avec dateValidation)
            dateValidation: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          {
            // Ou inscriptions créées aujourd'hui et déjà finalisées (si dateValidation n'existe pas encore)
            dateValidation: null,
            dateInscription: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        ]
      }
    })

    // Calculer le taux d'inscription
    const tauxInscription = totalInscriptions > 0 
      ? Math.round((etudiantsInscrits / totalInscriptions) * 100) 
      : 0

    // Répartition par filière
    const filiereDistribution = await prisma.inscription.groupBy({
      by: ['filiereId'],
      where: {
        statut: 'INSCRIT'
      },
      _count: {
        _all: true
      }
    })

    const filiereIds = filiereDistribution.map((item) => item.filiereId)
    const filiereInfos = filiereIds.length
      ? await prisma.filiere.findMany({
          where: { id: { in: filiereIds } },
          select: { id: true, nom: true }
        })
      : []
    const filiereMap = new Map(filiereInfos.map((filiere) => [filiere.id, filiere]))

    // Couleurs pour les filières
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']
    
    const dataParFiliere = filiereDistribution
      .map((entry, index) => {
        const filiere = filiereMap.get(entry.filiereId)
        return {
          name: filiere?.nom || 'Non défini',
          value: entry._count._all,
          color: colors[index % colors.length]
        }
      })
      .sort((a, b) => b.value - a.value)

    // Statut des candidats
    const dataStatut = [
      { name: 'Inscrits', value: etudiantsInscrits, color: '#10B981' },
      { name: 'En attente', value: enAttente, color: '#F59E0B' }
    ]

    // Inscriptions par semaine (7 dernières semaines)
    const inscriptionsParSemaine = []
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const count = await prisma.inscription.count({
        where: {
          statut: 'INSCRIT',
          dateInscription: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })

      inscriptionsParSemaine.push({
        semaine: `Sem ${7 - i}`,
        inscrits: count
      })
    }

    return {
      stats: {
        candidatsAdmis: totalInscriptions,
        etudiantsInscrits,
        enAttenteInscription: enAttente,
        inscriptionsAujourdhui,
        tauxInscription
      },
      dataParFiliere,
      dataStatut,
      inscriptionsParSemaine
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard agent:', error)
    throw error
  }
}


