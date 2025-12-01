import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faUserTie, faBuilding, faSearch } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'
import Modal from '../../components/common/Modal'

const ChefsDepartementView = () => {
  const [chefs, setChefs] = useState([
    { id: 1, nom: 'KAMDEM', prenom: 'Jean', email: 'jean.kamdem@inptic.cm', telephone: '+237 6XX XXX XXX', departement: 'Génie Informatique', actif: true },
    { id: 2, nom: 'MBALLA', prenom: 'Marie', email: 'marie.mballa@inptic.cm', telephone: '+237 6XX XXX XXX', departement: 'Réseaux et Télécommunications', actif: true },
  ])
  const [departements] = useState(['Génie Informatique', 'Réseaux et Télécommunications', 'Électronique', 'Autres'])
  const [showModal, setShowModal] = useState(false)
  const [editingChef, setEditingChef] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departement: '',
    actif: true
  })

  const handleAdd = () => {
    setEditingChef(null)
    setFormData({ nom: '', prenom: '', email: '', telephone: '', departement: '', actif: true })
    setShowModal(true)
  }

  const handleEdit = (chef) => {
    setEditingChef(chef)
    setFormData(chef)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chef de département ?')) {
      setChefs(chefs.filter(c => c.id !== id))
    }
  }

  const handleSave = () => {
    if (editingChef) {
      setChefs(chefs.map(c => c.id === editingChef.id ? { ...formData, id: editingChef.id } : c))
    } else {
      setChefs([...chefs, { ...formData, id: Date.now() }])
    }
    setShowModal(false)
  }

  const filteredChefs = chefs.filter(chef => 
    `${chef.nom} ${chef.prenom} ${chef.email} ${chef.departement}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Chefs de Département</h1>
              <p className="text-sm text-slate-600">Créez, modifiez et gérez les chefs de département</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Ajouter un chef
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un chef de département..."
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Département</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredChefs.map((chef) => (
                    <tr key={chef.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faUserTie} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{chef.prenom} {chef.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{chef.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{chef.telephone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <FontAwesomeIcon icon={faBuilding} className="mr-1" />
                          {chef.departement}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          chef.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {chef.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(chef)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(chef.id)}
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
            title={editingChef ? 'Modifier le chef de département' : 'Ajouter un chef de département'}
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Département</label>
                <select
                  value={formData.departement}
                  onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un département</option>
                  {departements.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="actif" className="text-sm text-slate-700">Actif</label>
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
                  {editingChef ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ChefsDepartementView

