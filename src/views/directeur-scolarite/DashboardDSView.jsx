import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt, faArchive, faUsers, faChartLine, faCheckCircle,
  faGraduationCap, faClipboardList, faArrowRight, faPenNib
} from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getSPDashboardStats } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const StatCard = ({ icon, label, value, color, to }) => (
  <Link
    to={to || '#'}
    className={`flex items-center gap-4 bg-white rounded-xl shadow-md p-5 border border-slate-100 hover:shadow-lg transition-shadow group`}
  >
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
      <FontAwesomeIcon icon={icon} className="text-white text-xl" />
    </div>
    <div>
      <p className="text-sm text-slate-500 mb-0.5">{label}</p>
      <p className="text-3xl font-bold text-slate-800">{value ?? '—'}</p>
    </div>
    <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
  </Link>
)

const DashboardDSView = () => {
  const { user } = useAuth()
  const { error: alertError } = useAlert()
  const [stats, setStats]  = useState(null)
  const [chart, setChart]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSPDashboardStats()
        setStats(res)
        setChart(res?.monthly || [])
      } catch (e) {
        console.error(e)
        alertError('Erreur lors du chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [alertError])

  const nomComplet = user ? `${user.prenom} ${user.nom}` : 'Directeur'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">

          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Bonjour, {nomComplet}
            </h1>
            <p className="text-slate-500 mt-1">
              Directeur de la Scolarité et des Examens — vue d'ensemble de la scolarité
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" text="Chargement des statistiques…" />
            </div>
          ) : (
            <>
              {/* Cartes stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                <StatCard
                  icon={faFileAlt}
                  label="Attestations générées"
                  value={stats?.attestationsGenerees ?? 0}
                  color="bg-blue-500"
                  to="/directeur-scolarite/attestations"
                />
                <StatCard
                  icon={faArchive}
                  label="En archive"
                  value={stats?.attestationsGenerees ?? 0}
                  color="bg-indigo-500"
                  to="/directeur-scolarite/archives"
                />
                <StatCard
                  icon={faGraduationCap}
                  label="Étudiants inscrits"
                  value={stats?.etudiantsInscrits ?? 0}
                  color="bg-emerald-500"
                />
                <StatCard
                  icon={faUsers}
                  label="Disponibles à générer"
                  value={stats?.attestationsDisponibles ?? 0}
                  color="bg-amber-500"
                  to="/directeur-scolarite/attestations"
                />
              </div>

              {/* Graphique */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Attestations générées par mois
                </h2>
                {chart.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucune donnée disponible</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="generes" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Attestations" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Raccourcis rapides */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Link
                  to="/directeur-scolarite/signature"
                  className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <FontAwesomeIcon icon={faPenNib} className="text-blue-600 text-2xl" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">Ma signature</h3>
                  <p className="text-sm text-slate-500">Gérer ma signature numérique sur les attestations</p>
                </Link>

                <Link
                  to="/directeur-scolarite/gestion-comptes"
                  className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg hover:border-emerald-300 transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
                    <FontAwesomeIcon icon={faUsers} className="text-emerald-600 text-2xl" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">Gestion des comptes</h3>
                  <p className="text-sm text-slate-500">Créer et gérer les comptes du service scolarité</p>
                </Link>

                <Link
                  to="/directeur-scolarite/statistiques"
                  className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg hover:border-amber-300 transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                    <FontAwesomeIcon icon={faChartLine} className="text-amber-600 text-2xl" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">Statistiques</h3>
                  <p className="text-sm text-slate-500">Consulter les tableaux de bord détaillés</p>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardDSView
