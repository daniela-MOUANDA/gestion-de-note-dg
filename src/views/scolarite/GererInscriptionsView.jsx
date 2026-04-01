import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserCheck, faSearch, faCheckCircle, faTimes, faEye, faFileAlt,
  faIdCard, faMoneyBillWave, faImage, faUpload, faUser, faCalendar,
  faEnvelope, faPhone, faArrowLeft, faDownload, faGraduationCap, faMapMarkerAlt, faBook, faTrash,
  faTh, faList, faCopy, faKey, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import {
  getFormations,
  getFilieres,
  getNiveauxDisponibles,
  getEtudiantsParFiliereNiveau,
  getPromotions,
  finaliserInscription,
  uploadDocumentInscription,
  deleteDocumentInscription,
  updateEtudiantInfo,
  uploadPhotoEtudiant,
  upsertParent,
  getParents,
  getDossierEtudiant,
  deleteEtudiant,
  bulkFillPlaceholderDocuments,
  bulkFinaliserComplets
} from '../../api/scolarite'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { pickPromotionForCurrentAcademicYear } from '../../utils/academicYear.js'

const GererInscriptionsView = () => {
  const location = useLocation()
  const navigate = useNavigate()


  const { showAlert, success, error: alertError } = useAlert()
  const { user } = useAuth()
  const [typeInscription, setTypeInscription] = useState('inscription')
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  // Option/parcours (utile surtout en L3 quand la filière a des options)
  const [selectedOptionFiliereId, setSelectedOptionFiliereId] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [selectedInscription, setSelectedInscription] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtreInscrit, setFiltreInscrit] = useState('tous') // 'tous', 'inscrits', 'non-inscrits'
  const [viewMode, setViewMode] = useState('grid') // 'grid' ou 'list'
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [studentCredentials, setStudentCredentials] = useState(null)

  // États pour les données de la base
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [promotions, setPromotions] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(false)
  const [fillingPlaceholders, setFillingPlaceholders] = useState(false)
  const [bulkFinalizing, setBulkFinalizing] = useState(false)
  const niveauxFetchIdRef = useRef(0)

  const getChildFilieresForParent = (parentId) => {
    const list = filieres.filter((f) => f.parent_filiere_id === parentId)
    return [...list].sort((a, b) => (a.code || '').localeCompare(b.code || ''))
  }

  const rootFilieres = useMemo(() => {
    return filieres
      .filter((f) => !f.parent_filiere_id)
      .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
  }, [filieres])

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
        // Année académique « calendrier » (ex. 2025-2026) : priorité sur EN_COURS
        const promoDefaut = pickPromotionForCurrentAcademicYear(promotionsData)
        if (promoDefaut) {
          setSelectedPromotion(promoDefaut.id)
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
      const fetchId = ++niveauxFetchIdRef.current
      const loadNiveaux = async () => {
        try {
          const niveauxData = await getNiveauxDisponibles(selectedFormation, selectedFiliere)
          if (fetchId !== niveauxFetchIdRef.current) return
          setNiveaux(niveauxData || [])
        } catch (error) {
          if (fetchId !== niveauxFetchIdRef.current) return
          console.error('Erreur lors du chargement des niveaux:', error)
        }
      }
      loadNiveaux()
    } else {
      niveauxFetchIdRef.current += 1
      setNiveaux([])
    }
  }, [selectedFormation, selectedFiliere])

  // Charger les étudiants quand filière, niveau, formation et promotion sont sélectionnés
  useEffect(() => {
    const effectiveFiliereId = selectedOptionFiliereId || selectedFiliere
    if (effectiveFiliereId && selectedNiveau && selectedFormation && selectedPromotion) {
      const loadEtudiants = async () => {
        try {
          setLoading(true)
          const etudiantsData = await getEtudiantsParFiliereNiveau(
            effectiveFiliereId,
            selectedNiveau,
            selectedPromotion,
            selectedFormation,
            typeInscription
          )
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
  }, [selectedFiliere, selectedOptionFiliereId, selectedNiveau, selectedFormation, selectedPromotion, typeInscription])

  const handleBack = () => {
    if (selectedEtudiant) {
      setSelectedEtudiant(null)
      setSelectedInscription(null)
      setDossierComplet(null)
    }
    else if (selectedOptionFiliereId) setSelectedOptionFiliereId('')
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
            navigate('/login', { replace: true })
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

  // Valider que les informations personnelles sont complètes
  const isPersonalInfoComplete = (etudiant) => {
    if (!etudiant) return false
    return !!(
      etudiant.nom &&
      etudiant.prenom &&
      etudiant.dateNaissance &&
      etudiant.lieuNaissance &&
      etudiant.nationalite &&
      etudiant.email &&
      etudiant.telephone &&
      etudiant.adresse
    )
  }

  // Valider qu'au moins un parent est renseigné
  const hasAtLeastOneParent = (parents) => {
    if (!parents || parents.length === 0) return false
    return parents.some(parent =>
      parent.nom &&
      parent.prenom &&
      parent.telephone
    )
  }

  // Validation complète avant finalisation
  const canFinalizeInscription = () => {
    if (!dossierComplet || !dossierComplet.etudiant || !dossierComplet.inscription) {
      return { valid: false, reason: 'Dossier incomplet' }
    }

    // Vérifier les documents
    if (!allDocumentsPresent(dossierComplet.inscription.documents || {})) {
      return { valid: false, reason: 'Tous les documents requis doivent être uploadés' }
    }

    // Vérifier les informations personnelles
    if (!isPersonalInfoComplete(dossierComplet.etudiant)) {
      return { valid: false, reason: 'Toutes les informations personnelles doivent être renseignées (nom, prénom, date de naissance, lieu de naissance, nationalité, email, téléphone, adresse)' }
    }

    // Vérifier qu'au moins un parent est renseigné
    if (!hasAtLeastOneParent(dossierComplet.parents || [])) {
      return { valid: false, reason: 'Au moins un parent doit avoir ses informations renseignées (nom, prénom, téléphone)' }
    }

    // Vérifier que l'inscription n'est pas déjà finalisée
    if (dossierComplet.inscription.statut === 'INSCRIT') {
      return { valid: false, reason: 'Cette inscription est déjà finalisée', alreadyFinalized: true }
    }

    return { valid: true }
  }

  const handleBulkPlaceholderDocuments = async () => {
    const effectiveFiliereId = selectedOptionFiliereId || selectedFiliere
    if (!effectiveFiliereId || !selectedNiveau || !selectedFormation || !selectedPromotion) {
      alertError('Sélectionnez formation, filière, niveau et promotion.')
      return
    }

    const ok = window.confirm(
      'Compléter automatiquement ce périmètre (filière, niveau, formation, promotion) ?\n\n' +
        '• Documents : fichiers modèles pour les pièces manquantes uniquement.\n' +
        '• E-mail : prénom.nom.matricule@stub.inptic.local (si vide).\n' +
        '• Parent : tuteur factice « Parent / parent{prénom}{nom} » + téléphone si aucun parent complet.\n' +
        '• Autres champs vides : valeurs minimales pour débloquer le dossier.\n\n' +
        'Rien n\'est écrasé si déjà renseigné. Usage provisoire : à corriger ensuite avec les vraies données.'
    )
    if (!ok) return

    try {
      setFillingPlaceholders(true)
      const result = await bulkFillPlaceholderDocuments({
        filiereId: effectiveFiliereId,
        niveauId: selectedNiveau,
        promotionId: selectedPromotion,
        formationId: selectedFormation,
        typeInscription
      })
      const u = result.updatedInscriptions ?? 0
      const c = result.alreadyComplete ?? 0
      const eu = result.updatedEtudiants ?? 0
      const pa = result.updatedParents ?? 0
      const tot = result.totalInscriptions ?? 0
      success(
        `Pièces modèles : ${u} dossier(s) complété(s), ${c} avaient déjà toutes les pièces (${tot} au total). ` +
          `Étudiants mis à jour : ${eu}. Parents (tuteur) : ${pa}.`
      )
      const etudiantsData = await getEtudiantsParFiliereNiveau(
        effectiveFiliereId,
        selectedNiveau,
        selectedPromotion,
        selectedFormation,
        typeInscription
      )
      setEtudiants(etudiantsData || [])
    } catch (err) {
      console.error(err)
      alertError(err.message || 'Erreur lors du remplissage des documents')
    } finally {
      setFillingPlaceholders(false)
    }
  }

  const handleBulkFinaliserComplets = async () => {
    const effectiveFiliereId = selectedOptionFiliereId || selectedFiliere
    if (!effectiveFiliereId || !selectedNiveau || !selectedFormation || !selectedPromotion) {
      alertError('Sélectionnez formation, filière, niveau et promotion.')
      return
    }

    const ok = window.confirm(
      'Finaliser toutes les inscriptions « dossier complet » de ce périmètre ?\n\n' +
        'Seuls les candidats ayant : toutes les pièces, les informations personnelles complètes, et au moins un parent renseigné — et qui ne sont pas déjà inscrits — recevront le statut INSCRIT et un compte étudiant.\n\n' +
        'Les autres seront ignorés.'
    )
    if (!ok) return

    try {
      setBulkFinalizing(true)
      const result = await bulkFinaliserComplets({
        filiereId: effectiveFiliereId,
        niveauId: selectedNiveau,
        promotionId: selectedPromotion,
        formationId: selectedFormation,
        typeInscription
      })
      const fin = result.finalized ?? 0
      const skip = result.skippedIncomplete ?? 0
      const deja = result.alreadyInscrit ?? 0
      const errs = result.errors || []
      let msg =
        `Inscriptions finalisées : ${fin}. Déjà inscrits : ${deja}. Dossiers incomplets (ignorés) : ${skip}.`
      if (errs.length > 0) {
        msg += ` Échecs : ${errs.length} (voir la console).`
        console.warn('Finalisation groupée — erreurs détail:', errs)
      }
      success(msg)
      const etudiantsData = await getEtudiantsParFiliereNiveau(
        effectiveFiliereId,
        selectedNiveau,
        selectedPromotion,
        selectedFormation,
        typeInscription
      )
      setEtudiants(etudiantsData || [])
    } catch (err) {
      console.error(err)
      alertError(err.message || 'Erreur lors de la finalisation groupée')
    } finally {
      setBulkFinalizing(false)
    }
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

  const handleDeleteDocument = async (documentType) => {
    if (!selectedInscription) {
      alertError('Aucune inscription sélectionnée')
      return
    }

    // Demander le motif du rejet/suppression
    const raison = window.prompt('Veuillez indiquer le motif de la suppression (ce motif sera visible par l\'étudiant) :', 'Document illisible ou non conforme')

    if (raison === null) return // Annulé par l'utilisateur

    try {
      setUploading({ ...uploading, [documentType]: true })
      await deleteDocumentInscription(selectedInscription.id, documentType, raison)
      success('Document supprimé et marqué comme rejeté avec succès!')

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
      console.error('Erreur lors de la suppression:', error)
      alertError(error.message || 'Erreur lors de la suppression du document')
    } finally {
      setUploading({ ...uploading, [documentType]: false })
    }
  }

  const handleUpdateEtudiantInfo = async () => {
    // Vérifier que le token existe
    const token = localStorage.getItem('token')
    if (!token) {
      alertError('Session expirée. Veuillez vous reconnecter.')
      navigate('/login', { replace: true })
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
      navigate('/login', { replace: true })
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

      // Recharger le dossier complet pour mettre à jour la validation
      const dossier = await getDossierEtudiant(selectedEtudiant.id, selectedInscription.id)
      setDossierComplet(dossier.dossier || dossier)

      // Recharger les parents
      const parentsData = await getParents(selectedEtudiant.id)
      const parentsList = Array.isArray(parentsData) ? parentsData : (parentsData.parents || [])
      setParents(parentsList)
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du parent:', error)
      alertError(error.message || 'Erreur lors de l\'enregistrement du parent')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEtudiant = async () => {
    if (!selectedEtudiant) {
      alertError('Aucun étudiant sélectionné')
      return
    }

    // Confirmation avant suppression
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'étudiant ${selectedEtudiant.prenom} ${selectedEtudiant.nom} ?\n\nCette action est irréversible et supprimera également toutes ses inscriptions et données associées.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(true)
      await deleteEtudiant(selectedEtudiant.id)
      success(`L'étudiant ${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été supprimé avec succès`)

      // Retourner à la liste et recharger les étudiants
      setSelectedEtudiant(null)
      setDossierComplet(null)

      // Recharger la liste des étudiants
      if (selectedFiliere && selectedNiveau) {
        const etudiantsData = await getEtudiantsParFiliereNiveau(
          selectedFiliere,
          selectedNiveau,
          selectedPromotion,
          selectedFormation,
          typeInscription
        )
        setEtudiants(etudiantsData)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étudiant:', error)
      alertError(error.message || 'Erreur lors de la suppression de l\'étudiant')
    } finally {
      setLoading(false)
    }
  }

  const handleFinaliserInscription = async () => {
    if (!selectedInscription) {
      alertError('Aucune inscription sélectionnée')
      return
    }

    // Validation complète
    const validation = canFinalizeInscription()
    if (!validation.valid) {
      if (validation.alreadyFinalized) {
        alertError('Cette inscription est déjà finalisée. Cette action ne peut être effectuée qu\'une seule fois.')
      } else {
        alertError(validation.reason)
      }
      return
    }

    try {
      setLoading(true)
      const result = await finaliserInscription(selectedInscription.id, user.id)

      // Afficher les identifiants dans une modal
      if (result.password) {
        setStudentCredentials({
          nom: result.etudiantNom || `${selectedEtudiant.prenom} ${selectedEtudiant.nom}`,
          email: result.etudiantEmail || selectedEtudiant.email,
          matricule: result.etudiantMatricule || selectedEtudiant.matricule,
          password: result.password
        })
        setShowCredentialsModal(true)
      }

      const message = typeInscription === 'inscription'
        ? `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été inscrit avec succès!`
        : `${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été réinscrit avec succès!`
      success(message)

      // Recharger le dossier pour mettre à jour le statut
      const dossier = await getDossierEtudiant(selectedEtudiant.id, selectedInscription.id)
      const dossierData = dossier.dossier || dossier
      setDossierComplet(dossierData)

      // Recharger les parents
      const parentsData = await getParents(selectedEtudiant.id)
      setParents(Array.isArray(parentsData) ? parentsData : (parentsData.parents || []))

      // Recharger la liste
      const etudiantsData = await getEtudiantsParFiliereNiveau(
        selectedFiliere,
        selectedNiveau,
        selectedPromotion,
        selectedFormation,
        typeInscription
      )
      setEtudiants(etudiantsData)
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
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
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
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
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
                {rootFilieres.map((filiere) => (
                  <button
                    key={filiere.id}
                    onClick={() => setSelectedFiliere(filiere.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                  >
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
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {typeInscription === 'inscription' ? 'Inscriptions' : 'Réinscriptions'} - {filieres.find(f => f.id === selectedFiliere)?.code || filieres.find(f => f.id === selectedFiliere)?.nom}
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
                    <button
                      key={niveau.id || niveau.code}
                      onClick={() => {
                        setSelectedNiveau(niveau.id)
                        setSelectedOptionFiliereId('')
                      }}
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

  // Vue 2bis : Choix d'option pour L3 (si la filière a des sous-parcours)
  const selectedNiveauObj = niveaux.find(n => n.id === selectedNiveau) || null
  const niveauCode = selectedNiveauObj?.code || ''
  const optionsPourFiliere = selectedFiliere ? getChildFilieresForParent(selectedFiliere) : []
  const requiresOption = niveauCode === 'L3' && optionsPourFiliere.length > 0

  if (requiresOption && !selectedOptionFiliereId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {typeInscription === 'inscription' ? 'Inscriptions' : 'Réinscriptions'} - {filieres.find(f => f.id === selectedFiliere)?.code || filieres.find(f => f.id === selectedFiliere)?.nom}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">Niveau: {selectedNiveauObj?.nom || niveauCode} — sélectionnez l'option</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Choisissez l'option (L3)</h2>
              <p className="text-slate-600 text-center mb-6">
                Filière: <span className="font-medium text-blue-600">{filieres.find(f => f.id === selectedFiliere)?.nom}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {optionsPourFiliere.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptionFiliereId(opt.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{opt.code || opt.nom}</div>
                      <div className="text-sm text-slate-600">{opt.nom}</div>
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

  // Vue 3: Profil détaillé avec documents
  if (selectedEtudiant) {
    if (loading && !dossierComplet) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
          <AdminSidebar />
          <div className="flex flex-col lg:ml-64 min-h-screen">
            <AdminHeader />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
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
    const isAlreadyFinalized = dossier.inscription?.statut === 'INSCRIT'
    const validation = canFinalizeInscription()
    const canFinalize = validation.valid && !isAlreadyFinalized

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
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
                <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${isAlreadyFinalized
                  ? 'bg-blue-100 text-blue-700'
                  : documentsComplete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                  {isAlreadyFinalized
                    ? '✓ Déjà inscrit'
                    : documentsComplete
                      ? '✓ Dossier complet'
                      : '⚠ Documents manquants'}
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
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          // Si l'image ne charge pas, afficher les initiales
                          e.target.style.display = 'none'
                          const parent = e.target.parentElement
                          if (parent && !parent.querySelector('.fallback-initials')) {
                            const fallback = document.createElement('span')
                            fallback.textContent = `${dossier.etudiant.prenom[0]}${dossier.etudiant.nom[0]}`
                            fallback.className = 'fallback-initials absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600'
                            parent.appendChild(fallback)
                          }
                        }}
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {dossier.inscription?.formation?.nom || selectedEtudiant.formation || 'Formation non spécifiée'}
                    </span>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {dossier.inscription?.filiere?.nom || selectedEtudiant.filiere} - {dossier.inscription?.niveau?.nom || selectedEtudiant.niveau}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Informations personnelles</h3>
                  <div className="flex gap-2">
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
                    <button
                      onClick={handleDeleteEtudiant}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                      disabled={loading}
                      title="Supprimer l'étudiant"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Supprimer
                    </button>
                  </div>
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
                            <div className="flex gap-2 flex-wrap">
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
                              <button
                                onClick={() => handleDeleteDocument(docType)}
                                disabled={uploading[docType]}
                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Supprimer le document"
                              >
                                <FontAwesomeIcon icon={faTrash} />Supprimer
                              </button>
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
                {isAlreadyFinalized ? (
                  <div className="w-full py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 bg-blue-100 text-blue-700">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Inscription déjà finalisée
                  </div>
                ) : (
                  <button
                    onClick={handleFinaliserInscription}
                    disabled={!canFinalize || loading}
                    className={`w-full py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 ${canFinalize && !loading
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    title={!canFinalize && !isAlreadyFinalized ? validation.reason : ''}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Finalisation en cours...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        {canFinalize
                          ? (typeInscription === 'inscription' ? 'Finaliser l\'inscription' : 'Finaliser la réinscription')
                          : validation.reason || 'Informations incomplètes'
                        }
                      </>
                    )}
                  </button>
                )}
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

    // Filtre par statut d'inscription
    if (filtreInscrit === 'inscrits' && !(e.inscrit || e.statut === 'INSCRIT')) {
      return false
    }
    if (filtreInscrit === 'non-inscrits' && (e.inscrit || e.statut === 'INSCRIT')) {
      return false
    }

    // Filtre par recherche textuelle
    const nomComplet = `${e.nom || ''} ${e.prenom || ''}`.toLowerCase()
    const matricule = (e.matricule || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return nomComplet.includes(query) || matricule.includes(query)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              {typeInscription === 'inscription' ? 'Candidats' : 'Étudiants à réinscrire'} - {filieres.find(f => f.id === (selectedOptionFiliereId || selectedFiliere))?.nom} - {niveaux.find(n => n.id === selectedNiveau)?.nom || niveaux.find(n => n.id === selectedNiveau)?.code}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {etudiantsFiltres.length} {typeInscription === 'inscription' ? 'candidat' : 'étudiant'}{etudiantsFiltres.length > 1 ? 's' : ''} trouvé{etudiantsFiltres.length > 1 ? 's' : ''}
              {filtreInscrit !== 'tous' && ` (${etudiants.length} au total)`}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-64">
                <select
                  value={filtreInscrit}
                  onChange={(e) => setFiltreInscrit(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="tous">Tous les candidats</option>
                  <option value="inscrits">Inscrits uniquement</option>
                  <option value="non-inscrits">Non inscrits uniquement</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleBulkPlaceholderDocuments}
                disabled={loading || fillingPlaceholders || bulkFinalizing}
                title="Ajoute des fichiers modèles pour toutes les pièces manquantes de cette filière / niveau (sans écraser les fichiers existants)."
                className="shrink-0 px-4 py-3 rounded-lg font-medium text-amber-900 bg-amber-100 border border-amber-300 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faUpload} className={fillingPlaceholders ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">Documents modèles (tous)</span>
                <span className="sm:hidden">Modèles</span>
              </button>
              <button
                type="button"
                onClick={handleBulkFinaliserComplets}
                disabled={loading || bulkFinalizing || fillingPlaceholders}
                title="Passe en INSCRIT toutes les inscriptions du périmètre dont le dossier est complet (pièces + infos perso + parent), sauf celles déjà inscrites."
                className="shrink-0 px-4 py-3 rounded-lg font-medium text-white bg-green-600 border border-green-700 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faCheckCircle} className={bulkFinalizing ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">Tout finaliser (complets)</span>
                <span className="sm:hidden">Finaliser</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'grid'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  title="Vue grille"
                >
                  <FontAwesomeIcon icon={faTh} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'list'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  title="Vue liste"
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </div>
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {etudiantsFiltres.map((etudiant) => {
                const docsComplete = allDocumentsPresent(etudiant.documents)
                return (
                  <div key={etudiant.id} className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden flex-shrink-0">
                          {etudiant.photo ? (
                            <img
                              src={etudiant.photo.startsWith('http') ? etudiant.photo : `http://localhost:3000${etudiant.photo}`}
                              alt={`${etudiant.prenom || ''} ${etudiant.nom || ''}`}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // Si l'image ne charge pas, masquer l'image et afficher les initiales
                                e.target.style.display = 'none'
                                const parent = e.target.parentElement
                                if (parent && !parent.querySelector('.fallback-initials')) {
                                  const fallback = document.createElement('span')
                                  fallback.textContent = `${etudiant.prenom?.[0] || ''}${etudiant.nom?.[0] || ''}`
                                  fallback.className = 'fallback-initials absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600'
                                  parent.appendChild(fallback)
                                }
                              }}
                            />
                          ) : null}
                          {!etudiant.photo && (
                            <span className="absolute inset-0 flex items-center justify-center">{(etudiant.prenom?.[0] || '')}{(etudiant.nom?.[0] || '')}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{etudiant.prenom || ''} {etudiant.nom || ''}</h3>
                          <p className="text-sm text-slate-600">{etudiant.matricule || 'N/A'}</p>
                          <p className="text-sm text-slate-600">{etudiant.email || 'Email non renseigné'}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${docsComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {docsComplete ? '✓ Complet' : '⚠ Incomplet'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-slate-700 mb-2">Documents:</p>
                        <div className="flex gap-2 flex-wrap">
                          {['acteNaissance', 'photo', 'quittance', 'pieceIdentite', 'releveBac', 'attestationReussiteBac'].map(doc => {
                            // Vérifier si le document est uploadé (peut être string ou objet)
                            const docData = etudiant.documents?.[doc]
                            const isUploaded = typeof docData === 'string' ? !!docData : docData?.uploaded || false

                            // Labels pour l'affichage
                            const labels = {
                              acteNaissance: 'Acte',
                              photo: 'Photo',
                              quittance: 'Quittance',
                              pieceIdentite: 'CNI',
                              releveBac: 'Relevé Bac',
                              attestationReussiteBac: 'Attest. Bac'
                            }

                            return (
                              <span key={doc} className={`text-xs px-2 py-1 rounded ${isUploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {labels[doc] || doc}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      {etudiant.inscrit || etudiant.statut === 'INSCRIT' ? (
                        <button
                          onClick={() => setSelectedEtudiant(etudiant)}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faCheckCircle} />Déjà inscrit - Voir le dossier
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedEtudiant(etudiant)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faEye} />Voir le dossier
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Étudiant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Matricule</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {etudiantsFiltres.map((etudiant, index) => {
                      const docsComplete = allDocumentsPresent(etudiant.documents)
                      const labels = {
                        acteNaissance: 'Acte',
                        photo: 'Photo',
                        quittance: 'Quittance',
                        pieceIdentite: 'CNI',
                        releveBac: 'Relevé Bac',
                        attestationReussiteBac: 'Attest. Bac'
                      }
                      return (
                        <tr
                          key={etudiant.id}
                          className={`hover:bg-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base overflow-hidden flex-shrink-0 ring-2 ring-blue-100">
                                {etudiant.photo ? (
                                  <img
                                    src={etudiant.photo.startsWith('http') ? etudiant.photo : `http://localhost:3000${etudiant.photo}`}
                                    alt={`${etudiant.prenom || ''} ${etudiant.nom || ''}`}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      const parent = e.target.parentElement
                                      if (parent && !parent.querySelector('.fallback-initials')) {
                                        const fallback = document.createElement('span')
                                        fallback.textContent = `${etudiant.prenom?.[0] || ''}${etudiant.nom?.[0] || ''}`
                                        fallback.className = 'fallback-initials absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600'
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                ) : null}
                                {!etudiant.photo && (
                                  <span className="absolute inset-0 flex items-center justify-center">{(etudiant.prenom?.[0] || '')}{(etudiant.nom?.[0] || '')}</span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{etudiant.prenom || ''} {etudiant.nom || ''}</div>
                                {etudiant.email && (
                                  <div className="text-xs text-slate-500 mt-0.5">{etudiant.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-md inline-block">
                              {etudiant.matricule || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-slate-600 flex items-center gap-2">
                              {etudiant.email ? (
                                <>
                                  <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 text-xs" />
                                  <span>{etudiant.email}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Email non renseigné</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {(etudiant.inscrit || etudiant.statut === 'INSCRIT') ? (
                              <span className="px-3 py-1.5 text-xs font-semibold rounded-lg inline-block w-fit bg-blue-100 text-blue-700 border border-blue-300">
                                ✓ Inscrit
                              </span>
                            ) : (
                              <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-block w-fit ${docsComplete ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-amber-100 text-amber-700 border border-amber-300'
                                }`}>
                                {docsComplete ? '✓ Complet' : '⚠ Incomplet'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {etudiant.inscrit || etudiant.statut === 'INSCRIT' ? (
                              <button
                                onClick={() => setSelectedEtudiant(etudiant)}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                                <FontAwesomeIcon icon={faCheckCircle} />Voir
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedEtudiant(etudiant)}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                                <FontAwesomeIcon icon={faEye} />Voir
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal pour afficher les identifiants de connexion */}
      {showCredentialsModal && studentCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FontAwesomeIcon icon={faKey} />
                  Identifiants de connexion générés
                </h2>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setStudentCredentials(null)
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-lg text-slate-700 mb-4">
                  L'inscription de <strong>{studentCredentials.nom}</strong> a été finalisée avec succès.
                </p>
                <p className="text-sm text-slate-600 mb-6">
                  Veuillez noter ces identifiants et les communiquer à l'étudiant :
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faIdCard} className="text-blue-600" />
                  Identifiants de connexion
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={studentCredentials.email}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(studentCredentials.email)
                          success('Email copié dans le presse-papiers')
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Copier"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Matricule</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={studentCredentials.matricule}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-slate-800 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(studentCredentials.matricule)
                          success('Matricule copié dans le presse-papiers')
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Copier"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={studentCredentials.password}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white border-2 border-green-300 rounded-lg text-slate-800 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(studentCredentials.password)
                          success('Mot de passe copié dans le presse-papiers')
                        }}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Copier"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Important :</strong> Ces identifiants sont affichés une seule fois. Assurez-vous de les noter ou de les copier avant de fermer cette fenêtre.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    // Copier tous les identifiants dans le presse-papiers
                    const text = `Identifiants de connexion - ${studentCredentials.nom}\n\nEmail: ${studentCredentials.email}\nMatricule: ${studentCredentials.matricule}\nMot de passe: ${studentCredentials.password}`
                    navigator.clipboard.writeText(text)
                    success('Tous les identifiants copiés dans le presse-papiers')
                  }}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCopy} />
                  Copier tout
                </button>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setStudentCredentials(null)
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(fillingPlaceholders || bulkFinalizing) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
          aria-label={fillingPlaceholders ? 'Traitement des documents en cours' : 'Finalisation des inscriptions en cours'}
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/80">
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-[3px] border-blue-100 border-t-blue-600 border-r-blue-500 animate-spin"
                  style={{ animationDuration: '0.95s' }}
                />
                <div
                  className="absolute inset-2 rounded-full border-[3px] border-emerald-100/80 border-b-emerald-600 border-l-emerald-500 animate-spin-reverse"
                />
                <div className="absolute inset-5 rounded-full border border-slate-200/90 bg-gradient-to-br from-blue-50 to-white shadow-inner" />
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="relative text-2xl text-blue-600 animate-spin"
                  style={{ animationDuration: '0.65s' }}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-slate-800">
                  {fillingPlaceholders
                    ? 'Remplissage des dossiers'
                    : 'Finalisation des inscriptions'}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {fillingPlaceholders
                    ? 'Génération des pièces modèles et mise à jour des fiches…'
                    : 'Création des comptes étudiants et passage au statut inscrit…'}
                </p>
                <p className="text-xs text-slate-500 pt-1 animate-pulse">Veuillez patienter</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GererInscriptionsView




