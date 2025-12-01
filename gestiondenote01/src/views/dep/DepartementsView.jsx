import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faBuilding, faSearch, faUsers } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'
import Modal from '../../components/common/Modal'

const DepartementsView = () => {
  const [departements, setDepartements] = useState([
    { id: 1, nom: 'Génie Informatique', code: 'GI', description: 'Département de Génie Informatique', nombreClasses: 8, nombreEtudiants: 520, actif: true },
    { id: 2, nom: 'Réseaux et Télécommunications', code: 'RT', description: 'Département de Réseaux et Télécommunications', nombreClasses: 6, nombreEtudiants: 380, actif: true },
    { id: 3, nom: 'Électronique', code: 'ELEC', description: 'Département d\'Électronique', nombreClasses: 5, nombreEtudiants: 250, actif: true },
    { id: 4, nom: 'Autres', code: 'AUT', description: 'Autres départements', nombreClasses: 5, nombreEtudiants: 100, actif: true },
  ])
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    description: '',
    actif: true
  })

  const handleAdd = () => {
    setEditingDept(null)
    setFormData({ nom: '', code: '', description: '', actif: true })
    setShowModal(true)
  }

  const handleEdit = (dept) => {
    setEditingDept(dept)
    setFormData({ nom: dept.nom, code: dept.code, description: dept.description, actif: dept.actif })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      setDepartements(departements.filter(d => d.id !== id))
    }
  }

  const handleSave = () => {
    if (editingDept) {
      setDepartements(departements.map(d => d.id === editingDept.id ? { ...formData, id: editingDept.id, nombreClasses: editingDept.nombreClasses, nombreEtudiants: editingDept.nombreEtudiants } : d))
    } else {
      setDepartements([...departements, { ...formData, id: Date.now(), nombreClasses: 0, nombreEtudiants: 0 }])
    }
    setShowModal(false)
  }

  const filteredDepartements = departements.filter(dept => 
    `${dept.nom} ${dept.code} ${dept.description}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Départements</h1>
              <p className="text-sm text-slate-600">Créez, modifiez et gérez les départements</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Ajouter un département
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un département..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grille des départements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredDepartements.map((dept) => (
              <div key={dept.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faBuilding} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{dept.nom}</h3>
                      <p className="text-sm text-slate-500">Code: {dept.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dept.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {dept.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{dept.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FontAwesomeIcon icon={faUsers} className="text-sm" />
                    <span className="text-sm">{dept.nombreEtudiants} étudiants</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-sm">{dept.nombreClasses} classes</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingDept ? 'Modifier le département' : 'Ajouter un département'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du département</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Génie Informatique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: GI"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description du département..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="actif" className="text-sm text-slate-700">Département actif</label>
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
                  {editingDept ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default DepartementsView

