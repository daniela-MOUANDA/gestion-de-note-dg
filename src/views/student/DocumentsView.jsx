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
  const [academicYear, setAcademicYear] = useState('2025-2026')

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
    '2025-2026',
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />

        <main className="flex-1 p-6 pt-24">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Documents Administratifs</h1>
            <p className="text-slate-500">Générez et téléchargez vos attestations et relevés officiels</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone principale - Prévisualisation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type de fichier */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Format de sortie
                </label>
                <div className="relative">
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner le format</option>
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
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Logo en haut à droite */}
                <div className="absolute top-6 right-6">
                  <div className="px-3 py-1 border border-slate-100 rounded text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Document Officiel
                  </div>
                </div>

                {/* Zone de prévisualisation du document */}
                <div className="text-center max-w-sm">
                  <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-xs">
                      <FontAwesomeIcon
                        icon={faFilePdf}
                        className="text-4xl text-slate-300"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    Aperçu du document
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Sélectionnez un document et une année académique pour générer un aperçu officiel.
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px bg-slate-100 w-12"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    <div className="h-px bg-slate-100 w-12"></div>
                  </div>
                </div>

                {/* Bordure décorative en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100"></div>
              </div>
            </div>

            {/* Panneau latéral - Actions */}
            <div className="space-y-6">
              {/* Configuration du document */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-50">Options de génération</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Type de document
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDocument}
                        onChange={(e) => setSelectedDocument(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        {availableDocuments.map((doc) => (
                          <option key={doc} value={doc}>{doc}</option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Année Académique
                    </label>
                    <div className="relative">
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        {academicYears.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions de sortie */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-50">Actions</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Télécharger PDF
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    Imprimer
                  </button>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="text-red-500 font-bold text-xs px-1.5 py-0.5 border border-red-200 rounded">PDF</div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Prêt pour l'export</p>
                      <p className="text-[10px] text-slate-400">Taille estimée : 2.5 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DocumentsView

