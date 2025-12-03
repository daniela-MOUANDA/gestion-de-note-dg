import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faBook, faSearch, faUpload, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import SidebarChefDepartement from '../../components/common/SidebarChefDepartement'
import HeaderChef from '../../components/common/HeaderChef'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'

const ModulesView = () => {
  const { user } = useAuth()
  const [departementChef] = useState('Génie Informatique')
  
  const [modules, setModules] = useState([
    { id: 1, code: 'BDD-301', nom: 'Base de données', credit: 4, semestre: 'S6', classe: 'GI-L3-A', estActif: true },
    { id: 2, code: 'PW-301', nom: 'Programmation web', credit: 5, semestre: 'S6', classe: 'GI-L3-A', estActif: true },
    { id: 3, code: 'RES-301', nom: 'Réseaux', credit: 3, semestre: 'S6', classe: 'GI-L3-B', estActif: true },
  ])
  const [classes] = useState(['GI-L3-A', 'GI-L3-B', 'GI-L2-A', 'GI-L2-B'])
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    credit: '',
    semestre: '',
    classe: '',
    estActif: true
  })

  const handleAdd = () => {
    setEditingModule(null)
    setFormData({ code: '', nom: '', credit: '', semestre: '', classe: '', estActif: true })
    setShowModal(true)
  }

  const handleEdit = (module) => {
    setEditingModule(module)
    setFormData(module)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      setModules(modules.filter(m => m.id !== id))
    }
  }

  const handleSave = () => {
    if (editingModule) {
      setModules(modules.map(m => m.id === editingModule.id ? { ...formData, id: editingModule.id, credit: parseInt(formData.credit) } : m))
    } else {
      setModules([...modules, { ...formData, id: Date.now(), credit: parseInt(formData.credit) }])
    }
    setShowModal(false)
  }

  const handleFileUpload = () => {
    if (!selectedFile || !selectedClasse) {
      alert('Veuillez sélectionner un fichier et une classe')
      return
    }
    // Ici on traiterait l'upload du fichier Excel
    alert(`Fichier Excel "${selectedFile.name}" sera importé pour la classe ${selectedClasse}`)
    setShowUploadModal(false)
    setSelectedFile(null)
    setSelectedClasse('')
  }

  const filteredModules = modules.filter(module => 
    `${module.code} ${module.nom} ${module.classe}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChefDepartement />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName={`Chef de Département - ${departementChef}`} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Modules</h1>
              <p className="text-sm text-slate-600">Gérez les modules de votre département : {departementChef}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUpload} />
                Importer Excel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Ajouter un module
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Crédits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Semestre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredModules.map((module) => (
                    <tr key={module.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faBook} className="text-purple-600" />
                          <span className="font-semibold text-slate-800">{module.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800">{module.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{module.credit} crédits</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {module.semestre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{module.classe}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          module.estActif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {module.estActif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(module)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(module.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingModule ? 'Modifier le module' : 'Ajouter un module'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code du module</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: BDD-301"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du module</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Base de données"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crédits</label>
                  <input
                    type="number"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
                  <input
                    type="text"
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: S6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                <select
                  value={formData.classe}
                  onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="estActif"
                  checked={formData.estActif}
                  onChange={(e) => setFormData({ ...formData, estActif: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="estActif" className="text-sm text-slate-700">Module actif</label>
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
                  {editingModule ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal d'upload Excel */}
          <Modal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            title="Importer un fichier Excel par modules"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sélectionner une classe</label>
                <select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fichier Excel</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FontAwesomeIcon icon={faFileExcel} className="mx-auto text-4xl text-green-600" />
                    <div className="flex text-sm text-slate-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Choisir un fichier</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-slate-500">XLSX, XLS jusqu'à 10MB</p>
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !selectedClasse}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUpload} />
                  Importer
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ModulesView

