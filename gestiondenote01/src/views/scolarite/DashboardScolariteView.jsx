import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers,
  faUserCheck,
  faFileExcel,
  faClock,
  faCheckCircle,
  faChartLine,
  faArrowTrendUp,
  faArchive,
  faFileAlt,
  faEnvelope,
  faAward
} from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'

const DashboardScolariteView = () => {
  const [stats] = useState({
    candidatsAdmis: 250,
    etudiantsInscrits: 180,
    enAttenteInscription: 70,
    inscriptionsAujourdhui: 5,
    tauxInscription: 72 // (180/250) * 100
  })

  // Données pour le graphique en camembert par filière
  const dataParFiliere = [
    { name: 'Génie Informatique', value: 95, color: '#3B82F6' },
    { name: 'Réseau et Télécom', value: 60, color: '#10B981' },
    { name: 'Management et Multimédias', value: 25, color: '#F59E0B' }
  ]

  // Données pour le graphique en barres (inscriptions par semaine)
  const inscriptionsParSemaine = [
    { semaine: 'Sem 1', inscrits: 12 },
    { semaine: 'Sem 2', inscrits: 18 },
    { semaine: 'Sem 3', inscrits: 25 },
    { semaine: 'Sem 4', inscrits: 30 },
    { semaine: 'Sem 5', inscrits: 35 },
    { semaine: 'Sem 6', inscrits: 40 },
    { semaine: 'Sem 7', inscrits: 20 }
  ]

  // Données pour le graphique en camembert (statut)
  const dataStatut = [
    { name: 'Inscrits', value: 180, color: '#10B981' },
    { name: 'En attente', value: 70, color: '#F59E0B' }
  ]

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarScolarite />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderScolarite scolariteName="Service Scolarité" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Tableau de bord
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Service Scolarité - Gestion des inscriptions
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Candidats admis</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.candidatsAdmis}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Étudiants inscrits</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.etudiantsInscrits}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUserCheck} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.enAttenteInscription}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faClock} className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-purple-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Aujourd'hui</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.inscriptionsAujourdhui}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques et statistiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Graphique en camembert - Répartition par filière */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Répartition par filière</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={dataParFiliere}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataParFiliere.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {dataParFiliere.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{item.value} étudiants</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphique en camembert - Statut */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Statut des candidats</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={dataStatut}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataStatut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {dataStatut.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graphique en barres - Évolution des inscriptions */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Évolution des inscriptions</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-green-600" />
                <span>Taux d'inscription: <span className="font-semibold text-slate-800">{stats.tauxInscription}%</span></span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inscriptionsParSemaine}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="semaine" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px' 
                  }} 
                />
                <Legend />
                <Bar dataKey="inscrits" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actions rapides et informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <a
                  href="/scolarite/importer-candidats"
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faFileExcel} className="text-blue-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Importer candidats admis</p>
                    <p className="text-xs text-slate-600">Importez un fichier Excel avec les candidats admis</p>
                  </div>
                </a>
                <a
                  href="/scolarite/inscriptions"
                  className="flex items-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faUserCheck} className="text-emerald-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Gérer les inscriptions</p>
                    <p className="text-xs text-slate-600">Vérifiez les documents et inscrivez les étudiants</p>
                  </div>
                </a>
                <a
                  href="/scolarite/messagerie"
                  className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="text-purple-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Messagerie</p>
                    <p className="text-xs text-slate-600">Envoyez des messages aux étudiants</p>
                  </div>
                </a>
                <a
                  href="/scolarite/bulletins"
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Bulletins</p>
                    <p className="text-xs text-slate-600">Gérez la remise des bulletins semestriels</p>
                  </div>
                </a>
                <a
                  href="/scolarite/diplomes"
                  className="flex items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faAward} className="text-amber-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Diplômes</p>
                    <p className="text-xs text-slate-600">Gérez la remise des diplômes DTS et Licence</p>
                  </div>
                </a>
                <a
                  href="/scolarite/proces-verbaux"
                  className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="text-indigo-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Procès-Verbaux</p>
                    <p className="text-xs text-slate-600">Consultez les PV des résultats semestriels et annuels</p>
                  </div>
                </a>
                <a
                  href="/scolarite/archivage"
                  className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faArchive} className="text-slate-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Archivage</p>
                    <p className="text-xs text-slate-600">Consultez les promotions passées, diplômés et abandons</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Informations</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Année académique:</span>
                  <span className="font-semibold text-slate-800">2025</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux d'inscription:</span>
                  <span className="font-semibold text-slate-800">{stats.tauxInscription}%</span>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="font-medium text-slate-700 mb-2">Filières disponibles:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      Génie Informatique
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      Réseau et Télécom
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                      Management et Multimédias
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardScolariteView

