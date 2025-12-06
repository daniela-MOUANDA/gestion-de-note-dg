import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faBuilding, faSearch, faUsers, faGraduationCap, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { getAllDepartements, createDepartement, updateDepartement, deleteDepartement } from '../../api/departements'
const DepartementsView = () => {
  const [departements, setDepartements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [deptToDelete, setDeptToDelete] = useState(null)
  const [editingDept, setEditingDept] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    description: '',
    actif: true
  })

  // Charger les départements depuis la base de données
  useEffect(() => {
    loadDepartements()
  }, [])

  const loadDepartements = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAllDepartements()
      if (result.success) {
        setDepartements(result.departements || [])
      } else {
        setError(result.error || 'Erreur lors du chargement des départements')
      }
    } catch (err) {
      console.error('Erreur lors du chargement des départements:', err)
      setError(err.message || 'Erreur lors du chargement des départements')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingDept(null)
    setFormData({ nom: '', code: '', description: '', actif: true })
    setError(null)
    setShowModal(true)
  }

  const handleEdit = (dept) => {
    setEditingDept(dept)
    setFormData({ 
      nom: dept.nom || '', 
      code: dept.code || '', 
      description: dept.description || '', 
      actif: dept.actif !== undefined ? dept.actif : true 
    })
    setError(null)
    setShowModal(true)
  }

  const handleDelete = (dept) => {
    setDeptToDelete(dept)
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!deptToDelete) return

    try {
      setLoading(true)
      setShowConfirmModal(false)
      const result = await deleteDepartement(deptToDelete.id)
      if (result.success) {
        setSuccessMessage(`Le département "${deptToDelete.nom}" a été supprimé avec succès.`)
        setShowSuccessModal(true)
        // Recharger les départements depuis la base de données
        await loadDepartements()
        // Fermer le modal après 2 secondes
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
      } else {
        setErrorMessage(result.error || 'Erreur lors de la suppression du département')
        setShowErrorModal(true)
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setErrorMessage(err.message || 'Erreur lors de la suppression du département')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
      setDeptToDelete(null)
    }
  }

  const handleSave = async () => {
      if (!formData.nom || !formData.code) {
      setError('Le nom et le code sont obligatoires')
      setErrorMessage('Le nom et le code sont obligatoires')
      setShowErrorModal(true)
      return
    }

    try {
      setSaving(true)
      setError(null)
      setErrorMessage('')

      let result
      if (editingDept) {
        // Mise à jour
        result = await updateDepartement(editingDept.id, formData)
        if (result.success) {
          setSuccessMessage(`Le département "${formData.nom}" a été modifié avec succès.`)
          setShowSuccessModal(true)
        }
      } else {
        // Création
        result = await createDepartement(formData)
        if (result.success) {
          setSuccessMessage(`Le département "${formData.nom}" a été créé avec succès.`)
          setShowSuccessModal(true)
        }
      }

      if (result.success) {
        setShowModal(false)
        // Recharger les départements depuis la base de données
        await loadDepartements()
        // Fermer le modal de succès après 2 secondes
        setTimeout(() => {
          setShowSuccessModal(false)
        }, 2000)
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
        setErrorMessage(result.error || 'Erreur lors de la sauvegarde du département')
        setShowErrorModal(true)
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(err.message || 'Erreur lors de la sauvegarde du département')
      setErrorMessage(err.message || 'Erreur lors de la sauvegarde du département')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const filteredDepartements = departements.filter(dept => 
    `${dept.nom} ${dept.code} ${dept.description}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
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

          {/* Messages d'erreur */}
          {error && !showModal && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

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

          {/* État de chargement */}
          {loading && !showModal && (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-3xl text-blue-600 animate-spin" />
              <span className="ml-3 text-slate-600">Chargement des départements...</span>
            </div>
          )}

          {/* Grille des départements */}
          {!loading && (
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
                {dept.filieres && dept.filieres.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-sm text-purple-600" />
                      <span className="text-xs font-semibold text-slate-700">Filières :</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dept.filieres.map((filiere) => (
                        <span key={filiere.id || filiere} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                          {filiere.nom || filiere}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Message si aucun département */}
          {!loading && filteredDepartements.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faBuilding} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-500">
                {searchQuery ? 'Aucun département ne correspond à votre recherche' : 'Aucun département enregistré'}
              </p>
            </div>
          )}

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingDept ? 'Modifier le département' : 'Ajouter un département'}
          >
            <div className="p-6 space-y-4">
              {/* Message d'erreur dans le modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {editingDept ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal de succès */}
          <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            type="success"
            title="Succès"
            message={successMessage}
          />

          {/* Modal d'erreur */}
          <Modal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            type="error"
            title="Erreur"
            message={errorMessage}
          />

          {/* Modal de confirmation de suppression */}
          <Modal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false)
              setDeptToDelete(null)
            }}
            type="warning"
            title="Confirmer la suppression"
            message={deptToDelete ? `Êtes-vous sûr de vouloir supprimer le département "${deptToDelete.nom}" ? Cette action est irréversible.` : ''}
          >
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setDeptToDelete(null)
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default DepartementsView

