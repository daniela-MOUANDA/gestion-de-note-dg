import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine, faTrophy, faUsers, faGraduationCap, faSpinner,
  faChartBar, faUserGraduate, faAward, faMedal, faDownload
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getDashboardStats, getFilieres } from '../../api/chefDepartement'
import { getMeilleursEtudiantsParFiliere } from '../../api/chefDepartement'
import * as XLSX from 'xlsx'

const StatistiquesView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEnseignants: 0,
    totalEtudiants: 0,
    studentsData: [],
    levelData: [],
    genreData: [],
    tauxReussiteData: []
  })
  const [meilleursEtudiants, setMeilleursEtudiants] = useState({})
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [filieres, setFilieres] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Charger les statistiques générales
      const statsRes = await getDashboardStats()
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats)
      }

      // Charger les filières
      const filieresRes = await getFilieres()
      if (filieresRes.success && filieresRes.filieres) {
        setFilieres(filieresRes.filieres)
        if (filieresRes.filieres.length > 0) {
          setSelectedFiliere(filieresRes.filieres[0].id)
        }
      }

      // Charger les meilleurs étudiants par filière
      await loadMeilleursEtudiants()
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
      showAlert('Erreur lors du chargement des statistiques', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadMeilleursEtudiants = async () => {
    try {
      const result = await getMeilleursEtudiantsParFiliere()
      if (result.success) {
        setMeilleursEtudiants(result.data || {})
      }
    } catch (error) {
      console.error('Erreur chargement meilleurs étudiants:', error)
    }
  }

  useEffect(() => {
    loadMeilleursEtudiants()
  }, [selectedFiliere])

  const handleExportMeilleursEtudiants = () => {
    try {
      const etudiants = meilleursEtudiants[selectedFiliere] || []
      if (etudiants.length === 0) {
        showAlert('Aucun étudiant à exporter pour cette filière', 'warning')
        return
      }

      const filiere = filieres.find(f => f.id === selectedFiliere)
      const filiereNom = filiere ? `${filiere.code} - ${filiere.nom}` : 'Filiere'

      // Préparer les données pour l'export
      const dataToExport = etudiants.map((etudiant, index) => ({
        'Rang': index + 1,
        'Matricule': etudiant.matricule || '',
        'Nom': etudiant.nom || '',
        'Prénom': etudiant.prenom || '',
        'Classe': etudiant.classe || '',
        'Moyenne Générale': etudiant.moyenneGenerale?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
        'Crédits Validés': etudiant.totalCreditsValides || 0,
        'Statut': etudiant.statut === 'VALIDE' ? 'Validé' : 'Ajourné'
      }))

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new()
      
      // Créer une nouvelle feuille avec les données
      const ws = XLSX.utils.json_to_sheet(dataToExport)

      // Définir la largeur des colonnes
      const colWidths = [
        { wch: 8 },  // Rang
        { wch: 15 }, // Matricule
        { wch: 20 }, // Nom
        { wch: 20 }, // Prénom
        { wch: 15 }, // Classe
        { wch: 18 }, // Moyenne Générale
        { wch: 15 }, // Crédits Validés
        { wch: 12 }  // Statut
      ]
      ws['!cols'] = colWidths

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Meilleurs Étudiants')

      // Générer le nom du fichier avec la date
      const date = new Date().toISOString().split('T')[0]
      const fileName = `Meilleurs_Etudiants_${filiereNom.replace(/\s+/g, '_')}_${date}.xlsx`

      // Exporter le fichier
      XLSX.writeFile(wb, fileName)

      showAlert(`Liste des meilleurs étudiants exportée avec succès (${etudiants.length} étudiants)`, 'success')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      showAlert('Erreur lors de l\'export de la liste', 'error')
    }
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des statistiques...</p>
            </div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Statistiques Détaillées</h1>
            <p className="text-sm text-slate-600">Analyse approfondie des performances du département</p>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Classes</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalClasses}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Enseignants</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalEnseignants}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Étudiants</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalEtudiants}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUserGraduate} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-purple-500 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Taux de réussite moyen</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {stats.tauxReussiteData && stats.tauxReussiteData.length > 0
                      ? Math.round(stats.tauxReussiteData.reduce((acc, curr) => acc + (curr.tauxReussite || 0), 0) / stats.tauxReussiteData.length)
                      : 0}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faChartLine} className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition par filière */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                Répartition des étudiants par filière
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.studentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.studentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Taux de réussite par filière */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-600 rounded"></span>
                Taux de réussite par filière
              </h3>
              {stats.tauxReussiteData && stats.tauxReussiteData.length > 0 ? (
                <div className="space-y-6 mt-8">
                  {stats.tauxReussiteData.map((item, idx) => {
                    const taux = item.tauxReussite || 0
                    const colorClass = taux >= 70 ? 'from-green-500 to-green-600' : 
                                      taux >= 50 ? 'from-yellow-500 to-yellow-600' : 
                                      'from-red-500 to-red-600'
                    const textColor = taux >= 70 ? 'text-green-600' : 
                                     taux >= 50 ? 'text-yellow-600' : 
                                     'text-red-600'
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-700">{item.filiere}</span>
                            {item.etudiantsAvecNotes !== undefined && (
                              <span className="text-xs text-slate-500">
                                ({item.etudiantsAvecNotes || 0} étudiant{item.etudiantsAvecNotes !== 1 ? 's' : ''} avec notes)
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${textColor}`}>{taux}%</span>
                            {item.etudiantsReussis !== undefined && item.etudiantsAvecNotes > 0 && (
                              <p className="text-xs text-slate-500">
                                {item.etudiantsReussis}/{item.etudiantsAvecNotes} réussis
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden relative">
                          <div
                            className={`bg-gradient-to-r ${colorClass} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                            style={{ width: `${Math.min(taux, 100)}%` }}
                          >
                            {taux > 10 && (
                              <span className="text-xs font-semibold text-white">{taux}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Aucune donnée de taux de réussite disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Meilleurs étudiants par filière */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-600 rounded"></span>
                Meilleurs étudiants par filière
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {filieres.length > 0 && (
                  <select
                    value={selectedFiliere}
                    onChange={(e) => setSelectedFiliere(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filieres.map(f => (
                      <option key={f.id} value={f.id}>{f.code} - {f.nom}</option>
                    ))}
                  </select>
                )}
                {meilleursEtudiants[selectedFiliere] && meilleursEtudiants[selectedFiliere].length > 0 && (
                  <button
                    onClick={handleExportMeilleursEtudiants}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Exporter la liste</span>
                  </button>
                )}
              </div>
            </div>

            {meilleursEtudiants[selectedFiliere] && meilleursEtudiants[selectedFiliere].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rang</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Étudiant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Classe</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Moyenne Générale</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Crédits Validés</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {meilleursEtudiants[selectedFiliere].slice(0, 10).map((etudiant, index) => (
                      <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          {index === 0 && <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 mr-1" />}
                          {index === 1 && <FontAwesomeIcon icon={faTrophy} className="text-slate-400 mr-1" />}
                          {index === 2 && <FontAwesomeIcon icon={faTrophy} className="text-amber-600 mr-1" />}
                          <span className="font-medium text-slate-900">{index + 1}er</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{etudiant.nom} {etudiant.prenom}</div>
                          <div className="text-xs text-slate-500">{etudiant.matricule}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{etudiant.classe || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-lg ${etudiant.moyenneGenerale >= 10 ? 'text-green-700' : 'text-red-700'}`}>
                            {etudiant.moyenneGenerale?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 font-medium">
                          {etudiant.totalCreditsValides || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {etudiant.statut === 'VALIDE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FontAwesomeIcon icon={faAward} /> Validé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Ajourné
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-slate-300 mb-3" />
                <p>Aucun étudiant avec notes trouvé pour cette filière</p>
              </div>
            )}
          </div>

          {/* Graphiques supplémentaires */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par niveau */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                Étudiants par niveau
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.levelData}>
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
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-pink-600 rounded"></span>
                Répartition par genre
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatistiquesView

