import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGraduationCap, faSave, faUpload, faArrowLeft, faFileExcel, faCheck, faHistory, faEye, faTrash, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAlert } from '../../contexts/AlertContext'

const AjouterNotesView = () => {
  const { showAlert } = useAlert()
  
  // États pour la navigation multi-étapes
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  
  // État pour le fichier Excel
  const [excelFile, setExcelFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  
  // État pour l'historique
  const [showHistory, setShowHistory] = useState(false)
  const [notesHistory, setNotesHistory] = useState([
    {
      id: 1,
      filiere: 'GI',
      niveau: 'L2',
      classe: 'GI-L2-A',
      module: 'Base de données',
      fileName: 'notes_bd_l2a.xlsx',
      dateImport: '2024-11-20',
      heureImport: '14:30',
      nombreEtudiants: 25,
      moyenneClasse: 13.2,
      status: 'Importé'
    },
    {
      id: 2,
      filiere: 'RT',
      niveau: 'L1',
      classe: 'RT-L1-B',
      module: 'Électronique',
      fileName: 'notes_electronique_l1b.xlsx',
      dateImport: '2024-11-18',
      heureImport: '09:15',
      nombreEtudiants: 22,
      moyenneClasse: 11.8,
      status: 'Importé'
    },
    {
      id: 3,
      filiere: 'GI',
      niveau: 'L3',
      classe: 'GI-L3-A',
      module: 'Génie logiciel',
      fileName: 'notes_gl_l3a.xlsx',
      dateImport: '2024-11-15',
      heureImport: '16:45',
      nombreEtudiants: 28,
      moyenneClasse: 14.5,
      status: 'Importé'
    },
    {
      id: 4,
      filiere: 'GI',
      niveau: 'L1',
      classe: 'GI-L1-A',
      module: 'Algorithmique',
      fileName: 'notes_algo_l1a.xlsx',
      dateImport: '2024-11-12',
      heureImport: '11:20',
      nombreEtudiants: 30,
      moyenneClasse: 12.7,
      status: 'Importé'
    },
    {
      id: 5,
      filiere: 'RT',
      niveau: 'L3',
      classe: 'RT-L3-B',
      module: 'Sécurité réseaux',
      fileName: 'notes_secu_l3b.xlsx',
      dateImport: '2024-11-10',
      heureImport: '13:10',
      nombreEtudiants: 24,
      moyenneClasse: 15.1,
      status: 'Importé'
    }
  ])

  // Données statiques
  const filieres = ['GI', 'RT']
  const niveaux = ['L1', 'L2', 'L3']
  
  const classesByFiliere = {
    'GI': {
      'L1': ['GI-L1-A', 'GI-L1-B'],
      'L2': ['GI-L2-A', 'GI-L2-B'],
      'L3': ['GI-L3-A', 'GI-L3-B']
    },
    'RT': {
      'L1': ['RT-L1-A', 'RT-L1-B'],
      'L2': ['RT-L2-A', 'RT-L2-B'],
      'L3': ['RT-L3-A', 'RT-L3-B']
    }
  }

  const modulesByFiliere = {
    'GI': {
      'L1': ['Algorithmique', 'Mathématiques I', 'Système d\'exploitation', 'Anglais I'],
      'L2': ['Base de données', 'Programmation web', 'Réseaux I', 'Anglais II'],
      'L3': ['Génie logiciel', 'Intelligence artificielle', 'Sécurité informatique', 'Projet']
    },
    'RT': {
      'L1': ['Électronique', 'Mathématiques I', 'Télécommunications', 'Anglais I'],
      'L2': ['Réseaux avancés', 'Protocoles', 'Administration système', 'Anglais II'],
      'L3': ['Sécurité réseaux', 'Cloud computing', 'IoT', 'Projet']
    }
  }

  // Gestionnaires pour la navigation
  const handleFiliereSelect = (filiere) => {
    setSelectedFiliere(filiere)
    setSelectedNiveau('')
    setSelectedClasse('')
    setSelectedModule('')
    setCurrentStep(2)
  }

  const handleNiveauSelect = (niveau) => {
    setSelectedNiveau(niveau)
    setSelectedClasse('')
    setSelectedModule('')
    setCurrentStep(3)
  }

  const handleClasseSelect = (classe) => {
    setSelectedClasse(classe)
    setSelectedModule('')
    setCurrentStep(4)
  }

  const handleModuleSelect = (module) => {
    setSelectedModule(module)
    setCurrentStep(5)
  }

  // Gestionnaire pour l'upload du fichier Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setExcelFile(file)
        setUploadStatus('Fichier sélectionné')
      } else {
        showAlert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)', 'error')
        setExcelFile(null)
        setUploadStatus('')
      }
    }
  }

  const handleSubmitNotes = () => {
    if (!excelFile) {
      showAlert('Veuillez sélectionner un fichier Excel', 'error')
      return
    }

    // Simulation du traitement du fichier
    setUploadStatus('Traitement en cours...')
    
    setTimeout(() => {
      setUploadStatus('Terminé')
      
      // Ajouter à l'historique
      const newHistoryEntry = {
        id: Date.now(),
        filiere: selectedFiliere,
        niveau: selectedNiveau,
        classe: selectedClasse,
        module: selectedModule,
        fileName: excelFile.name,
        dateImport: new Date().toISOString().split('T')[0],
        heureImport: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        nombreEtudiants: Math.floor(Math.random() * 15) + 20, // Simulation
        moyenneClasse: (Math.random() * 8 + 10).toFixed(1), // Simulation entre 10 et 18
        status: 'Importé'
      }
      
      setNotesHistory(prev => [newHistoryEntry, ...prev])
      showAlert(`Notes importées avec succès pour ${selectedClasse} - ${selectedModule}`, 'success')
      
      // Reset après succès
      setTimeout(() => {
        resetForm()
      }, 2000)
    }, 2000)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedFiliere('')
    setSelectedNiveau('')
    setSelectedClasse('')
    setSelectedModule('')
    setExcelFile(null)
    setUploadStatus('')
  }

  const handleDeleteHistoryEntry = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée de l\'historique ?')) {
      setNotesHistory(prev => prev.filter(entry => entry.id !== id))
      showAlert('Entrée supprimée de l\'historique', 'success')
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setNotesHistory([])
      showAlert('Historique effacé', 'success')
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      if (currentStep === 2) {
        setSelectedFiliere('')
      } else if (currentStep === 3) {
        setSelectedNiveau('')
      } else if (currentStep === 4) {
        setSelectedClasse('')
      } else if (currentStep === 5) {
        setSelectedModule('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName="Dr. Jean KAMDEM" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {currentStep > 1 && (
                <button
                  onClick={goBack}
                  className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Retour
                </button>
              )}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                  Ajouter des notes
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Importez les notes des étudiants via un fichier Excel
                </p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  showHistory 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                {showHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
              </button>
            </div>

            {/* Indicateur d'étapes */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {step}
                    </div>
                    {step < 5 && (
                      <div className={`w-12 h-0.5 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Labels des étapes */}
            <div className="flex justify-center mb-8">
              <div className="grid grid-cols-5 gap-4 text-xs text-center max-w-2xl">
                <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-slate-500'}>Filière</span>
                <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-slate-500'}>Niveau</span>
                <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-slate-500'}>Classe</span>
                <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-slate-500'}>Module</span>
                <span className={currentStep >= 5 ? 'text-blue-600 font-medium' : 'text-slate-500'}>Upload</span>
              </div>
            </div>
          </div>

          {/* Historique des notes ajoutées */}
          {showHistory && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    <FontAwesomeIcon icon={faHistory} className="mr-3 text-blue-600" />
                    Historique des notes ajoutées
                  </h2>
                  {notesHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      Effacer tout
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {notesHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-slate-300 mb-4" />
                    <p className="text-slate-500">Aucun historique d'import de notes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notesHistory.map((entry) => (
                      <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-slate-800">
                                {entry.classe} - {entry.module}
                              </h3>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                {entry.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Filière:</span> {entry.filiere}
                              </div>
                              <div>
                                <span className="font-medium">Niveau:</span> {entry.niveau}
                              </div>
                              <div>
                                <span className="font-medium">Étudiants:</span> {entry.nombreEtudiants}
                              </div>
                              <div>
                                <span className="font-medium">Moyenne:</span> {entry.moyenneClasse}/20
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faFileExcel} className="mr-1 text-green-600" />
                                {entry.fileName}
                              </div>
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                                {entry.dateImport} à {entry.heureImport}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryEntry(entry.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer de l'historique"
                            >
                              <FontAwesomeIcon icon={faTrash} />
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

          {/* Étape 1: Sélection de la filière */}
          {!showHistory && currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {filieres.map((filiere) => (
                  <button
                    key={filiere}
                    onClick={() => handleFiliereSelect(filiere)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">
                        {filiere}
                      </div>
                      <div className="text-sm text-slate-600">
                        {filiere === 'GI' ? 'Génie Informatique' : 'Réseaux et Télécommunications'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Sélection du niveau */}
          {!showHistory && currentStep === 2 && (
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
          )}

          {/* Étape 3: Sélection de la classe */}
          {!showHistory && currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez la classe</h2>
              <p className="text-slate-600 text-center mb-6">
                Filière: <span className="font-medium text-blue-600">{selectedFiliere}</span> | 
                Niveau: <span className="font-medium text-blue-600">{selectedNiveau}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {classesByFiliere[selectedFiliere][selectedNiveau].map((classe) => (
                  <button
                    key={classe}
                    onClick={() => handleClasseSelect(classe)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">
                        {classe}
                      </div>
                      <div className="text-sm text-slate-600">
                        Classe {classe.split('-')[2]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 4: Sélection du module */}
          {!showHistory && currentStep === 4 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez le module</h2>
              <p className="text-slate-600 text-center mb-6">
                Classe: <span className="font-medium text-blue-600">{selectedClasse}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {modulesByFiliere[selectedFiliere][selectedNiveau].map((module) => (
                  <button
                    key={module}
                    onClick={() => handleModuleSelect(module)}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group text-left"
                  >
                    <div className="text-lg font-medium text-slate-800 group-hover:text-blue-600">
                      {module}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 5: Upload du fichier Excel */}
          {!showHistory && currentStep === 5 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Importer le fichier Excel</h2>
              <div className="text-center mb-6">
                <p className="text-slate-600 mb-2">
                  Classe: <span className="font-medium text-blue-600">{selectedClasse}</span> | 
                  Module: <span className="font-medium text-blue-600">{selectedModule}</span>
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {/* Zone de drop pour le fichier */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-green-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    Sélectionnez votre fichier Excel
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Formats acceptés: .xlsx, .xls
                  </p>
                  
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Choisir un fichier
                  </label>
                </div>

                {/* Informations sur le fichier sélectionné */}
                {excelFile && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-green-800">{excelFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(excelFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      {uploadStatus === 'Terminé' && (
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                      )}
                    </div>
                    {uploadStatus && (
                      <p className="text-sm text-green-600 mt-2">{uploadStatus}</p>
                    )}
                  </div>
                )}

                {/* Bouton d'import */}
                {excelFile && uploadStatus !== 'Terminé' && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleSubmitNotes}
                      disabled={uploadStatus === 'Traitement en cours...'}
                      className="flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors mx-auto"
                    >
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {uploadStatus === 'Traitement en cours...' ? 'Traitement...' : 'Importer les notes'}
                    </button>
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Format du fichier Excel :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Colonne A: Matricule de l'étudiant</li>
                    <li>• Colonne B: Nom complet</li>
                    <li>• Colonne C: Note (sur 20)</li>
                    <li>• Première ligne: En-têtes (ignorée)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AjouterNotesView
