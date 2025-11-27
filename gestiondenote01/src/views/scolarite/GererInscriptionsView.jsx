import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserCheck, faSearch, faCheckCircle, faTimes, faEye, faFileAlt,
  faIdCard, faMoneyBillWave, faImage, faUpload, faUser, faCalendar,
  faEnvelope, faPhone, faArrowLeft, faDownload, faGraduationCap, faMapMarkerAlt, faBook
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAlert } from '../../contexts/AlertContext'
import {
  getFormations,
  getFilieres,
  getNiveauxDisponibles,
  getClasses,
  getEtudiantsParClasse,
  getPromotions,
  finaliserInscription
} from '../../api/scolarite'

const GererInscriptionsView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  
  const { showAlert } = useAlert()
  const [typeInscription, setTypeInscription] = useState('inscription')
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // États pour les données de la base
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [classes, setClasses] = useState([])
  const [promotions, setPromotions] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Charger les formations et filières au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [formationsData, filieresData, promotionsData] = await Promise.all([
          getFormations(),
          getFilieres(),
          getPromotions()
        ])
        setFormations(formationsData)
        setFilieres(filieresData)
        setPromotions(promotionsData)
        // Sélectionner la promotion en cours par défaut
        const promoEnCours = promotionsData.find(p => p.statut === 'EN_COURS')
        if (promoEnCours) {
          setSelectedPromotion(promoEnCours.id)
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        showAlert('Erreur lors du chargement des données', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Charger les niveaux quand formation et filière sont sélectionnés
  useEffect(() => {
    if (selectedFormation && selectedFiliere) {
      const loadNiveaux = async () => {
        try {
          const niveauxData = await getNiveauxDisponibles(selectedFormation, selectedFiliere)
          setNiveaux(niveauxData)
        } catch (error) {
          console.error('Erreur lors du chargement des niveaux:', error)
        }
      }
      loadNiveaux()
    } else {
      setNiveaux([])
    }
  }, [selectedFormation, selectedFiliere])
  
  // Charger les classes quand filière et niveau sont sélectionnés
  useEffect(() => {
    if (selectedFiliere && selectedNiveau) {
      const loadClasses = async () => {
        try {
          const classesData = await getClasses(selectedFiliere, selectedNiveau)
          setClasses(classesData)
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error)
        }
      }
      loadClasses()
    } else {
      setClasses([])
    }
  }, [selectedFiliere, selectedNiveau])
  
  // Charger les étudiants quand classe est sélectionnée
  useEffect(() => {
    if (selectedClasse && selectedPromotion) {
      const loadEtudiants = async () => {
        try {
          setLoading(true)
          const etudiantsData = await getEtudiantsParClasse(
            selectedClasse,
            selectedPromotion,
            typeInscription
          )
          setEtudiants(etudiantsData)
        } catch (error) {
          console.error('Erreur lors du chargement des étudiants:', error)
          showAlert('Erreur lors du chargement des étudiants', 'error')
        } finally {
          setLoading(false)
        }
      }
      loadEtudiants()
    } else {
      setEtudiants([])
    }
  }, [selectedClasse, selectedPromotion, typeInscription])

  const handleBack = () => {
    if (selectedEtudiant) setSelectedEtudiant(null)
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedFormation) setSelectedFormation('')
  }

  const allDocumentsPresent = (documents) => {
    return documents.acteNaissance?.uploaded && documents.photo?.uploaded && 
           documents.quittance?.uploaded && documents.pieceIdentite?.uploaded
  }

  const handleFileUpload = (documentType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = documentType === 'photo' ? 'image/*' : '.pdf'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) showAlert(`Document ${documentType} uploadé avec succès!`, 'success')
    }
    input.click()
  }

  const handleFinaliserInscription = () => {
    if (selectedEtudiant && allDocumentsPresent(selectedEtudiant.documents)) {
      const message = typeInscription === 'inscription' 
        ? `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été inscrit avec succès!`
        : `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été réinscrit avec succès!`
      showAlert(message, 'success')
      setSelectedEtudiant(null)
    } else {
      showAlert('Veuillez uploader tous les documents requis', 'error')
    }
  }

  // Vue 0: Sélection du type de formation
  if (!selectedFormation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les inscriptions
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le type de formation pour commencer
              </p>
            </div>
            
            {/* Dropdown pour choisir entre Inscription et Réinscription */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border-2 border-blue-200 mb-6">
              <label className="block text-lg font-bold text-slate-800 mb-3">
                Type d'opération
              </label>
              <select 
                value={typeInscription} 
                onChange={(e) => setTypeInscription(e.target.value)}
                className="w-full px-5 py-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold text-lg bg-white cursor-pointer transition-all hover:border-blue-400"
              >
                <option value="inscription">📝 Inscription</option>
                <option value="reinscription">🔄 Réinscription</option>
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le type de formation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {formations.map((formation) => (
                  <button key={formation.id} onClick={() => setSelectedFormation(formation.id)}
                    className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faBook} className="text-4xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{formation.nom}</div>
                      <div className="text-sm text-slate-600">{formation.description}</div>
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

  // Vue 1: Sélection de la filière
  if (!selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">
                  {typeInscription === 'inscription' ? 'Inscription' : 'Réinscription'} - {formations.find(f => f.id === selectedFormation)?.nom}
                </h1>
              </div>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la filière pour commencer
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez la filière</h2>
              <p className="text-slate-600 text-center mb-6">
                Formation: <span className="font-medium text-blue-600">{formations.find(f => f.id === selectedFormation)?.nom}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => (
                  <button key={filiere.id} onClick={() => setSelectedFiliere(filiere.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{filiere.id}</div>
                      <div className="text-sm text-slate-600">{filiere.nom}</div>
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
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {typeInscription === 'inscription' ? 'Inscriptions' : 'Réinscriptions'} - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">Sélectionnez le niveau d'études</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez le niveau</h2>
              <p className="text-slate-600 text-center mb-6">
                Filière: <span className="font-medium text-blue-600">{filieres.find(f => f.id === selectedFiliere)?.nom}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {niveaux.map((niveau) => {
                  const niveauObj = niveaux.find(n => n.code === niveau)
                  return (
                    <button key={niveau.code || niveau} onClick={() => setSelectedNiveau(niveau.id || niveau)}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau.code || niveau}</div>
                        <div className="text-sm text-slate-600 mb-2">
                          {niveauObj?.nom || (niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année')}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3: Profil détaillé avec documents
  if (selectedEtudiant) {
    const documentsComplete = allDocumentsPresent(selectedEtudiant.documents)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour à la liste
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    Dossier d'{typeInscription === 'inscription' ? 'inscription' : 'réinscription'}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    {typeInscription === 'inscription' ? 'Inscription' : 'Réinscription'} • {selectedFiliere} • {selectedNiveau}
                  </p>
                </div>
                <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                  documentsComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {documentsComplete ? '✓ Dossier complet' : '⚠ Documents manquants'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedEtudiant.prenom[0]}{selectedEtudiant.nom[0]}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedEtudiant.prenom} {selectedEtudiant.nom}</h2>
                  <p className="text-slate-600 text-sm">{selectedEtudiant.matricule}</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-2">
                    {selectedEtudiant.filiere} - {selectedEtudiant.niveau}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEtudiant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faPhone} className="text-green-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Téléphone</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEtudiant.telephone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faCalendar} className="text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Date de naissance</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEtudiant.dateNaissance}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Lieu de naissance</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEtudiant.lieuNaissance}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                <h3 className="text-lg font-bold text-slate-800">Documents requis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['acteNaissance', 'photo', 'quittance', 'pieceIdentite'].map((docType) => {
                    const doc = selectedEtudiant.documents[docType]
                    const labels = {
                      acteNaissance: { title: 'Acte de naissance', icon: faFileAlt, format: 'PDF' },
                      photo: { title: 'Photo d\'identité', icon: faImage, format: 'JPG/PNG' },
                      quittance: { title: 'Quittance de paiement', icon: faMoneyBillWave, format: 'PDF' },
                      pieceIdentite: { title: 'Pièce d\'identité', icon: faIdCard, format: 'PDF' }
                    }
                    return (
                      <div key={docType} className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={labels[docType].icon}
                              className={`text-2xl ${doc?.uploaded ? 'text-green-600' : 'text-slate-400'}`} />
                            <div>
                              <h4 className="font-semibold text-slate-800">{labels[docType].title}</h4>
                              <p className="text-xs text-slate-500">Format {labels[docType].format}</p>
                            </div>
                          </div>
                          <FontAwesomeIcon icon={doc?.uploaded ? faCheckCircle : faTimes}
                            className={doc?.uploaded ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        {doc?.uploaded ? (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm text-green-800 font-medium mb-2">{doc.nom}</p>
                            <div className="flex gap-2">
                              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <FontAwesomeIcon icon={faEye} />Consulter
                              </button>
                              <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                                <FontAwesomeIcon icon={faDownload} />Télécharger
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => handleFileUpload(docType)}
                            className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faUpload} />Uploader
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t">
                <button onClick={handleFinaliserInscription} disabled={!documentsComplete}
                  className={`w-full py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 ${
                    documentsComplete ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {documentsComplete 
                    ? (typeInscription === 'inscription' ? 'Finaliser l\'inscription' : 'Finaliser la réinscription')
                    : 'Documents incomplets'
                  }
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Liste des étudiants
  const etudiantsFiltres = etudiants.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              {typeInscription === 'inscription' ? 'Candidats' : 'Étudiants à réinscrire'} - {selectedFiliere} - {selectedNiveau}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {etudiants.length} {typeInscription === 'inscription' ? 'candidat' : 'étudiant'}{etudiants.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {etudiantsFiltres.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <FontAwesomeIcon icon={faUserCheck} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">
                {searchQuery ? 'Aucun candidat ne correspond à votre recherche' : 'Aucun candidat trouvé'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {etudiantsFiltres.map((etudiant) => {
                const docsComplete = allDocumentsPresent(etudiant.documents)
                return (
                  <div key={etudiant.id} className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {etudiant.prenom[0]}{etudiant.nom[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{etudiant.prenom} {etudiant.nom}</h3>
                          <p className="text-sm text-slate-600">{etudiant.matricule}</p>
                          <p className="text-sm text-slate-600">{etudiant.email}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          docsComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {docsComplete ? '✓ Complet' : '⚠ Incomplet'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-slate-700 mb-2">Documents:</p>
                        <div className="flex gap-2 flex-wrap">
                          {['acteNaissance', 'photo', 'quittance', 'pieceIdentite'].map(doc => (
                            <span key={doc} className={`text-xs px-2 py-1 rounded ${
                              etudiant.documents[doc]?.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {doc === 'acteNaissance' ? 'Acte' : doc === 'pieceIdentite' ? 'CNI' : doc.charAt(0).toUpperCase() + doc.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setSelectedEtudiant(etudiant)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faEye} />Voir le dossier
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default GererInscriptionsView




