import { useState } from 'react'
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

const DashboardChefView = () => {
  const { user } = useAuth()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Chef de Service'
  const [stats] = useState({
    totalAgents: 5,
    agentsActifs: 4,
    totalInscriptions: 180,
    attestationsGenerees: 145,
    messagesNonLus: 8
  })

  // Données des dernières connexions
  const [dernieresConnexions] = useState([
    { id: 1, nom: 'Marie NZAMBA', role: 'Agent', date: '27/11/2024', heure: '14:32', statut: 'actif' },
    { id: 2, nom: 'Jeanne OBIANG', role: 'SP-Scolarité', date: '27/11/2024', heure: '09:15', statut: 'actif' },
    { id: 3, nom: 'Paul MBADINGA', role: 'Agent', date: '26/11/2024', heure: '16:45', statut: 'actif' },
    { id: 4, nom: 'Sophie ELLA', role: 'Agent', date: '26/11/2024', heure: '11:20', statut: 'inactif' }
  ])

  // Données des actions récentes
  const [actionsRecentes] = useState([
    { id: 1, agent: 'Marie NZAMBA', action: 'Inscription validée', details: 'ANDEME MBO Lidvige - GI-1A', date: '27/11/2024 14:30', type: 'success' },
    { id: 2, agent: 'Jeanne OBIANG', action: 'Attestation générée', details: 'N°0460/INPTIC/DG/DSE/2024', date: '27/11/2024 09:15', type: 'info' },
    { id: 3, agent: 'Paul MBADINGA', action: 'Bulletin distribué', details: 'RT-2A - Semestre 1', date: '26/11/2024 16:40', type: 'success' },
    { id: 4, agent: 'Marie NZAMBA', action: 'Message envoyé', details: 'Classe GI-1A (35 étudiants)', date: '26/11/2024 15:20', type: 'info' },
    { id: 5, agent: 'Sophie ELLA', action: 'Tentative de connexion échouée', details: '3 tentatives', date: '26/11/2024 11:15', type: 'warning' }
  ])

  // Données pour les graphiques
  const dataActivites = [
    { jour: 'Lun', inscriptions: 12, attestations: 8, bulletins: 15 },
    { jour: 'Mar', inscriptions: 18, attestations: 12, bulletins: 20 },
    { jour: 'Mer', inscriptions: 15, attestations: 10, bulletins: 18 },
    { jour: 'Jeu', inscriptions: 22, attestations: 15, bulletins: 25 },
    { jour: 'Ven', inscriptions: 20, attestations: 18, bulletins: 22 },
  ]

  const dataConnexions = [
    { heure: '8h', connexions: 2 },
    { heure: '10h', connexions: 4 },
    { heure: '12h', connexions: 3 },
    { heure: '14h', connexions: 5 },
    { heure: '16h', connexions: 3 },
  ]

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
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
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
              <p className="text-xs text-green-600 mt-1">{stats.agentsActifs} actifs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faUserCheck} className="text-emerald-500 text-3xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalInscriptions}</h3>
              <p className="text-sm text-slate-600">Inscriptions totales</p>
              <p className="text-xs text-slate-500 mt-1">Année 2024-2025</p>
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
              <h3 className="text-3xl font-bold text-slate-800">98%</h3>
              <p className="text-sm text-slate-600">Taux d'activité</p>
              <p className="text-xs text-green-600 mt-1">+5% cette semaine</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique des activités */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Activités de la semaine</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataActivites}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inscriptions" fill="#10B981" name="Inscriptions" />
                  <Bar dataKey="attestations" fill="#3B82F6" name="Attestations" />
                  <Bar dataKey="bulletins" fill="#8B5CF6" name="Bulletins" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique des connexions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Connexions aujourd'hui</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dataConnexions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="heure" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="connexions" stroke="#6366F1" strokeWidth={2} name="Connexions" />
                </LineChart>
              </ResponsiveContainer>
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

