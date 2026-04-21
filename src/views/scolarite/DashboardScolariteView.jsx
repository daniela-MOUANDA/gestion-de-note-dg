import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  faAward,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { getAgentDashboardStats } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const DashboardScolariteView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const nomComplet = user ? `${user.nom} ${user.prenom}` : 'Agent Scolarité'

  // Vérifier que l'utilisateur a le bon rôle
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    // Si l'utilisateur n'est pas AGENT_SCOLARITE, rediriger vers le bon dashboard
    if (user.role !== 'AGENT_SCOLARITE') {
      console.warn('Utilisateur avec rôle incorrect sur le dashboard Agent:', user.role)
      switch (user.role) {
        case 'SP_SCOLARITE':
          navigate('/sp-scolarite/dashboard', { replace: true })
          break
        case 'CHEF_SERVICE_SCOLARITE':
          navigate('/chef-scolarite/dashboard', { replace: true })
          break
        case 'CHEF_DEPARTEMENT':
          navigate('/chef/departement/dashboard', { replace: true })
          break
        case 'DEP':
          navigate('/dep/dashboard', { replace: true })
          break
        default:
          navigate('/login')
      }
    }
  }, [user, isAuthenticated, navigate])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    candidatsAdmis: 0,
    etudiantsInscrits: 0,
    enAttenteInscription: 0,
    inscriptionsAujourdhui: 0,
    tauxInscription: 0
  })
  const [dataParFiliere, setDataParFiliere] = useState([])
  const [inscriptionsParSemaine, setInscriptionsParSemaine] = useState([])
  const [dataGenre, setDataGenre] = useState([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const data = await getAgentDashboardStats()
        setStats(data.stats)
        setDataParFiliere(data.dataParFiliere || [])
        setInscriptionsParSemaine(data.inscriptionsParSemaine || [])
        setDataGenre(data.dataGenre || [])
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        // En cas d'erreur, garder les valeurs par défaut (0)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

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

  const KpiCard = ({ label, value, sub, icon, iconWrapClass }) => (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}>
          <FontAwesomeIcon icon={icon} className="text-lg" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement des statistiques..." />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />

        <main className="flex-1 p-4 pt-28 sm:p-6 sm:pt-28 lg:p-8 lg:pt-32">
          {/* Message de bienvenue */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Suivi en temps réel des inscriptions, des dossiers en attente et de la répartition des candidats.
            </p>
          </div>

          {/* Statistiques */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Candidats admis"
              value={stats.candidatsAdmis}
              sub="Dossiers validés"
              icon={faUsers}
              iconWrapClass="bg-sky-50 text-sky-600"
            />
            <KpiCard
              label="Étudiants inscrits"
              value={stats.etudiantsInscrits}
              sub="Inscrits confirmés"
              icon={faUserCheck}
              iconWrapClass="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="En attente"
              value={stats.enAttenteInscription}
              sub="À traiter"
              icon={faClock}
              iconWrapClass="bg-amber-50 text-amber-600"
            />
            <KpiCard
              label="Aujourd'hui"
              value={stats.inscriptionsAujourdhui}
              sub="Nouvelles inscriptions"
              icon={faCheckCircle}
              iconWrapClass="bg-violet-50 text-violet-600"
            />
          </div>


          {/* Graphiques et statistiques */}
          <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
            {/* Graphique en camembert - Répartition par filière */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-1 text-base font-bold text-slate-900">Répartition par filière</h2>
              <p className="mb-4 text-xs text-slate-500">Répartition des candidats admis par filière</p>
              {dataParFiliere.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={dataParFiliere}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dataParFiliere.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {dataParFiliere.map((item, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.value} étudiants</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-96 text-slate-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>

            {/* Inscriptions par filière */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Inscriptions par filière</h2>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FontAwesomeIcon icon={faChartLine} className="text-indigo-600" />
                  <span>Volume des inscrits</span>
                </div>
              </div>
              {dataParFiliere.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataParFiliere}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Bas de dashboard: évolution + genre */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Évolution des inscriptions</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-green-600" />
                <span>Taux actuel: <span className="font-semibold text-slate-800">{stats.tauxInscription}%</span></span>
              </div>
            </div>
            {inscriptionsParSemaine.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inscriptionsParSemaine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" stroke="#64748b" />
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
            ) : (
              <div className="flex items-center justify-center h-72 text-slate-500">
                <p>Aucune donnée disponible</p>
              </div>
            )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-1 text-base font-bold text-slate-900">Répartition par genre</h2>
              <p className="mb-4 text-xs text-slate-500">Distribution des étudiants inscrits par genre</p>
              {dataGenre.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dataGenre}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={105}
                        dataKey="value"
                      >
                        {dataGenre.map((entry, index) => (
                          <Cell key={`genre-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {dataGenre.map((item, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-72 items-center justify-center text-slate-500">
                  <p>Aucune donnée de genre disponible</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardScolariteView

