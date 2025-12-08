import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faPlus, faEdit, faTrash, faSearch, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import { getFilieres } from '../../api/chefDepartement'

const GererModulesView = () => {
  const { showAlert } = useAlert()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filieres, setFilieres] = useState([])
  const [modules, setModules] = useState([
    { id: 1, code: 'BDD-301', nom: 'Base de données', credit: 4, semestre: 'S6', estActif: true, uniteEnseignement: 'UE-301', filiereId: '' },
    { id: 2, code: 'PW-301', nom: 'Programmation web', credit: 5, semestre: 'S6', estActif: true, uniteEnseignement: 'UE-301', filiereId: '' },
    { id: 3, code: 'RES-301', nom: 'Réseaux', credit: 3, semestre: 'S6', estActif: true, uniteEnseignement: 'UE-301', filiereId: '' },
    { id: 4, code: 'MATH-201', nom: 'Mathématiques', credit: 4, semestre: 'S4', estActif: false, uniteEnseignement: 'UE-201', filiereId: '' },
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newModule, setNewModule] = useState({
    filiereId: '',
    nom: '',
    credit: '',
    semestre: '',
    uniteEnseignement: '',
    estActif: true
  })

  // Charger les filières du département
  useEffect(() => {
    const loadFilieres = async () => {
      try {
        const res = await getFilieres()
        if (res.success) {
          setFilieres(res.filieres || [])
        }
      } catch (error) {
        console.error('Erreur chargement filières:', error)
      }
    }
    loadFilieres()
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

  const filteredModules = modules.filter(module =>
    module.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.semestre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddModule = (e) => {
    e.preventDefault()

    // Générer le code automatiquement
    const code = generateModuleCode(newModule.nom, newModule.semestre)

    const moduleToAdd = {
      id: modules.length + 1,
      ...newModule,
      code,
      credit: parseInt(newModule.credit)
    }
    setModules([...modules, moduleToAdd])
    setShowAddModal(false)
    setNewModule({
      filiereId: '',
      nom: '',
      credit: '',
      semestre: '',
      uniteEnseignement: '',
      estActif: true
    })
    showAlert('Module ajouté avec succès !', 'success')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewModule({
      ...newModule,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Prévisualiser le code généré
  const previewCode = generateModuleCode(newModule.nom, newModule.semestre)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les modules
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Gérez les modules de votre département
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Ajouter un module
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher un module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          {/* Liste des modules */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Crédits</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Semestre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unité d'enseignement</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredModules.map((module) => (
                    <tr key={module.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faBook} className="text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-slate-800">{module.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800">{module.nom}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{module.credit} crédits</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {module.semestre}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{module.uniteEnseignement}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${module.estActif
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {module.estActif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

          {/* Modal d'ajout de module */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Ajouter un nouveau module</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleAddModule} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Filière */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Filière *
                      </label>
                      <select
                        name="filiereId"
                        value={newModule.filiereId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une filière</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.code} - {f.nom}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nom du module */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nom du module *
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={newModule.nom}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Base de données"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Crédits */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nombre de crédits *
                      </label>
                      <input
                        type="number"
                        name="credit"
                        value={newModule.credit}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="10"
                        placeholder="Ex: 4"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Semestre */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Semestre * <span className="text-xs text-slate-500">(S1-S2: L1, S3-S4: L2, S5-S6: L3)</span>
                      </label>
                      <select
                        name="semestre"
                        value={newModule.semestre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un semestre</option>
                        <option value="S1">S1 (1ère année - Semestre 1)</option>
                        <option value="S2">S2 (1ère année - Semestre 2)</option>
                        <option value="S3">S3 (2ème année - Semestre 1)</option>
                        <option value="S4">S4 (2ème année - Semestre 2)</option>
                        <option value="S5">S5 (3ème année - Semestre 1)</option>
                        <option value="S6">S6 (3ème année - Semestre 2)</option>
                      </select>
                    </div>

                    {/* Code généré automatiquement - Affichage seulement */}
                    {previewCode && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Code du module (généré automatiquement)
                        </label>
                        <div className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono">
                          {previewCode}
                        </div>
                      </div>
                    )}

                    {/* Unité d'enseignement */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Unité d'enseignement *
                      </label>
                      <input
                        type="text"
                        name="uniteEnseignement"
                        value={newModule.uniteEnseignement}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: UE-301"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Statut actif/inactif */}
                    <div className="md:col-span-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="estActif"
                          checked={newModule.estActif}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-slate-700">
                          Module actif
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Ajouter le module
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default GererModulesView

