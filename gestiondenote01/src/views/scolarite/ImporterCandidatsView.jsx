import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel, faUpload, faDownload, faCheckCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'

const ImporterCandidatsView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  const [selectedFile, setSelectedFile] = useState(null)
  const [anneeAcademique, setAnneeAcademique] = useState('2025')
  const [filiere, setFiliere] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const filieres = [
    'Génie Informatique',
    'Réseau et Télécom',
    'Management et Multimédias'
  ]

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
        alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !filiere) {
      alert('Veuillez sélectionner un fichier et une filière')
      return
    }

    setIsUploading(true)
    
    // Simulation de l'upload
    setTimeout(() => {
      setIsUploading(false)
      setUploadResult({
        success: true,
        message: 'Fichier importé avec succès!',
        candidatsImports: 45
      })
      setSelectedFile(null)
    }, 2000)
  }

  const handleDownloadTemplate = () => {
    // Créer un template Excel (simulation)
    alert('Téléchargement du modèle Excel...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
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
                  <li>Le fichier Excel doit contenir les colonnes : Nom, Prénom, Email, Téléphone, Filière, Année académique</li>
                  <li>Assurez-vous que le fichier correspond à l'année académique sélectionnée</li>
                  <li>Vous pouvez télécharger un modèle Excel pour vous aider</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire d'import */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Paramètres d'import</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Année académique</label>
                <select
                  value={anneeAcademique}
                  onChange={(e) => setAnneeAcademique(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filière</label>
                <select
                  value={filiere}
                  onChange={(e) => setFiliere(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
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
              <div className={`mt-4 p-4 rounded-lg flex items-center ${
                uploadResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-3" />
                <div>
                  <p className="font-medium">{uploadResult.message}</p>
                  {uploadResult.candidatsImports && (
                    <p className="text-sm mt-1">{uploadResult.candidatsImports} candidats importés</p>
                  )}
                </div>
              </div>
            )}

            {/* Bouton d'import */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !filiere || isUploading}
                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                {isUploading ? 'Import en cours...' : 'Importer le fichier'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ImporterCandidatsView

