import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faChalkboardTeacher, faSearch, faBook, faUserTie, faSpinner } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { 
  getEnseignants, 
  createEnseignant, 
  updateEnseignant, 
  deleteEnseignant,
  affecterModulesEnseignant 
} from '../../api/chefDepartement.js'
import { getModules } from '../../api/chefDepartement.js'

const EnseignantsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [departementChef, setDepartementChef] = useState('')
  const [enseignants, setEnseignants] = useState([])
  const [modules, setModules] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEnseignant, setEditingEnseignant] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    modules: [],
    actif: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les enseignants
      const enseignantsResult = await getEnseignants()
      if (enseignantsResult.success) {
        setEnseignants(enseignantsResult.enseignants)
      } else {
        showAlert('error', enseignantsResult.error || 'Erreur lors du chargement des enseignants')
      }

      // Charger les modules
      const modulesResult = await getModules()
      if (modulesResult.success) {
        setModules(modulesResult.modules)
      }

      // Récupérer le nom du département
      if (user?.departement) {
        setDepartementChef(user.departement.nom)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingEnseignant(null)
    setFormData({ nom: '', prenom: '', email: '', telephone: '', modules: [], actif: true })
    setShowModal(true)
  }

  const handleEdit = (enseignant) => {
    setEditingEnseignant(enseignant)
    setFormData({
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      telephone: enseignant.telephone || '',
      modules: enseignant.modules.map(m => m.id),
      actif: enseignant.actif
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      return
    }

    try {
      const result = await deleteEnseignant(id)
      if (result.success) {
        showAlert('success', 'Enseignant supprimé avec succès')
        loadData()
      } else {
        showAlert('error', result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors de la suppression')
    }
  }

  const handleSave = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      showAlert('error', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setSaving(true)
      let result

      if (editingEnseignant) {
        result = await updateEnseignant(editingEnseignant.id, formData)
        if (result.success && formData.modules.length > 0) {
          // Mettre à jour les affectations de modules
          await affecterModulesEnseignant(editingEnseignant.id, formData.modules)
        }
      } else {
        result = await createEnseignant(formData)
        if (result.success && formData.modules.length > 0) {
          // Affecter les modules
          await affecterModulesEnseignant(result.enseignant.id, formData.modules)
        }
      }

      if (result.success) {
        showAlert('success', editingEnseignant ? 'Enseignant modifié avec succès' : 'Enseignant créé avec succès')
        setShowModal(false)
        loadData()
      } else {
        showAlert('error', result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleModuleToggle = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId]
    }))
  }

  const filteredEnseignants = enseignants.filter(enseignant => 
    `${enseignant.nom} ${enseignant.prenom} ${enseignant.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des enseignants...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Enseignants</h1>
              <p className="text-sm text-slate-600">Gérez les enseignants de votre département : {departementChef}</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Ajouter un enseignant
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un enseignant..."
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom & Prénom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Modules assignés</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEnseignants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        Aucun enseignant trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredEnseignants.map((enseignant) => (
                      <tr key={enseignant.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faUserTie} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{enseignant.prenom} {enseignant.nom}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{enseignant.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{enseignant.telephone || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {enseignant.modules && enseignant.modules.length > 0 ? (
                              enseignant.modules.map((module) => (
                                <span key={module.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <FontAwesomeIcon icon={faBook} className="mr-1" />
                                  {module.code}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Aucun module</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            enseignant.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {enseignant.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(enseignant)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDelete(enseignant.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingEnseignant ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Modules assignés</label>
                <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {modules.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun module disponible</p>
                  ) : (
                    modules.map((module) => (
                      <label key={module.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.modules.includes(module.id)}
                          onChange={() => handleModuleToggle(module.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{module.code} - {module.nom} ({module.classe})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select
                  value={formData.actif ? 'Actif' : 'Inactif'}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'Actif' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {editingEnseignant ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default EnseignantsView
