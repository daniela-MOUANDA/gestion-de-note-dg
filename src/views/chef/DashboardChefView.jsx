import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { getDashboardStats } from '../../api/chefDepartement'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

const DashboardChefView = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const isEspaceDepartement =
    user?.role === 'CHEF_DEPARTEMENT' || user?.role === 'COORD_PEDAGOGIQUE'
  const nomComplet = user ? `${user.nom} ${user.prenom}` : 'Département'

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (isAuthenticated && !isEspaceDepartement) {
      console.warn(`Accès non autorisé au dashboard Chef de Département pour le rôle: ${user?.role}. Redirection...`)
      const role = user?.role?.trim().toUpperCase()
      if (role === 'CHEF_SERVICE_SCOLARITE') {
        navigate('/chef-scolarite/dashboard', { replace: true })
      } else if (role === 'SP_SCOLARITE') {
        navigate('/sp-scolarite/dashboard', { replace: true })
      } else if (role === 'AGENT_SCOLARITE') {
        navigate('/scolarite/dashboard', { replace: true })
      } else if (role === 'DEP') {
        navigate('/dep/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate, isEspaceDepartement])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEnseignants: 0,
    totalEtudiants: 0,
    notesEnAttente: 0,
    rattrapagesProgrammes: 0,
    unitesPubliees: 0,
    bulletinsPublies: 0,
    messagesNonLus: 0
  })

  // State pour les graphes
  const [graphData, setGraphData] = useState({
    studentsData: [],
    modulesParFiliere: [],
    levelData: [],
    genreData: [],
    tauxReussiteData: []
  })



  const recentActions = [
    { id: 1, action: 'Note ajoutée pour Module "Base de données"', date: 'Il y a 2 heures', type: 'note' },
    { id: 2, action: 'Rattrapage programmé pour L3 GI', date: 'Il y a 5 heures', type: 'rattrapage' },
    { id: 3, action: 'Bulletin publié pour Semestre 4', date: 'Hier', type: 'bulletin' },
    { id: 4, action: 'Unité d\'enseignement publiée', date: 'Il y a 2 jours', type: 'unite' },
    { id: 5, action: 'Nouveau message du Directeur des Études', date: 'Il y a 1 heure', type: 'message' }
  ]

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      // 1. Charger stats globales
      const statsRes = await getDashboardStats()
      if (statsRes.success && statsRes.stats) {
        // Mettre à jour les graphiques
        setGraphData(statsRes.stats)

        // Mettre à jour les statistiques de base
        setStats({
          totalClasses: statsRes.stats.totalClasses || 0,
          totalEnseignants: statsRes.stats.totalEnseignants || 0,
          totalEtudiants: statsRes.stats.totalEtudiants || 0,
          notesEnAttente: 0, // À implémenter plus tard
          rattrapagesProgrammes: 0, // À implémenter plus tard
          unitesPubliees: 0, // À implémenter plus tard
          bulletinsPublies: 0, // À implémenter plus tard
          messagesNonLus: 0 // À implémenter plus tard
        })
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les données
  useEffect(() => {
    if (isAuthenticated && isEspaceDepartement) {
      loadDashboardData()
    }
  }, [isAuthenticated, isEspaceDepartement, loadDashboardData])







  // Données pour les graphiques (Utilisation du state graphData)
  // const studentsData = [ ... ] (Supprimé car dynamique)

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

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

  const departementChef = user?.departement?.nom || 'Département'

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bienvenue, {nomComplet} !
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Nous sommes ravis de vous revoir. Voici un aperçu de votre tableau de bord.
            </p>
          </div>

          {/* Statistiques */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Classes"
              value={stats.totalClasses}
              sub="Groupes pédagogiques actifs"
              icon={faUsers}
              iconWrapClass="bg-sky-50 text-sky-600"
            />
            <KpiCard
              label="Enseignants"
              value={stats.totalEnseignants}
              sub="Corps enseignant actif"
              icon={faChalkboardTeacher}
              iconWrapClass="bg-violet-50 text-violet-600"
            />
            <KpiCard
              label="Étudiants"
              value={stats.totalEtudiants}
              sub="Inscriptions actives"
              icon={faUserGraduate}
              iconWrapClass="bg-emerald-50 text-emerald-600"
            />
            <a href="/chef/messagerie" className="block">
              <KpiCard
                label="Messages non lus"
                value={stats.messagesNonLus}
                sub="Boîte de réception"
                icon={faEnvelope}
                iconWrapClass="bg-fuchsia-50 text-fuchsia-600"
              />
            </a>
          </div>

          {/* Grille des graphiques - Disposition élégante */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition des étudiants par filière */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                Étudiants par filière (Total: {graphData?.studentsData?.reduce((acc, curr) => acc + curr.value, 0) || 0})
              </h3>
              <p className="mb-4 text-xs text-slate-500">Répartition des inscriptions actives</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={graphData.studentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {graphData.studentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {graphData.studentsData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || COLORS[idx % COLORS.length] }}></div>
                    <div>
                      <p className="text-xs text-slate-600">{entry.name}</p>
                      <p className="text-lg font-bold text-slate-800">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules par filière */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="w-1 h-6 bg-amber-600 rounded"></span>
                Modules par filière
              </h3>
              <p className="mb-4 text-xs text-slate-500">Volume de modules gérés dans votre département</p>
              {graphData.modulesParFiliere && graphData.modulesParFiliere.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={graphData.modulesParFiliere}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="filiere" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => {
                          if (name === 'modules') return [`${value}`, 'Modules']
                          if (name === 'creditsTotal') return [`${value}`, 'Crédits cumulés']
                          return [value, name]
                        }}
                      />
                      <Bar dataKey="modules" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {graphData.modulesParFiliere.slice(0, 4).map((item) => (
                      <div
                        key={item.filiere}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-slate-700">{item.filiere}</span>
                        <span className="text-sm text-slate-600">
                          <strong className="text-slate-900">{item.modules}</strong> modules · {item.creditsTotal} crédits
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Aucune donnée de modules disponible</p>
                  <p className="text-sm mt-2">Les modules apparaîtront ici une fois associés aux filières</p>
                </div>
              )}
            </div>
          </div>

          {/* Deuxième ligne de graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition par niveau */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                Étudiants par niveau
              </h3>
              <p className="mb-4 text-xs text-slate-500">Effectifs regroupés par niveau</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData.levelData}>
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

            {/* Répartition par genre */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="w-1 h-6 bg-pink-600 rounded"></span>
                Répartition par genre
              </h3>
              <p className="mb-4 text-xs text-slate-500">Distribution des étudiants par genre</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={graphData.genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {graphData.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {graphData.genreData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <div>
                      <p className="text-xs text-slate-600">{entry.name}</p>
                      <p className="text-lg font-bold text-slate-800">{entry.value}</p>
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

export default DashboardChefView
