import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserCheck, faSearch, faCheckCircle, faTimes, faEye, faFileAlt,
  faIdCard, faMoneyBillWave, faImage, faUpload, faUser, faCalendar,
  faEnvelope, faPhone, faArrowLeft, faDownload, faGraduationCap, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'
import { useAlert } from '../../contexts/AlertContext'

const GererInscriptionsView = () => {
  const { showAlert } = useAlert()
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const filieres = [
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'MM', nom: 'Management et Multimédias' }
  ]
  
  const niveaux = ['L1', 'L2', 'L3']

  const [etudiantsData] = useState({
    'GI': {
      'L1': [
        {
          id: 1, nom: 'MBO', prenom: 'Lidvige', matricule: 'GI2025-L1-001',
          email: 'lidvigembo@mail.com', telephone: '077 00 00 01',
          dateNaissance: '2005-05-15', lieuNaissance: 'Libreville',
          adresse: 'Quartier Nzeng-Ayong', filiere: 'GI', niveau: 'L1',
          documents: { acteNaissance: null, photo: null, quittance: null, pieceIdentite: null }
        },
        {
          id: 2, nom: 'OWONO', prenom: 'Pierre', matricule: 'GI2025-L1-002',
          email: 'pierre.owono@mail.com', telephone: '077 00 00 02',
          dateNaissance: '2005-03-20', lieuNaissance: 'Port-Gentil',
          adresse: 'Quartier Lalala', filiere: 'GI', niveau: 'L1',
          documents: {
            acteNaissance: { nom: 'acte_naissance.pdf', uploaded: true },
            photo: { nom: 'photo.jpg', uploaded: true },
            quittance: null,
            pieceIdentite: { nom: 'cni.pdf', uploaded: true }
          }
        }
      ],
      'L2': [
        {
          id: 3, nom: 'NGUEMA', prenom: 'Marie', matricule: 'GI2024-L2-001',
          email: 'marie.nguema@mail.com', telephone: '077 00 00 03',
          dateNaissance: '2004-08-10', lieuNaissance: 'Franceville',
          adresse: 'Quartier Glass', filiere: 'GI', niveau: 'L2',
          documents: {
            acteNaissance: { nom: 'acte_naissance.pdf', uploaded: true },
            photo: { nom: 'photo.jpg', uploaded: true },
            quittance: { nom: 'quittance.pdf', uploaded: true },
            pieceIdentite: { nom: 'cni.pdf', uploaded: true }
          }
        }
      ],
      'L3': []
    },
    'RT': {
      'L1': [
        {
          id: 4, nom: 'NKOMO', prenom: 'Jean', matricule: 'RT2025-L1-001',
          email: 'jean.nkomo@mail.com', telephone: '077 00 00 04',
          dateNaissance: '2005-11-25', lieuNaissance: 'Oyem',
          adresse: 'Quartier Sotega', filiere: 'RT', niveau: 'L1',
          documents: {
            acteNaissance: { nom: 'acte_naissance.pdf', uploaded: true },
            photo: null, quittance: null, pieceIdentite: null
          }
        }
      ],
      'L2': [], 'L3': []
    },
    'MM': { 'L1': [], 'L2': [], 'L3': [] }
  })

  const handleBack = () => {
    if (selectedEtudiant) setSelectedEtudiant(null)
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
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
      showAlert(`${selectedEtudiant.prenom} ${selectedEtudiant.nom} a été inscrit avec succès!`, 'success')
      setSelectedEtudiant(null)
    } else {
      showAlert('Veuillez uploader tous les documents requis', 'error')
    }
  }

  // Vue 1: Sélection de la filière
  if (!selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les inscriptions
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la filière pour commencer
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Inscriptions - {selectedFiliere}
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
                  const count = etudiantsData[selectedFiliere]?.[niveau]?.length || 0
                  return (
                    <button key={niveau} onClick={() => setSelectedNiveau(niveau)}
                      className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau}</div>
                        <div className="text-sm text-slate-600 mb-2">
                          {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                        </div>
                        <div className="text-xs text-slate-500 mt-3 px-3 py-1 bg-slate-100 rounded-full inline-block">
                          {count} candidat{count > 1 ? 's' : ''}
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
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour à la liste
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">Dossier d'inscription</h1>
                  <p className="text-sm sm:text-base text-slate-600">{selectedFiliere} • {selectedNiveau}</p>
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
                  {documentsComplete ? 'Finaliser l\'inscription' : 'Documents incomplets'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Liste des étudiants
  const etudiants = (etudiantsData[selectedFiliere]?.[selectedNiveau] || []).filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarScolarite />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderScolarite scolariteName="Service Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Candidats {selectedFiliere} - {selectedNiveau}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">{etudiants.length} candidat{etudiants.length > 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {etudiants.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <FontAwesomeIcon icon={faUserCheck} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun candidat trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {etudiants.map((etudiant) => {
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




