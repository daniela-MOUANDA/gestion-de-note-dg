import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate, 
  faSearch, 
  faEye, 
  faArrowLeft,
  faDownload,
  faPrint,
  faGraduationCap,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBirthdayCake,
  faTimes,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAlert } from '../../contexts/AlertContext'

const GererEtudiantsView = () => {
  const { showAlert } = useAlert()
  
  // États pour la navigation multi-étapes
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // État pour la recherche et la pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // État pour le modal de messagerie
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState(null)
  const [messageForm, setMessageForm] = useState({
    sujet: '',
    contenu: '',
    priorite: 'normale'
  })

  // Données statiques
  const filieres = ['GI', 'RT']
  const niveaux = ['L1', 'L2', 'L3']

  // Données des étudiants par filière et niveau
  const etudiantsData = {
    'GI': {
      'L1': Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        matricule: `GI2025-L1-${String(i + 1).padStart(3, '0')}`,
        nom: ['MBENG', 'NKOMO', 'OWONO', 'ELLA', 'OBIANG'][i % 5],
        prenom: ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 1}@inptic.edu.ga`,
        dateNaissance: '1998-05-15',
        lieuNaissance: 'Libreville',
        adresse: 'Quartier Nzeng-Ayong',
        civilite: i % 2 === 0 ? 'M' : 'F',
        classe: i < 15 ? 'GI-L1-A' : 'GI-L1-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Algorithmique', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Mathématiques I', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Système d\'exploitation', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Anglais I', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      })),
      'L2': Array.from({ length: 20 }, (_, i) => ({
        id: i + 31,
        matricule: `GI2024-L2-${String(i + 1).padStart(3, '0')}`,
        nom: ['OBAME', 'NGUEMA', 'MOUNDOUNGA', 'KOUMBA', 'MOUSSAVOU'][i % 5],
        prenom: ['Paul', 'Julie', 'David', 'Emma', 'Thomas'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 31}@inptic.edu.ga`,
        dateNaissance: '1997-03-20',
        lieuNaissance: 'Port-Gentil',
        adresse: 'Quartier Lalala',
        civilite: i % 2 === 0 ? 'M' : 'F',
        classe: i < 10 ? 'GI-L2-A' : 'GI-L2-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Base de données', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Programmation web', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Réseaux I', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Anglais II', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      })),
      'L3': Array.from({ length: 15 }, (_, i) => ({
        id: i + 51,
        matricule: `GI2023-L3-${String(i + 1).padStart(3, '0')}`,
        nom: ['MBO', 'DUPONT', 'MARTIN', 'BERNARD', 'PETIT'][i % 5],
        prenom: ['Lidvige', 'Jean', 'Marie', 'Pierre', 'Sophie'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 51}@inptic.edu.ga`,
        dateNaissance: '1996-08-10',
        lieuNaissance: 'Franceville',
        adresse: 'Quartier Glass',
        civilite: i % 2 === 0 ? 'F' : 'M',
        classe: i < 8 ? 'GI-L3-A' : 'GI-L3-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Génie logiciel', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Intelligence artificielle', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Sécurité informatique', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Projet', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      }))
    },
    'RT': {
      'L1': Array.from({ length: 25 }, (_, i) => ({
        id: i + 101,
        matricule: `RT2025-L1-${String(i + 1).padStart(3, '0')}`,
        nom: ['ABESSOLO', 'MINKO', 'NZANG', 'ONDO', 'MENDOME'][i % 5],
        prenom: ['Alain', 'Christine', 'Eric', 'Fatima', 'Georges'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 101}@inptic.edu.ga`,
        dateNaissance: '1998-02-12',
        lieuNaissance: 'Oyem',
        adresse: 'Quartier Sotega',
        civilite: i % 2 === 0 ? 'M' : 'F',
        classe: i < 13 ? 'RT-L1-A' : 'RT-L1-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Électronique', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Mathématiques I', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Télécommunications', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Anglais I', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      })),
      'L2': Array.from({ length: 18 }, (_, i) => ({
        id: i + 151,
        matricule: `RT2024-L2-${String(i + 1).padStart(3, '0')}`,
        nom: ['KOMBILA', 'YEMBI', 'MAGANGA', 'MASSALA', 'MATALA'][i % 5],
        prenom: ['Henri', 'Isabelle', 'Jacques', 'Karine', 'Louis'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 151}@inptic.edu.ga`,
        dateNaissance: '1997-06-25',
        lieuNaissance: 'Mouila',
        adresse: 'Quartier Akanda',
        civilite: i % 2 === 0 ? 'M' : 'F',
        classe: i < 9 ? 'RT-L2-A' : 'RT-L2-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Réseaux avancés', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Protocoles', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Administration système', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Anglais II', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      })),
      'L3': Array.from({ length: 12 }, (_, i) => ({
        id: i + 181,
        matricule: `RT2023-L3-${String(i + 1).padStart(3, '0')}`,
        nom: ['NTOUTOUME', 'ESSONO', 'MEBA', 'ONDO', 'NDONG'][i % 5],
        prenom: ['Marc', 'Nathalie', 'Olivier', 'Patricia', 'Quentin'][i % 5],
        telephone: `077${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        email: `etudiant${i + 181}@inptic.edu.ga`,
        dateNaissance: '1996-11-30',
        lieuNaissance: 'Tchibanga',
        adresse: 'Quartier Nzeng-Ayong',
        civilite: i % 2 === 0 ? 'M' : 'F',
        classe: i < 6 ? 'RT-L3-A' : 'RT-L3-B',
        statut: 'Actif',
        moyenneGenerale: (Math.random() * 8 + 10).toFixed(2),
        modulesResultats: [
          { module: 'Sécurité réseaux', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Cloud computing', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'IoT', note: (Math.random() * 8 + 10).toFixed(2) },
          { module: 'Projet', note: (Math.random() * 8 + 10).toFixed(2) }
        ]
      }))
    }
  }

  // Gestionnaires de navigation
  const handleFiliereSelect = (filiere) => {
    setSelectedFiliere(filiere)
    setSelectedNiveau('')
    setSelectedStudent(null)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleNiveauSelect = (niveau) => {
    setSelectedNiveau(niveau)
    setSelectedStudent(null)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleBack = () => {
    if (selectedStudent) {
      setSelectedStudent(null)
    } else if (selectedNiveau) {
      setSelectedNiveau('')
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    }
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
  }

  const handleOpenMessageModal = (student) => {
    setSelectedStudentForMessage(student)
    setMessageForm({
      sujet: '',
      contenu: '',
      priorite: 'normale'
    })
    setShowMessageModal(true)
  }

  const handleCloseMessageModal = () => {
    setShowMessageModal(false)
    setSelectedStudentForMessage(null)
    setMessageForm({
      sujet: '',
      contenu: '',
      priorite: 'normale'
    })
  }

  const handleSendMessage = () => {
    if (!messageForm.sujet || !messageForm.contenu) {
      showAlert('Veuillez remplir tous les champs', 'error')
      return
    }
    
    // Logique d'envoi du message
    console.log('Message envoyé à:', selectedStudentForMessage)
    console.log('Message:', messageForm)
    
    showAlert(`Message envoyé avec succès à ${selectedStudentForMessage.nom} ${selectedStudentForMessage.prenom}`, 'success')
    handleCloseMessageModal()
  }

  // Obtenir les étudiants filtrés et paginés
  const getCurrentStudents = () => {
    if (!selectedFiliere || !selectedNiveau) return []
    
    const students = etudiantsData[selectedFiliere][selectedNiveau] || []
    const filtered = students.filter(etudiant =>
      `${etudiant.nom} ${etudiant.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etudiant.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etudiant.classe.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return {
      students: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    }
  }

  const getAppreciationColor = (note) => {
    const n = parseFloat(note)
    if (n >= 16) return 'bg-green-100 text-green-800 border-green-200'
    if (n >= 14) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (n >= 12) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (n >= 10) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getAppreciation = (note) => {
    const n = parseFloat(note)
    if (n >= 16) return 'Très Bien'
    if (n >= 14) return 'Bien'
    if (n >= 12) return 'Assez Bien'
    if (n >= 10) return 'Passable'
    return 'Insuffisant'
  }

  // Vue principale: Sélection de la filière
  if (!selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef chefName="Dr. Jean KAMDEM" />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les étudiants
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Consultez et gérez les étudiants de votre département
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

  // Vue 2: Sélection du niveau
  if (selectedFiliere && !selectedNiveau) {
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
                Gérer les étudiants - {selectedFiliere}
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
                      <div className="text-xs text-slate-500 mt-2">
                        {etudiantsData[selectedFiliere][niveau].length} étudiants
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

  // Vue 3: Détail d'un étudiant
  if (selectedStudent) {
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
                Retour à la liste
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    Profil de l'étudiant
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    {selectedFiliere} • {selectedNiveau}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenMessageModal(selectedStudent)}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                    Envoyer un message
                  </button>
                  <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Télécharger PDF
                  </button>
                  <button className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                    <FontAwesomeIcon icon={faPrint} className="mr-2" />
                    Imprimer
                  </button>
                </div>
              </div>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedStudent.nom.charAt(0)}{selectedStudent.prenom.charAt(0)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedStudent.nom} {selectedStudent.prenom}</h2>
                  <p className="text-slate-600">{selectedStudent.matricule}</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mt-2">
                    {selectedStudent.statut}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Classe:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.classe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Filière:</span>
                    <span className="font-medium text-slate-800">{selectedFiliere}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Civilité:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.civilite === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {selectedStudent.civilite === 'M' ? 'Masculin' : 'Féminin'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Téléphone:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.telephone}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Informations personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm font-medium text-slate-800">{selectedStudent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faPhone} className="text-green-600 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-slate-500">Téléphone</p>
                        <p className="text-sm font-medium text-slate-800">{selectedStudent.telephone}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faBirthdayCake} className="text-purple-600 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-slate-500">Date de naissance</p>
                        <p className="text-sm font-medium text-slate-800">{selectedStudent.dateNaissance}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-600 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-slate-500">Lieu de naissance</p>
                        <p className="text-sm font-medium text-slate-800">{selectedStudent.lieuNaissance}</p>
                      </div>
                    </div>
                    <div className="flex items-start md:col-span-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-600 mt-1 mr-3" />
                      <div>
                        <p className="text-xs text-slate-500">Adresse</p>
                        <p className="text-sm font-medium text-slate-800">{selectedStudent.adresse}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Performance académique</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedStudent.moyenneGenerale}/20</p>
                      <p className="text-sm text-slate-600">Moyenne générale</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.modulesResultats.length}</p>
                      <p className="text-sm text-slate-600">Modules suivis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Résultats par module */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Résultats par module</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Module</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Note</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedStudent.modulesResultats.map((resultat, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{resultat.module}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-slate-800">{resultat.note}/20</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getAppreciationColor(resultat.note)}`}>
                            {getAppreciation(resultat.note)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Liste des étudiants avec pagination
  const { students, total, totalPages } = getCurrentStudents()

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
                  Étudiants {selectedFiliere} - {selectedNiveau}
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  {total} étudiant{total > 1 ? 's' : ''} inscrit{total > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Télécharger PDF
                </button>
                <button className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                  <FontAwesomeIcon icon={faPrint} className="mr-2" />
                  Imprimer
                </button>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher un étudiant par nom, matricule ou classe..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          {/* Table des étudiants */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Matricule</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom & Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Téléphone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((etudiant, index) => (
                    <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                        {etudiant.matricule}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                            {etudiant.nom.charAt(0)}{etudiant.prenom.charAt(0)}
                          </div>
                          {etudiant.nom} {etudiant.prenom}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{etudiant.classe}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{etudiant.telephone}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {etudiant.statut}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewStudent(etudiant)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            Voir
                          </button>
                          <button
                            onClick={() => handleOpenMessageModal(etudiant)}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            title="Envoyer un message"
                          >
                            <FontAwesomeIcon icon={faEnvelope} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Page {currentPage} sur {totalPages} • {total} résultat{total > 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de messagerie rapide */}
      {showMessageModal && selectedStudentForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg font-bold">
                    {selectedStudentForMessage.nom.charAt(0)}{selectedStudentForMessage.prenom.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Envoyer un message</h2>
                    <p className="text-indigo-100 text-sm">
                      À: {selectedStudentForMessage.nom} {selectedStudentForMessage.prenom}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseMessageModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>
            </div>

            {/* Informations de l'étudiant */}
            <div className="p-6 bg-indigo-50 border-b border-indigo-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserGraduate} className="text-indigo-600" />
                  <div>
                    <span className="text-slate-500">Matricule:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedStudentForMessage.matricule}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-indigo-600" />
                  <div>
                    <span className="text-slate-500">Classe:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedStudentForMessage.classe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="text-indigo-600" />
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedStudentForMessage.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-indigo-600" />
                  <div>
                    <span className="text-slate-500">Téléphone:</span>
                    <span className="ml-2 font-medium text-slate-800">{selectedStudentForMessage.telephone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div className="p-6 space-y-4">
              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priorité du message
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priorite"
                      value="normale"
                      checked={messageForm.priorite === 'normale'}
                      onChange={(e) => setMessageForm({ ...messageForm, priorite: e.target.value })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Normale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priorite"
                      value="urgente"
                      checked={messageForm.priorite === 'urgente'}
                      onChange={(e) => setMessageForm({ ...messageForm, priorite: e.target.value })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700 flex items-center gap-1">
                      Urgente
                      {messageForm.priorite === 'urgente' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">!</span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sujet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={messageForm.sujet}
                  onChange={(e) => setMessageForm({ ...messageForm, sujet: e.target.value })}
                  placeholder="Ex: Convocation pour entretien, Résultats d'examen..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={messageForm.contenu}
                  onChange={(e) => setMessageForm({ ...messageForm, contenu: e.target.value })}
                  placeholder={`Bonjour ${selectedStudentForMessage.prenom},\n\nVotre message ici...`}
                  rows="8"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageForm.contenu.length} caractères
                </p>
              </div>

              {/* Suggestions de messages rapides */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Messages rapides:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Convocation', text: `Bonjour ${selectedStudentForMessage.prenom},\n\nVous êtes convoqué(e) à mon bureau le [DATE] à [HEURE].\n\nCordialement,\nLe Chef de Département` },
                    { label: 'Félicitations', text: `Bonjour ${selectedStudentForMessage.prenom},\n\nToutes mes félicitations pour vos excellents résultats!\n\nContinuez ainsi.\n\nCordialement,\nLe Chef de Département` },
                    { label: 'Rappel', text: `Bonjour ${selectedStudentForMessage.prenom},\n\nJe vous rappelle que [VOTRE RAPPEL].\n\nCordialement,\nLe Chef de Département` }
                  ].map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setMessageForm({ ...messageForm, contenu: template.text })}
                      className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pied du modal */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={handleCloseMessageModal}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageForm.sujet || !messageForm.contenu}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Envoyer le message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GererEtudiantsView
