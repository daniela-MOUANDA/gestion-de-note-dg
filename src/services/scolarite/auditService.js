import { supabaseAdmin } from '../../lib/supabase.js'

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

    // Construire la requête de base
    let query = supabaseAdmin
      .from('actions_audit')
      .select('*, utilisateurs (id, nom, prenom, roles (code))')
      .order('date_action', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtre par type d'action
    if (typeAction && typeAction !== 'all') {
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
      query = query.eq('type_action', mappedType)
    }

    // Filtre par utilisateur
    if (utilisateurId && utilisateurId !== 'all') {
      query = query.eq('utilisateur_id', utilisateurId)
    }

    // Filtre par date
    if (dateDebut) {
      const debut = new Date(dateDebut)
      debut.setHours(0, 0, 0, 0)
      query = query.gte('date_action', debut.toISOString())
    }
    if (dateFin) {
      const fin = new Date(dateFin)
      fin.setHours(23, 59, 59, 999)
      query = query.lte('date_action', fin.toISOString())
    }

    // Recherche dans action et details
    if (searchQuery && searchQuery.trim()) {
      query = query.or(`action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`)
    }

    const { data: actions, error } = await query

    if (error) throw error

    // Formater les données pour le frontend
    return (actions || []).map(action => ({
      id: action.id,
      agent: `${action.utilisateurs?.prenom || ''} ${action.utilisateurs?.nom || ''}`.trim(),
      agentId: action.utilisateurs?.id,
      action: action.action,
      details: action.details || '',
      date: new Date(action.date_action).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateISO: action.date_action,
      type: mapTypeActionToDisplay(action.type_action),
      typeAction: action.type_action,
      ipAddress: action.ip_address || null,
      userAgent: action.user_agent || null
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
    const { data: roleAgent } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'AGENT_SCOLARITE')
      .single()
    
    const { data: roleSP } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'SP_SCOLARITE')
      .single()
    
    if (!roleAgent || !roleSP) {
      throw new Error('Rôles AGENT_SCOLARITE ou SP_SCOLARITE non trouvés dans la base de données')
    }

    const { data: utilisateurs, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, nom, prenom, roles (code)')
      .in('role_id', [roleAgent.id, roleSP.id])
      .eq('actif', true)
      .order('nom', { ascending: true })

    if (error) throw error

    return (utilisateurs || []).map(u => ({
      id: u.id,
      nom: `${u.nom} ${u.prenom}`,
      role: u.roles?.code === 'AGENT_SCOLARITE' ? 'Agent' : 'SP-Scolarité'
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
