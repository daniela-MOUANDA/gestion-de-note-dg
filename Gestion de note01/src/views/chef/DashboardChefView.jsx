import { useState } from 'react'
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
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'

const DashboardChefView = () => {
  const [stats] = useState({
    totalClasses: 12,
    totalEnseignants: 45,
    totalEtudiants: 850,
    notesEnAttente: 23,
    rattrapagesProgrammes: 8,
    unitesPubliees: 15,
    bulletinsPublies: 120,
    messagesNonLus: 2
  })

  const recentActions = [
    { id: 1, action: 'Note ajoutée pour Module "Base de données"', date: 'Il y a 2 heures', type: 'note' },
    { id: 2, action: 'Rattrapage programmé pour L3 GI', date: 'Il y a 5 heures', type: 'rattrapage' },
    { id: 3, action: 'Bulletin publié pour Semestre 4', date: 'Hier', type: 'bulletin' },
    { id: 4, action: 'Unité d\'enseignement publiée', date: 'Il y a 2 jours', type: 'unite' },
    { id: 5, action: 'Nouveau message du Directeur des Études', date: 'Il y a 1 heure', type: 'message' }
  ]

  // Données pour les graphiques
  const studentsData = [
    { name: 'GI', value: 480, color: '#3b82f6' },
    { name: 'RT', value: 370, color: '#8b5cf6' }
  ]

  const levelData = [
    { niveau: 'L1', etudiants: 320 },
    { niveau: 'L2', etudiants: 280 },
    { niveau: 'L3', etudiants: 250 }
  ]

  const tauxReussiteData = [
    { filiere: 'GI', tauxReussite: 87.5 },
    { filiere: 'RT', tauxReussite: 82.3 }
  ]

  const genreData = [
    { name: 'Masculin', value: 520, color: '#3b82f6', percentage: 61.2 },
    { name: 'Féminin', value: 330, color: '#ec4899', percentage: 38.8 }
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName="Dr. Jean KAMDEM" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Tableau de bord
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vue d'ensemble de votre département
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
                Étudiants par filière
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {studentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-xs text-slate-600">GI</p>
                    <p className="text-lg font-bold text-slate-800">480</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="text-xs text-slate-600">RT</p>
                    <p className="text-lg font-bold text-slate-800">370</p>
                  </div>
                </div>
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
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-xs text-slate-600">Masculin</p>
                    <p className="text-lg font-bold text-slate-800">520</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <div>
                    <p className="text-xs text-slate-600">Féminin</p>
                    <p className="text-lg font-bold text-slate-800">330</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deuxième ligne de graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                Étudiants par niveau
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={levelData}>
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

            {/* Taux de réussite */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-600 rounded"></span>
                Taux de réussite par filière
              </h3>
              <div className="space-y-6 mt-8">
                {/* GI */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Génie Informatique</span>
                    <span className="text-2xl font-bold text-green-600">87.5%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: '87.5%' }}
                    >
                      <span className="text-xs font-bold text-white">87.5%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">420 étudiants sur 480</p>
                </div>

                {/* RT */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Réseau et Télécom</span>
                    <span className="text-2xl font-bold text-blue-600">82.3%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: '82.3%' }}
                    >
                      <span className="text-xs font-bold text-white">82.3%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">305 étudiants sur 370</p>
                </div>

                {/* Taux global */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-800">Taux global</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">85.3%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 h-5 rounded-full transition-all duration-500"
                      style={{ width: '85.3%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">725 étudiants sur 850 ont réussi</p>
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

