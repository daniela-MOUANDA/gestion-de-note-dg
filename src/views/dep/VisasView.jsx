import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStamp, faCheckCircle, faClock, faFileAlt, faSearch, faFilter, faDownload, faEye } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'
import Modal from '../../components/common/Modal'

const VisasView = () => {
  const [documents, setDocuments] = useState([
    { id: 1, type: 'Bulletin', titre: 'Bulletin Semestre 1 - L3 GI', classe: 'L3 GI - Groupe A', dateCreation: '2025-01-10', statut: 'EN_ATTENTE', nombrePages: 1 },
    { id: 2, type: 'Note de Service', titre: 'Note de Service N°001/2025', departement: 'Génie Informatique', dateCreation: '2025-01-12', statut: 'EN_ATTENTE', nombrePages: 2 },
    { id: 3, type: 'PV', titre: 'PV Conseil de Classe - L2 RT', classe: 'L2 RT - Groupe B', dateCreation: '2025-01-14', statut: 'VISE', dateVisa: '2025-01-15', nombrePages: 3 },
    { id: 4, type: 'Bulletin', titre: 'Bulletin Semestre 1 - L1 ELEC', classe: 'L1 ELEC - Groupe A', dateCreation: '2025-01-11', statut: 'EN_ATTENTE', nombrePages: 1 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('TOUS')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const handleViser = (document) => {
    setSelectedDocument(document)
    setShowModal(true)
  }

  const handleConfirmerVisa = () => {
    setDocuments(documents.map(d => d.id === selectedDocument.id ? { ...d, statut: 'VISE', dateVisa: new Date().toISOString().split('T')[0] } : d))
    setShowModal(false)
    alert('Document visé avec succès !')
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = `${doc.titre} ${doc.type}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'TOUS' || doc.type === filterType
    const matchesStatut = filterStatut === 'TOUS' || doc.statut === filterStatut
    return matchesSearch && matchesType && matchesStatut
  })

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'VISE': return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE': return 'bg-amber-100 text-amber-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'VISE': return 'Visé'
      case 'EN_ATTENTE': return 'En attente'
      default: return statut
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'Bulletin': return 'bg-blue-100 text-blue-800'
      case 'Note de Service': return 'bg-purple-100 text-purple-800'
      case 'PV': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Visas & Documents</h1>
            <p className="text-sm text-slate-600">Imposez des visas sur les documents (bulletins, notes de service, PV, etc.)</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Tous les types</option>
                <option value="Bulletin">Bulletins</option>
                <option value="Note de Service">Notes de Service</option>
                <option value="PV">Procès-Verbaux</option>
              </select>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VISE">Visés</option>
              </select>
            </div>
          </div>

          {/* Liste des documents */}
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-800">{doc.titre}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(doc.statut)}`}>
                        {getStatutLabel(doc.statut)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Date de création:</span> {new Date(doc.dateCreation).toLocaleDateString('fr-FR')}
                      </div>
                      {doc.classe && (
                        <div>
                          <span className="font-medium">Classe:</span> {doc.classe}
                        </div>
                      )}
                      {doc.departement && (
                        <div>
                          <span className="font-medium">Département:</span> {doc.departement}
                        </div>
                      )}
                      {doc.dateVisa && (
                        <div>
                          <span className="font-medium">Date de visa:</span> {new Date(doc.dateVisa).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Pages:</span> {doc.nombrePages}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Voir"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Télécharger"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                    {doc.statut === 'EN_ATTENTE' && (
                      <button
                        onClick={() => handleViser(doc)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faStamp} />
                        Viser
                      </button>
                    )}
                    {doc.statut === 'VISE' && (
                      <div className="flex items-center gap-2 text-green-600 px-4 py-2">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span className="text-sm font-medium">Visé</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de confirmation de visa */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Confirmer le visa"
          >
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                Êtes-vous sûr de vouloir viser le document <strong>{selectedDocument?.titre}</strong> ?
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-2"><strong>Type:</strong> {selectedDocument?.type}</p>
                <p className="text-sm text-slate-600 mb-2"><strong>Date de création:</strong> {selectedDocument?.dateCreation ? new Date(selectedDocument.dateCreation).toLocaleDateString('fr-FR') : ''}</p>
                {selectedDocument?.classe && (
                  <p className="text-sm text-slate-600 mb-2"><strong>Classe:</strong> {selectedDocument.classe}</p>
                )}
                {selectedDocument?.departement && (
                  <p className="text-sm text-slate-600"><strong>Département:</strong> {selectedDocument.departement}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmerVisa}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faStamp} />
                  Confirmer le visa
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default VisasView

