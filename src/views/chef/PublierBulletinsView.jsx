import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFilePdf, 
  faCheckCircle, 
  faTimes, 
  faDownload, 
  faEye,
  faArrowLeft,
  faSpinner,
  faHistory,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import { getFilieres, getClasses } from '../../api/chefDepartement'

const PublierBulletinsView = () => {
  const { showAlert } = useAlert()
  const { user } = useAuth()
  
  // États pour la navigation multi-étapes
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedClasse, setSelectedClasse] = useState(null)
  const [showHistorique, setShowHistorique] = useState(false)
  const [filieres, setFilieres] = useState([])
  const [loadingFilieres, setLoadingFilieres] = useState(true)
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const niveaux = ['L1', 'L2', 'L3']

  // Charger les filières du département du chef connecté
  useEffect(() => {
    const loadFilieres = async () => {
      try {
        setLoadingFilieres(true)
        const result = await getFilieres()
        if (result.success && result.filieres) {
          // Extraire uniquement les codes des filières pour l'affichage
          const filiereCodes = result.filieres.map(f => ({
            code: f.code,
            nom: f.nom,
            id: f.id
          }))
          setFilieres(filiereCodes)
        } else {
          showAlert(result.error || 'Erreur lors du chargement des filières', 'error')
          setFilieres([])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des filières:', error)
        showAlert('Erreur lors du chargement des filières', 'error')
        setFilieres([])
      } finally {
        setLoadingFilieres(false)
      }
    }

    loadFilieres()
  }, [showAlert])

  // Charger les classes quand une filière et un niveau sont sélectionnés
  useEffect(() => {
    const loadClasses = async () => {
      if (!selectedFiliere || !selectedNiveau) {
        setClasses([])
        return
      }

      try {
        setLoadingClasses(true)
        const result = await getClasses()
        if (result.success && result.classes) {
          // Filtrer les classes par filière et niveau
          const filiereObj = filieres.find(f => f.code === selectedFiliere)
          if (!filiereObj) {
            setClasses([])
            return
          }

          const filteredClasses = result.classes.filter(classe => {
            const classeFiliere = classe.filiere || classe.filieres?.code
            const classeNiveau = classe.niveau || classe.niveaux?.code
            return classeFiliere === selectedFiliere && classeNiveau === selectedNiveau
          })

          setClasses(filteredClasses)
        } else {
          setClasses([])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error)
        setClasses([])
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [selectedFiliere, selectedNiveau, filieres])

  // Historique des bulletins générés
  const [historiqueBulletins, setHistoriqueBulletins] = useState([
    {
      id: 1,
      classe: 'GI-L3-A',
      filiere: 'GI',
      niveau: 'L3',
      semestre: 'S5',
      type: 'Avant rattrapages',
      dateGeneration: '2024-11-15',
      nombreEtudiants: 45,
      generePar: 'Dr. Jean KAMDEM'
    },
    {
      id: 2,
      classe: 'GI-L3-B',
      filiere: 'GI',
      niveau: 'L3',
      semestre: 'S5',
      type: 'Avant rattrapages',
      dateGeneration: '2024-11-15',
      nombreEtudiants: 42,
      generePar: 'Dr. Jean KAMDEM'
    },
    {
      id: 3,
      classe: 'GI-L2-A',
      filiere: 'GI',
      niveau: 'L2',
      semestre: 'S3',
      type: 'Après rattrapages',
      dateGeneration: '2024-11-10',
      nombreEtudiants: 48,
      generePar: 'Dr. Jean KAMDEM'
    }
  ])

  // Gestionnaires de navigation
  const handleFiliereSelect = (filiere) => {
    setSelectedFiliere(filiere)
    setSelectedNiveau('')
    setCurrentStep(2)
  }

  const handleNiveauSelect = (niveau) => {
    setSelectedNiveau(niveau)
    setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep === 3) {
      setSelectedNiveau('')
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setSelectedFiliere('')
      setCurrentStep(1)
    }
  }

  const handleOpenGenerateModal = (classe) => {
    setSelectedClasse(classe)
    setShowGenerateModal(true)
  }

  const handleGenerateBulletin = (type) => {
    if (!selectedClasse) return

    const classeCode = selectedClasse.code || selectedClasse.nom || 'Classe inconnue'
    const newBulletin = {
      id: Date.now(),
      classe: classeCode,
      filiere: selectedFiliere,
      niveau: selectedNiveau,
      semestre: getSemestre(selectedNiveau),
      type: type,
      dateGeneration: new Date().toISOString().split('T')[0],
      nombreEtudiants: selectedClasse.effectif || Math.floor(Math.random() * 20) + 30,
      generePar: user?.nom || 'Chef de département'
    }

    setHistoriqueBulletins(prev => [newBulletin, ...prev])
    setShowGenerateModal(false)
    setSelectedClasse(null)
    showAlert(`Bulletin généré avec succès pour ${classeCode} (${type})`, 'success')
  }

  const getSemestre = (niveau) => {
    const semestreMap = { 'L1': 'S1', 'L2': 'S3', 'L3': 'S5' }
    return semestreMap[niveau] || 'S1'
  }

  const handleDownloadBulletin = (bulletin) => {
    showAlert(`Téléchargement du bulletin ${bulletin.classe} - ${bulletin.semestre}`, 'info')
  }

  const handleViewBulletin = (bulletin) => {
    showAlert(`Visualisation du bulletin ${bulletin.classe} - ${bulletin.semestre}`, 'info')
  }

  // Étape 1: Sélection de la filière
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    Publier les bulletins
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    Générez et publiez les bulletins de notes des étudiants
                  </p>
                </div>
                <button
                  onClick={() => setShowHistorique(!showHistorique)}
                  className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faHistory} className="mr-2" />
                  Historique
                </button>
              </div>
            </div>

            {/* Historique des bulletins */}
            {showHistorique && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                      <FontAwesomeIcon icon={faHistory} className="mr-3 text-blue-600" />
                      Historique des bulletins générés
                    </h2>
                    <button
                      onClick={() => setShowHistorique(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {historiqueBulletins.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Aucun bulletin généré
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historiqueBulletins.map((bulletin) => (
                        <div
                          key={bulletin.id}
                          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-slate-800">
                                  {bulletin.classe} - {bulletin.semestre}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  bulletin.type === 'Avant rattrapages' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {bulletin.type}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                                <div>📅 {new Date(bulletin.dateGeneration).toLocaleDateString('fr-FR')}</div>
                                <div>👥 {bulletin.nombreEtudiants} étudiants</div>
                                <div>👨‍💼 {bulletin.generePar}</div>
                                <div>📂 {bulletin.filiere} {bulletin.niveau}</div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleViewBulletin(bulletin)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Visualiser"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => handleDownloadBulletin(bulletin)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Télécharger"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              {loadingFilieres ? (
                <div className="flex items-center justify-center py-12">
                  <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin" />
                </div>
              ) : filieres.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 mb-4">Aucune filière disponible pour votre département</p>
                  <p className="text-sm text-slate-400">Contactez l'administrateur pour ajouter des filières à votre département</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {filieres.map((filiere) => (
                    <button
                      key={filiere.code}
                      onClick={() => handleFiliereSelect(filiere.code)}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">
                          {filiere.code}
                        </div>
                        <div className="text-sm text-slate-600">
                          {filiere.nom}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Étape 2: Sélection du niveau
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Bulletins - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau d'études
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez le niveau</h2>
              <p className="text-slate-600 text-center mb-6">Filière: <span className="font-medium text-blue-600">{selectedFiliere}</span></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {niveaux.map((niveau) => (
                  <button
                    key={niveau}
                    onClick={() => handleNiveauSelect(niveau)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">
                        {niveau}
                      </div>
                      <div className="text-sm text-slate-600">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Étape 3: Liste des classes avec statut
  // Les classes sont déjà chargées depuis l'API dans le useEffect

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Bulletins - {selectedFiliere} {selectedNiveau}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Générez les bulletins pour les classes dont toutes les notes sont saisies
            </p>
          </div>

          {loadingClasses ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200">
              <FontAwesomeIcon icon={faFilePdf} className="text-6xl text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500 mb-2">Aucune classe trouvée</p>
              <p className="text-sm text-slate-400">Aucune classe disponible pour {selectedFiliere} {selectedNiveau}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((classe, index) => {
                // Pour l'instant, on affiche les classes sans statut détaillé
                // TODO: Charger le statut réel depuis l'API des bulletins
                const isReady = false // Sera remplacé par le statut réel
                const status = {
                  notesCompletes: isReady,
                  pourcentage: 0,
                  modules: classe.nombreModules || 0,
                  modulesRemplis: 0
                }

              return (
                <div key={classe.id || classe.code || `classe-${index}`} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{classe.code || classe.nom}</h3>
                      {classe.nom && classe.code !== classe.nom && (
                        <p className="text-sm text-slate-500 mb-2">{classe.nom}</p>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          isReady 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {isReady ? '✓ Prêt' : '⚠ En cours'}
                        </span>
                        <span className="text-sm text-slate-600">
                          {status.pourcentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={faFilePdf} className="text-xl" />
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Notes saisies</span>
                      <span>{status.modulesRemplis}/{status.modules} modules</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          isReady ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${status.pourcentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400" />
                      <span>Semestre: {getSemestre(selectedNiveau)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenGenerateModal(classe)}
                    disabled={!isReady}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      isReady
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <FontAwesomeIcon icon={isReady ? faCheckCircle : faSpinner} className="mr-2" />
                    {isReady ? 'Générer le bulletin' : 'Notes incomplètes'}
                  </button>
                </div>
              )
            })}
            </div>
          )}

          {/* Modal de choix du type de bulletin */}
          {showGenerateModal && selectedClasse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button
                  onClick={() => {
                    setShowGenerateModal(false)
                    setSelectedClasse(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faFilePdf} className="text-blue-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Générer le bulletin</h2>
                  <p className="text-slate-600">
                    Pour la classe <strong>{selectedClasse?.code || selectedClasse?.nom || 'Classe inconnue'}</strong>
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-slate-600 text-center">
                    Choisissez le type de bulletin à générer :
                  </p>
                  <button
                    onClick={() => handleGenerateBulletin('Avant rattrapages')}
                    className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors text-left"
                  >
                    <div className="font-bold mb-1">📋 Avant rattrapages</div>
                    <div className="text-sm">Notes de la session normale</div>
                  </button>
                  <button
                    onClick={() => handleGenerateBulletin('Après rattrapages')}
                    className="w-full px-4 py-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors text-left"
                  >
                    <div className="font-bold mb-1">✅ Après rattrapages</div>
                    <div className="text-sm">Notes finales après rattrapages</div>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowGenerateModal(false)
                    setSelectedClasse(null)
                  }}
                  className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default PublierBulletinsView
