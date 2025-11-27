import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faArchive, faBell, faCheckCircle, faUsers, faChartLine, faEnvelope
} from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'

const DashboardSPView = () => {
  // Données statistiques
  const [stats] = useState({
    attestationsGenerees: 145,
    attestationsDisponibles: 23,
    attestationsCeMois: 18,
    enAttente: 12
  })

  // Alertes étudiants prêts
  const [alertes] = useState([
    { id: 1, nom: 'ANDEME MBO Lidvige Johane', filiere: 'GI', niveau: 'L3', classe: 'GI-3A', date: '2024-11-25' },
    { id: 2, nom: 'MBADINGA Paul', filiere: 'RT', niveau: 'L2', classe: 'RT-2B', date: '2024-11-24' },
    { id: 3, nom: 'OBIANG Sophie', filiere: 'MTIC', niveau: 'L1', classe: 'MTIC-1A', date: '2024-11-23' }
  ])

  // Données pour les graphiques
  const dataAttestations = [
    { mois: 'Août', generes: 12 },
    { mois: 'Sept', generes: 25 },
    { mois: 'Oct', generes: 38 },
    { mois: 'Nov', generes: 18 }
  ]

  const dataFileres = [
    { name: 'GI', value: 45 },
    { name: 'RT', value: 38 },
    { name: 'MTIC', value: 35 },
    { name: 'AV', value: 27 }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Tableau de bord
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vue d'ensemble des attestations de scolarité - Année 2024-2025
            </p>
          </div>

          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-500 text-3xl" />
                <FontAwesomeIcon icon={faChartLine} className="text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.attestationsGenerees}</h3>
              <p className="text-sm text-slate-600">Attestations générées</p>
              <p className="text-xs text-slate-500 mt-1">Depuis le début de l'année</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-3xl" />
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">Disponible</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.attestationsDisponibles}</h3>
              <p className="text-sm text-slate-600">Attestations disponibles</p>
              <p className="text-xs text-slate-500 mt-1">Étudiants à jour</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-indigo-500 text-3xl" />
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">Ce mois</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.attestationsCeMois}</h3>
              <p className="text-sm text-slate-600">Générées ce mois</p>
              <p className="text-xs text-slate-500 mt-1">Novembre 2024</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon icon={faBell} className="text-amber-500 text-3xl" />
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold">Alerte</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats.enAttente}</h3>
              <p className="text-sm text-slate-600">En attente</p>
              <p className="text-xs text-slate-500 mt-1">À traiter</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Graphique en barres */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Attestations générées par mois</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataAttestations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="generes" fill="#3B82F6" name="Attestations" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique en camembert */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Répartition par filière</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataFileres}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataFileres.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alertes et Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Alertes étudiants */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBell} className="text-amber-500" />
                  Attestations disponibles à générer
                </h2>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {alertes.length} étudiants
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alertes.map((alerte) => (
                  <div key={alerte.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUsers} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{alerte.nom}</p>
                        <p className="text-sm text-slate-600">{alerte.filiere} - {alerte.classe}</p>
                        <p className="text-xs text-slate-500">Inscription finalisée le {alerte.date}</p>
                      </div>
                    </div>
                    <Link
                      to="/sp-scolarite/attestations"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      Générer
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <Link
                  to="/sp-scolarite/attestations"
                  className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                    <span className="font-medium text-slate-800">Générer attestation</span>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  to="/sp-scolarite/archives"
                  className="flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faArchive} className="text-emerald-600 text-xl" />
                    <span className="font-medium text-slate-800">Consulter archives</span>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  to="/sp-scolarite/messagerie"
                  className="flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faEnvelope} className="text-indigo-600 text-xl" />
                    <span className="font-medium text-slate-800">Messagerie interne</span>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardSPView
