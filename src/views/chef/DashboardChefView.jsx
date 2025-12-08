import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faChalkboardTeacher,
  faUserGraduate,
  faGraduationCap,
  faCalendarCheck,
  faFileAlt,
  faChartLine,
  faCheckCircle,
  faClock,
  faBook,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getDashboardStats } from '../../api/chefDepartement'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'

const DashboardChefView = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Chef de Département'

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'CHEF_DEPARTEMENT') {
      console.warn(`Accès non autorisé au dashboard Chef de Département pour le rôle: ${user?.role}. Redirection...`)
      const role = user?.role?.trim().toUpperCase()
      if (role === 'CHEF_SERVICE_SCOLARITE') {
        navigate('/chef-scolarite/dashboard', { replace: true })
      } else if (role === 'SP_SCOLARITE') {
        navigate('/sp-scolarite/dashboard', { replace: true })
      } else if (role === 'AGENT_SCOLARITE') {
        navigate('/scolarite/dashboard', { replace: true })
      } else if (role === 'DEP') {
        navigate('/dep/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEnseignants: 0,
    totalEtudiants: 0,
    notesEnAttente: 0,
    rattrapagesProgrammes: 0,
    unitesPubliees: 0,
    bulletinsPublies: 0,
    messagesNonLus: 0
  })

  // State pour les graphes
  const [graphData, setGraphData] = useState({
    studentsData: [],
    levelData: [],
    genreData: [],
    tauxReussiteData: []
  })



  const recentActions = [
    { id: 1, action: 'Note ajoutée pour Module "Base de données"', date: 'Il y a 2 heures', type: 'note' },
    { id: 2, action: 'Rattrapage programmé pour L3 GI', date: 'Il y a 5 heures', type: 'rattrapage' },
    { id: 3, action: 'Bulletin publié pour Semestre 4', date: 'Hier', type: 'bulletin' },
    { id: 4, action: 'Unité d\'enseignement publiée', date: 'Il y a 2 jours', type: 'unite' },
    { id: 5, action: 'Nouveau message du Directeur des Études', date: 'Il y a 1 heure', type: 'message' }
  ]

  // Charger les données
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // 1. Charger stats globales
      const statsRes = await getDashboardStats()
      if (statsRes.success && statsRes.stats) {
        // Mettre à jour les graphiques
        setGraphData(statsRes.stats)

        // Mettre à jour les statistiques de base
        setStats({
          totalClasses: statsRes.stats.totalClasses || 0,
          totalEnseignants: statsRes.stats.totalEnseignants || 0,
          totalEtudiants: statsRes.stats.totalEtudiants || 0,
          notesEnAttente: 0, // À implémenter plus tard
          rattrapagesProgrammes: 0, // À implémenter plus tard
          unitesPubliees: 0, // À implémenter plus tard
          bulletinsPublies: 0, // À implémenter plus tard
          messagesNonLus: 0 // À implémenter plus tard
        })
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error)
    }
  }







  // Données pour les graphiques (Utilisation du state graphData)
  // const studentsData = [ ... ] (Supprimé car dynamique)

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

  const getActionIcon = (type) => {
    const icons = {
      note: faGraduationCap,
      rattrapage: faCalendarCheck,
      bulletin: faFileAlt,
      unite: faBook,
      message: faEnvelope
    }
    return icons[type] || faCheckCircle
  }

  const getActionColor = (type) => {
    const colors = {
      note: 'text-blue-600 bg-blue-100',
      rattrapage: 'text-orange-600 bg-orange-100',
      bulletin: 'text-green-600 bg-green-100',
      unite: 'text-purple-600 bg-purple-100',
      message: 'text-indigo-600 bg-indigo-100'
    }
    return colors[type] || 'text-slate-600 bg-slate-100'
  }

  const departementChef = user?.departement?.nom || 'Département'

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
              Nous sommes ravis de vous revoir. Voici un aperçu de votre tableau de bord.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Classes</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalClasses}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Enseignants</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalEnseignants}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Étudiants</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalEtudiants}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUserGraduate} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <a
              href="/chef/messagerie"
              className="bg-white rounded-lg border-l-4 border-purple-500 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Messages non lus</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.messagesNonLus}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 relative">
                  <FontAwesomeIcon icon={faEnvelope} className="text-purple-600 text-xl" />
                  {stats.messagesNonLus > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </div>
            </a>
          </div>

          {/* Grille des graphiques - Disposition élégante */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition des étudiants par filière */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                Étudiants par filière (Total: {graphData?.studentsData?.reduce((acc, curr) => acc + curr.value, 0) || 0})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={graphData.studentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {graphData.studentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {graphData.studentsData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || COLORS[idx % COLORS.length] }}></div>
                    <div>
                      <p className="text-xs text-slate-600">{entry.name}</p>
                      <p className="text-lg font-bold text-slate-800">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition par genre */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-pink-600 rounded"></span>
                Répartition par genre
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={graphData.genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {graphData.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {graphData.genreData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <div>
                      <p className="text-xs text-slate-600">{entry.name}</p>
                      <p className="text-lg font-bold text-slate-800">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deuxième ligne de graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                Étudiants par niveau
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData.levelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="niveau" stroke="#64748b" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="etudiants" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Taux de réussite (Mocké pour l'instant) */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-600 rounded"></span>
                Taux de réussite par filière (Estimé)
              </h3>
              <div className="space-y-6 mt-8">
                {graphData.tauxReussiteData.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">{item.filiere}</span>
                      <span className="text-2xl font-bold text-green-600">{item.tauxReussite}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${item.tauxReussite}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardChefView
