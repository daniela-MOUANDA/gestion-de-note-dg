import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt, 
  faPlus, 
  faEdit, 
  faTrash, 
  faArrowLeft,
  faTimes,
  faEye,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'

const GererEmploisTempsView = () => {
  const { showAlert } = useAlert()
  
  // États pour la navigation multi-étapes
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  
  // États pour les emplois du temps
  const [isCreatingEmploi, setIsCreatingEmploi] = useState(false)
  const [showAddCoursModal, setShowAddCoursModal] = useState(false)
  const [showEditCoursModal, setShowEditCoursModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingEmploiId, setEditingEmploiId] = useState(null)
  const [viewingEmploi, setViewingEmploi] = useState(null)
  const [emploiToDelete, setEmploiToDelete] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState({ jour: '', heure: '' })
  const [editingCours, setEditingCours] = useState(null)
  
  const [currentEmploiData, setCurrentEmploiData] = useState({
    dateDebut: '',
    dateFin: '',
    cours: []
  })

  const [newCours, setNewCours] = useState({
    module: '',
    enseignant: '',
    salle: '',
    type: 'Cours'
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

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const heures = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

  const [emploisTempsData, setEmploisTempsData] = useState({
    'GI-L1-A': [],
    'GI-L1-B': [],
    'GI-L2-A': [],
    'GI-L2-B': [],
    'GI-L3-A': [
      {
        id: 1,
        dateDebut: '2024-01-15',
        dateFin: '2024-05-15',
        cours: [
          { id: 1, jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', module: 'Génie logiciel', enseignant: 'Dr. MBENG', salle: 'A101', type: 'Cours' },
          { id: 2, jour: 'Mardi', heureDebut: '14:00', heureFin: '16:00', module: 'Intelligence artificielle', enseignant: 'Dr. NKOMO', salle: 'B205', type: 'Cours' },
          { id: 3, jour: 'Mercredi', heureDebut: '08:00', heureFin: '10:00', module: 'Génie logiciel', enseignant: 'Dr. MBENG', salle: 'Lab 1', type: 'Devoir' }
        ]
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
    if (isCreatingEmploi) {
      if (window.confirm('Voulez-vous quitter sans enregistrer ? Tous les cours ajoutés seront perdus.')) {
        setIsCreatingEmploi(false)
        setEditingEmploiId(null)
        setCurrentEmploiData({ dateDebut: '', dateFin: '', cours: [] })
      }
    } else if (currentStep === 4) {
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

  // Gestionnaires d'emplois du temps
  const handleStartCreateEmploi = () => {
    setIsCreatingEmploi(true)
    setEditingEmploiId(null)
    setCurrentEmploiData({ dateDebut: '', dateFin: '', cours: [] })
  }

  const handleStartEditEmploi = (emploi) => {
    setIsCreatingEmploi(true)
    setEditingEmploiId(emploi.id)
    setCurrentEmploiData({ ...emploi })
  }

  const handleOpenAddCoursModal = (jour, heure) => {
    setSelectedSlot({ jour, heure })
    setNewCours({
      module: '',
      enseignant: '',
      salle: '',
      type: 'Cours'
    })
    setShowAddCoursModal(true)
  }

  const handleAddCours = () => {
    if (!newCours.module) {
      showAlert('Veuillez renseigner le module', 'error')
      return
    }

    const heureIndex = heures.indexOf(selectedSlot.heure)
    const heureFin = heures[heureIndex + 1] || '20:00'

    const cours = {
      id: Date.now(),
      jour: selectedSlot.jour,
      heureDebut: selectedSlot.heure,
      heureFin: heureFin,
      ...newCours
    }

    setCurrentEmploiData(prev => ({
      ...prev,
      cours: [...prev.cours, cours]
    }))

    setShowAddCoursModal(false)
    showAlert('Cours ajouté à l\'emploi du temps', 'success')
  }

  const handleEditCours = (cours) => {
    setEditingCours({ ...cours })
    setShowEditCoursModal(true)
  }

  const handleUpdateCours = () => {
    setCurrentEmploiData(prev => ({
      ...prev,
      cours: prev.cours.map(c => c.id === editingCours.id ? editingCours : c)
    }))
    setEditingCours(null)
    setShowEditCoursModal(false)
    showAlert('Cours modifié', 'success')
  }

  const handleDeleteCours = (coursId) => {
    if (window.confirm('Supprimer ce cours ?')) {
      setCurrentEmploiData(prev => ({
        ...prev,
        cours: prev.cours.filter(c => c.id !== coursId)
      }))
      showAlert('Cours supprimé', 'success')
    }
  }

  const handleSaveEmploiTemps = () => {
    if (!currentEmploiData.dateDebut || !currentEmploiData.dateFin) {
      showAlert('Veuillez renseigner les dates de début et fin', 'error')
      return
    }

    if (currentEmploiData.cours.length === 0) {
      showAlert('Veuillez ajouter au moins un cours', 'error')
      return
    }

    if (editingEmploiId) {
      // Mise à jour
      setEmploisTempsData(prev => ({
        ...prev,
        [selectedClasse]: prev[selectedClasse].map(e =>
          e.id === editingEmploiId ? { ...currentEmploiData, id: editingEmploiId } : e
        )
      }))
      showAlert('Emploi du temps modifié avec succès !', 'success')
    } else {
      // Création
      const emploi = {
        id: Date.now(),
        ...currentEmploiData
      }
      setEmploisTempsData(prev => ({
        ...prev,
        [selectedClasse]: [...(prev[selectedClasse] || []), emploi]
      }))
      showAlert('Emploi du temps créé avec succès !', 'success')
    }

    setIsCreatingEmploi(false)
    setEditingEmploiId(null)
    setCurrentEmploiData({ dateDebut: '', dateFin: '', cours: [] })
  }

  const handleDeleteEmploi = (emploi) => {
    setEmploiToDelete(emploi)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteEmploi = () => {
    if (!emploiToDelete) return

    setEmploisTempsData(prev => ({
      ...prev,
      [selectedClasse]: prev[selectedClasse].filter(e => e.id !== emploiToDelete.id)
    }))

    setEmploiToDelete(null)
    setShowDeleteConfirm(false)
    showAlert('Emploi du temps supprimé avec succès !', 'success')
  }

  const handleViewEmploi = (emploi) => {
    setViewingEmploi(emploi)
    setShowViewModal(true)
  }

  const getCoursForSlot = (jour, heure) => {
    return currentEmploiData.cours.filter(c => c.jour === jour && c.heureDebut === heure)
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les emplois du temps
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Créez et gérez les emplois du temps des classes
              </p>
            </div>

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
                Emplois du temps - {selectedFiliere}
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
                Emplois du temps - {selectedFiliere} {selectedNiveau}
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
                        {(emploisTempsData[classe] || []).length} emploi{(emploisTempsData[classe] || []).length > 1 ? 's' : ''} du temps
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

  // Étape 4: Gestion des emplois du temps de la classe
  const emplois = emploisTempsData[selectedClasse] || []

  // Vue de création/édition avec grille interactive
  if (isCreatingEmploi) {
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
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    {editingEmploiId ? 'Modifier' : 'Créer'} l'emploi du temps - {selectedClasse}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    Cliquez sur les "+" pour ajouter des cours aux créneaux
                  </p>
                </div>
                <button
                  onClick={handleSaveEmploiTemps}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Enregistrer l'emploi du temps
                </button>
              </div>
            </div>

            {/* Période */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={currentEmploiData.dateDebut}
                      onChange={(e) => setCurrentEmploiData(prev => ({ ...prev, dateDebut: e.target.value }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={currentEmploiData.dateFin}
                      onChange={(e) => setCurrentEmploiData(prev => ({ ...prev, dateFin: e.target.value }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  {currentEmploiData.cours.length} cours ajouté{currentEmploiData.cours.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Grille hebdomadaire */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-600">
                      <th className="border border-slate-300 p-3 text-white font-semibold text-sm">Horaires</th>
                      {jours.map(jour => (
                        <th key={jour} className="border border-slate-300 p-3 text-white font-semibold text-sm">
                          {jour}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heures.map((heure, index) => (
                      <tr key={heure}>
                        <td className="border border-slate-300 p-3 bg-slate-50 font-medium text-sm text-slate-700 text-center">
                          {heure} - {heures[index + 1] || '20:00'}
                        </td>
                        {jours.map(jour => {
                          const coursInSlot = getCoursForSlot(jour, heure)
                          return (
                            <td key={jour} className="border border-slate-300 p-2 align-top min-w-[150px]">
                              {coursInSlot.length === 0 ? (
                                <button
                                  onClick={() => handleOpenAddCoursModal(jour, heure)}
                                  className="w-full h-20 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-slate-200 hover:border-blue-400"
                                >
                                  <FontAwesomeIcon icon={faPlus} className="text-2xl" />
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  {coursInSlot.map(cours => (
                                    <div
                                      key={cours.id}
                                      className={`p-2 rounded-lg text-xs ${
                                        cours.type === 'Cours' 
                                          ? 'bg-blue-100 border border-blue-300' 
                                          : 'bg-orange-100 border border-orange-300'
                                      }`}
                                    >
                                      <div className="font-bold text-slate-800 mb-1">{cours.module}</div>
                                      <div className="text-slate-600">👨‍🏫 {cours.enseignant || 'Non assigné'}</div>
                                      <div className="text-slate-600">🏫 {cours.salle || 'Non assignée'}</div>
                                      <div className="flex gap-1 mt-2">
                                        <button
                                          onClick={() => handleEditCours(cours)}
                                          className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                                        >
                                          <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCours(cours.id)}
                                          className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => handleOpenAddCoursModal(jour, heure)}
                                    className="w-full py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  >
                                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                    Ajouter
                                  </button>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* Modal d'ajout de cours */}
        {showAddCoursModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAddCoursModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
              
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Ajouter un cours
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {selectedSlot.jour} • {selectedSlot.heure} - {heures[heures.indexOf(selectedSlot.heure) + 1] || '20:00'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Module *</label>
                  <input
                    type="text"
                    value={newCours.module}
                    onChange={(e) => setNewCours(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Base de données"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Enseignant</label>
                  <input
                    type="text"
                    value={newCours.enseignant}
                    onChange={(e) => setNewCours(prev => ({ ...prev, enseignant: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Dr. MBENG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Salle</label>
                  <input
                    type="text"
                    value={newCours.salle}
                    onChange={(e) => setNewCours(prev => ({ ...prev, salle: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: A101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={newCours.type}
                    onChange={(e) => setNewCours(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cours">Cours</option>
                    <option value="Devoir">Devoir</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddCoursModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCours}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition de cours */}
        {showEditCoursModal && editingCours && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowEditCoursModal(false)
                  setEditingCours(null)
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
              
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Modifier le cours
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {editingCours.jour} • {editingCours.heureDebut} - {editingCours.heureFin}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Module *</label>
                  <input
                    type="text"
                    value={editingCours.module}
                    onChange={(e) => setEditingCours(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Enseignant</label>
                  <input
                    type="text"
                    value={editingCours.enseignant}
                    onChange={(e) => setEditingCours(prev => ({ ...prev, enseignant: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Salle</label>
                  <input
                    type="text"
                    value={editingCours.salle}
                    onChange={(e) => setEditingCours(prev => ({ ...prev, salle: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={editingCours.type}
                    onChange={(e) => setEditingCours(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cours">Cours</option>
                    <option value="Devoir">Devoir</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditCoursModal(false)
                    setEditingCours(null)
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateCours}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vue principale: Liste des emplois du temps
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                  Emplois du temps - {selectedClasse}
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {emplois.length} emploi{emplois.length > 1 ? 's' : ''} du temps
                </p>
              </div>
              <button
                onClick={handleStartCreateEmploi}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Ajouter un emploi du temps
              </button>
            </div>
          </div>

          {/* Liste des emplois du temps */}
          {emplois.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun emploi du temps créé pour cette classe</p>
              <button
                onClick={handleStartCreateEmploi}
                className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Créer le premier emploi du temps
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {emplois.map((emploi) => (
                <div key={emploi.id} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Emploi du temps - {selectedClasse}
                      </h3>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">📅 Période:</span> {new Date(emploi.dateDebut).toLocaleDateString('fr-FR')} - {new Date(emploi.dateFin).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <span className="font-medium">📚 Cours:</span> {emploi.cours.length}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewEmploi(emploi)
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEditEmploi(emploi)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEmploi(emploi)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  {/* Aperçu des cours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {emploi.cours.slice(0, 6).map((cours) => (
                      <div key={cours.id} className={`p-2 rounded-lg text-sm ${
                        cours.type === 'Cours' ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
                      }`}>
                        <div className="font-medium text-slate-800">{cours.jour} {cours.heureDebut}-{cours.heureFin}</div>
                        <div className="text-slate-600 text-xs">{cours.module}</div>
                      </div>
                    ))}
                    {emploi.cours.length > 6 && (
                      <div className="p-2 rounded-lg text-sm bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <span className="text-slate-600">+{emploi.cours.length - 6} cours</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de visualisation */}
          {showViewModal && viewingEmploi && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingEmploi(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Emploi du temps - {selectedClasse}</h2>
                <p className="text-slate-600 mb-6">
                  Période: {new Date(viewingEmploi.dateDebut).toLocaleDateString('fr-FR')} - {new Date(viewingEmploi.dateFin).toLocaleDateString('fr-FR')}
                </p>

                {/* Grille de visualisation */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-600">
                        <th className="border border-slate-300 p-3 text-white font-semibold text-sm">Horaires</th>
                        {jours.map(jour => (
                          <th key={jour} className="border border-slate-300 p-3 text-white font-semibold text-sm">
                            {jour}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heures.map((heure, index) => (
                        <tr key={heure}>
                          <td className="border border-slate-300 p-3 bg-slate-50 font-medium text-sm text-slate-700 text-center">
                            {heure} - {heures[index + 1] || '20:00'}
                          </td>
                          {jours.map(jour => {
                            const coursInSlot = viewingEmploi.cours.filter(c => c.jour === jour && c.heureDebut === heure)
                            return (
                              <td key={jour} className="border border-slate-300 p-2 align-top">
                                {coursInSlot.length === 0 ? (
                                  <div className="text-center text-slate-400 text-xs py-4">Aucun</div>
                                ) : (
                                  <div className="space-y-2">
                                    {coursInSlot.map(cours => (
                                      <div
                                        key={cours.id}
                                        className={`p-2 rounded-lg text-xs ${
                                          cours.type === 'Cours' 
                                            ? 'bg-blue-100 border border-blue-300' 
                                            : 'bg-orange-100 border border-orange-300'
                                        }`}
                                      >
                                        <div className="font-bold text-slate-800">{cours.module}</div>
                                        <div className="text-slate-600 mt-1">👨‍🏫 {cours.enseignant}</div>
                                        <div className="text-slate-600">🏫 {cours.salle}</div>
                                        <div className="mt-1">
                                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                                            cours.type === 'Cours' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'
                                          }`}>
                                            {cours.type}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmation de suppression */}
          {showDeleteConfirm && emploiToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setEmploiToDelete(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faTrash} className="text-red-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Supprimer l'emploi du temps</h2>
                  <p className="text-slate-600">
                    Êtes-vous sûr de vouloir supprimer cet emploi du temps ? Cette action est irréversible.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setEmploiToDelete(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteEmploi}
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

export default GererEmploisTempsView
