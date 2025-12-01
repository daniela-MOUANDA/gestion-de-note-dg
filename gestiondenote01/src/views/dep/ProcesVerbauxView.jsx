import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFileAlt, faDownload, faEye, faSearch, faFilter, faCalendar } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'
import Modal from '../../components/common/Modal'

const ProcesVerbauxView = () => {
  const [procesVerbaux, setProcesVerbaux] = useState([
    { id: 1, type: 'Conseil de Classe', titre: 'PV Conseil L3 GI - Groupe A', classe: 'L3 GI - Groupe A', date: '2025-01-15', statut: 'GENERÉ', nombrePages: 5 },
    { id: 2, type: 'Réunion Pédagogique', titre: 'PV Réunion Département GI', departement: 'Génie Informatique', date: '2025-01-10', statut: 'GENERÉ', nombrePages: 3 },
    { id: 3, type: 'Conseil de Classe', titre: 'PV Conseil L2 RT - Groupe B', classe: 'L2 RT - Groupe B', date: '2025-01-16', statut: 'BROUILLON', nombrePages: 0 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Conseil de Classe',
    titre: '',
    classe: '',
    departement: '',
    date: new Date().toISOString().split('T')[0],
    contenu: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('TOUS')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const handleGenerer = () => {
    setFormData({
      type: 'Conseil de Classe',
      titre: '',
      classe: '',
      departement: '',
      date: new Date().toISOString().split('T')[0],
      contenu: ''
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const newPV = {
      id: Date.now(),
      ...formData,
      statut: 'GENERÉ',
      nombrePages: Math.ceil(formData.contenu.length / 500) || 1
    }
    setProcesVerbaux([newPV, ...procesVerbaux])
    setShowModal(false)
    alert('Procès-Verbal généré avec succès !')
  }

  const filteredPV = procesVerbaux.filter(pv => {
    const matchesSearch = `${pv.titre} ${pv.type}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'TOUS' || pv.type === filterType
    const matchesStatut = filterStatut === 'TOUS' || pv.statut === filterStatut
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
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Procès-Verbaux</h1>
              <p className="text-sm text-slate-600">Générez et gérez les procès-verbaux</p>
            </div>
            <button
              onClick={handleGenerer}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Générer un PV
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un PV..."
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
                <option value="Conseil de Classe">Conseil de Classe</option>
                <option value="Réunion Pédagogique">Réunion Pédagogique</option>
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

          {/* Liste des PV */}
          <div className="space-y-4">
            {filteredPV.map((pv) => (
              <div key={pv.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                      <h3 className="text-lg font-bold text-slate-800">{pv.titre}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(pv.statut)}`}>
                        {pv.statut}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Type:</span> {pv.type}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(pv.date).toLocaleDateString('fr-FR')}
                      </div>
                      {pv.classe && (
                        <div>
                          <span className="font-medium">Classe:</span> {pv.classe}
                        </div>
                      )}
                      {pv.departement && (
                        <div>
                          <span className="font-medium">Département:</span> {pv.departement}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Pages:</span> {pv.nombrePages}
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
                    {pv.statut === 'GENERÉ' && (
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
            title="Générer un Procès-Verbal"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de PV</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Conseil de Classe">Conseil de Classe</option>
                  <option value="Réunion Pédagogique">Réunion Pédagogique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: PV Conseil L3 GI - Groupe A"
                />
              </div>
              {formData.type === 'Conseil de Classe' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                  <input
                    type="text"
                    value={formData.classe}
                    onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: L3 GI - Groupe A"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Département</label>
                  <input
                    type="text"
                    value={formData.departement}
                    onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Génie Informatique"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  placeholder="Saisissez le contenu du procès-verbal..."
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
                  Générer le PV
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ProcesVerbauxView

