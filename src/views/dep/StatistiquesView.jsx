import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar, faChartLine, faUsers, faGraduationCap, faUserTie, 
  faBuilding, faFileContract, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'
import { getStatistiques } from '../../api/dep'

const StatistiquesView = () => {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    // Chefs de Département
    totalChefs: 0,
    repartitionChefsParDepartement: [],
    
    // Départements
    totalDepartements: 0,
    repartitionEtudiantsParDepartement: [],
    filieresParDepartement: [],
    
    // Visas & Documents
    bulletinsEnAttente: 0,
    bulletinsVisesTotal: 0,
    bulletinsVisesParMois: [],
    
    // Étudiants
    totalEtudiants: 0,
    repartitionParNiveau: [],
    repartitionParFiliere: [],
    tauxReussiteParNiveau: [],
    tauxReussiteParFiliere: []
  })

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

  useEffect(() => {
    loadStatistiques()
  }, [])

  const loadStatistiques = async () => {
    try {
      setLoading(true)
      const result = await getStatistiques()

      if (result.success && result.data) {
        setStats(result.data)
      } else {
        showAlert(result.error || 'Erreur lors du chargement des statistiques', 'error')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      showAlert('Erreur lors du chargement des statistiques', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Statistiques</h1>
            <p className="text-sm text-slate-600">Vue d'ensemble des statistiques pédagogiques</p>
          </div>

          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold text-slate-800">{stats.totalChefs}</h3>
                <FontAwesomeIcon icon={faUserTie} className="text-blue-500 text-3xl" />
              </div>
              <p className="text-sm text-slate-600">Chefs de Département</p>
              <p className="text-xs text-slate-500 mt-1">Tous départements</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold text-slate-800">{stats.totalDepartements}</h3>
                <FontAwesomeIcon icon={faBuilding} className="text-purple-500 text-3xl" />
              </div>
              <p className="text-sm text-slate-600">Départements</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.filieresParDepartement.reduce((sum, dep) => sum + (dep.nombreFilieres || 0), 0)} filières
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold text-slate-800">{stats.bulletinsEnAttente}</h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-3xl" />
              </div>
              <p className="text-sm text-slate-600">Bulletins en attente</p>
              <p className="text-xs text-amber-600 mt-1">En attente de visa</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold text-slate-800">{stats.totalEtudiants}</h3>
                <FontAwesomeIcon icon={faGraduationCap} className="text-emerald-500 text-3xl" />
              </div>
              <p className="text-sm text-slate-600">Étudiants</p>
              <p className="text-xs text-green-600 mt-1">Tous niveaux confondus</p>
            </div>
          </div>

          {/* Section 1: Visas & Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
            {/* Bulletins visés par mois */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="text-amber-600" />
                Bulletins visés par mois
              </h2>
              {stats.bulletinsVisesParMois.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.bulletinsVisesParMois}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vises" fill="#f59e0b" name="Bulletins visés" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Départements */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="text-purple-600" />
                Répartition des Étudiants par Département
              </h2>
              {stats.repartitionEtudiantsParDepartement.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.repartitionEtudiantsParDepartement}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.repartitionEtudiantsParDepartement.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Étudiants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Répartition par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                Répartition par Niveau
              </h2>
              {stats.repartitionParNiveau.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.repartitionParNiveau}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="niveau" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="etudiants" fill="#3b82f6" name="Nombre d'étudiants" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Taux de réussite par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-emerald-600" />
                Taux de réussite par Niveau
              </h2>
              {stats.tauxReussiteParNiveau.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.tauxReussiteParNiveau}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="niveau" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="taux" fill="#10b981" name="Taux de réussite (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Taux de réussite par filière */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
              Taux de réussite par Filière
            </h2>
            {stats.tauxReussiteParFiliere && stats.tauxReussiteParFiliere.length > 0 && stats.tauxReussiteParFiliere.some(f => f.taux > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.tauxReussiteParFiliere.filter(f => f.taux > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="filiere" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taux" name="Taux de réussite (%)">
                    {stats.tauxReussiteParFiliere.filter(f => f.taux > 0).map((entry, index) => {
                      // Couleurs différentes : vert, jaune, bleu, puis répétition
                      const colors = ['#10b981', '#f59e0b', '#3b82f6'] // vert, jaune, bleu
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatistiquesView
