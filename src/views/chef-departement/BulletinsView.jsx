import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt, faSpinner, faCheckCircle, faExclamationTriangle,
  faDownload, faSearch, faGraduationCap, faArrowLeft, faFilePdf, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getEtatBulletinsToutesClasses, genererBulletins } from '../../api/chefDepartement'

const BulletinsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()

  const [loading, setLoading] = useState(true)
  const [classesAvecEtat, setClassesAvecEtat] = useState([])
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('')
  const [generationLoading, setGenerationLoading] = useState({})
  const [viewMode, setViewMode] = useState('liste') // 'liste' ou 'detail'

  useEffect(() => {
    loadEtatBulletins()
  }, [selectedSemestre])

  const loadEtatBulletins = async () => {
    try {
      setLoading(true)
      const result = await getEtatBulletinsToutesClasses(selectedSemestre || null)
      if (result.success) {
        setClassesAvecEtat(result.classes || [])
      } else {
        showAlert(result.error || 'Erreur lors du chargement', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGenererBulletins = async (classeId, semestre, classeCode) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir générer les bulletins pour ${classeCode} - ${semestre} ?\n\nLes bulletins seront générés pour TOUS les étudiants de la classe et envoyés en attente de visa au DEP.`)) {
      return
    }

    const key = `${classeId}_${semestre}`
    try {
      setGenerationLoading(prev => ({ ...prev, [key]: true }))
      const result = await genererBulletins(classeId, semestre)
      if (result.success) {
        showAlert(result.message || 'Bulletins générés avec succès', 'success')
        // Recharger l'état
        await loadEtatBulletins()
      } else {
        showAlert(result.error || 'Erreur lors de la génération', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la génération des bulletins', 'error')
    } finally {
      setGenerationLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  // Grouper les classes par filière et niveau
  const classesGrouped = classesAvecEtat.reduce((acc, classe) => {
    const filiere = classe.filiere || 'Autres'
    const niveau = classe.niveau || 'Autres'
    const key = `${filiere}_${niveau}`
    
    if (!acc[key]) {
      acc[key] = {
        filiere,
        niveau,
        classes: []
      }
    }
    
    acc[key].classes.push(classe)
    return acc
  }, {})

  // Filtrer par filière et niveau
  let classesFiltrees = Object.values(classesGrouped)
  if (selectedFiliere) {
    classesFiltrees = classesFiltrees.filter(g => g.filiere === selectedFiliere)
  }
  if (selectedNiveau) {
    classesFiltrees = classesFiltrees.filter(g => g.niveau === selectedNiveau)
  }

  // Obtenir les filières et niveaux uniques
  const filieres = [...new Set(classesAvecEtat.map(c => c.filiere).filter(Boolean))]
  const niveaux = [...new Set(classesAvecEtat.map(c => c.niveau).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des données...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Bulletins</h1>
            <p className="text-sm text-slate-600">
              Générez les bulletins pour les classes dont toutes les notes sont saisies
            </p>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filière</label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les filières</option>
                  {filieres.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niveau</label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Semestre</label>
                <select
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les semestres</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                  <option value="S5">S5</option>
                  <option value="S6">S6</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des classes par filière/niveau */}
          {classesFiltrees.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">Aucune classe trouvée</p>
            </div>
          ) : (
            <div className="space-y-6">
              {classesFiltrees.map((groupe, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    {groupe.filiere} {groupe.niveau}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupe.classes.map((classe) => {
                      // Trouver le semestre à afficher
                      const semestreData = selectedSemestre
                        ? classe.semestres.find(s => s.semestre === selectedSemestre)
                        : classe.semestres[0] // Prendre le premier semestre si aucun n'est sélectionné

                      if (!semestreData) return null

                      const { semestre, pretPourGeneration, pourcentageNotes, modulesAvecNotesCompletes, nombreModulesRequis, nombreEtudiants, etudiantsAvecNotesCompletes } = semestreData
                      
                      // Utiliser le nombre de modules requis de la classe si disponible, sinon celui du semestre
                      const modulesRequis = nombreModulesRequis || classe.nombreModulesRequis || 0
                      const key = `${classe.id}_${semestre}`
                      const isLoading = generationLoading[key]

                      return (
                        <div key={classe.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-slate-800">{classe.code}</h4>
                              <p className="text-sm text-slate-500">{classe.nom}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <FontAwesomeIcon icon={faFilePdf} className="text-blue-600" />
                            </div>
                          </div>

                          {/* Statut */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              {pretPourGeneration ? (
                                <>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Prêt
                                  </span>
                                  <span className="text-sm font-semibold text-green-700">100%</span>
                                </>
                              ) : (
                                <>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    En cours
                                  </span>
                                  <span className="text-sm font-semibold text-yellow-700">{pourcentageNotes || 0}%</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mb-1">Notes saisies</div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  pretPourGeneration ? 'bg-green-600' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(pourcentageNotes || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                              {modulesAvecNotesCompletes}/{modulesRequis} modules
                            </span>
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                              Semestre: {semestre}
                            </span>
                          </div>

                          {/* Bouton d'action */}
                          <button
                            onClick={() => handleGenererBulletins(classe.id, semestre, classe.code)}
                            disabled={!pretPourGeneration || isLoading}
                            className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                              pretPourGeneration
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isLoading ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                <span>Génération...</span>
                              </>
                            ) : pretPourGeneration ? (
                              <>
                                <FontAwesomeIcon icon={faFileAlt} />
                                <span>Générer les bulletins</span>
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <span>Notes incomplètes</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BulletinsView
