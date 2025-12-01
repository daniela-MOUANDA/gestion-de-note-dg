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
  getEtudiantsParFiliereNiveau,
  getPromotions,
  finaliserInscription,
  uploadDocumentInscription,
  updateEtudiantInfo,
  uploadPhotoEtudiant,
  upsertParent,
  getParents,
  getDossierEtudiant
} from '../../api/scolarite'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const GererInscriptionsView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  
  const { showAlert, success, error: alertError } = useAlert()
  const { user } = useAuth()
  const [typeInscription, setTypeInscription] = useState('inscription')
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [selectedInscription, setSelectedInscription] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // États pour les données de la base
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [promotions, setPromotions] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(false)
  
  // États pour l'édition
  const [editingInfo, setEditingInfo] = useState(false)
  const [etudiantInfo, setEtudiantInfo] = useState({})
  const [parents, setParents] = useState([])
  const [parentData, setParentData] = useState({
    PERE: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' },
    MERE: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' },
    TUTEUR: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' }
  })
  const [uploading, setUploading] = useState({})
  const [dossierComplet, setDossierComplet] = useState(null)
  
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
  
  // Charger les étudiants quand filière, niveau, formation et promotion sont sélectionnés
  useEffect(() => {
    if (selectedFiliere && selectedNiveau && selectedFormation && selectedPromotion) {
      const loadEtudiants = async () => {
        try {
          setLoading(true)
          console.log('Chargement des étudiants pour:', { selectedFiliere, selectedNiveau, selectedFormation, selectedPromotion, typeInscription })
          const etudiantsData = await getEtudiantsParFiliereNiveau(
            selectedFiliere,
            selectedNiveau,
            selectedPromotion,
            selectedFormation,
            typeInscription
          )
          console.log('Étudiants récupérés:', etudiantsData.length, etudiantsData)
          setEtudiants(etudiantsData || [])
        } catch (error) {
          console.error('Erreur lors du chargement des étudiants:', error)
          alertError(error.message || 'Erreur lors du chargement des étudiants')
          setEtudiants([])
        } finally {
          setLoading(false)
        }
      }
      loadEtudiants()
    } else {
      setEtudiants([])
    }
  }, [selectedFiliere, selectedNiveau, selectedFormation, selectedPromotion, typeInscription])

  const handleBack = () => {
    if (selectedEtudiant) {
      setSelectedEtudiant(null)
      setSelectedInscription(null)
      setDossierComplet(null)
    }
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedFormation) setSelectedFormation('')
  }

  // Charger le dossier complet quand un étudiant est sélectionné
  useEffect(() => {
    const loadDossier = async () => {
      if (selectedEtudiant && selectedEtudiant.inscriptionId) {
        try {
          setLoading(true)
          
          // Vérifier que le token existe avant de faire l'appel
          const token = localStorage.getItem('token')
          if (!token) {
            alertError('Session expirée. Veuillez vous reconnecter.')
            window.location.href = '/login'
            return
          }
          
          const response = await getDossierEtudiant(selectedEtudiant.id, selectedEtudiant.inscriptionId)
          // La réponse de l'API est { success: true, dossier: {...} }
          const dossier = response.dossier || response
          setDossierComplet(dossier)
          setSelectedInscription(dossier.inscription ? { id: dossier.inscription.id } : { id: selectedEtudiant.inscriptionId })
          
          // Charger les parents
          const parentsData = await getParents(selectedEtudiant.id)
          const parentsList = Array.isArray(parentsData) ? parentsData : (parentsData.parents || [])
          setParents(parentsList)
          
          // Initialiser les données des parents
          const newParentData = {
            PERE: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' },
            MERE: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' },
            TUTEUR: { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' }
          }
          parentsList.forEach(parent => {
            if (newParentData[parent.type]) {
              newParentData[parent.type] = {
                nom: parent.nom || '',
                prenom: parent.prenom || '',
                telephone: parent.telephone || '',
                email: parent.email || '',
                profession: parent.profession || '',
                adresse: parent.adresse || ''
              }
            }
          })
          setParentData(newParentData)
          
          // Initialiser les informations de l'étudiant
          setEtudiantInfo({
            email: dossier.etudiant?.email || '',
            telephone: dossier.etudiant?.telephone || '',
            adresse: dossier.etudiant?.adresse || '',
            nationalite: dossier.etudiant?.nationalite || ''
          })
        } catch (error) {
          console.error('Erreur lors du chargement du dossier:', error)
          // Ne pas afficher d'erreur si c'est une redirection de connexion
          if (!error.message.includes('Session expirée') && !error.message.includes('reconnecter')) {
            alertError(error.message || 'Erreur lors du chargement du dossier')
          }
        } finally {
          setLoading(false)
        }
      }
    }
    loadDossier()
  }, [selectedEtudiant])

  const allDocumentsPresent = (documents) => {
    if (!documents) return false
    // Les documents peuvent être soit des URLs (string) soit des objets avec { uploaded: true, url: ... }
    const hasActeNaissance = typeof documents.acteNaissance === 'string' ? !!documents.acteNaissance : documents.acteNaissance?.uploaded
    const hasPhoto = typeof documents.photo === 'string' ? !!documents.photo : documents.photo?.uploaded
    const hasQuittance = typeof documents.quittance === 'string' ? !!documents.quittance : documents.quittance?.uploaded
    const hasPieceIdentite = typeof documents.pieceIdentite === 'string' ? !!documents.pieceIdentite : documents.pieceIdentite?.uploaded
    const hasReleveBac = typeof documents.releveBac === 'string' ? !!documents.releveBac : documents.releveBac?.uploaded
    const hasAttestationReussiteBac = typeof documents.attestationReussiteBac === 'string' ? !!documents.attestationReussiteBac : documents.attestationReussiteBac?.uploaded
    return hasActeNaissance && hasPhoto && hasQuittance && hasPieceIdentite && hasReleveBac && hasAttestationReussiteBac
  }

  const handleFileUpload = async (documentType) => {
    if (!selectedInscription) {
      alertError('Aucune inscription sélectionnée')
      return
    }
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = documentType === 'photo' ? 'image/*' : '.pdf'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        setUploading({ ...uploading, [documentType]: true })
        const result = await uploadDocumentInscription(selectedInscription.id, documentType, file)
        success(`Document ${documentType} uploadé avec succès!`)
        
        // Recharger le dossier
        const dossier = await getDossierEtudiant(selectedEtudiant.id, selectedInscription.id)
        setDossierComplet(dossier.dossier)
        
        // Mettre à jour la liste des étudiants
        const etudiantsData = await getEtudiantsParFiliereNiveau(
          selectedFiliere,
          selectedNiveau,
          selectedPromotion,
          selectedFormation,
          typeInscription
        )
        setEtudiants(etudiantsData)
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error)
        alertError(error.message || 'Erreur lors de l\'upload du document')
      } finally {
        setUploading({ ...uploading, [documentType]: false })
      }
    }
    input.click()
  }

  const handleUpdateEtudiantInfo = async () => {
    // Vérifier que le token existe
    const token = localStorage.getItem('token')
    if (!token) {
      alertError('Session expirée. Veuillez vous reconnecter.')
      window.location.href = '/login'
      return
    }
    
    try {
      setLoading(true)
      await updateEtudiantInfo(selectedEtudiant.id, etudiantInfo)
      success('Informations mises à jour avec succès!')
      setEditingInfo(false)
      
      // Recharger le dossier
      const dossier = await getDossierEtudiant(selectedEtudiant.id, selectedInscription.id)
      setDossierComplet(dossier.dossier || dossier)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      // Ne pas afficher d'erreur si c'est une redirection de connexion
      if (!error.message.includes('Session expirée') && !error.message.includes('reconnecter')) {
        alertError(error.message || 'Erreur lors de la mise à jour')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadPhoto = async (file) => {
    // Vérifier que le token existe
    const token = localStorage.getItem('token')
    if (!token) {
      alertError('Session expirée. Veuillez vous reconnecter.')
      window.location.href = '/login'
      return
    }
    
    try {
      setUploading({ ...uploading, photoProfil: true })
      const result = await uploadPhotoEtudiant(selectedEtudiant.id, file)
      success('Photo de profil uploadée avec succès!')
      
      // Recharger le dossier
      const dossier = await getDossierEtudiant(selectedEtudiant.id, selectedInscription.id)
      setDossierComplet(dossier.dossier || dossier)
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error)
      // Ne pas afficher d'erreur si c'est une redirection de connexion
      if (!error.message.includes('Session expirée') && !error.message.includes('reconnecter')) {
        alertError(error.message || 'Erreur lors de l\'upload de la photo')
      }
    } finally {
      setUploading({ ...uploading, photoProfil: false })
    }
  }

  const handleSaveParent = async (parentData) => {
    try {
      setLoading(true)
      await upsertParent(selectedEtudiant.id, parentData)
      success('Parent enregistré avec succès!')
      
      // Recharger les parents
      const parentsData = await getParents(selectedEtudiant.id)
      setParents(parentsData.parents || [])
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du parent:', error)
      alertError(error.message || 'Erreur lors de l\'enregistrement du parent')
    } finally {
      setLoading(false)
    }
  }

  const handleFinaliserInscription = async () => {
    if (!selectedInscription) {
      alertError('Aucune inscription sélectionnée')
      return
    }
    
    if (!dossierComplet || !dossierComplet.inscription || !allDocumentsPresent(dossierComplet.inscription.documents || {})) {
      alertError('Veuillez uploader tous les documents requis')
      return
    }
    
    try {
      setLoading(true)
      await finaliserInscription(selectedInscription.id, user.id)
      const message = typeInscription === 'inscription' 
        ? `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été inscrit avec succès!`
        : `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été réinscrit avec succès!`
      success(message)
      
      // Recharger la liste
      const etudiantsData = await getEtudiantsParFiliereNiveau(
        selectedFiliere,
        selectedNiveau,
        selectedPromotion,
        selectedFormation,
        typeInscription
      )
      setEtudiants(etudiantsData)
      setSelectedEtudiant(null)
      setSelectedInscription(null)
      setDossierComplet(null)
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error)
      alertError(error.message || 'Erreur lors de la finalisation de l\'inscription')
    } finally {
      setLoading(false)
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
                      <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{filiere.code || filiere.nom}</div>
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
                {typeInscription === 'inscription' ? 'Inscriptions' : 'Réinscriptions'} - {filieres.find(f => f.id === selectedFiliere)?.nom || filieres.find(f => f.id === selectedFiliere)?.code}
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
                  return (
                    <button key={niveau.id || niveau.code} onClick={() => setSelectedNiveau(niveau.id)}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau.code}</div>
                        <div className="text-sm text-slate-600 mb-2">
                          {niveau.nom || (niveau.code === 'L1' ? 'Première année' : niveau.code === 'L2' ? 'Deuxième année' : 'Troisième année')}
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
    if (loading && !dossierComplet) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
          <Sidebar />
          <div className="flex flex-col lg:ml-64 min-h-screen">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Chargement du dossier..." />
            </main>
          </div>
        </div>
      )
    }
    
    const dossier = dossierComplet || {
      etudiant: selectedEtudiant,
      inscription: {
        documents: selectedEtudiant.documents || {}
      }
    }
    const documentsComplete = dossier.inscription && allDocumentsPresent(dossier.inscription.documents || {})
    
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
                    {typeInscription === 'inscription' ? 'Inscription' : 'Réinscription'} • {filieres.find(f => f.id === selectedFiliere)?.nom || 'Filière'} • {niveaux.find(n => n.id === selectedNiveau)?.nom || niveaux.find(n => n.id === selectedNiveau)?.code || 'Niveau'}
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
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {dossier.etudiant.photo ? (
                      <img 
                        src={dossier.etudiant.photo.startsWith('http') ? dossier.etudiant.photo : `http://localhost:3000${dossier.etudiant.photo}`}
                        alt={`${dossier.etudiant.prenom} ${dossier.etudiant.nom}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{dossier.etudiant.prenom[0]}{dossier.etudiant.nom[0]}</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) handleUploadPhoto(file)
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading.photoProfil}
                    />
                    {uploading.photoProfil && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{dossier.etudiant.prenom} {dossier.etudiant.nom}</h2>
                  <p className="text-slate-600 text-sm">{dossier.etudiant.matricule}</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-2">
                    {dossier.inscription?.filiere?.nom || selectedEtudiant.filiere} - {dossier.inscription?.niveau?.nom || selectedEtudiant.niveau}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Informations personnelles</h3>
                  <button
                    onClick={() => {
                      if (editingInfo) {
                        handleUpdateEtudiantInfo()
                      } else {
                        setEditingInfo(true)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    disabled={loading}
                  >
                    {editingInfo ? 'Enregistrer' : 'Modifier'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    {editingInfo ? (
                      <input
                        type="email"
                        value={etudiantInfo.email}
                        onChange={(e) => setEtudiantInfo({ ...etudiantInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{dossier.etudiant.email || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                    {editingInfo ? (
                      <input
                        type="tel"
                        value={etudiantInfo.telephone}
                        onChange={(e) => setEtudiantInfo({ ...etudiantInfo, telephone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{dossier.etudiant.telephone || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Adresse</p>
                    {editingInfo ? (
                      <input
                        type="text"
                        value={etudiantInfo.adresse}
                        onChange={(e) => setEtudiantInfo({ ...etudiantInfo, adresse: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{dossier.etudiant.adresse || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Nationalité</p>
                    {editingInfo ? (
                      <input
                        type="text"
                        value={etudiantInfo.nationalite}
                        onChange={(e) => setEtudiantInfo({ ...etudiantInfo, nationalite: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{dossier.etudiant.nationalite || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date de naissance</p>
                    <p className="text-sm font-medium text-slate-800">
                      {dossier.etudiant.dateNaissance ? new Date(dossier.etudiant.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseigné'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Lieu de naissance</p>
                    <p className="text-sm font-medium text-slate-800">{dossier.etudiant.lieuNaissance || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section Parents */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Informations sur les parents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['PERE', 'MERE', 'TUTEUR'].map((type) => {
                  const currentParentData = parentData[type] || { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '' }
                  
                  const handleParentChange = (field, value) => {
                    setParentData({
                      ...parentData,
                      [type]: {
                        ...currentParentData,
                        [field]: value
                      }
                    })
                  }
                  
                  const handleParentBlur = () => {
                    if (currentParentData.nom && currentParentData.prenom) {
                      handleSaveParent({ ...currentParentData, type })
                    }
                  }
                  
                  return (
                    <div key={type} className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">
                        {type === 'PERE' ? 'Père' : type === 'MERE' ? 'Mère' : 'Tuteur'}
                      </h4>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nom"
                          value={currentParentData.nom}
                          onChange={(e) => handleParentChange('nom', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Prénom"
                          value={currentParentData.prenom}
                          onChange={(e) => handleParentChange('prenom', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="tel"
                          placeholder="Téléphone"
                          value={currentParentData.telephone}
                          onChange={(e) => handleParentChange('telephone', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={currentParentData.email}
                          onChange={(e) => handleParentChange('email', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Profession"
                          value={currentParentData.profession}
                          onChange={(e) => handleParentChange('profession', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Adresse"
                          value={currentParentData.adresse}
                          onChange={(e) => handleParentChange('adresse', e.target.value)}
                          onBlur={handleParentBlur}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                <h3 className="text-lg font-bold text-slate-800">Documents requis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['acteNaissance', 'photo', 'quittance', 'pieceIdentite', 'releveBac', 'attestationReussiteBac'].map((docType) => {
                    const documents = dossier.inscription?.documents || {}
                    const docUrl = documents[docType]
                    // docUrl peut être soit une string (URL) soit un objet { uploaded: true, url: ... }
                    const url = typeof docUrl === 'string' ? docUrl : docUrl?.url
                    const isUploaded = typeof docUrl === 'string' ? !!docUrl : docUrl?.uploaded || false
                    const doc = isUploaded ? { nom: docType, uploaded: true, url: url } : null
                    const labels = {
                      acteNaissance: { title: 'Acte de naissance', icon: faFileAlt, format: 'PDF' },
                      photo: { title: 'Photo d\'identité', icon: faImage, format: 'JPG/PNG' },
                      quittance: { title: 'Quittance de paiement', icon: faMoneyBillWave, format: 'PDF' },
                      pieceIdentite: { title: 'Pièce d\'identité', icon: faIdCard, format: 'PDF' },
                      releveBac: { title: 'Copie légalisée du relevé de notes du bac', icon: faFileAlt, format: 'PDF' },
                      attestationReussiteBac: { title: 'Copie légalisée de l\'attestation de réussite au bac', icon: faFileAlt, format: 'PDF' }
                    }
                    return (
                      <div key={docType} className={`border-2 rounded-lg p-4 transition-colors ${isUploaded ? 'border-green-300 hover:border-green-400' : 'border-red-300 hover:border-red-400'}`}>
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
                            <p className="text-sm text-green-800 font-medium mb-2">✓ Document uploadé</p>
                            <div className="flex gap-2">
                              <a
                                href={doc.url.startsWith('http') ? doc.url : `http://localhost:3000${doc.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faEye} />Consulter
                              </a>
                              <a
                                href={doc.url.startsWith('http') ? doc.url : `http://localhost:3000${doc.url}`}
                                download
                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faDownload} />Télécharger
                              </a>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleFileUpload(docType)}
                            disabled={uploading[docType]}
                            className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {uploading[docType] ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Upload en cours...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faUpload} />Uploader
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t">
                <button 
                  onClick={handleFinaliserInscription} 
                  disabled={!documentsComplete || loading}
                  className={`w-full py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 ${
                    documentsComplete && !loading ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Finalisation en cours...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {documentsComplete 
                        ? (typeInscription === 'inscription' ? 'Finaliser l\'inscription' : 'Finaliser la réinscription')
                        : 'Documents incomplets'
                      }
                    </>
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Liste des étudiants
  const etudiantsFiltres = etudiants.filter(e => {
    if (!e) return false
    const nomComplet = `${e.nom || ''} ${e.prenom || ''}`.toLowerCase()
    const matricule = (e.matricule || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return nomComplet.includes(query) || matricule.includes(query)
  })

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
              {typeInscription === 'inscription' ? 'Candidats' : 'Étudiants à réinscrire'} - {filieres.find(f => f.id === selectedFiliere)?.nom} - {niveaux.find(n => n.id === selectedNiveau)?.nom || niveaux.find(n => n.id === selectedNiveau)?.code}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {etudiants.length} {typeInscription === 'inscription' ? 'candidat' : 'étudiant'}{etudiants.length > 1 ? 's' : ''} trouvé{etudiants.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <LoadingSpinner size="lg" text="Chargement des étudiants..." />
            </div>
          ) : etudiantsFiltres.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <FontAwesomeIcon icon={faUserCheck} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">
                {searchQuery ? 'Aucun candidat ne correspond à votre recherche' : 'Aucun candidat trouvé pour cette classe'}
              </p>
              {!searchQuery && (
                <p className="text-slate-400 text-sm mt-2">
                  Les étudiants doivent être importés depuis Excel pour apparaître ici
                </p>
              )}
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
                          {(etudiant.prenom?.[0] || '')}{(etudiant.nom?.[0] || '')}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{etudiant.prenom || ''} {etudiant.nom || ''}</h3>
                          <p className="text-sm text-slate-600">{etudiant.matricule || 'N/A'}</p>
                          <p className="text-sm text-slate-600">{etudiant.email || 'Email non renseigné'}</p>
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
                              etudiant.documents?.[doc]?.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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




