import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faArchive, faBell, faCheckCircle, faUsers, faChartLine, faEnvelope
} from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getSPDashboardStats } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const DashboardSPView = () => {
  const { user } = useAuth()
  const { error: alertError } = useAlert()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Secrétaire Particulière'
  // Données statistiques
  const [stats, setStats] = useState({
    attestationsGenerees: 0,
    attestationsDisponibles: 0,
    attestationsCeMois: 0,
    enAttente: 0
  })

  // Alertes étudiants prêts
  const [alertes, setAlertes] = useState([])

  // Données pour les graphiques
  const [dataAttestations, setDataAttestations] = useState([])

  const [dataFileres, setDataFileres] = useState([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const response = await getSPDashboardStats()
        setStats(response?.stats || {
          attestationsGenerees: 0,
          attestationsDisponibles: 0,
          attestationsCeMois: 0,
          enAttente: 0
        })
        setDataAttestations(response?.monthly || [])
        setDataFileres(
          (response?.byFiliere || []).map((item) => ({
            name: item.code || item.nom,
            value: item.value
          }))
        )
        setAlertes(response?.alerts || [])
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord SP:', error)
        alertError(error.message || 'Erreur lors du chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
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

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-10 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Chargement des statistiques..." />
            </div>
          ) : (
          <>
          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Attestations générées</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.attestationsGenerees}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2.5">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Attestations disponibles</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.attestationsDisponibles}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2.5">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Générées ce mois</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.attestationsCeMois}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2.5">
                  <FontAwesomeIcon icon={faFileAlt} className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.enAttente}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5">
                  <FontAwesomeIcon icon={faBell} className="text-amber-600 text-xl" />
                </div>
              </div>
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
              {alertes.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune attestation disponible à générer pour le moment.</p>
              ) : (
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
              )}
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
          </>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardSPView
