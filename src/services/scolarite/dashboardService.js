import { supabaseAdmin } from '../../lib/supabase.js'
import { getCurrentAcademicYearLabel } from '../../utils/academicYear.js'

const MONTHS_WINDOW = 4

const capitalize = (value = '') => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const formatMonthLabel = (date) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
  return capitalize(formatter.format(date).replace('.', ''))
}

// Statistiques pour le Chef de Service de la Scolarité
export const getChefDashboardStats = async () => {
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

    // Compter les agents actifs
    const { count: totalAgents } = await supabaseAdmin
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleAgent.id)
      .eq('actif', true)

    // Compter les SP actives
    const { count: totalSP } = await supabaseAdmin
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleSP.id)
      .eq('actif', true)

    // Compter les candidats admis
    const { count: candidatsAdmis } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('type_inscription', 'INSCRIPTION')

    // Compter les étudiants inscrits
    const { count: etudiantsInscrits } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'INSCRIT')

    // Compter les inscriptions en attente
    const { count: inscriptionsEnAttente } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'EN_ATTENTE')

    // Compter les attestations générées ce mois
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const academicYear = getCurrentAcademicYearLabel(now)

    const { data: promoAnnees } = await supabaseAdmin
      .from('promotions')
      .select('annee')
      .eq('statut', 'EN_COURS')

    const possibleAcademicYears = [
      ...new Set([academicYear, ...(promoAnnees || []).map((p) => p.annee)])
    ]

    let attestationsCeMois = 0
    if (possibleAcademicYears.length > 0) {
      const { count } = await supabaseAdmin
        .from('attestations')
        .select('*', { count: 'exact', head: true })
        .in('annee_academique', possibleAcademicYears)
        .gte('date_generation', startOfMonth.toISOString())
      attestationsCeMois = count || 0
    }

    // Récupérer les dernières connexions
    const { data: dernieresConnexions } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, nom, prenom, derniere_connexion, actif, roles (code)')
      .in('role_id', [roleAgent.id, roleSP.id])
      .not('derniere_connexion', 'is', null)
      .order('derniere_connexion', { ascending: false })
      .limit(5)

    // Récupérer les actions récentes
    const { data: actionsRecentes } = await supabaseAdmin
      .from('actions_audit')
      .select('*, utilisateurs (nom, prenom)')
      .order('date_action', { ascending: false })
      .limit(5)

    // Statistiques des inscriptions par semaine
    const inscriptionsParSemaine = []
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const { count } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'INSCRIT')
        .gte('date_inscription', weekStart.toISOString())
        .lte('date_inscription', weekEnd.toISOString())

      inscriptionsParSemaine.push({
        semaine: `Sem ${5 - i}`,
        inscriptions: count || 0
      })
    }

    const anneeAcademique = getCurrentAcademicYearLabel(now)

    // Calculer le taux d'activité
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    
    const totalUsers = (totalAgents || 0) + (totalSP || 0)
    const { count: usersActifs7Jours } = await supabaseAdmin
      .from('utilisateurs')
      .select('*', { count: 'exact', head: true })
      .in('role_id', [roleAgent.id, roleSP.id])
      .gte('derniere_connexion', sevenDaysAgo.toISOString())
    
    const tauxActivite = totalUsers > 0 
      ? Math.round(((usersActifs7Jours || 0) / totalUsers) * 100)
      : 0

    return {
      stats: {
        totalAgents: totalAgents || 0,
        agentsActifs: totalAgents || 0,
        totalSP: totalSP || 0,
        spActives: totalSP || 0,
        candidatsAdmis: candidatsAdmis || 0,
        etudiantsInscrits: etudiantsInscrits || 0,
        inscriptionsEnAttente: inscriptionsEnAttente || 0,
        attestationsGenerees: attestationsCeMois,
        messagesNonLus: 0,
        tauxActivite,
        variationTauxActivite: 0,
        anneeAcademique
      },
      connexionsAujourdhui: [],
      dernieresConnexions: (dernieresConnexions || []).map(u => ({
        id: u.id,
        nom: `${u.nom} ${u.prenom}`,
        role: u.roles?.code === 'AGENT_SCOLARITE' ? 'Agent' : 'SP-Scolarité',
        date: u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'N/A',
        heure: u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        statut: u.actif ? 'actif' : 'inactif'
      })),
      actionsRecentes: (actionsRecentes || []).map(a => ({
        id: a.id,
        agent: `${a.utilisateurs?.prenom || ''} ${a.utilisateurs?.nom || ''}`.trim(),
        action: a.action,
        details: a.details || '',
        date: new Date(a.date_action).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: 'info'
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
      
      const { count } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('type_inscription', 'INSCRIPTION')
        .gte('date_inscription', monthStart.toISOString())
        .lte('date_inscription', monthEnd.toISOString())
      
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
      const monthName = monthNames[monthStart.getMonth()]
      
      inscriptionsParMois.push({
        mois: monthName,
        total: count || 0
      })
    }
    
    // Répartition par filière
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id, code, nom')

    const repartitionFilieres = []
    for (const filiere of (filieres || [])) {
      const { count } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('type_inscription', 'INSCRIPTION')
        .eq('filiere_id', filiere.id)
      
      if (count && count > 0) {
        repartitionFilieres.push({
          name: filiere.code || filiere.nom,
          value: count
        })
      }
    }
    
    repartitionFilieres.sort((a, b) => b.value - a.value)
    
    return {
      inscriptionsParMois,
      repartitionFilieres
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    throw error
  }
}

export const getSPDashboardStats = async () => {
  const now = new Date()
  const academicYear = getCurrentAcademicYearLabel(now)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_WINDOW - 1), 1)

  const { data: promoAnnees } = await supabaseAdmin
    .from('promotions')
    .select('annee')
    .eq('statut', 'EN_COURS')

  const possibleAcademicYears = [
    ...new Set([academicYear, ...(promoAnnees || []).map((p) => p.annee)])
  ]

  // Compter les attestations
  let generated = 0, thisMonth = 0
  if (possibleAcademicYears.length > 0) {
    const { count: genCount } = await supabaseAdmin
      .from('attestations')
      .select('*', { count: 'exact', head: true })
      .in('annee_academique', possibleAcademicYears)
    generated = genCount || 0

    const { count: monthCount } = await supabaseAdmin
      .from('attestations')
      .select('*', { count: 'exact', head: true })
      .in('annee_academique', possibleAcademicYears)
      .gte('date_generation', startOfMonth.toISOString())
    thisMonth = monthCount || 0
  }

  const { count: pending } = await supabaseAdmin
    .from('inscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'EN_ATTENTE')

  // Compter les étudiants disponibles pour attestation
  const { data: attestationPairs } = await supabaseAdmin
    .from('attestations')
    .select('etudiant_id, promotion_id')
  
  const attestationSet = new Set(
    (attestationPairs || []).map(a => `${a.etudiant_id}-${a.promotion_id}`)
  )

  const { data: validatedLite } = await supabaseAdmin
    .from('inscriptions')
    .select('id, etudiant_id, promotion_id')
    .in('statut', ['INSCRIT', 'VALIDEE'])

  const availableInscriptionIds = (validatedLite || [])
    .filter(i => !attestationSet.has(`${i.etudiant_id}-${i.promotion_id}`))
    .map(i => i.id)

  const available = availableInscriptionIds.length

  // Alertes
  let alerts = []
  if (availableInscriptionIds.length > 0) {
    const { data: alertsRaw } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        id, date_validation, date_inscription,
        etudiants (nom, prenom),
        filieres (code, nom),
        classes (code, nom),
        niveaux (code, nom)
      `)
      .in('id', availableInscriptionIds.slice(0, 5))
      .order('date_validation', { ascending: false })

    alerts = (alertsRaw || []).map(item => ({
      id: item.id,
      nom: `${item.etudiants?.nom ?? ''} ${item.etudiants?.prenom ?? ''}`.trim(),
      filiere: item.filieres?.code || item.filieres?.nom || 'N/A',
      classe: item.classes?.code || item.classes?.nom || item.niveaux?.code || 'N/A',
      date: item.date_validation
        ? new Date(item.date_validation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : item.date_inscription
          ? new Date(item.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
          : ''
    }))
  }

  // Monthly stats
  const monthly = []
  for (let i = MONTHS_WINDOW - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    
    let generes = 0
    if (possibleAcademicYears.length > 0) {
      const { count } = await supabaseAdmin
        .from('attestations')
        .select('*', { count: 'exact', head: true })
        .in('annee_academique', possibleAcademicYears)
        .gte('date_generation', date.toISOString())
        .lt('date_generation', nextMonth.toISOString())
      generes = count || 0
    }
    
    monthly.push({
      mois: formatMonthLabel(date),
      generes
    })
  }

  // By filiere
  const { data: filieres } = await supabaseAdmin
    .from('filieres')
    .select('id, code, nom')

  const byFiliere = []
  for (const filiere of (filieres || [])) {
    const { count } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['INSCRIT', 'VALIDEE'])
      .eq('filiere_id', filiere.id)
    
    if (count && count > 0) {
      byFiliere.push({
        id: filiere.id,
        code: filiere.code,
        nom: filiere.nom,
        value: count
      })
    }
  }
  byFiliere.sort((a, b) => b.value - a.value)

  return {
    stats: {
      attestationsGenerees: generated,
      attestationsDisponibles: available,
      attestationsCeMois: thisMonth,
      enAttente: pending || 0
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

    // Compter les inscriptions totales
    const { count: totalInscriptions } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('type_inscription', 'INSCRIPTION')

    // Compter les étudiants inscrits
    const { count: etudiantsInscrits } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'INSCRIT')

    // Compter les inscriptions en attente
    const { count: enAttente } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'EN_ATTENTE')

    // Compter les inscriptions finalisées aujourd'hui
    const { count: inscriptionsAujourdhui } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'INSCRIT')
      .gte('date_validation', todayStart.toISOString())
      .lte('date_validation', todayEnd.toISOString())

    // Calculer le taux d'inscription
    const total = totalInscriptions || 0
    const inscrits = etudiantsInscrits || 0
    const tauxInscription = total > 0 ? Math.round((inscrits / total) * 100) : 0

    // Données inscriptions pour analyses croisées
    const { data: inscriptionsRaw } = await supabaseAdmin
      .from('inscriptions')
      .select('filiere_id, statut, type_inscription')
      .eq('type_inscription', 'INSCRIPTION')

    // Référentiel filières
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id, nom, code')

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']
    const dataParFiliere = []
    const filiereStatusMatrix = []
    
    for (let i = 0; i < (filieres || []).length; i++) {
      const filiere = filieres[i]
      const inscriptionsFiliere = (inscriptionsRaw || []).filter((i) => i.filiere_id === filiere.id)
      const totalFiliere = inscriptionsFiliere.length
      const inscritsFiliere = inscriptionsFiliere.filter((i) => i.statut === 'INSCRIT').length
      const attenteFiliere = inscriptionsFiliere.filter((i) => i.statut === 'EN_ATTENTE').length
      const tauxConversion = totalFiliere > 0 ? Math.round((inscritsFiliere / totalFiliere) * 100) : 0

      if (inscritsFiliere > 0) {
        dataParFiliere.push({
          name: filiere.code || filiere.nom,
          value: inscritsFiliere,
          color: colors[i % colors.length]
        })
      }

      if (totalFiliere > 0 || inscritsFiliere > 0 || attenteFiliere > 0) {
        filiereStatusMatrix.push({
          filiere: filiere.code || filiere.nom,
          admis: totalFiliere,
          inscrits: inscritsFiliere,
          enAttente: attenteFiliere,
          tauxConversion
        })
      }
    }
    dataParFiliere.sort((a, b) => b.value - a.value)
    filiereStatusMatrix.sort((a, b) => b.admis - a.admis)

    // Répartition par genre (sur inscrits)
    const { data: inscritsAvecSexe } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiants(sexe)')
      .eq('statut', 'INSCRIT')

    let masculin = 0
    let feminin = 0
    ;(inscritsAvecSexe || []).forEach((row) => {
      const sexe = row?.etudiants?.sexe
      if (sexe === 'M') masculin++
      if (sexe === 'F') feminin++
    })
    const dataGenre = [
      { name: 'Masculin', value: masculin, color: '#3B82F6' },
      { name: 'Féminin', value: feminin, color: '#EC4899' }
    ].filter((g) => g.value > 0)

    // Funnel opérationnel
    const dossiersComplets = inscrits + (enAttente || 0)
    const funnelData = [
      { step: 'Candidats admis', value: total },
      { step: 'Dossiers traités', value: dossiersComplets },
      { step: 'Inscriptions finalisées', value: inscrits }
    ]

    // Inscriptions par mois (6 derniers mois)
    const inscriptionsParMois = []
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1)
      moisDebut.setHours(0, 0, 0, 0)
      
      const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      moisFin.setHours(23, 59, 59, 999)

      const { count } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'INSCRIT')
        .gte('date_inscription', moisDebut.toISOString())
        .lte('date_inscription', moisFin.toISOString())

      inscriptionsParMois.push({
        mois: moisNoms[date.getMonth()],
        inscrits: count || 0
      })
    }

    // Alertes rapides
    const filiereAttenteMax = [...filiereStatusMatrix].sort((a, b) => b.enAttente - a.enAttente)[0]
    const filiereFaibleConversion = [...filiereStatusMatrix].sort((a, b) => a.tauxConversion - b.tauxConversion)[0]
    const alertes = [
      filiereAttenteMax && filiereAttenteMax.enAttente > 0
        ? {
          type: 'warning',
          titre: `Attente élevée: ${filiereAttenteMax.filiere}`,
          detail: `${filiereAttenteMax.enAttente} dossier(s) en attente`
        }
        : null,
      filiereFaibleConversion
        ? {
          type: 'info',
          titre: `Conversion faible: ${filiereFaibleConversion.filiere}`,
          detail: `Taux conversion ${filiereFaibleConversion.tauxConversion}%`
        }
        : null
    ].filter(Boolean)

    return {
      stats: {
        candidatsAdmis: total,
        etudiantsInscrits: inscrits,
        enAttenteInscription: enAttente || 0,
        inscriptionsAujourdhui: inscriptionsAujourdhui || 0,
        tauxInscription
      },
      dataParFiliere,
      dataGenre,
      inscriptionsParSemaine: inscriptionsParMois,
      funnelData,
      filiereStatusMatrix,
      alertes
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard agent:', error)
    throw error
  }
}
