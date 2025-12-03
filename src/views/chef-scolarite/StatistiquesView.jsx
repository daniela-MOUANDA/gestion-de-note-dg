import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartLine
} from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAuth } from '../../contexts/AuthContext'
import { getChefStatistiques } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const StatistiquesView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: alertError } = useAlert()
  
  const [dataInscriptions, setDataInscriptions] = useState([])
  const [dataFilieres, setDataFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'CHEF_SERVICE_SCOLARITE') {
      console.warn(`Accès non autorisé aux statistiques Chef pour le rôle: ${user?.role}. Redirection...`)
      const role = user?.role?.trim().toUpperCase()
      if (role === 'SP_SCOLARITE') {
        navigate('/sp-scolarite/dashboard', { replace: true })
      } else if (role === 'AGENT_SCOLARITE') {
        navigate('/scolarite/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  // Charger les statistiques
  useEffect(() => {
    const loadStatistiques = async () => {
      if (user?.role === 'CHEF_SERVICE_SCOLARITE') {
        try {
          setLoading(true)
          setError(null)
          const data = await getChefStatistiques()
          setDataInscriptions(data.inscriptionsParMois || [])
          setDataFilieres(data.repartitionFilieres || [])
        } catch (err) {
          console.error('Erreur lors du chargement des statistiques:', err)
          setError(err.message || 'Erreur lors du chargement des statistiques.')
          alertError(err.message || 'Erreur lors du chargement des statistiques.')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    if (isAuthenticated && user?.role === 'CHEF_SERVICE_SCOLARITE') {
      loadStatistiques()
    }
  }, [isAuthenticated, user, alertError])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <LoadingSpinner size="lg" text="Chargement des statistiques..." />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-600" />
              Statistiques
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Analyse des données et tendances
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Inscriptions par mois</h2>
              {dataInscriptions.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataInscriptions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#6366F1" name="Inscriptions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Répartition par filière</h2>
              {dataFilieres.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dataFilieres}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dataFilieres.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {dataFilieres.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.value} étudiants</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatistiquesView

