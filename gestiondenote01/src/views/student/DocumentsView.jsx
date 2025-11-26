import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFilePdf,
  faDownload,
  faPrint,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const DocumentsView = () => {
  // Données par défaut pour l'affichage sans connexion
  const defaultStudentData = {
    id: 1,
    email: 'lidvige.mbo@example.com',
    matricule: '1045937',
    nom: 'MBO',
    prenom: 'Lidvige',
    programme: 'GI 2025 Génie Informatique',
    niveau: 'L3',
    moyenneGenerale: 14.5,
    credits: 24,
    totalModules: 15,
    rangClasse: 5,
    estActif: true,
    estBoursier: true,
    semestre: 'Semestre 5',
    derniereConnexion: new Date().toISOString()
  }

  const [student] = useState(() => {
    const studentData = localStorage.getItem('student')
    if (studentData) {
      return new StudentModel(JSON.parse(studentData))
    }
    return new StudentModel(defaultStudentData)
  })

  const [fileType, setFileType] = useState('')
  const [selectedDocument, setSelectedDocument] = useState('Attestation de scolarité')
  const [academicYear, setAcademicYear] = useState('2024-2025')

  const availableDocuments = [
    'Attestation de scolarité',
    'Relevé de notes',
    'Certificat de scolarité',
    'Attestation de réussite'
  ]

  const fileTypes = [
    'Tous les types',
    'PDF',
    'Image',
    'Document Word'
  ]

  const academicYears = [
    '2024-2025',
    '2023-2024',
    '2022-2023'
  ]

  const handleDownload = () => {
    // TODO: Implémenter le téléchargement
    console.log('Téléchargement du document:', selectedDocument)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Documents
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone principale - Prévisualisation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type de fichier */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type de fichier
                </label>
                <div className="relative">
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner</option>
                    {fileTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Zone de prévisualisation */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-xl p-6 sm:p-8 border-2 border-slate-200 min-h-[600px] sm:min-h-[700px] relative overflow-hidden">
                {/* Logo en haut à droite */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                    <span className="text-xs text-slate-600 font-bold tracking-wider">INPTIC</span>
                  </div>
                </div>
                
                {/* Effet de grille en arrière-plan */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `
                    linear-gradient(to right, #64748b 1px, transparent 1px),
                    linear-gradient(to bottom, #64748b 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Zone de prévisualisation du document */}
                <div className="w-full h-full flex items-center justify-center relative z-10">
                  <div className="text-center p-8 max-w-md">
                    {/* Icône avec effet de profondeur */}
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-200 inline-block">
                        <FontAwesomeIcon 
                          icon={faFilePdf} 
                          className="text-5xl sm:text-6xl text-red-500"
                        />
                      </div>
                    </div>
                    
                    {/* Message principal */}
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-700">
                        Aucun document sélectionné
                      </h3>
                      <p className="text-slate-500 text-sm sm:text-base">
                        Sélectionnez un document dans la liste pour le prévisualiser ici
                      </p>
                    </div>
                    
                    {/* Ligne décorative */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1"></div>
                    </div>
                  </div>
                </div>
                
                {/* Bordure décorative en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400"></div>
              </div>
            </div>

            {/* Panneau latéral - Actions */}
            <div className="space-y-6">
              {/* Liste des documents disponibles */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Liste des documents disponibles
                </label>
                <div className="relative">
                  <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {availableDocuments.map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Année académique */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Année Académique
                </label>
                <div className="relative">
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Section PDF */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-4 sm:p-6 border border-blue-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    PDF
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Fichier PDF</p>
                    <p className="text-xs text-slate-500">2.5 MB</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Télécharger
                </button>
              </div>

              {/* Section Impression */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-4">Impression</p>
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <FontAwesomeIcon icon={faPrint} />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DocumentsView

