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
  faBook
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
    bulletinsPublies: 120
  })

  const recentActions = [
    { id: 1, action: 'Note ajoutée pour Module "Base de données"', date: 'Il y a 2 heures', type: 'note' },
    { id: 2, action: 'Rattrapage programmé pour L3 GI', date: 'Il y a 5 heures', type: 'rattrapage' },
    { id: 3, action: 'Bulletin publié pour Semestre 4', date: 'Hier', type: 'bulletin' },
    { id: 4, action: 'Unité d\'enseignement publiée', date: 'Il y a 2 jours', type: 'unite' }
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

  const notesStatusData = [
    { name: 'Validées', value: 827, color: '#10b981' },
    { name: 'En attente', value: 23, color: '#f59e0b' }
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

  const getActionIcon = (type) => {
    const icons = {
      note: faGraduationCap,
      rattrapage: faCalendarCheck,
      bulletin: faFileAlt,
      unite: faBook
    }
    return icons[type] || faCheckCircle
  }

  const getActionColor = (type) => {
    const colors = {
      note: 'text-blue-600 bg-blue-100',
      rattrapage: 'text-orange-600 bg-orange-100',
      bulletin: 'text-green-600 bg-green-100',
      unite: 'text-purple-600 bg-purple-100'
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

            <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Notes en attente</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.notesEnAttente}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faClock} className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Grille des graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graphiques principaux */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Répartition des étudiants par filière */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Étudiants par filière</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={studentsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={120}
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
                </div>

                {/* Répartition par niveau */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Étudiants par niveau</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={levelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="niveau" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="etudiants" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Graphique statut des notes */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Statut des notes</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={notesStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {notesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Validées</span>
                  <span className="text-sm font-bold text-green-900">827</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">En attente</span>
                  <span className="text-sm font-bold text-orange-900">23</span>
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

