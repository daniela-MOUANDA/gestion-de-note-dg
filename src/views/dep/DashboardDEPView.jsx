import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faUserTie, faBuilding, faGraduationCap, faChartLine, 
  faFileAlt, faClipboardList, faEnvelope, faTrophy, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getDashboardStats } from '../../api/dep'

const KpiCard = ({ label, value, sub, icon, iconWrapClass = 'bg-slate-100 text-slate-600' }) => (
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

const DashboardDEPView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { showAlert } = useAlert()
  const nomComplet = user ? `${user.nom} ${user.prenom}` : 'Directeur des Études Pédagogiques'
  
  // Vérifier que l'utilisateur a le bon rôle
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }
    
    // Si l'utilisateur n'est pas DEP, rediriger vers le bon dashboard
    if (user.role !== 'DEP') {
      console.warn('Utilisateur avec rôle incorrect sur le dashboard DEP:', user.role)
      switch (user.role) {
        case 'SP_SCOLARITE':
          navigate('/sp-scolarite/dashboard', { replace: true })
          break
        case 'AGENT_SCOLARITE':
          navigate('/scolarite/dashboard', { replace: true })
          break
        case 'CHEF_SERVICE_SCOLARITE':
          navigate('/chef-scolarite/dashboard', { replace: true })
          break
        case 'CHEF_DEPARTEMENT':
          navigate('/chef/departement/dashboard', { replace: true })
          break
        default:
          navigate('/login', { replace: true })
      }
    }
  }, [user, isAuthenticated, navigate])
  
  // Données dynamiques
  const [stats, setStats] = useState({
    totalChefsDepartement: 0,
    totalDepartements: 0,
    totalEtudiants: 0,
    totalClasses: 0,
    tauxReussite: 0,
    repartitionEtudiants: [],
    inscriptionsParMois: [],
    tauxReussiteParNiveau: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const result = await getDashboardStats()
        
        if (result.success && result.stats) {
          setStats({
            totalChefsDepartement: result.stats.totalChefsDepartement || 0,
            totalDepartements: result.stats.totalDepartements || 0,
            totalEtudiants: result.stats.totalEtudiants || 0,
            totalClasses: result.stats.totalClasses || 0,
            tauxReussite: result.stats.tauxReussite || 0,
            repartitionEtudiants: result.stats.repartitionEtudiants || [],
            inscriptionsParMois: result.stats.inscriptionsParMois || [],
            tauxReussiteParNiveau: result.stats.tauxReussiteParNiveau || []
          })
        } else {
          showAlert(result.error || 'Erreur lors du chargement des données', 'error')
        }
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error)
        showAlert('Erreur lors du chargement des données du dashboard', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'DEP') {
      loadDashboardData()
    }
  }, [isAuthenticated, user, showAlert])

  // Couleurs pour le graphique en camembert
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          {/* Message de bienvenue */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-slate-800">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Vue d'ensemble de la direction des études pédagogiques. Voici un aperçu des statistiques et indicateurs clés.
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Chefs de Département"
              value={stats.totalChefsDepartement}
              sub="Tous départements"
              icon={faUserTie}
              iconWrapClass="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Départements"
              value={stats.totalDepartements}
              sub={`${stats.totalClasses} classes`}
              icon={faBuilding}
              iconWrapClass="bg-violet-50 text-violet-600"
            />
            <KpiCard
              label="Étudiants"
              value={stats.totalEtudiants}
              sub="Tous niveaux confondus"
              icon={faGraduationCap}
              iconWrapClass="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="Taux de réussite"
              value={`${stats.tauxReussite}%`}
              sub="Moyenne générale"
              icon={faChartLine}
              iconWrapClass="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Carte d'action rapide */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/dep/meilleurs-etudiants')}
            >
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faTrophy} className="text-amber-600 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Meilleurs étudiants</h3>
              <p className="text-sm text-slate-600">Classement disponible</p>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/dep/etudiants')}
            >
              <div className="flex items-center justify-between mb-3">
                <FontAwesomeIcon icon={faGraduationCap} className="text-emerald-600 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Voir tous les étudiants</h3>
              <p className="text-sm text-slate-600">Consulter la liste complète</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Inscriptions par mois */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-600" />
                Inscriptions par mois
              </h2>
              {stats.inscriptionsParMois.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.inscriptionsParMois}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inscriptions" fill="#0f2744" name="Inscriptions" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Taux de réussite par niveau */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
                Taux de réussite par niveau
              </h2>
              {stats.tauxReussiteParNiveau.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.tauxReussiteParNiveau}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="niveau" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="taux" fill="#10b981" name="Taux de réussite (%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Répartition des étudiants par département */}
          {stats.repartitionEtudiants.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-purple-600" />
                  Répartition des étudiants par département
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.repartitionEtudiants}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="departementCode" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} étudiants`, 'Nombre d\'étudiants']}
                      labelFormatter={(label) => {
                        const dept = stats.repartitionEtudiants.find(d => d.departementCode === label)
                        return dept ? dept.departementNom : label
                      }}
                    />
                    <Legend />
                    <Bar dataKey="nombreEtudiants" fill="#0f2744" name="Nombre d'étudiants" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="text-indigo-600" />
                  Répartition par département (Camembert)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.repartitionEtudiants}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ departementCode, nombreEtudiants, percent }) => 
                        `${departementCode}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="nombreEtudiants"
                    >
                      {stats.repartitionEtudiants.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        return [`${value} étudiants`, 'Nombre d\'étudiants']
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800">{data.departementNom}</p>
                              <p className="text-sm text-slate-600">
                                {data.nombreEtudiants} étudiants
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardDEPView

