import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFileAlt, faDownload, faEye, faSearch, faFilter, faChartBar } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'

const RapportsView = () => {
  const [rapports, setRapports] = useState([
    { id: 1, type: 'Rapport Mensuel', titre: 'Rapport Mensuel - Janvier 2025', periode: 'Janvier 2025', dateGeneration: '2025-01-31', statut: 'GENERÉ', nombrePages: 15 },
    { id: 2, type: 'Rapport Annuel', titre: 'Rapport Annuel 2025-2026', periode: 'Année 2025-2026', dateGeneration: '2025-01-20', statut: 'GENERÉ', nombrePages: 45 },
    { id: 3, type: 'Rapport Pédagogique', titre: 'Rapport Pédagogique - Semestre 1', periode: 'Semestre 1 - 2025-2026', dateGeneration: '2025-01-25', statut: 'BROUILLON', nombrePages: 0 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Rapport Mensuel',
    titre: '',
    periode: '',
    contenu: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('TOUS')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const handleGenerer = () => {
    setFormData({
      type: 'Rapport Mensuel',
      titre: '',
      periode: '',
      contenu: ''
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const newRapport = {
      id: Date.now(),
      ...formData,
      statut: 'GENERÉ',
      dateGeneration: new Date().toISOString().split('T')[0],
      nombrePages: Math.ceil(formData.contenu.length / 500) || 1
    }
    setRapports([newRapport, ...rapports])
    setShowModal(false)
    alert('Rapport généré avec succès !')
  }

  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = `${rapport.titre} ${rapport.type}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'TOUS' || rapport.type === filterType
    const matchesStatut = filterStatut === 'TOUS' || rapport.statut === filterStatut
    return matchesSearch && matchesType && matchesStatut
  })

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'GENERÉ': return 'bg-green-100 text-green-800'
      case 'BROUILLON': return 'bg-amber-100 text-amber-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Rapports</h1>
              <p className="text-sm text-slate-600">Générez et gérez les rapports pédagogiques</p>
            </div>
            <button
              onClick={handleGenerer}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Générer un rapport
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un rapport..."
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
                <option value="Rapport Mensuel">Rapport Mensuel</option>
                <option value="Rapport Annuel">Rapport Annuel</option>
                <option value="Rapport Pédagogique">Rapport Pédagogique</option>
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
                <option value="GENERÉ">Générés</option>
                <option value="BROUILLON">Brouillons</option>
              </select>
            </div>
          </div>

          {/* Liste des rapports */}
          <div className="space-y-4">
            {filteredRapports.map((rapport) => (
              <div key={rapport.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-800">{rapport.titre}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(rapport.statut)}`}>
                        {rapport.statut}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Type:</span> {rapport.type}
                      </div>
                      <div>
                        <span className="font-medium">Période:</span> {rapport.periode}
                      </div>
                      <div>
                        <span className="font-medium">Date de génération:</span> {new Date(rapport.dateGeneration).toLocaleDateString('fr-FR')}
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span> {rapport.nombrePages}
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
                    {rapport.statut === 'GENERÉ' && (
                      <button
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Télécharger"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de génération */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Générer un Rapport"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de rapport</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Rapport Mensuel">Rapport Mensuel</option>
                  <option value="Rapport Annuel">Rapport Annuel</option>
                  <option value="Rapport Pédagogique">Rapport Pédagogique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Rapport Mensuel - Janvier 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Période</label>
                <input
                  type="text"
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Janvier 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="Saisissez le contenu du rapport..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Générer le rapport
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default RapportsView

