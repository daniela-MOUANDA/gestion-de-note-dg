import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStamp, faCheckCircle, faClock, faFileAlt, faSearch, faFilter, faDownload, faEye, faSync } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { getBulletinsEnAttente, getBulletinsVises, viserBulletin } from '../../api/dep'
import { toast } from 'react-hot-toast'

const VisasView = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('TOUS')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const fetchDocuments = async () => {
    try {
      setRefreshing(true)
      const [pendingRes, visedRes] = await Promise.all([
        getBulletinsEnAttente(),
        getBulletinsVises()
      ])

      let allDocs = []

      if (pendingRes.success) {
        const pendingDocs = pendingRes.bulletins.map(b => ({
          id: b.id,
          type: 'Bulletin',
          titre: `Bulletin ${b.semestre} - ${b.classes?.nom || 'Classe inconnue'}`,
          classe: b.classes?.nom,
          departement: b.departements?.nom,
          dateCreation: b.dateGeneration,
          statut: 'EN_ATTENTE',
          nombrePages: b.nombreEtudiants, // Utiliser nb étudiants comme proxy
          data: b // Garder l'objet original
        }))
        allDocs = [...allDocs, ...pendingDocs]
      }

      if (visedRes.success) {
        const visedDocs = visedRes.bulletins.map(b => ({
          id: b.id,
          type: 'Bulletin',
          titre: `Bulletin ${b.semestre} - ${b.classes?.nom || 'Classe inconnue'}`,
          classe: b.classes?.nom,
          departement: b.departements?.nom,
          dateCreation: b.dateGeneration,
          statut: 'VISE',
          dateVisa: b.dateVisa,
          visePar: b.dep?.nom ? `${b.dep.nom} ${b.dep.prenom}` : 'N/A',
          nombrePages: b.nombreEtudiants,
          data: b
        }))
        allDocs = [...allDocs, ...visedDocs]
      }

      setDocuments(allDocs.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)))
    } catch (error) {
      console.error('Erreur chargement documents:', error)
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleViser = (document) => {
    setSelectedDocument(document)
    setShowModal(true)
  }

  const handleConfirmerVisa = async () => {
    try {
      const result = await viserBulletin(selectedDocument.id)
      if (result.success) {
        toast.success('Document visé avec succès !')
        setShowModal(false)
        fetchDocuments() // Rafraîchir la liste
      } else {
        toast.error('Erreur lors du visa : ' + result.error)
      }
    } catch (error) {
      toast.error('Erreur technique lors du visa')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = `${doc.titre} ${doc.type} ${doc.classe || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'TOUS' || doc.type === filterType
    const matchesStatut = filterStatut === 'TOUS' || doc.statut === filterStatut
    return matchesSearch && matchesType && matchesStatut
  })

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'VISE': return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE': return 'bg-amber-100 text-amber-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'VISE': return 'Visé'
      case 'EN_ATTENTE': return 'En attente'
      default: return statut
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Bulletin': return 'bg-blue-100 text-blue-800'
      case 'Note de Service': return 'bg-purple-100 text-purple-800'
      case 'PV': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const handleVoir = (doc) => {
    // Construire l'URL avec le token d'authentification si nécessaire ou passer par une méthode sécurisée
    // Ici on ouvre dans un nouvel onglet, l'auth sera gérée par le cookie ou le header si on passait par fetch
    // Comme c'est un lien direct, on peut passer le token en query param (moins sécurisé) ou utiliser une route qui valide le cookie
    // Pour l'instant, faisons simple : window.open avec le token en query param (à sécuriser plus tard)
    const token = localStorage.getItem('token')
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dep/bulletins/${doc.id}/preview?token=${token}`

    // Alternative plus propre : fetch blob et open URL
    // Mais pour "Voir", un nouvel onglet est mieux. 
    // Modifions le backend pour accepter le token en query param temporairement ou utilisons une fonction fetch.

    viewDocument(doc.id)
  }

  const viewDocument = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dep/bulletins/${id}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Erreur téléchargement')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      toast.error("Erreur lors de l'ouverture du document")
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Visas & Documents</h1>
              <p className="text-sm text-slate-600">Imposez des visas sur les documents (bulletins, notes de service, PV, etc.)</p>
            </div>
            <button
              onClick={fetchDocuments}
              className="p-2 bg-white rounded-full shadow hover:bg-slate-50 transition-colors text-blue-600"
              title="Rafraîchir"
            >
              <FontAwesomeIcon icon={faSync} spin={refreshing} />
            </button>
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
          {loading ? (
            <div className="flex justify-center py-12">
              <FontAwesomeIcon icon={faSync} spin className="text-4xl text-blue-500" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-slate-500">Aucun document trouvé.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${doc.statut === 'VISE' ? 'border-green-500' : 'border-amber-500'}`}>
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
                          <span className="font-medium">Effectif:</span> {doc.nombrePages} étudiants
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDocument(doc.id)}
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
          )}

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
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                  <p>⚠️ Cette action est irréversible. Le cachet officiel sera apposé sur tous les bulletins de ce lot.</p>
                </div>
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
      </div >
    </div >
  )
}

export default VisasView

