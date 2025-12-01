import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faGraduationCap, faSearch, faUsers, faBook } from '@fortawesome/free-solid-svg-icons'
import SidebarChefDepartement from '../../components/common/SidebarChefDepartement'
import HeaderChef from '../../components/common/HeaderChef'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'

const ClassesView = () => {
  const { user } = useAuth()
  // Simuler le département du chef connecté (sera récupéré depuis la BD)
  const [departementChef] = useState('Génie Informatique') // À récupérer depuis user.departement
  
  const [classes, setClasses] = useState([
    { id: 1, code: 'GI-L3-A', niveau: 'L3', effectif: 45, nombreModules: 8, filiere: 'GI', actif: true },
    { id: 2, code: 'GI-L3-B', niveau: 'L3', effectif: 42, nombreModules: 8, filiere: 'GI', actif: true },
    { id: 3, code: 'GI-L2-A', niveau: 'L2', effectif: 48, nombreModules: 7, filiere: 'GI', actif: true },
    { id: 4, code: 'GI-L2-B', niveau: 'L2', effectif: 40, nombreModules: 7, filiere: 'GI', actif: true },
  ])
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    niveau: 'L1',
    filiere: 'GI',
    actif: true
  })

  const niveaux = ['L1', 'L2', 'L3']
  const filieres = ['GI', 'RT'] // Filtrer selon le département

  useEffect(() => {
    // Filtrer les classes selon le département du chef
    // Ici on simule avec 'GI' mais ça devrait venir de user.departement
  }, [])

  const handleAdd = () => {
    setEditingClass(null)
    setFormData({ code: '', niveau: 'L1', filiere: 'GI', actif: true })
    setShowModal(true)
  }

  const handleEdit = (classe) => {
    setEditingClass(classe)
    setFormData(classe)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      setClasses(classes.filter(c => c.id !== id))
    }
  }

  const handleSave = () => {
    if (editingClass) {
      setClasses(classes.map(c => c.id === editingClass.id ? { ...formData, id: editingClass.id, effectif: editingClass.effectif, nombreModules: editingClass.nombreModules } : c))
    } else {
      setClasses([...classes, { ...formData, id: Date.now(), effectif: 0, nombreModules: formData.niveau === 'L1' ? 6 : formData.niveau === 'L2' ? 7 : 8 }])
    }
    setShowModal(false)
  }

  const filteredClasses = classes.filter(classe => 
    `${classe.code} ${classe.niveau}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChefDepartement />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName={`Chef de Département - ${departementChef}`} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Classes</h1>
              <p className="text-sm text-slate-600">Gérez les classes de votre département : {departementChef}</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Ajouter une classe
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grille des classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classe) => (
              <div key={classe.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{classe.code}</h3>
                      <p className="text-sm text-slate-500">Niveau: {classe.niveau}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    classe.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {classe.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FontAwesomeIcon icon={faUsers} className="text-sm" />
                    <span className="text-sm">{classe.effectif} étudiants</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <FontAwesomeIcon icon={faBook} className="text-sm" />
                    <span className="text-sm">{classe.nombreModules} modules</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleEdit(classe)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(classe.id)}
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
            title={editingClass ? 'Modifier la classe' : 'Ajouter une classe'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code de la classe</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: GI-L3-A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
                <select
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {niveaux.map((niveau) => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filière</label>
                <select
                  value={formData.filiere}
                  onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filieres.map((filiere) => (
                    <option key={filiere} value={filiere}>{filiere}</option>
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
                <label htmlFor="actif" className="text-sm text-slate-700">Classe active</label>
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
                  {editingClass ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default ClassesView

