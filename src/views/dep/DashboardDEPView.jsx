import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faUserTie, faBuilding, faGraduationCap, faChartLine, 
  faFileAlt, faClipboardList, faEnvelope, faTrophy, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const DashboardDEPView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Directeur des Études Pédagogiques'
  
  // Vérifier que l'utilisateur a le bon rôle
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }
    
    // Si l'utilisateur n'est pas DEP, rediriger vers le bon dashboard
    if (user.role !== 'DEP') {
      console.warn('Utilisateur avec rôle incorrect sur le dashboard DEP:', user.role)
      switch (user.role) {
        case 'SP_SCOLARITE':
          navigate('/sp-scolarite/dashboard', { replace: true })
          break
        case 'AGENT_SCOLARITE':
          navigate('/scolarite/dashboard', { replace: true })
          break
        case 'CHEF_SERVICE_SCOLARITE':
          navigate('/chef-scolarite/dashboard', { replace: true })
          break
        case 'CHEF_DEPARTEMENT':
          navigate('/chef/departement/dashboard', { replace: true })
          break
        default:
          navigate('/login', { replace: true })
      }
    }
  }, [user, isAuthenticated, navigate])
  
  // Données de démonstration (sera remplacé par des vraies données)
  const [stats, setStats] = useState({
    totalChefsDepartement: 0,
    totalDepartements: 0,
    totalEtudiants: 0,
    totalClasses: 0,
    conseilsEnAttente: 0,
    documentsAViser: 0,
    pvGeneres: 0,
    tauxReussite: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setStats({
        totalChefsDepartement: 4,
        totalDepartements: 4,
        totalEtudiants: 1250,
        totalClasses: 24,
        conseilsEnAttente: 3,
        documentsAViser: 12,
        pvGeneres: 45,
        tauxReussite: 87.5
      })
      setLoading(false)
    }, 1000)
  }, [])

  const inscriptionsParMois = [
    { mois: 'Jan', inscriptions: 45 },
    { mois: 'Fév', inscriptions: 78 },
    { mois: 'Mar', inscriptions: 92 },
    { mois: 'Avr', inscriptions: 120 },
    { mois: 'Mai', inscriptions: 115 }
  ]

  const tauxReussiteParNiveau = [
    { niveau: 'L1', taux: 82.5 },
    { niveau: 'L2', taux: 88.3 },
    { niveau: 'L3', taux: 91.7 }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          {/* Message de bienvenue */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-slate-800">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vue d'ensemble de la direction des études pédagogiques. Voici un aperçu des statistiques et indicateurs clés.
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUserTie} className="text-blue-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalChefsDepartement}</h3>
              <p className="text-sm text-slate-600">Chefs de Département</p>
              <p className="text-xs text-slate-500 mt-1">Tous départements</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faBuilding} className="text-purple-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalDepartements}</h3>
              <p className="text-sm text-slate-600">Départements</p>
              <p className="text-xs text-slate-500 mt-1">{stats.totalClasses} classes</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-emerald-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalEtudiants}</h3>
              <p className="text-sm text-slate-600">Étudiants</p>
              <p className="text-xs text-green-600 mt-1">Tous niveaux confondus</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.tauxReussite}%</h3>
              <p className="text-sm text-slate-600">Taux de réussite</p>
              <p className="text-xs text-green-600 mt-1">Moyenne générale</p>
            </div>
          </div>

          {/* Cartes d'actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-2xl" />
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.conseilsEnAttente}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Conseils en attente</h3>
              <p className="text-sm text-slate-600">Résultats à valider</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-purple-600 text-2xl" />
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.documentsAViser}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Documents à viser</h3>
              <p className="text-sm text-slate-600">En attente de visa</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-emerald-600 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">PV générés</h3>
              <p className="text-sm text-slate-600">{stats.pvGeneres} ce mois</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faTrophy} className="text-amber-600 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Meilleurs étudiants</h3>
              <p className="text-sm text-slate-600">Classement disponible</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Inscriptions par mois */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-600" />
                Inscriptions par mois
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inscriptionsParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inscriptions" fill="#3b82f6" name="Inscriptions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Taux de réussite par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
                Taux de réussite par niveau
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tauxReussiteParNiveau}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="niveau" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taux" fill="#10b981" name="Taux de réussite (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardDEPView

