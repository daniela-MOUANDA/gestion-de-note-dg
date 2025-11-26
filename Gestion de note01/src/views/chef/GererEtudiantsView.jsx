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
  faBirthdayCake
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
                        <button
                          onClick={() => handleViewStudent(etudiant)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          Voir
                        </button>
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
    </div>
  )
}

export default GererEtudiantsView
