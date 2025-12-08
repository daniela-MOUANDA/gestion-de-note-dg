import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faUserTie, faBuilding, faSearch, faEye, faEyeSlash, faKey, faSpinner } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import TelephoneInput from '../../components/common/TelephoneInput'
import { getAllChefsDepartement, createChefDepartement, updateChefDepartement, deleteChefDepartement } from '../../api/chefsDepartement.js'
import { getAllDepartements } from '../../api/departements.js'

const ChefsDepartementView = () => {
  const [chefs, setChefs] = useState([])
  const [departements, setDepartements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingChef, setEditingChef] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departementId: '',
    motDePasse: '',
    actif: true
  })
  const [showPassword, setShowPassword] = useState(false)

  // Charger les chefs de département et les départements depuis l'API
  useEffect(() => {
    loadChefs()
    loadDepartements()
  }, [])

  const loadChefs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllChefsDepartement()
      if (response.success) {
        setChefs(response.chefs)
      } else {
        setError(response.error || 'Erreur lors du chargement des chefs de département')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors du chargement des chefs de département')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartements = async () => {
    try {
      const response = await getAllDepartements()
      if (response.success) {
        setDepartements(response.departements)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des départements:', err)
    }
  }

  const handleAdd = () => {
    setEditingChef(null)
    setFormData({ nom: '', prenom: '', email: '', telephone: '', departementId: '', motDePasse: '', actif: true })
    setShowPassword(false)
    setShowModal(true)
  }

  const handleEdit = (chef) => {
    setEditingChef(chef)
    setFormData({ ...chef, motDePasse: '' }) // Ne pas afficher le mot de passe existant
    setShowPassword(false)
    setError(null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chef de département ?')) {
      try {
        setError(null)
        const response = await deleteChefDepartement(id)
        if (response.success) {
          await loadChefs() // Recharger la liste
        } else {
          setError(response.error || 'Erreur lors de la suppression')
        }
      } catch (err) {
        console.error('Erreur:', err)
        setError(err.message || 'Erreur lors de la suppression')
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validation
      if (!formData.nom || !formData.prenom || !formData.email || !formData.departementId) {
        setError('Veuillez remplir tous les champs obligatoires')
        setSaving(false)
        return
      }

      if (!editingChef && !formData.motDePasse) {
        setError('Le mot de passe est obligatoire pour un nouveau chef de département')
        setSaving(false)
        return
      }

      let response
      if (editingChef) {
        // Mise à jour
        response = await updateChefDepartement(editingChef.id, formData)
      } else {
        // Création
        response = await createChefDepartement(formData)
      }

      if (response.success) {
        setShowModal(false)
        await loadChefs() // Recharger la liste
        // Réinitialiser le formulaire
        setFormData({ nom: '', prenom: '', email: '', telephone: '', departementId: '', motDePasse: '', actif: true })
        setEditingChef(null)
      } else {
        setError(response.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const filteredChefs = chefs.filter(chef => 
    `${chef.nom} ${chef.prenom} ${chef.email} ${chef.departement?.nom || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
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

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Tableau */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 text-2xl mb-2" />
                <p className="text-slate-600">Chargement des chefs de département...</p>
              </div>
            ) : filteredChefs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun chef de département enregistré'}
              </div>
            ) : (
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
                          {chef.departement?.nom || 'Non assigné'}
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
            )}
          </div>

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingChef ? 'Modifier le chef de département' : 'Ajouter un chef de département'}
            size="2xl"
          >
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <TelephoneInput
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  name="telephone"
                  label="Téléphone"
                  required={false}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Département <span className="text-red-500">*</span></label>
                  <select
                    value={formData.departementId}
                    onChange={(e) => setFormData({ ...formData, departementId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un département</option>
                    {departements.map((dept) => {
                      // Vérifier si le département est déjà assigné à un autre chef
                      const isAssigned = chefs.some(chef => 
                        chef.departementId === dept.id && 
                        chef.id !== editingChef?.id && 
                        chef.actif
                      )
                      const assignedChef = isAssigned ? chefs.find(chef => 
                        chef.departementId === dept.id && 
                        chef.id !== editingChef?.id && 
                        chef.actif
                      ) : null
                      
                      return (
                        <option 
                          key={dept.id} 
                          value={dept.id}
                          disabled={isAssigned}
                          style={isAssigned ? { color: '#999', fontStyle: 'italic' } : {}}
                        >
                          {dept.nom} ({dept.code})
                          {isAssigned && assignedChef && ` - Déjà assigné à ${assignedChef.prenom} ${assignedChef.nom}`}
                        </option>
                      )
                    })}
                  </select>
                  {formData.departementId && chefs.some(chef => 
                    chef.departementId === formData.departementId && 
                    chef.id !== editingChef?.id && 
                    chef.actif
                  ) && (
                    <p className="mt-1 text-xs text-red-600">
                      ⚠️ Ce département est déjà assigné à un autre chef de département
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <FontAwesomeIcon icon={faKey} className="mr-1 text-blue-600" />
                    Mot de passe {!editingChef && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Entrez le mot de passe"
                      required={!editingChef}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      id="actif"
                      checked={formData.actif}
                      onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="actif" className="text-sm text-slate-700">Actif</label>
                  </div>
                </div>
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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
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

