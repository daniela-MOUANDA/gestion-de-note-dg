import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faUserCheck, faFileAlt, faChartLine, faClipboardList, 
  faEnvelope, faClock, faCheckCircle, faExclamationTriangle, faGraduationCap,
  faBuilding, faUserTie, faChartBar, faCalendarCheck, faBookOpen
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const DashboardDGView = () => {
  const nomComplet = 'Directeur Général'
  
  // Données de démonstration
  const [stats] = useState({
    totalEtudiants: 1250,
    totalEnseignants: 85,
    totalDepartements: 4,
    totalFormations: 12,
    inscriptionsCetteAnnee: 450,
    tauxReussite: 87.5,
    tauxOccupation: 92.3,
    messagesNonLus: 3
  })

  const inscriptionsParMois = [
    { mois: 'Jan', inscriptions: 45 },
    { mois: 'Fév', inscriptions: 78 },
    { mois: 'Mar', inscriptions: 92 },
    { mois: 'Avr', inscriptions: 120 },
    { mois: 'Mai', inscriptions: 115 }
  ]

  const repartitionParFiliere = [
    { name: 'GI', value: 520, color: '#3b82f6' },
    { name: 'RT', value: 380, color: '#8b5cf6' },
    { name: 'Réseaux', value: 250, color: '#10b981' },
    { name: 'Autres', value: 100, color: '#f59e0b' }
  ]

  const tauxReussiteParNiveau = [
    { niveau: 'L1', taux: 82.5 },
    { niveau: 'L2', taux: 88.3 },
    { niveau: 'L3', taux: 91.7 }
  ]

  const actionsRecentes = [
    { id: 1, action: 'Nouvelle promotion créée - 2025-2026', date: 'Il y a 2 heures', type: 'success' },
    { id: 2, action: 'Rapport mensuel généré', date: 'Il y a 5 heures', type: 'info' },
    { id: 3, action: 'Validation du budget annuel', date: 'Hier', type: 'success' },
    { id: 4, action: 'Réunion avec les chefs de département', date: 'Il y a 2 jours', type: 'info' },
    { id: 5, action: 'Nouveau message du Ministère', date: 'Il y a 1 heure', type: 'warning' }
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Sidebar simplifié pour prévisualisation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50">
        <div className="p-6 border-b border-slate-700">
          <img 
            src="/images/logo.png" 
            alt="Logo INPTIC" 
            className="h-20 w-auto object-contain mx-auto"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-400 mb-4 px-3">Directeur Général</p>
          <nav className="space-y-1">
            <div className="px-3 py-2.5 bg-blue-600 rounded-lg text-sm font-medium">
              <FontAwesomeIcon icon={faChartLine} className="mr-3" />
              Tableau de bord
            </div>
          </nav>
        </div>
      </div>

      <div className="flex flex-col lg:ml-64 min-h-screen">
        {/* Header simplifié */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Direction Générale</h1>
            <p className="text-sm text-slate-600">Directeur Général - Administration et supervision</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="text-slate-600 text-xl cursor-pointer" />
              {stats.messagesNonLus > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.messagesNonLus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">Directeur Général</p>
                <p className="text-xs text-slate-600">DG</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                DG
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-4">
          {/* Message de bienvenue */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-slate-800">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vue d'ensemble de l'établissement. Voici un aperçu des statistiques et indicateurs clés.
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalEtudiants}</h3>
              <p className="text-sm text-slate-600">Étudiants total</p>
              <p className="text-xs text-green-600 mt-1">+{stats.inscriptionsCetteAnnee} cette année</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUserTie} className="text-purple-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalEnseignants}</h3>
              <p className="text-sm text-slate-600">Enseignants</p>
              <p className="text-xs text-slate-500 mt-1">Tous départements</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faBuilding} className="text-emerald-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalDepartements}</h3>
              <p className="text-sm text-slate-600">Départements</p>
              <p className="text-xs text-slate-500 mt-1">{stats.totalFormations} formations</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.tauxReussite}%</h3>
              <p className="text-sm text-slate-600">Taux de réussite</p>
              <p className="text-xs text-green-600 mt-1">+2.5% cette année</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Inscriptions par mois */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
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

            {/* Répartition par filière */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-purple-600" />
                Répartition par filière
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionParFiliere}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionParFiliere.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique taux de réussite */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
              Taux de réussite par niveau
            </h2>
            <ResponsiveContainer width="100%" height={250}>
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

          {/* Actions récentes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} className="text-indigo-600" />
                Activités récentes
              </h2>
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
                      <p className="text-xs text-slate-500 mt-1">{action.date}</p>
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

export default DashboardDGView

