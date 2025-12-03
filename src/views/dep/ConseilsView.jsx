import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faCheckCircle, faClock, faFileAlt, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'
import Modal from '../../components/common/Modal'

const ConseilsView = () => {
  const [conseils, setConseils] = useState([
    { id: 1, classe: 'L3 GI - Groupe A', departement: 'Génie Informatique', dateReunion: '2025-01-15', statut: 'EN_ATTENTE', nombreEtudiants: 35, decisions: 'Admissions, Redoublements, Exclusions' },
    { id: 2, classe: 'L2 RT - Groupe B', departement: 'Réseaux et Télécommunications', dateReunion: '2025-01-16', statut: 'VALIDE', nombreEtudiants: 28, decisions: 'Admissions, Redoublements' },
    { id: 3, classe: 'L1 ELEC - Groupe A', departement: 'Électronique', dateReunion: '2025-01-17', statut: 'EN_ATTENTE', nombreEtudiants: 42, decisions: 'Admissions' },
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedConseil, setSelectedConseil] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const handleEnvoyer = (conseil) => {
    setSelectedConseil(conseil)
    setShowModal(true)
  }

  const handleConfirmerEnvoi = () => {
    setConseils(conseils.map(c => c.id === selectedConseil.id ? { ...c, statut: 'VALIDE' } : c))
    setShowModal(false)
    alert('Résultats du conseil envoyés avec succès !')
  }

  const filteredConseils = conseils.filter(conseil => {
    const matchesSearch = `${conseil.classe} ${conseil.departement}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatut === 'TOUS' || conseil.statut === filterStatut
    return matchesSearch && matchesFilter
  })

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'VALIDE': return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE': return 'bg-amber-100 text-amber-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'VALIDE': return 'Envoyé'
      case 'EN_ATTENTE': return 'En attente'
      default: return statut
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Conseils de Classes</h1>
            <p className="text-sm text-slate-600">Envoyez les résultats des conseils de classes après les réunions</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDE">Envoyés</option>
              </select>
            </div>
          </div>

          {/* Liste des conseils */}
          <div className="space-y-4">
            {filteredConseils.map((conseil) => (
              <div key={conseil.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-800">{conseil.classe}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(conseil.statut)}`}>
                        {getStatutLabel(conseil.statut)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Département:</span> {conseil.departement}
                      </div>
                      <div>
                        <span className="font-medium">Date de réunion:</span> {new Date(conseil.dateReunion).toLocaleDateString('fr-FR')}
                      </div>
                      <div>
                        <span className="font-medium">Nombre d'étudiants:</span> {conseil.nombreEtudiants}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-slate-700">Décisions prises:</span>
                      <p className="text-sm text-slate-600 mt-1">{conseil.decisions}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {conseil.statut === 'EN_ATTENTE' && (
                      <button
                        onClick={() => handleEnvoyer(conseil)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        Envoyer les résultats
                      </button>
                    )}
                    {conseil.statut === 'VALIDE' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span className="text-sm font-medium">Envoyé</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de confirmation */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Confirmer l'envoi des résultats"
          >
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                Êtes-vous sûr de vouloir envoyer les résultats du conseil de classe pour <strong>{selectedConseil?.classe}</strong> ?
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-2"><strong>Département:</strong> {selectedConseil?.departement}</p>
                <p className="text-sm text-slate-600 mb-2"><strong>Date de réunion:</strong> {selectedConseil?.dateReunion ? new Date(selectedConseil.dateReunion).toLocaleDateString('fr-FR') : ''}</p>
                <p className="text-sm text-slate-600"><strong>Décisions:</strong> {selectedConseil?.decisions}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmerEnvoi}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Confirmer l'envoi
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ConseilsView

