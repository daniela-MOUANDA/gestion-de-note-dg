import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserCheck, 
  faSearch, 
  faCheckCircle, 
  faTimes, 
  faEye,
  faFileAlt,
  faIdCard,
  faMoneyBillWave,
  faImage,
  faUpload,
  faUser,
  faCalendar,
  faEnvelope,
  faPhone,
  faFilter
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'

const GererInscriptionsView = () => {
  const [filiereActive, setFiliereActive] = useState('Génie Informatique')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidat, setSelectedCandidat] = useState(null)
  const [showDossier, setShowDossier] = useState(false)
  
  const filieres = ['Génie Informatique', 'Réseau et Télécom', 'Management et Multimédias']
  
  const [candidats] = useState([
    {
      id: 1,
      nom: 'MBO',
      prenom: 'Lidvige',
      email: 'lidvigembo@mail.com',
      telephone: '077 00 00 00',
      dateNaissance: '2000-05-15',
      lieuNaissance: 'Yaoundé',
      filiere: 'Génie Informatique',
      anneeAcademique: '2025',
      documents: {
        acteNaissance: null,
        photo: null,
        quittance: null,
        pieceIdentite: null
      },
      statut: 'Candidat admis',
      photo: null
    },
    {
      id: 2,
      nom: 'DUPONT',
      prenom: 'Jean',
      email: 'jean.dupont@mail.com',
      telephone: '077 00 00 01',
      dateNaissance: '2001-03-20',
      lieuNaissance: 'Douala',
      filiere: 'Réseau et Télécom',
      anneeAcademique: '2025',
      documents: {
        acteNaissance: { nom: 'acte_naissance.pdf', uploaded: true },
        photo: { nom: 'photo.jpg', uploaded: true },
        quittance: null,
        pieceIdentite: { nom: 'cni.pdf', uploaded: true }
      },
      statut: 'Candidat admis',
      photo: null
    },
    {
      id: 3,
      nom: 'MARTIN',
      prenom: 'Marie',
      email: 'marie.martin@mail.com',
      telephone: '077 00 00 02',
      dateNaissance: '2000-08-10',
      lieuNaissance: 'Bafoussam',
      filiere: 'Management et Multimédias',
      anneeAcademique: '2025',
      documents: {
        acteNaissance: { nom: 'acte_naissance.pdf', uploaded: true },
        photo: { nom: 'photo.jpg', uploaded: true },
        quittance: { nom: 'quittance.pdf', uploaded: true },
        pieceIdentite: { nom: 'cni.pdf', uploaded: true }
      },
      statut: 'Candidat admis',
      photo: null
    },
  ])

  const filteredCandidats = candidats.filter(candidat =>
    candidat.filiere === filiereActive &&
    candidat.statut === 'Candidat admis' &&
    (`${candidat.nom} ${candidat.prenom} ${candidat.email}`.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const allDocumentsPresent = (documents) => {
    return documents.acteNaissance?.uploaded && 
           documents.photo?.uploaded && 
           documents.quittance?.uploaded && 
           documents.pieceIdentite?.uploaded
  }

  const handleFileUpload = (candidatId, documentType, file) => {
    console.log('Upload document:', candidatId, documentType, file)
    // Ici, vous ajouteriez la logique pour uploader le fichier
    alert(`Document ${documentType} uploadé avec succès pour ${candidatId}`)
  }

  const handleInscrire = (candidatId) => {
    const candidat = candidats.find(c => c.id === candidatId)
    if (candidat && allDocumentsPresent(candidat.documents)) {
      console.log('Inscrire candidat:', candidatId)
      alert('Étudiant inscrit avec succès!')
      // Ici, vous mettriez à jour le statut à 'Inscrit'
    } else {
      alert('Veuillez d\'abord uploader tous les documents requis')
    }
  }

  const handleViewDossier = (candidat) => {
    setSelectedCandidat(candidat)
    setShowDossier(true)
  }

  const getDocumentIcon = (present) => {
    return present ? faCheckCircle : faTimes
  }

  const getDocumentColor = (present) => {
    return present ? 'text-green-600' : 'text-red-600'
  }

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
              Vérifiez les documents et inscrivez les candidats admis
            </p>
          </div>

          {/* Sélection de la filière */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-semibold text-slate-700">Filière:</label>
              <div className="flex gap-2">
                {filieres.map(filiere => (
                  <button
                    key={filiere}
                    onClick={() => setFiliereActive(filiere)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filiereActive === filiere
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filiere}
                  </button>
                ))}
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
                placeholder="Rechercher un candidat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          {/* Liste des candidats */}
          <div className="space-y-4">
            {filteredCandidats.map((candidat) => {
              const canInscrire = allDocumentsPresent(candidat.documents)
              return (
                <div key={candidat.id} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {candidat.prenom[0]}{candidat.nom[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {candidat.prenom} {candidat.nom}
                          </h3>
                          <p className="text-sm text-slate-600">{candidat.email}</p>
                          <p className="text-sm text-slate-600">{candidat.telephone}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          canInscrire 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {canInscrire ? 'Prêt à inscrire' : 'Documents incomplets'}
                        </span>
                      </div>
                      
                      {/* Documents avec upload */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-700 mb-3">Documents requis:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Acte de naissance */}
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon 
                                  icon={faFileAlt} 
                                  className={getDocumentColor(candidat.documents.acteNaissance?.uploaded)}
                                />
                                <span className="text-xs font-medium text-slate-700">Acte de naissance</span>
                              </div>
                              <FontAwesomeIcon 
                                icon={getDocumentIcon(candidat.documents.acteNaissance?.uploaded)} 
                                className={getDocumentColor(candidat.documents.acteNaissance?.uploaded) + ' text-xs'}
                              />
                            </div>
                            {candidat.documents.acteNaissance?.uploaded ? (
                              <p className="text-xs text-green-600">{candidat.documents.acteNaissance.nom}</p>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleFileUpload(candidat.id, 'acteNaissance', file)
                                  }}
                                />
                                <span className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                                  Uploader
                                </span>
                              </label>
                            )}
                          </div>

                          {/* Photo */}
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon 
                                  icon={faImage} 
                                  className={getDocumentColor(candidat.documents.photo?.uploaded)}
                                />
                                <span className="text-xs font-medium text-slate-700">Photo</span>
                              </div>
                              <FontAwesomeIcon 
                                icon={getDocumentIcon(candidat.documents.photo?.uploaded)} 
                                className={getDocumentColor(candidat.documents.photo?.uploaded) + ' text-xs'}
                              />
                            </div>
                            {candidat.documents.photo?.uploaded ? (
                              <p className="text-xs text-green-600">{candidat.documents.photo.nom}</p>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleFileUpload(candidat.id, 'photo', file)
                                  }}
                                />
                                <span className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                                  Uploader
                                </span>
                              </label>
                            )}
                          </div>

                          {/* Quittance */}
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon 
                                  icon={faMoneyBillWave} 
                                  className={getDocumentColor(candidat.documents.quittance?.uploaded)}
                                />
                                <span className="text-xs font-medium text-slate-700">Quittance</span>
                              </div>
                              <FontAwesomeIcon 
                                icon={getDocumentIcon(candidat.documents.quittance?.uploaded)} 
                                className={getDocumentColor(candidat.documents.quittance?.uploaded) + ' text-xs'}
                              />
                            </div>
                            {candidat.documents.quittance?.uploaded ? (
                              <p className="text-xs text-green-600">{candidat.documents.quittance.nom}</p>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleFileUpload(candidat.id, 'quittance', file)
                                  }}
                                />
                                <span className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                                  Uploader
                                </span>
                              </label>
                            )}
                          </div>

                          {/* Pièce d'identité */}
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon 
                                  icon={faIdCard} 
                                  className={getDocumentColor(candidat.documents.pieceIdentite?.uploaded)}
                                />
                                <span className="text-xs font-medium text-slate-700">Pièce d'identité</span>
                              </div>
                              <FontAwesomeIcon 
                                icon={getDocumentIcon(candidat.documents.pieceIdentite?.uploaded)} 
                                className={getDocumentColor(candidat.documents.pieceIdentite?.uploaded) + ' text-xs'}
                              />
                            </div>
                            {candidat.documents.pieceIdentite?.uploaded ? (
                              <p className="text-xs text-green-600">{candidat.documents.pieceIdentite.nom}</p>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleFileUpload(candidat.id, 'pieceIdentite', file)
                                  }}
                                />
                                <span className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                                  Uploader
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDossier(candidat)}
                        className="flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        Voir dossier
                      </button>
                      {canInscrire && (
                        <button
                          onClick={() => handleInscrire(candidat.id)}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                          Inscrire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal Dossier complet */}
          {showDossier && selectedCandidat && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Dossier complet</h2>
                  <button
                    onClick={() => setShowDossier(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo et infos principales */}
                  <div className="md:col-span-1">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
                      <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
                        {selectedCandidat.prenom[0]}{selectedCandidat.nom[0]}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{selectedCandidat.prenom} {selectedCandidat.nom}</h3>
                      <p className="text-blue-100 text-sm">{selectedCandidat.filiere}</p>
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Informations personnelles</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-slate-400" />
                          <span className="text-slate-600">{selectedCandidat.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-slate-400" />
                          <span className="text-slate-600">{selectedCandidat.telephone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
                          <span className="text-slate-600">{selectedCandidat.dateNaissance}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                          <span className="text-slate-600">{selectedCandidat.lieuNaissance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Documents</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Acte de naissance</span>
                          {selectedCandidat.documents.acteNaissance?.uploaded ? (
                            <span className="text-green-600 flex items-center gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              {selectedCandidat.documents.acteNaissance.nom}
                            </span>
                          ) : (
                            <span className="text-red-600">Manquant</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Photo</span>
                          {selectedCandidat.documents.photo?.uploaded ? (
                            <span className="text-green-600 flex items-center gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              {selectedCandidat.documents.photo.nom}
                            </span>
                          ) : (
                            <span className="text-red-600">Manquant</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Quittance de paiement</span>
                          {selectedCandidat.documents.quittance?.uploaded ? (
                            <span className="text-green-600 flex items-center gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              {selectedCandidat.documents.quittance.nom}
                            </span>
                          ) : (
                            <span className="text-red-600">Manquant</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Pièce d'identité</span>
                          {selectedCandidat.documents.pieceIdentite?.uploaded ? (
                            <span className="text-green-600 flex items-center gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              {selectedCandidat.documents.pieceIdentite.nom}
                            </span>
                          ) : (
                            <span className="text-red-600">Manquant</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDossier(false)}
                    className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Fermer
                  </button>
                  {allDocumentsPresent(selectedCandidat.documents) && (
                    <button
                      onClick={() => {
                        handleInscrire(selectedCandidat.id)
                        setShowDossier(false)
                      }}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Inscrire l'étudiant
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default GererInscriptionsView
