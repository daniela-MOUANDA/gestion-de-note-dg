import prisma from '../../lib/prisma.js'

// Récupérer toutes les actions d'audit avec filtres
export const getActionsAudit = async (filters = {}) => {
  try {
    const {
      typeAction,
      utilisateurId,
      dateDebut,
      dateFin,
      searchQuery,
      limit = 1000,
      offset = 0
    } = filters

    // Construire la condition where
    const whereCondition = {}

    // Filtre par type d'action
    if (typeAction && typeAction !== 'all') {
      // Mapper les valeurs d'affichage vers les enums Prisma
      const typeActionMap = {
        'connexion': 'CONNEXION',
        'inscription': 'INSCRIPTION',
        'attestation': 'ATTESTATION',
        'bulletin': 'BULLETIN',
        'diplome': 'DIPLOME',
        'message': 'MESSAGE',
        'error': 'ERROR',
        'pv': 'PV',
        'archivage': 'ARCHIVAGE'
      }
      const mappedType = typeActionMap[typeAction.toLowerCase()] || typeAction.toUpperCase()
      whereCondition.typeAction = mappedType
    }

    // Filtre par utilisateur
    if (utilisateurId && utilisateurId !== 'all') {
      whereCondition.utilisateurId = utilisateurId
    }

    // Filtre par date
    if (dateDebut || dateFin) {
      whereCondition.dateAction = {}
      if (dateDebut) {
        const debut = new Date(dateDebut)
        debut.setHours(0, 0, 0, 0)
        whereCondition.dateAction.gte = debut
      }
      if (dateFin) {
        const fin = new Date(dateFin)
        fin.setHours(23, 59, 59, 999)
        whereCondition.dateAction.lte = fin
      }
    }

    // Recherche dans action et details
    if (searchQuery && searchQuery.trim()) {
      whereCondition.OR = [
        { action: { contains: searchQuery, mode: 'insensitive' } },
        { details: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    // Récupérer les actions avec les informations de l'utilisateur
    const actions = await prisma.actionAudit.findMany({
      where: whereCondition,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      },
      orderBy: {
        dateAction: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Formater les données pour le frontend
    return actions.map(action => ({
      id: action.id,
      agent: `${action.utilisateur.prenom} ${action.utilisateur.nom}`,
      agentId: action.utilisateur.id,
      action: action.action,
      details: action.details || '',
      date: action.dateAction.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateISO: action.dateAction.toISOString(),
      type: mapTypeActionToDisplay(action.typeAction),
      typeAction: action.typeAction,
      ipAddress: action.ipAddress || null,
      userAgent: action.userAgent || null
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des actions d\'audit:', error)
    throw error
  }
}

// Récupérer la liste des agents/SP pour les filtres
export const getAgentsPourFiltre = async () => {
  try {
    // Récupérer les IDs des rôles
    const roleAgent = await prisma.role.findUnique({ where: { code: 'AGENT_SCOLARITE' } })
    const roleSP = await prisma.role.findUnique({ where: { code: 'SP_SCOLARITE' } })
    
    if (!roleAgent || !roleSP) {
      throw new Error('Rôles AGENT_SCOLARITE ou SP_SCOLARITE non trouvés dans la base de données')
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        roleId: {
          in: [roleAgent.id, roleSP.id]
        },
        actif: true
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: {
          select: {
            code: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    })

    return utilisateurs.map(u => ({
      id: u.id,
      nom: `${u.prenom} ${u.nom}`,
      role: u.role?.code === 'AGENT_SCOLARITE' ? 'Agent' : 'SP-Scolarité'
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error)
    throw error
  }
}

// Mapper le type d'action enum vers un format d'affichage
const mapTypeActionToDisplay = (typeAction) => {
  const mapping = {
    'CONNEXION': 'connexion',
    'DECONNEXION': 'connexion',
    'INSCRIPTION': 'inscription',
    'ATTESTATION': 'attestation',
    'BULLETIN': 'bulletin',
    'DIPLOME': 'diplome',
    'MESSAGE': 'message',
    'PV': 'pv',
    'ARCHIVAGE': 'archivage',
    'ERROR': 'error'
  }
  return mapping[typeAction] || 'autre'
}

