import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileExcel,
  faUpload,
  faDownload,
  faCheckCircle,
  faInfoCircle,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const ImporterCandidatsView = () => {
  const location = useLocation()

  const { success, error: alertError } = useAlert()
  const { isAuthenticated, user } = useAuth()



  const [selectedFile, setSelectedFile] = useState(null)
  const [anneeAcademique, setAnneeAcademique] = useState('2025')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

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

  const handleDownloadTemplate = () => {
    // TODO: Créer et télécharger un template Excel
    alert('Fonctionnalité de téléchargement du modèle à venir')
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
                  <li>Le fichier Excel doit contenir plusieurs feuilles, une par filière (ex: "Génie Info", "Réseaux-Télécoms", "Management des TIC")</li>
                  <li>Chaque feuille doit contenir les colonnes : N°, Nom(s), Prénom(s), Date et lieu de naissance, Série du BAC, Année d'obtention, Sexe</li>
                  <li>Les filières seront détectées automatiquement depuis les noms des feuilles Excel</li>
                  <li>Assurez-vous que le fichier correspond à l'année académique sélectionnée</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire d'import */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Paramètres d'import</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Année académique</label>
              <select
                value={anneeAcademique}
                onChange={(e) => setAnneeAcademique(e.target.value)}
                disabled={isUploading}
                className="w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Les filières seront détectées automatiquement depuis les feuilles Excel</p>
            </div>

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
        </main>
      </div>
    </div>
  )
}

export default ImporterCandidatsView

