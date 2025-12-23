import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTrophy, 
  faMedal, 
  faAward, 
  faGraduationCap, 
  faFilter,
  faCrown,
  faUser,
  faChartLine
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'
import { getMeilleursEtudiants } from '../../api/dep'
import { getFilieres } from '../../api/scolarite'
import { getMention } from '../../utils/mentions'

const MeilleursEtudiantsView = () => {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [etudiants, setEtudiants] = useState([])
  const [filterFiliere, setFilterFiliere] = useState('TOUS')
  const [filterNiveau, setFilterNiveau] = useState('TOUS')
  const [filterSemestre, setFilterSemestre] = useState('TOUS')
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])

  // Options de semestres
  const semestresOptions = [
    { value: 'TOUS', label: 'Choisir le semestre' },
    { value: 'S1', label: 'Semestre 1 (L1)' },
    { value: 'S2', label: 'Semestre 2 (L1)' },
    { value: 'S3', label: 'Semestre 3 (L2)' },
    { value: 'S4', label: 'Semestre 4 (L2)' },
    { value: 'S5', label: 'Semestre 5 (L3)' },
    { value: 'S6', label: 'Semestre 6 (L3)' }
  ]

  // Charger les filières
  useEffect(() => {
    const loadFilieres = async () => {
      try {
        const filieresData = await getFilieres()
        setFilieres(filieresData || [])
      } catch (error) {
        console.error('Erreur lors du chargement des filières:', error)
      }
    }
    loadFilieres()
  }, [])

  // Charger les niveaux
  useEffect(() => {
    const loadNiveaux = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/niveaux`)
        if (response.ok) {
          const niveauxData = await response.json()
          setNiveaux(niveauxData || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des niveaux:', error)
      }
    }
    loadNiveaux()
  }, [])

  // Charger les meilleurs étudiants
  const loadMeilleursEtudiants = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getMeilleursEtudiants({
        filiere: filterFiliere,
        niveau: filterNiveau,
        semestre: filterSemestre,
        limit: 50
      })

      if (result.success) {
        setEtudiants(result.etudiants || [])
      } else {
        showAlert(result.error || 'Erreur lors du chargement des meilleurs étudiants', 'error')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des meilleurs étudiants:', error)
      showAlert('Erreur lors du chargement des meilleurs étudiants', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterFiliere, filterNiveau, filterSemestre, showAlert])

  useEffect(() => {
    loadMeilleursEtudiants()
  }, [loadMeilleursEtudiants])


  // Fonction pour obtenir la couleur du rang
  const getRangColor = (rang) => {
    if (rang === 1) return 'from-yellow-400 to-yellow-600'
    if (rang === 2) return 'from-slate-300 to-slate-500'
    if (rang === 3) return 'from-amber-600 to-amber-800'
    return 'from-blue-400 to-blue-600'
  }

  // Filtrer les étudiants avec moyenne >= 10 pour le podium (pas d'Ajourné)
  const etudiantsValides = etudiants.filter(e => e.moyenneGenerale >= 10)
  
  // Séparer les 3 premiers (seulement ceux avec moyenne >= 10) et les autres
  const top3 = etudiantsValides.slice(0, 3)
  const autres = etudiantsValides.slice(3)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement des meilleurs étudiants..." />
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
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faTrophy} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Meilleurs Étudiants</h1>
                <p className="text-slate-600 mt-1">Classement des étudiants par performance académique</p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterFiliere}
                onChange={(e) => setFilterFiliere(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white shadow-sm"
              >
                <option value="TOUS">Toutes les filières</option>
                {filieres.map(filiere => (
                  <option key={filiere.id} value={filiere.code}>{filiere.nom || filiere.code}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterNiveau}
                onChange={(e) => setFilterNiveau(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white shadow-sm"
              >
                <option value="TOUS">Tous les niveaux</option>
                {niveaux.map(niveau => (
                  <option key={niveau.id} value={niveau.code}>{niveau.code} - {niveau.nom}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterSemestre}
                onChange={(e) => setFilterSemestre(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white shadow-sm"
              >
                {semestresOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Podium pour les 3 premiers */}
          {top3.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faCrown} className="text-yellow-500" />
                Podium
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2ème place */}
                {top3[1] && (
                  <div className="order-2 md:order-1 flex flex-col items-center">
                    <div className="w-full bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-300 transform hover:scale-105 transition-transform">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <FontAwesomeIcon icon={faMedal} className="text-white text-3xl" />
                        </div>
                        <div className="text-4xl font-bold text-slate-600 mb-2">#2</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">
                          {top3[1].prenom} {top3[1].nom}
                        </h3>
                        <div className="text-sm text-slate-600 mb-3">{top3[1].matricule}</div>
                        <div className="flex items-center gap-2 mb-3">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500" />
                          <span className="text-sm font-medium">{top3[1].filiere} - {top3[1].niveau}</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-700 mb-2">
                          {top3[1].moyenneGenerale}/20
                        </div>
                        <div className={`px-4 py-1 rounded-full text-xs font-semibold border ${getMention(top3[1].moyenneGenerale).color}`}>
                          {getMention(top3[1].moyenneGenerale).text}
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                          {top3[1].credits} crédits validés
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1ère place */}
                {top3[0] && (
                  <div className="order-1 md:order-2 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-xl p-8 border-2 border-yellow-400 transform hover:scale-105 transition-transform relative">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                          <FontAwesomeIcon icon={faCrown} className="text-white text-xl" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center mt-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                          <FontAwesomeIcon icon={faTrophy} className="text-white text-4xl" />
                        </div>
                        <div className="text-5xl font-bold text-yellow-700 mb-2">#1</div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1 text-center">
                          {top3[0].prenom} {top3[0].nom}
                        </h3>
                        <div className="text-sm text-slate-600 mb-3">{top3[0].matricule}</div>
                        <div className="flex items-center gap-2 mb-3">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500" />
                          <span className="text-sm font-medium">{top3[0].filiere} - {top3[0].niveau}</span>
                        </div>
                        <div className="text-4xl font-bold text-yellow-700 mb-2">
                          {top3[0].moyenneGenerale}/20
                        </div>
                        <div className={`px-4 py-1 rounded-full text-xs font-semibold border ${getMention(top3[0].moyenneGenerale).color}`}>
                          {getMention(top3[0].moyenneGenerale).text}
                        </div>
                        <div className="mt-3 text-sm text-slate-700 font-medium">
                          <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                          {top3[0].credits} crédits validés
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3ème place */}
                {top3[2] && (
                  <div className="order-3 flex flex-col items-center">
                    <div className="w-full bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-300 transform hover:scale-105 transition-transform">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <FontAwesomeIcon icon={faMedal} className="text-white text-3xl" />
                        </div>
                        <div className="text-4xl font-bold text-amber-700 mb-2">#3</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">
                          {top3[2].prenom} {top3[2].nom}
                        </h3>
                        <div className="text-sm text-slate-600 mb-3">{top3[2].matricule}</div>
                        <div className="flex items-center gap-2 mb-3">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500" />
                          <span className="text-sm font-medium">{top3[2].filiere} - {top3[2].niveau}</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-700 mb-2">
                          {top3[2].moyenneGenerale}/20
                        </div>
                        <div className={`px-4 py-1 rounded-full text-xs font-semibold border ${getMention(top3[2].moyenneGenerale).color}`}>
                          {getMention(top3[2].moyenneGenerale).text}
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                          {top3[2].credits} crédits validés
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des autres étudiants */}
          {autres.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faAward} className="text-blue-500" />
                Classement complet
              </h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Rang</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Étudiant</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Filière</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Niveau</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Moyenne</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Crédits</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Mention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {autres.map((etudiant) => {
                        const mention = getMention(etudiant.moyenneGenerale)
                        return (
                          <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-700">#{etudiant.rang}</span>
                                {etudiant.rang <= 10 && (
                                  <FontAwesomeIcon icon={faAward} className="text-blue-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <FontAwesomeIcon icon={faUser} className="text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{etudiant.prenom} {etudiant.nom}</p>
                                  <p className="text-xs text-slate-500">{etudiant.matricule}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {etudiant.filiere}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {etudiant.niveau}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${
                                  etudiant.moyenneGenerale >= 16 ? 'text-green-600' :
                                  etudiant.moyenneGenerale >= 14 ? 'text-blue-600' :
                                  etudiant.moyenneGenerale >= 12 ? 'text-yellow-600' :
                                  etudiant.moyenneGenerale >= 10 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {etudiant.moyenneGenerale}/20
                                </span>
                                <div className="w-20 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      etudiant.moyenneGenerale >= 16 ? 'bg-green-600' :
                                      etudiant.moyenneGenerale >= 14 ? 'bg-blue-600' :
                                      etudiant.moyenneGenerale >= 12 ? 'bg-yellow-600' :
                                      etudiant.moyenneGenerale >= 10 ? 'bg-orange-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${Math.min((etudiant.moyenneGenerale / 20) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-slate-700 font-medium">{etudiant.credits}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${mention.color}`}>
                                {mention.text}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Message si aucun étudiant */}
          {etudiants.length === 0 && !loading && (() => {
            // Déterminer le message selon les filtres
            let message = ''
            let titre = 'Aucun étudiant trouvé'
            
            const hasSemestreFilter = filterSemestre && filterSemestre !== 'TOUS'
            const hasNiveauFilter = filterNiveau && filterNiveau !== 'TOUS'
            const hasFiliereFilter = filterFiliere && filterFiliere !== 'TOUS'
            
            if (hasSemestreFilter && hasNiveauFilter) {
              const semestreLabel = semestresOptions.find(s => s.value === filterSemestre)?.label || filterSemestre
              const niveauLabel = niveaux.find(n => n.code === filterNiveau)?.nom || filterNiveau
              titre = 'Aucune note disponible'
              message = `Il n'y a pas encore de notes saisies pour le ${semestreLabel} au niveau ${niveauLabel}.`
            } else if (hasSemestreFilter) {
              const semestreLabel = semestresOptions.find(s => s.value === filterSemestre)?.label || filterSemestre
              titre = 'Aucune note disponible'
              message = `Il n'y a pas encore de notes saisies pour le ${semestreLabel}.`
            } else if (hasNiveauFilter) {
              const niveauLabel = niveaux.find(n => n.code === filterNiveau)?.nom || filterNiveau
              titre = 'Aucune note disponible'
              message = `Il n'y a pas encore de notes saisies pour le niveau ${niveauLabel}.`
            } else if (hasFiliereFilter) {
              const filiereLabel = filieres.find(f => f.code === filterFiliere)?.nom || filterFiliere
              titre = 'Aucun étudiant trouvé'
              message = `Aucun étudiant avec des notes ne correspond à la filière ${filiereLabel}.`
            } else {
              titre = 'Aucun étudiant trouvé'
              message = 'Aucun étudiant avec des notes ne correspond aux critères de recherche sélectionnés.'
            }
            
            return (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FontAwesomeIcon icon={faTrophy} className="text-6xl text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">{titre}</h3>
                <p className="text-slate-600">{message}</p>
                {(hasSemestreFilter || hasNiveauFilter) && (
                  <p className="text-sm text-slate-500 mt-3">
                    Le classement sera affiché une fois que les notes auront été saisies dans le système.
                  </p>
                )}
              </div>
            )
          })()}
        </main>
      </div>
    </div>
  )
}

export default MeilleursEtudiantsView
