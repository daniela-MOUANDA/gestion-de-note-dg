import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarCheck, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch, 
  faCheckCircle,
  faArrowLeft,
  faTimes,
  faHistory,
  faEye
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAlert } from '../../contexts/AlertContext'

const GererRattrapagesView = () => {
  const { showAlert } = useAlert()
  
  // États pour la navigation multi-étapes
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  
  // États pour les rattrapages
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingRattrapage, setEditingRattrapage] = useState(null)
  const [rattrapageToDelete, setRattrapageToDelete] = useState(null)
  
  const [newRattrapage, setNewRattrapage] = useState({
    module: '',
    enseignant: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    salle: '',
    type: 'Écrit'
  })

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

  const [rattrapagesData, setRattrapagesData] = useState({
    'GI-L1-A': [],
    'GI-L1-B': [],
    'GI-L2-A': [
      {
        id: 1,
        module: 'Base de données',
        enseignant: 'Dr. MBENG',
        date: '2024-12-15',
        heureDebut: '08:00',
        heureFin: '10:00',
        salle: 'A101',
        type: 'Écrit',
        filiere: 'GI',
        niveau: 'L2',
        classe: 'GI-L2-A'
      }
    ],
    'GI-L2-B': [],
    'GI-L3-A': [
      {
        id: 2,
        module: 'Génie logiciel',
        enseignant: 'Dr. NKOMO',
        date: '2024-12-18',
        heureDebut: '14:00',
        heureFin: '16:00',
        salle: 'B205',
        type: 'Pratique',
        filiere: 'GI',
        niveau: 'L3',
        classe: 'GI-L3-A'
      }
    ],
    'GI-L3-B': [],
    'RT-L1-A': [],
    'RT-L1-B': [],
    'RT-L2-A': [],
    'RT-L2-B': [],
    'RT-L3-A': [],
    'RT-L3-B': []
  })

  // Historique des rattrapages récents
  const [recentRattrapages, setRecentRattrapages] = useState([
    {
      id: 1,
      module: 'Base de données',
      enseignant: 'Dr. MBENG',
      date: '2024-12-15',
      heureDebut: '08:00',
      heureFin: '10:00',
      salle: 'A101',
      type: 'Écrit',
      filiere: 'GI',
      niveau: 'L2',
      classe: 'GI-L2-A'
    },
    {
      id: 2,
      module: 'Génie logiciel',
      enseignant: 'Dr. NKOMO',
      date: '2024-12-18',
      heureDebut: '14:00',
      heureFin: '16:00',
      salle: 'B205',
      type: 'Pratique',
      filiere: 'GI',
      niveau: 'L3',
      classe: 'GI-L3-A'
    }
  ])

  // Gestionnaires de navigation
  const handleFiliereSelect = (filiere) => {
    setSelectedFiliere(filiere)
    setSelectedNiveau('')
    setSelectedClasse('')
    setCurrentStep(2)
  }

  const handleNiveauSelect = (niveau) => {
    setSelectedNiveau(niveau)
    setSelectedClasse('')
    setCurrentStep(3)
  }

  const handleClasseSelect = (classe) => {
    setSelectedClasse(classe)
    setCurrentStep(4)
  }

  const handleBack = () => {
    if (currentStep === 4) {
      setSelectedClasse('')
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setSelectedNiveau('')
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setSelectedFiliere('')
      setCurrentStep(1)
    }
  }

  // Gestionnaires de rattrapages
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewRattrapage(prev => ({ ...prev, [name]: value }))
  }

  const handleAddRattrapage = () => {
    if (!newRattrapage.module || !newRattrapage.date || !newRattrapage.heureDebut || !newRattrapage.heureFin) {
      showAlert('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    const rattrapage = {
      id: Date.now(),
      ...newRattrapage,
      filiere: selectedFiliere,
      niveau: selectedNiveau,
      classe: selectedClasse
    }

    setRattrapagesData(prev => ({
      ...prev,
      [selectedClasse]: [...(prev[selectedClasse] || []), rattrapage]
    }))

    // Ajouter à l'historique récent
    setRecentRattrapages(prev => [rattrapage, ...prev.slice(0, 4)])

    setNewRattrapage({
      module: '',
      enseignant: '',
      date: '',
      heureDebut: '',
      heureFin: '',
      salle: '',
      type: 'Écrit'
    })
    setShowAddModal(false)
    showAlert('Rattrapage programmé avec succès !', 'success')
  }

  const handleEditRattrapage = (rattrapage) => {
    setEditingRattrapage({ ...rattrapage })
    setShowEditModal(true)
  }

  const handleUpdateRattrapage = () => {
    if (!editingRattrapage) return

    setRattrapagesData(prev => ({
      ...prev,
      [selectedClasse]: prev[selectedClasse].map(r =>
        r.id === editingRattrapage.id ? editingRattrapage : r
      )
    }))

    // Mettre à jour dans l'historique récent aussi
    setRecentRattrapages(prev =>
      prev.map(r => r.id === editingRattrapage.id ? editingRattrapage : r)
    )

    setEditingRattrapage(null)
    setShowEditModal(false)
    showAlert('Rattrapage modifié avec succès !', 'success')
  }

  const handleDeleteRattrapage = (rattrapage) => {
    setRattrapageToDelete(rattrapage)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteRattrapage = () => {
    if (!rattrapageToDelete) return

    setRattrapagesData(prev => ({
      ...prev,
      [selectedClasse]: prev[selectedClasse].filter(r => r.id !== rattrapageToDelete.id)
    }))

    setRattrapageToDelete(null)
    setShowDeleteConfirm(false)
    showAlert('Rattrapage supprimé avec succès !', 'success')
  }

  const handleRemoveFromHistory = (id) => {
    if (window.confirm('Retirer ce rattrapage de l\'historique ? (Il restera disponible dans sa classe)')) {
      setRecentRattrapages(prev => prev.filter(r => r.id !== id))
      showAlert('Retiré de l\'historique', 'success')
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer l\'historique ? Les rattrapages resteront disponibles dans leurs classes respectives.')) {
      setRecentRattrapages([])
      showAlert('Historique effacé', 'success')
    }
  }

  const handleClickRecentRattrapage = (rattrapage) => {
    setSelectedFiliere(rattrapage.filiere)
    setSelectedNiveau(rattrapage.niveau)
    setSelectedClasse(rattrapage.classe)
    setCurrentStep(4)
    setTimeout(() => {
      setEditingRattrapage({ ...rattrapage })
      setShowEditModal(true)
    }, 100)
  }

  // Étape 1: Sélection de la filière
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les rattrapages
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Programmez et gérez les sessions de rattrapage
              </p>
            </div>

            {/* Historique des rattrapages récents */}
            {recentRattrapages.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                      <FontAwesomeIcon icon={faHistory} className="mr-3 text-blue-600" />
                      Rattrapages récemment programmés
                    </h2>
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      Effacer l'historique
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {recentRattrapages.slice(0, 5).map((rattrapage) => (
                      <div
                        key={rattrapage.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleClickRecentRattrapage(rattrapage)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-800">
                                {rattrapage.classe} - {rattrapage.module}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                rattrapage.type === 'Écrit' ? 'bg-blue-100 text-blue-700' :
                                rattrapage.type === 'Oral' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {rattrapage.type}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                              <div>📅 {rattrapage.date}</div>
                              <div>🕐 {rattrapage.heureDebut} - {rattrapage.heureFin}</div>
                              <div>🏫 {rattrapage.salle}</div>
                              <div>👨‍🏫 {rattrapage.enseignant}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFromHistory(rattrapage.id)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Retirer de l'historique (le rattrapage reste dans la classe)"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
          </main>
        </div>
      </div>
    )
  }

  // Étape 2: Sélection du niveau
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les rattrapages - {selectedFiliere}
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

  // Étape 3: Sélection de la classe
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les rattrapages - {selectedFiliere} {selectedNiveau}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

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
                        {(rattrapagesData[classe] || []).length} rattrapage{(rattrapagesData[classe] || []).length > 1 ? 's' : ''} programmé{(rattrapagesData[classe] || []).length > 1 ? 's' : ''}
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

  // Étape 4: Gestion des rattrapages de la classe
  const rattrapages = rattrapagesData[selectedClasse] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName="Dr. Jean KAMDEM" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                  Rattrapages - {selectedClasse}
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {rattrapages.length} rattrapage{rattrapages.length > 1 ? 's' : ''} programmé{rattrapages.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Programmer un rattrapage
              </button>
            </div>
          </div>

          {/* Liste des rattrapages */}
          {rattrapages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun rattrapage programmé pour cette classe</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Programmer le premier rattrapage
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rattrapages.map((rattrapage) => (
                <div key={rattrapage.id} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-800">{rattrapage.module}</h3>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          rattrapage.type === 'Écrit' ? 'bg-blue-100 text-blue-700' :
                          rattrapage.type === 'Oral' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {rattrapage.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">👨‍🏫 Enseignant:</span>
                          {rattrapage.enseignant}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">📅 Date:</span>
                          {new Date(rattrapage.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">🕐 Horaires:</span>
                          {rattrapage.heureDebut} - {rattrapage.heureFin}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">🏫 Salle:</span>
                          {rattrapage.salle}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditRattrapage(rattrapage)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteRattrapage(rattrapage)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal d'ajout de rattrapage */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewRattrapage({
                      module: '',
                      enseignant: '',
                      date: '',
                      heureDebut: '',
                      heureFin: '',
                      salle: '',
                      type: 'Écrit'
                    })
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Programmer un rattrapage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Module *</label>
                    <input
                      type="text"
                      name="module"
                      value={newRattrapage.module}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Base de données"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enseignant</label>
                    <input
                      type="text"
                      name="enseignant"
                      value={newRattrapage.enseignant}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Dr. MBENG"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={newRattrapage.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      name="type"
                      value={newRattrapage.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Écrit">Écrit</option>
                      <option value="Oral">Oral</option>
                      <option value="Pratique">Pratique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure de début *</label>
                    <input
                      type="time"
                      name="heureDebut"
                      value={newRattrapage.heureDebut}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure de fin *</label>
                    <input
                      type="time"
                      name="heureFin"
                      value={newRattrapage.heureFin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Salle</label>
                    <input
                      type="text"
                      name="salle"
                      value={newRattrapage.salle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: A101"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewRattrapage({
                        module: '',
                        enseignant: '',
                        date: '',
                        heureDebut: '',
                        heureFin: '',
                        salle: '',
                        type: 'Écrit'
                      })
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddRattrapage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Programmer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal d'édition de rattrapage */}
          {showEditModal && editingRattrapage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRattrapage(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Modifier le rattrapage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Module *</label>
                    <input
                      type="text"
                      value={editingRattrapage.module}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, module: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enseignant</label>
                    <input
                      type="text"
                      value={editingRattrapage.enseignant}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, enseignant: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={editingRattrapage.date}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      value={editingRattrapage.type}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Écrit">Écrit</option>
                      <option value="Oral">Oral</option>
                      <option value="Pratique">Pratique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure de début *</label>
                    <input
                      type="time"
                      value={editingRattrapage.heureDebut}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, heureDebut: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Heure de fin *</label>
                    <input
                      type="time"
                      value={editingRattrapage.heureFin}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, heureFin: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Salle</label>
                    <input
                      type="text"
                      value={editingRattrapage.salle}
                      onChange={(e) => setEditingRattrapage({ ...editingRattrapage, salle: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingRattrapage(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateRattrapage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmation de suppression */}
          {showDeleteConfirm && rattrapageToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setRattrapageToDelete(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faTrash} className="text-red-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Supprimer le rattrapage</h2>
                  <p className="text-slate-600">
                    Êtes-vous sûr de vouloir supprimer le rattrapage de <strong>{rattrapageToDelete.module}</strong> ?
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setRattrapageToDelete(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteRattrapage}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default GererRattrapagesView
