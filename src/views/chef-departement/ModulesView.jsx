import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faBook, faSearch, faUpload, faFileExcel, faSpinner } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getModules, createModule, updateModule, deleteModule, getFilieres } from '../../api/chefDepartement.js'

const ModulesView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [departementChef, setDepartementChef] = useState('')
  const [modules, setModules] = useState([])
  const [filieres, setFilieres] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSemestre, setFilterSemestre] = useState('')
  const [filterUE, setFilterUE] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    credit: '',
    semestre: '',
    filiereId: '',
    ue: 'UE1',
    actif: true
  })

  useEffect(() => {
    loadData()
  }, [])

  // Générer le code du module automatiquement
  const generateModuleCode = (nom, semestre) => {
    if (!nom || !semestre) return ''

    // Prendre les 3 premières lettres du nom (ou moins si nom court)
    const prefix = nom
      .toUpperCase()
      .replace(/[^A-Z]/g, '') // Retirer les caractères non-alphabétiques
      .substring(0, 3)
      .padEnd(3, 'X') // Compléter avec X si moins de 3 lettres

    // Extraire le numéro du semestre (S1 -> 1, S6 -> 6)
    const semestreNum = semestre.replace('S', '')

    return `${prefix}-${semestreNum}01`
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les modules
      const modulesResult = await getModules()
      if (modulesResult.success) {
        setModules(modulesResult.modules)
      } else {
        showAlert(modulesResult.error || 'Erreur lors du chargement des modules', 'error')
      }

      // Charger les filières
      const filieresResult = await getFilieres()
      if (filieresResult.success) {
        setFilieres(filieresResult.filieres)
      }

      // Récupérer le nom du département
      if (user?.departement) {
        setDepartementChef(user.departement.nom)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingModule(null)
    setFormData({ 
      code: '', 
      nom: '', 
      credit: '', 
      semestre: '', 
      filiereId: '', 
      ue: 'UE1',
      actif: true 
    })
    setShowModal(true)
  }

  const handleEdit = (module) => {
    setEditingModule(module)
    setFormData({
      code: module.code,
      nom: module.nom,
      credit: module.credit.toString(),
      semestre: module.semestre,
      filiereId: module.filiereId,
      ue: module.ue || 'UE1',
      actif: module.actif
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      return
    }

    try {
      const result = await deleteModule(id)
      if (result.success) {
        showAlert('Module supprimé avec succès', 'success')
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
    if (!formData.nom || !formData.credit || !formData.semestre || !formData.filiereId || !formData.ue) {
      showAlert('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    try {
      setSaving(true)
      
      // Générer le code automatiquement
      const code = generateModuleCode(formData.nom, formData.semestre)
      const dataToSend = { ...formData, code }
      
      let result

      if (editingModule) {
        result = await updateModule(editingModule.id, dataToSend)
      } else {
        result = await createModule(dataToSend)
      }

      if (result.success) {
        showAlert(editingModule ? 'Module modifié avec succès' : 'Module créé avec succès', 'success')
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

  const handleFileUpload = () => {
    if (!selectedFile || !selectedFiliere) {
      showAlert('Veuillez sélectionner un fichier et une filière', 'error')
      return
    }
    // TODO: Implémenter l'upload Excel
    showAlert(`Fichier Excel "${selectedFile.name}" sera importé pour la filière ${selectedFiliere}`, 'info')
    setShowUploadModal(false)
    setSelectedFile(null)
    setSelectedFiliere('')
  }

  // Extraire les valeurs uniques pour les filtres
  const semestresUniques = [...new Set(modules.map(m => m.semestre).filter(Boolean))].sort()
  const ueUniques = [...new Set(modules.map(m => m.ue || 'UE1').filter(Boolean))].sort()
  
  // Extraire les filières uniques (peut être un code ou un ID)
  const filieresUniques = [...new Set(
    modules
      .map(m => {
        // Priorité: filiere (code) puis filiereId
        return m.filiere || (m.filiereId && filieres.find(f => f.id === m.filiereId)?.code) || m.filiereId
      })
      .filter(Boolean)
  )].sort()

  // Filtrer les modules selon les critères
  const filteredModules = modules.filter(module => {
    // Filtre de recherche textuelle
    const matchesSearch = !searchQuery || 
      `${module.code} ${module.nom} ${module.filiere || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtre par semestre
    const matchesSemestre = !filterSemestre || module.semestre === filterSemestre
    
    // Filtre par UE
    const moduleUE = module.ue || 'UE1'
    const matchesUE = !filterUE || moduleUE === filterUE
    
    // Filtre par filière
    let matchesFiliere = true
    if (filterFiliere) {
      const moduleFiliereCode = module.filiere
      const moduleFiliereId = module.filiereId
      
      // Vérifier si le code correspond
      if (moduleFiliereCode === filterFiliere) {
        matchesFiliere = true
      } 
      // Vérifier si l'ID correspond (et récupérer le code de la filière)
      else if (moduleFiliereId) {
        const filiereObj = filieres.find(f => f.id === moduleFiliereId)
        if (filiereObj && (filiereObj.code === filterFiliere || filiereObj.id === filterFiliere)) {
          matchesFiliere = true
        } else {
          matchesFiliere = false
        }
      } else {
        matchesFiliere = false
      }
    }
    
    return matchesSearch && matchesSemestre && matchesUE && matchesFiliere
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des modules...</p>
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
          {/* En-tête avec titre et boutons */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Modules</h1>
                <p className="text-sm text-slate-600">Gérez les modules de votre département{departementChef ? ` : ${departementChef}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={handleAdd}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  <span>Ajouter un module</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-sm" />
                  <span>Importer Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="mb-6 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Rechercher un module par code, nom ou filière..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Filtres :</span>
                </div>
                
                {/* Filtre Semestre */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Semestre</label>
                  <select
                    value={filterSemestre}
                    onChange={(e) => setFilterSemestre(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Tous les semestres</option>
                    {semestresUniques.map(semestre => (
                      <option key={semestre} value={semestre}>{semestre}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre UE */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unité d'Enseignement</label>
                  <select
                    value={filterUE}
                    onChange={(e) => setFilterUE(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Toutes les UE</option>
                    {ueUniques.map(ue => (
                      <option key={ue} value={ue}>{ue}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre Filière */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Filière</label>
                  <select
                    value={filterFiliere}
                    onChange={(e) => setFilterFiliere(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Toutes les filières</option>
                    {filieresUniques.map(filiere => (
                      <option key={filiere} value={filiere}>{filiere}</option>
                    ))}
                  </select>
                </div>

                {/* Bouton réinitialiser les filtres */}
                {(filterSemestre || filterUE || filterFiliere) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterSemestre('')
                        setFilterUE('')
                        setFilterFiliere('')
                      }}
                      className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors whitespace-nowrap"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Indicateur de résultats */}
          {(filterSemestre || filterUE || filterFiliere || searchQuery) && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-blue-600">
                  (sur {modules.length} au total)
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterSemestre('')
                  setFilterUE('')
                  setFilterFiliere('')
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}

          {/* Tableau */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Crédits</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Semestre</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">UE</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Filière</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredModules.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FontAwesomeIcon icon={faBook} className="text-6xl text-slate-300 mb-4" />
                          <p className="text-lg font-medium text-slate-500 mb-2">Aucun module trouvé</p>
                          <p className="text-sm text-slate-400 mb-4">Commencez par créer votre premier module</p>
                          <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Ajouter un module</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredModules.map((module) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            module.ue === 'UE1' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {module.ue || 'UE1'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{module.filiere || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            module.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {module.actif ? 'Actif' : 'Inactif'}
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
            title={editingModule ? 'Modifier le module' : 'Ajouter un module'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du module *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crédits *</label>
                  <input
                    type="number"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 4"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Semestre *</label>
                  <select
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="S1">S1 (L1)</option>
                    <option value="S2">S2 (L1)</option>
                    <option value="S3">S3 (L2)</option>
                    <option value="S4">S4 (L2)</option>
                    <option value="S5">S5 (L3)</option>
                    <option value="S6">S6 (L3)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filière *</label>
                <select
                  value={formData.filiereId}
                  onChange={(e) => setFormData({ ...formData, filiereId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>{filiere.code} - {filiere.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unité d'Enseignement (UE) *</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ue"
                      value="UE1"
                      checked={formData.ue === 'UE1'}
                      onChange={(e) => setFormData({ ...formData, ue: e.target.value })}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">UE1</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ue"
                      value="UE2"
                      checked={formData.ue === 'UE2'}
                      onChange={(e) => setFormData({ ...formData, ue: e.target.value })}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">UE2</span>
                  </label>
                </div>
              </div>
              {formData.nom && formData.semestre && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code du module (auto-généré)</label>
                  <input
                    type="text"
                    value={generateModuleCode(formData.nom, formData.semestre)}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    placeholder="Ex: BDD-301"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="estActif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="estActif" className="text-sm text-slate-700">Module actif</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Sélectionner une filière</label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>{filiere.code} - {filiere.nom}</option>
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
                  disabled={!selectedFile || !selectedFiliere}
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
