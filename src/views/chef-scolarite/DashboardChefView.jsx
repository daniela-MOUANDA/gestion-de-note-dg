import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faUserCheck, faFileAlt, faChartLine, faClipboardList, 
  faEnvelope, faClock, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAuth } from '../../contexts/AuthContext'
import { getChefDashboardStats } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const DashboardChefView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: alertError } = useAlert()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Chef de Service'
  
  const [stats, setStats] = useState({
    totalAgents: 0,
    agentsActifs: 0,
    totalSP: 0,
    spActives: 0,
    candidatsAdmis: 0,
    etudiantsInscrits: 0,
    inscriptionsEnAttente: 0,
    attestationsGenerees: 0,
    messagesNonLus: 0
  })
  const [dernieresConnexions, setDernieresConnexions] = useState([])
  const [actionsRecentes, setActionsRecentes] = useState([])
  const [inscriptionsParSemaine, setInscriptionsParSemaine] = useState([])
  const [connexionsAujourdhui, setConnexionsAujourdhui] = useState([])
  const [tauxActivite, setTauxActivite] = useState(0)
  const [variationTauxActivite, setVariationTauxActivite] = useState(0)
  const [anneeAcademique, setAnneeAcademique] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'CHEF_SERVICE_SCOLARITE') {
      console.warn(`Accès non autorisé au dashboard Chef pour le rôle: ${user?.role}. Redirection...`)
      const role = user?.role?.trim().toUpperCase()
      switch (role) {
        case 'SP_SCOLARITE':
          navigate('/sp-scolarite/dashboard', { replace: true })
          break
        case 'AGENT_SCOLARITE':
          navigate('/scolarite/dashboard', { replace: true })
          break
        case 'CHEF_DEPARTEMENT':
          navigate('/chef/departement/dashboard', { replace: true })
          break
        case 'DEP':
          navigate('/dep/dashboard', { replace: true })
          break
        default:
          navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  // Charger les données du dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      // Seulement charger si l'utilisateur est un Chef de Service
      if (user?.role === 'CHEF_SERVICE_SCOLARITE') {
        try {
          setLoading(true)
          setError(null)
          const data = await getChefDashboardStats()
          setStats(data.stats)
          setDernieresConnexions(data.dernieresConnexions || [])
          setActionsRecentes(data.actionsRecentes || [])
          setInscriptionsParSemaine(data.inscriptionsParSemaine || [])
          setConnexionsAujourdhui(data.connexionsAujourdhui || [])
          setTauxActivite(data.stats.tauxActivite || 0)
          setVariationTauxActivite(data.stats.variationTauxActivite || 0)
          // Forcer l'année académique à 2025-2026
          setAnneeAcademique('2025-2026')
        } catch (err) {
          console.error('Erreur lors du chargement du dashboard chef:', err)
          setError(err.message || 'Erreur lors du chargement des données du tableau de bord.')
          alertError(err.message || 'Erreur lors du chargement des données du tableau de bord.')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    if (isAuthenticated && user?.role === 'CHEF_SERVICE_SCOLARITE') {
      loadDashboardData()
    }
  }, [isAuthenticated, user, alertError])

  // Les données de connexions sont maintenant chargées depuis l'API

  const getActionIcon = (type) => {
    switch(type) {
      case 'success': return faCheckCircle
      case 'warning': return faExclamationTriangle
      default: return faClipboardList
    }
  }

  const getActionColor = (type) => {
    switch(type) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-amber-600 bg-amber-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
          {/* Message de bienvenue */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-slate-800">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Nous sommes ravis de vous revoir. Voici un aperçu de votre tableau de bord.
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalAgents}</h3>
              <p className="text-sm text-slate-600">Agents enregistrés</p>
              <p className="text-xs text-green-600 mt-1">{stats.agentsActifs || stats.totalAgents} actifs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUserCheck} className="text-emerald-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.etudiantsInscrits}</h3>
              <p className="text-sm text-slate-600">Étudiants inscrits</p>
              <p className="text-xs text-slate-500 mt-1">{anneeAcademique ? `Année ${anneeAcademique}` : 'Chargement...'}</p>
              {stats.candidatsAdmis > stats.etudiantsInscrits && (
                <p className="text-xs text-amber-600 mt-1">
                  {stats.candidatsAdmis - stats.etudiantsInscrits} en attente
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.attestationsGenerees}</h3>
              <p className="text-sm text-slate-600">Attestations générées</p>
              <p className="text-xs text-slate-500 mt-1">Ce mois</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faEnvelope} className="text-indigo-500 text-3xl" />
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Nouveau</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.messagesNonLus}</h3>
              <p className="text-sm text-slate-600">Messages non lus</p>
              <Link to="/chef-scolarite/messagerie" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Voir les messages →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{tauxActivite}%</h3>
              <p className="text-sm text-slate-600">Taux d'activité</p>
              <p className={`text-xs mt-1 ${variationTauxActivite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variationTauxActivite >= 0 ? '+' : ''}{variationTauxActivite}% cette semaine
              </p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique des activités */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Inscriptions par semaine</h2>
              {inscriptionsParSemaine.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={inscriptionsParSemaine}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semaine" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inscriptions" fill="#10B981" name="Inscriptions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>

            {/* Graphique des connexions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Connexions aujourd'hui</h2>
              {connexionsAujourdhui.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={connexionsAujourdhui}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="heure" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="connexions" stroke="#6366F1" strokeWidth={2} name="Connexions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <p>Aucune connexion aujourd'hui</p>
                </div>
              )}
            </div>
          </div>

          {/* Dernières connexions et Actions récentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dernières connexions */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-indigo-600" />
                  Dernières connexions
                </h2>
                <Link to="/chef-scolarite/audit" className="text-sm text-indigo-600 hover:underline">
                  Voir tout →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {dernieresConnexions.map((connexion) => (
                    <div key={connexion.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          connexion.statut === 'actif' ? 'bg-green-100' : 'bg-slate-200'
                        }`}>
                          <FontAwesomeIcon icon={faUsers} className={
                            connexion.statut === 'actif' ? 'text-green-600' : 'text-slate-500'
                          } />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{connexion.nom}</p>
                          <p className="text-xs text-slate-500">{connexion.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">{connexion.date}</p>
                        <p className="text-xs font-semibold text-slate-800">{connexion.heure}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions récentes */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} className="text-indigo-600" />
                  Actions récentes
                </h2>
                <Link to="/chef-scolarite/audit" className="text-sm text-indigo-600 hover:underline">
                  Audit complet →
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {actionsRecentes.map((action) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(action.type)}`}>
                        <FontAwesomeIcon icon={getActionIcon(action.type)} className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{action.action}</p>
                        <p className="text-xs text-slate-600 truncate">{action.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{action.agent}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{action.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default DashboardChefView

