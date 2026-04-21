import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileExcel,
  faUpload,
  faDownload,
  faCheckCircle,
  faInfoCircle,
  faExclamationTriangle,
  faSpinner,
  faUserPlus,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { getFormations, getFilieres, getPromotions } from '../../api/scolarite'
import { pickPromotionForCurrentAcademicYear, getCurrentAcademicYearLabel } from '../../utils/academicYear.js'
import { creerEtudiantManuel } from '../../api/scolarite'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const ImporterCandidatsView = () => {
  const location = useLocation()

  const { success, error: alertError } = useAlert()
  const { isAuthenticated, user } = useAuth()



  const [selectedFile, setSelectedFile] = useState(null)
  const [anneeAcademique, setAnneeAcademique] = useState(getCurrentAcademicYearLabel())

  const importAnneeOptions = useMemo(() => {
    const label = getCurrentAcademicYearLabel()
    const parts = label.split('-').map((x) => parseInt(String(x).trim().replace(/\//g, ''), 10))
    const endY = Number.isFinite(parts[1]) ? parts[1] : new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => {
      const yr = endY - i
      return { value: `${yr - 1}-${yr}`, label: `${yr - 1}–${yr}` }
    })
  }, [])
  // Paramètres d'import
  const [importFormationId, setImportFormationId] = useState('')
  const [importNiveauId, setImportNiveauId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Données pour le formulaire
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [promotions, setPromotions] = useState([])
  
  // Formulaire étudiant
  const [formData, setFormData] = useState({
    // Informations étudiant
    matricule: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: '',
    sexe: '',
    email: '',
    telephone: '',
    adresse: '',
    // Informations inscription
    promotionId: '',
    formationId: '',
    filiereId: '',
    optionFiliereId: '',
    niveauId: '',
    typeInscription: 'INSCRIPTION'
  })

  const selectedNiveauObj = niveaux.find(n => n.id === formData.niveauId)
  const selectedNiveauCode = (selectedNiveauObj?.code || '').toUpperCase()
  const selectedFiliereObj = filieres.find(f => f.id === formData.filiereId) || null
  const selectedFiliereParentId = selectedFiliereObj?.parent_filiere_id || selectedFiliereObj?.id || null
  const optionsForSelectedFiliere = filieres.filter(f => f.parent_filiere_id === selectedFiliereParentId)
  const requiresL3Option = selectedNiveauCode === 'L3' && optionsForSelectedFiliere.length > 0

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')) {
        setSelectedFile(file)
        setUploadResult(null)
      } else {
        alertError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alertError('Veuillez sélectionner un fichier Excel')
      return
    }

    if (!importFormationId || !importNiveauId) {
      alertError('Veuillez sélectionner une formation et un niveau avant d\'importer')
      return
    }

    if (!isAuthenticated || !user) {
      alertError('Vous devez être connecté pour importer des étudiants')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('anneeAcademique', anneeAcademique)
      formData.append('formationId', importFormationId)
      formData.append('niveauId', importNiveauId)

      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('token')
      console.log('Token récupéré:', token ? 'Présent' : 'Manquant', token ? `(${token.length} caractères)` : '')

      if (!token) {
        console.error('Token manquant dans localStorage')
        alertError('Votre session a expiré. Veuillez vous reconnecter.')
        setIsUploading(false)
        return
      }

      console.log('Envoi de la requête d\'import...')
      const response = await fetch(`${API_URL}/scolarite/import-etudiants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('Réponse reçue:', response.status, response.statusText)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }

      setUploadResult(data)
      success(data.message || 'Import réussi !')
      setSelectedFile(null)

      // Réinitialiser le champ fichier
      const fileInput = document.getElementById('file-upload')
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      setUploadResult({
        success: false,
        message: error.message || 'Erreur lors de l\'import du fichier'
      })
      alertError(error.message || 'Erreur lors de l\'import du fichier')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!importNiveauId) {
      alertError('Sélectionnez d\'abord le niveau : le modèle Excel (onglets) dépend du niveau (L1/L2 tronc commun, L3 options).')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const qs = new URLSearchParams({ niveauId: importNiveauId })
      const response = await fetch(`${API_URL}/scolarite/template-excel?${qs.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const ct = response.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const errBody = await response.json().catch(() => ({}))
          throw new Error(errBody.error || 'Erreur lors du téléchargement')
        }
        throw new Error('Erreur lors du téléchargement')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const niveauCode = niveaux.find(n => n.id === importNiveauId)?.code || 'niveau'
      a.download = `modele_import_candidats_${niveauCode}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alertError(err.message || 'Impossible de télécharger le modèle Excel')
    }
  }

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token')
        const [formationsData, filieresData, promotionsData, niveauxResponse] = await Promise.all([
          getFormations(),
          getFilieres({ sansGroupes: true }),
          getPromotions(),
          fetch(`${API_URL}/scolarite/niveaux`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.json())
        ])
        setFormations(formationsData)
        setFilieres(filieresData)
        setPromotions(promotionsData)
        const niveauxData = niveauxResponse || []
        setNiveaux(niveauxData)

        // Paramètres d'import : pré-sélectionner formation 1 et niveau L1
        if (formationsData.length > 0) setImportFormationId(formationsData[0].id)
        const niveauL1 = niveauxData.find(n => n.code === 'L1')
        if (niveauL1) setImportNiveauId(niveauL1.id)
        
        const promoDefaut = pickPromotionForCurrentAcademicYear(promotionsData)
        if (promoDefaut) {
          setFormData(prev => ({ ...prev, promotionId: promoDefaut.id }))
        }
        
        // Sélectionner la première formation par défaut
        if (formationsData.length > 0) {
          setFormData(prev => ({ ...prev, formationId: formationsData[0].id }))
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        alertError('Erreur lors du chargement des données')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!requiresL3Option) return
    if (!selectedFiliereObj?.parent_filiere_id) return
    if (formData.optionFiliereId) return
    setFormData(prev => ({ ...prev, optionFiliereId: selectedFiliereObj.id }))
  }, [requiresL3Option, selectedFiliereObj, formData.optionFiliereId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'filiereId') {
        next.optionFiliereId = ''
      }
      if (name === 'niveauId') {
        const niveau = niveaux.find(n => n.id === value)
        if ((niveau?.code || '').toUpperCase() !== 'L3') {
          next.optionFiliereId = ''
        }
      }
      return next
    })
  }

  const handleOpenModal = () => {
    setShowAddModal(true)
    // Réinitialiser le formulaire
    setFormData({
      matricule: '',
      nom: '',
      prenom: '',
      dateNaissance: '',
      lieuNaissance: '',
      nationalite: '',
      sexe: '',
      email: '',
      telephone: '',
      adresse: '',
      promotionId: pickPromotionForCurrentAcademicYear(promotions)?.id || '',
      formationId: formations[0]?.id || '',
      filiereId: '',
      optionFiliereId: '',
      niveauId: '',
      typeInscription: 'INSCRIPTION'
    })
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation — seul le nom est obligatoire (certains étudiants n'ont pas de prénom)
    if (!formData.nom?.trim()) {
      alertError('Le nom est obligatoire')
      return
    }
    
    if (!formData.promotionId || !formData.formationId || !formData.filiereId || !formData.niveauId) {
      alertError('Veuillez remplir tous les champs d\'inscription')
      return
    }
    if (requiresL3Option && !formData.optionFiliereId) {
      alertError('En L3, veuillez sélectionner une option/parcours.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await creerEtudiantManuel({
        ...formData,
        anneeAcademique
      })
      
      success(`Étudiant ${[formData.nom, formData.prenom].filter(Boolean).join(' ').trim()} créé avec succès !`)
      handleCloseModal()
      
      // Réinitialiser le formulaire
      setFormData({
        matricule: '',
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        nationalite: '',
        sexe: '',
        email: '',
        telephone: '',
        adresse: '',
        promotionId: pickPromotionForCurrentAcademicYear(promotions)?.id || '',
        formationId: formations[0]?.id || '',
        filiereId: '',
        optionFiliereId: '',
        niveauId: '',
        typeInscription: 'INSCRIPTION'
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error)
      alertError(error.message || 'Erreur lors de la création de l\'étudiant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Importer candidats admis
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Importez un fichier Excel contenant la liste des candidats admis au concours
            </p>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Une feuille par filière / parcours.</strong> Le modèle Excel téléchargeable contient un onglet pour
                    chaque parcours (Génie Info, Réseaux-Télécoms, Technico-commercial, Web Mastering, Ecommerce Digital,
                    Management des TIC, Audiovisuel, etc.). <strong>Supprimez les feuilles dont vous n&apos;avez pas besoin</strong> avant d&apos;importer.
                  </li>
                  <li>
                    Le nom de chaque onglet sert à reconnaître la filière (mappage automatique vers les codes en base).
                  </li>
                  <li>
                    <strong>Colonne obligatoire :</strong> en-tête reconnaissable pour <strong>Nom</strong> (ex. « Nom(s) »). <strong>Prénom</strong> est <strong>optionnel</strong> (colonne vide ou absente acceptée).
                    Toutes les autres colonnes du modèle sont <strong>facultatives</strong> : vous pouvez les laisser vides ou les retirer du fichier pour compléter les dossiers plus tard.
                  </li>
                  <li>En L3, utilisez des onglets d&apos;option explicites (ex: GI-DAR, RT-AZUR, MMI-WM, MTIC-EMCD), pas seulement le tronc (GI/RT/MMI/MTIC).</li>
                  <li>Le modèle Excel téléchargeable s&apos;adapte au <strong>niveau</strong> choisi ci-dessus : L1/L2 = tronc commun uniquement ; L3 = une feuille par option (et les filières sans option comme TC).</li>
                  <li>Vérifiez que l&apos;année académique et la formation sélectionnées correspondent à votre import.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire d'import */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Paramètres d'import</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Année académique */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Année académique *</label>
                <select
                  value={anneeAcademique}
                  onChange={(e) => setAnneeAcademique(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {importAnneeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Formation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Formation *</label>
                <select
                  value={importFormationId}
                  onChange={(e) => setImportFormationId(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Sélectionner</option>
                  {formations.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>

              {/* Niveau */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niveau *</label>
                <select
                  value={importNiveauId}
                  onChange={(e) => setImportNiveauId(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Sélectionner</option>
                  {niveaux.map(n => (
                    <option key={n.id} value={n.id}>{n.nom} ({n.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Ajouter un étudiant
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Chaque onglet du fichier correspond à une filière : seules les feuilles présentes (non vides) sont importées.
            </p>

            {/* Zone de téléversement */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
              <FontAwesomeIcon icon={faFileExcel} className="text-5xl text-green-600 mb-4" />
              <p className="text-slate-700 font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Glisser-déposer un fichier Excel ici'}
              </p>
              <p className="text-sm text-slate-500 mb-4">ou</p>
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
              >
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                Sélectionner un fichier
              </label>
              <div className="mt-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center mx-auto"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Télécharger le modèle Excel
                </button>
              </div>
            </div>

            {/* Résultat de l'upload */}
            {uploadResult && (
              <div className={`mt-4 p-4 rounded-lg ${uploadResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={uploadResult.success ? faCheckCircle : faExclamationTriangle}
                    className="mr-3 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium mb-2">{uploadResult.message}</p>
                    {uploadResult.success && uploadResult.details && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm font-semibold mb-2">Détails par filière :</div>
                        {Object.entries(uploadResult.details).map(([filiere, details]) => (
                          <div key={filiere} className="bg-white/50 rounded p-2 text-sm">
                            <div className="font-medium text-green-900">{filiere}</div>
                            <div className="text-green-700 mt-1">
                              ✓ {details.etudiantsCrees} étudiants créés
                              {details.etudiantsExistant > 0 && (
                                <span className="ml-3">⚠ {details.etudiantsExistant} déjà existants</span>
                              )}
                            </div>
                            {details.erreurs && details.erreurs.length > 0 && (
                              <div className="text-red-600 text-xs mt-1">
                                {details.erreurs.length} erreur(s)
                              </div>
                            )}
                          </div>
                        ))}
                        {uploadResult.erreurs && uploadResult.erreurs.length > 0 && (
                          <div className="mt-3 text-xs text-red-600">
                            <div className="font-semibold mb-1">Erreurs :</div>
                            <ul className="list-disc list-inside space-y-1">
                              {uploadResult.erreurs.slice(0, 5).map((err, idx) => (
                                <li key={idx}>{err}</li>
                              ))}
                              {uploadResult.erreurs.length > 5 && (
                                <li>... et {uploadResult.erreurs.length - 5} autre(s) erreur(s)</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton d'import */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isUploading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Importer le fichier
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Modal d'ajout d'étudiant */}
          <Modal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            title="Ajouter un étudiant"
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations personnelles */}
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Matricule (optionnel)</label>
                    <input
                      type="text"
                      name="matricule"
                      value={formData.matricule}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Laissé vide pour génération automatique"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sexe</label>
                    <select
                      name="sexe"
                      value={formData.sexe}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom <span className="text-slate-400 font-normal">(optionnel)</span></label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      placeholder="Laisser vide si l&apos;étudiant n&apos;a pas de prénom"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formData.dateNaissance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lieu de naissance</label>
                    <input
                      type="text"
                      name="lieuNaissance"
                      value={formData.lieuNaissance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nationalité</label>
                    <input
                      type="text"
                      name="nationalite"
                      value={formData.nationalite}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                    <textarea
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informations d'inscription */}
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations d'inscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Promotion *</label>
                    <select
                      name="promotionId"
                      value={formData.promotionId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {promotions.map(promo => (
                        <option key={promo.id} value={promo.id}>{promo.annee}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Formation *</label>
                    <select
                      name="formationId"
                      value={formData.formationId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {formations.map(formation => (
                        <option key={formation.id} value={formation.id}>{formation.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filière *</label>
                    <select
                      name="filiereId"
                      value={formData.filiereId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {filieres.map(filiere => (
                        <option key={filiere.id} value={filiere.id}>{filiere.nom} ({filiere.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Niveau *</label>
                    <select
                      name="niveauId"
                      value={formData.niveauId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {niveaux.map(niveau => (
                        <option key={niveau.id} value={niveau.id}>{niveau.nom} ({niveau.code})</option>
                      ))}
                    </select>
                  </div>
                  {requiresL3Option && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Option / Parcours L3 *</label>
                      <select
                        name="optionFiliereId"
                        value={formData.optionFiliereId}
                        onChange={handleInputChange}
                        required={requiresL3Option}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner l'option</option>
                        {optionsForSelectedFiliere.map(option => (
                          <option key={option.id} value={option.id}>{option.nom} ({option.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type d'inscription *</label>
                    <select
                      name="typeInscription"
                      value={formData.typeInscription}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INSCRIPTION">Inscription</option>
                      <option value="REINSCRIPTION">Réinscription</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUserPlus} />
                      Ajouter l'étudiant
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ImporterCandidatsView

