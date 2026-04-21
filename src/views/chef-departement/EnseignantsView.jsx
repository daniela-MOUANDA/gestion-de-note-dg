import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faChalkboardTeacher, faSearch, faBook, faUserTie, faSpinner } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import TelephoneInput from '../../components/common/TelephoneInput'
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
    statut: 'PERMANENT',
    grade: '',
    modules: [],
    actif: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les enseignants et les modules en parallèle
      const [enseignantsResult, modulesResult] = await Promise.all([
        getEnseignants(),
        getModules()
      ])

      console.log('📦 Résultats chargés:', { enseignantsResult, modulesResult })
      
      // Charger les enseignants
      if (enseignantsResult.success) {
        setEnseignants(enseignantsResult.enseignants || [])
      } else {
        showAlert(enseignantsResult.error || 'Erreur lors du chargement des enseignants', 'error')
        setEnseignants([])
      }

      // Charger les modules
      if (modulesResult.success && modulesResult.modules) {
        // Enrichir les modules avec l'info d'affectation
        const enseignantsList = enseignantsResult.success ? (enseignantsResult.enseignants || []) : []
        
        const modulesEnrichis = (modulesResult.modules || []).map(module => {
          // Trouver si le module est déjà affecté
          const affecteA = enseignantsList.find(ens => 
            ens.modules && Array.isArray(ens.modules) && ens.modules.some(m => m.id === module.id)
          )
          
          return {
            ...module,
            affecteA: affecteA ? `${affecteA.nom} ${affecteA.prenom}` : null,
            affecteAId: affecteA?.id
          }
        })
        
        console.log('📦 Modules enrichis:', modulesEnrichis)
        setModules(modulesEnrichis)
      } else {
        console.error('❌ Erreur chargement modules:', modulesResult.error)
        showAlert('Erreur lors du chargement des modules', 'warning')
        setModules([])
      }

      // Récupérer le nom du département
      if (user?.departement) {
        setDepartementChef(user.departement.nom)
      }
    } catch (error) {
      console.error('❌ Erreur loadData:', error)
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingEnseignant(null)
    setFormData({ nom: '', prenom: '', email: '', telephone: '', statut: 'PERMANENT', grade: '', modules: [], actif: true })
    setShowModal(true)
  }

  const handleEdit = (enseignant) => {
    setEditingEnseignant(enseignant)
    setFormData({
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      telephone: enseignant.telephone || '',
      statut: enseignant.statut || 'PERMANENT',
      grade: enseignant.grade || '',
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
        showAlert('Enseignant supprimé avec succès', 'success')
        loadData()
      } else {
        showAlert(result.error || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la suppression', 'error')
    }
  }

  const handleSave = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      showAlert('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    try {
      setSaving(true)
      let result

      if (editingEnseignant) {
        result = await updateEnseignant(editingEnseignant.id, formData)
        if (result.success && formData.modules.length > 0) {
          // Mettre à jour les affectations de modules
          const affectationResult = await affecterModulesEnseignant(editingEnseignant.id, formData.modules)
          if (!affectationResult.success) {
            showAlert(affectationResult.error || 'Erreur lors de l\'affectation des modules', 'error')
            setSaving(false)
            return
          }
        }
      } else {
        result = await createEnseignant(formData)
        if (result.success && formData.modules.length > 0) {
          // Affecter les modules
          const affectationResult = await affecterModulesEnseignant(result.enseignant.id, formData.modules)
          if (!affectationResult.success) {
            showAlert(affectationResult.error || 'Erreur lors de l\'affectation des modules', 'error')
            setSaving(false)
            return
          }
        }
      }

      if (result.success) {
        showAlert(editingEnseignant ? 'Enseignant modifié avec succès' : 'Enseignant créé avec succès', 'success')
        setShowModal(false)
        loadData()
      } else {
        showAlert(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la sauvegarde', 'error')
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Modules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actif</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEnseignants.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
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
                              <p className="font-semibold text-slate-800">
                                {enseignant.grade && <span className="text-blue-600 mr-1">{enseignant.grade}</span>}
                                {enseignant.nom} {enseignant.prenom}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{enseignant.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{enseignant.telephone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            enseignant.statut === 'PERMANENT' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {enseignant.statut === 'PERMANENT' ? 'Permanent' : 'Vacataire'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {enseignant.grade || '-'}
                        </td>
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
                              <span className="text-xs text-slate-400">Aucun</span>
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
            size="6xl"
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <TelephoneInput
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  name="telephone"
                  label="Téléphone"
                  required={false}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="VACATAIRE">Vacataire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucun</option>
                    <option value="Dr">Dr (Docteur)</option>
                    <option value="Pr">Pr (Professeur)</option>
                    <option value="MC">MC (Maître de Conférences)</option>
                    <option value="MA">MA (Maître Assistant)</option>
                    <option value="Ing">Ing (Ingénieur)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modules assignés</label>
                  <select
                    multiple
                    value={formData.modules}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                      setFormData({ ...formData, modules: selectedOptions })
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                    style={{ fontSize: '14px' }}
                  >
                    {modules.length === 0 ? (
                      <option disabled>Aucun module disponible - Créez d'abord des modules</option>
                    ) : (
                      modules.map((module) => {
                        const dejaAffecte = module.affecteA && module.affecteAId !== editingEnseignant?.id
                        return (
                          <option 
                            key={module.id} 
                            value={module.id}
                            disabled={dejaAffecte}
                            style={{
                              color: dejaAffecte ? '#94a3b8' : '#1e293b',
                              fontWeight: dejaAffecte ? 'normal' : '500'
                            }}
                          >
                            {dejaAffecte ? '🔒 ' : '✓ '}
                            {module.code} - {module.nom}
                            {dejaAffecte ? ` → ${module.affecteA}` : ''}
                          </option>
                        )
                      })
                    )}
                  </select>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-slate-600">
                      💡 Maintenez <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">Ctrl</kbd> (ou <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">Cmd</kbd>) pour sélectionner plusieurs modules
                    </p>
                    <p className="text-orange-600 flex items-center gap-1">
                      <span>🔒</span> Les modules grisés sont déjà affectés à d'autres enseignants
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Compte actif</label>
                  <select
                    value={formData.actif ? 'Actif' : 'Inactif'}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'Actif' })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
