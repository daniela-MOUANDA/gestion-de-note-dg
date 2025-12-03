import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, 
  faPlus, 
  faDownload, 
  faTrash, 
  faEye,
  faArrowLeft,
  faTimes,
  faUpload,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAlert } from '../../contexts/AlertContext'

const PublierUnitesEnseignementView = () => {
  const { showAlert } = useAlert()
  
  // États pour la navigation multi-étapes
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  
  // États pour les documents
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)
  
  const [newDocument, setNewDocument] = useState({
    titre: '',
    description: '',
    fichier: null
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

  // Documents par classe
  const [documentsData, setDocumentsData] = useState({
    'GI-L1-A': [],
    'GI-L1-B': [],
    'GI-L2-A': [],
    'GI-L2-B': [],
    'GI-L3-A': [
      {
        id: 1,
        titre: 'Maquette pédagogique S5',
        description: 'Maquette pédagogique complète du semestre 5',
        nomFichier: 'maquette_s5_gi_l3a.pdf',
        taille: '2.4 MB',
        datePublication: '2024-11-15',
        publiePar: 'Dr. Jean KAMDEM',
        filiere: 'GI',
        niveau: 'L3',
        classe: 'GI-L3-A'
      },
      {
        id: 2,
        titre: 'Situation semestrielle S5',
        description: 'Situation des notes du semestre 5',
        nomFichier: 'situation_s5_gi_l3a.pdf',
        taille: '1.8 MB',
        datePublication: '2024-11-10',
        publiePar: 'Dr. Jean KAMDEM',
        filiere: 'GI',
        niveau: 'L3',
        classe: 'GI-L3-A'
      }
    ],
    'GI-L3-B': [
      {
        id: 3,
        titre: 'UE du S5',
        description: 'Liste des unités d\'enseignement du semestre 5',
        nomFichier: 'ue_s5_gi_l3b.pdf',
        taille: '1.2 MB',
        datePublication: '2024-11-12',
        publiePar: 'Dr. Jean KAMDEM',
        filiere: 'GI',
        niveau: 'L3',
        classe: 'GI-L3-B'
      }
    ],
    'RT-L1-A': [],
    'RT-L1-B': [],
    'RT-L2-A': [
      {
        id: 4,
        titre: 'Note de service - Examens S3',
        description: 'Informations importantes concernant les examens du S3',
        nomFichier: 'note_service_examens_s3.pdf',
        taille: '850 KB',
        datePublication: '2024-11-08',
        publiePar: 'Dr. Jean KAMDEM',
        filiere: 'RT',
        niveau: 'L2',
        classe: 'RT-L2-A'
      }
    ],
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

  // Gestionnaires de documents
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        showAlert('Seuls les fichiers PDF sont acceptés', 'error')
        e.target.value = ''
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10 MB
        showAlert('Le fichier ne doit pas dépasser 10 MB', 'error')
        e.target.value = ''
        return
      }
      setNewDocument(prev => ({ ...prev, fichier: file }))
    }
  }

  const handlePublishDocument = () => {
    if (!newDocument.titre || !newDocument.fichier) {
      showAlert('Veuillez remplir le titre et sélectionner un fichier PDF', 'error')
      return
    }

    const document = {
      id: Date.now(),
      titre: newDocument.titre,
      description: newDocument.description,
      nomFichier: newDocument.fichier.name,
      taille: `${(newDocument.fichier.size / (1024 * 1024)).toFixed(2)} MB`,
      datePublication: new Date().toISOString().split('T')[0],
      publiePar: 'Dr. Jean KAMDEM',
      filiere: selectedFiliere,
      niveau: selectedNiveau,
      classe: selectedClasse
    }

    setDocumentsData(prev => ({
      ...prev,
      [selectedClasse]: [...(prev[selectedClasse] || []), document]
    }))

    setNewDocument({ titre: '', description: '', fichier: null })
    setShowAddModal(false)
    showAlert('Document publié avec succès !', 'success')
  }

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      setDocumentsData(prev => ({
        ...prev,
        [selectedClasse]: prev[selectedClasse].filter(d => d.id !== documentId)
      }))
      showAlert('Document supprimé', 'success')
    }
  }

  const handleViewDocument = (document) => {
    setViewingDocument(document)
    setShowViewModal(true)
  }

  const handleDownloadDocument = (document) => {
    showAlert(`Téléchargement de ${document.nomFichier}`, 'info')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Étape 1: Sélection de la filière
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Publier documents
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Publiez des documents académiques pour les classes (maquettes pédagogiques, situations, UE, notes de service)
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
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Documents - {selectedFiliere}
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
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Documents - {selectedFiliere} {selectedNiveau}
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
                        {(documentsData[classe] || []).length} document{(documentsData[classe] || []).length > 1 ? 's' : ''} publié{(documentsData[classe] || []).length > 1 ? 's' : ''}
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

  // Étape 4: Gestion des documents de la classe
  const documents = documentsData[selectedClasse] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName="Dr. Jean KAMDEM" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
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
                  Documents - {selectedClasse}
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {documents.length} document{documents.length > 1 ? 's' : ''} publié{documents.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Publier un document
              </button>
            </div>
          </div>

          {/* Liste des documents */}
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200">
              <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun document publié pour cette classe</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Publier le premier document
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faFilePdf} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{document.titre}</h3>
                          <p className="text-sm text-slate-600">{document.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">📄 Fichier:</span> {document.nomFichier}
                        </div>
                        <div>
                          <span className="font-medium">💾 Taille:</span> {document.taille}
                        </div>
                        <div>
                          <span className="font-medium">📅 Publié le:</span> {new Date(document.datePublication).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <span className="font-medium">👨‍💼 Par:</span> {document.publiePar}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewDocument(document)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(document)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
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

          {/* Modal de publication de document */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewDocument({ titre: '', description: '', fichier: null })
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Publier un document</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Titre du document *</label>
                    <input
                      type="text"
                      value={newDocument.titre}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, titre: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Maquette pédagogique S5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={newDocument.description}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description du document..."
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fichier PDF *</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <FontAwesomeIcon icon={faUpload} className="text-3xl text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">
                          {newDocument.fichier ? (
                            <>
                              <span className="font-medium text-blue-600">{newDocument.fichier.name}</span>
                              <br />
                              <span className="text-xs">{formatFileSize(newDocument.fichier.size)}</span>
                            </>
                          ) : (
                            <>
                              Cliquez pour sélectionner un fichier PDF
                              <br />
                              <span className="text-xs">Taille max: 10 MB</span>
                            </>
                          )}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewDocument({ titre: '', description: '', fichier: null })
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePublishDocument}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Publier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de visualisation */}
          {showViewModal && viewingDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingDocument(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faFilePdf} className="text-red-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{viewingDocument.titre}</h2>
                  <p className="text-slate-600">{viewingDocument.description}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Classe:</span>
                      <p className="text-slate-900">{viewingDocument.classe}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Fichier:</span>
                      <p className="text-slate-900">{viewingDocument.nomFichier}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Taille:</span>
                      <p className="text-slate-900">{viewingDocument.taille}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Date de publication:</span>
                      <p className="text-slate-900">{new Date(viewingDocument.datePublication).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Publié par:</span>
                      <p className="text-slate-900">{viewingDocument.publiePar}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Filière/Niveau:</span>
                      <p className="text-slate-900">{viewingDocument.filiere} {viewingDocument.niveau}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadDocument(viewingDocument)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Télécharger
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setViewingDocument(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Fermer
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

export default PublierUnitesEnseignementView
