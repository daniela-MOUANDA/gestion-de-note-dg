import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faGraduationCap, faSearch, faUsers, faBook, faSpinner, faEye, faTimes } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getClasses, createClasse, updateClasse, deleteClasse, getEtudiantsByClasse } from '../../api/chefDepartement.js'
import { getFilieres } from '../../api/scolarite.js'

// Fonction pour obtenir tous les niveaux
const getAllNiveaux = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:3000/api/scolarite/niveaux', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Erreur lors de la récupération des niveaux')
    return await response.json()
  } catch (error) {
    console.error('Erreur:', error)
    // Fallback: retourner une liste statique
    return [
      { id: 'L1', code: 'L1', nom: '1ère année', ordinal: '1ère' },
      { id: 'L2', code: 'L2', nom: '2ème année', ordinal: '2ème' },
      { id: 'L3', code: 'L3', nom: '3ème année', ordinal: '3ème' }
    ]
  }
}

// Modal pour la liste des étudiants
const StudentListModal = ({ isOpen, onClose, classe, etudiants, loading }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Liste des étudiants</h2>
          {classe && (
            <p className="text-slate-600">
              Classe : <span className="font-semibold">{classe.code}</span> • {classe.nom}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement de la liste...</p>
            </div>
          ) : etudiants.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
              <FontAwesomeIcon icon={faUsers} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Aucun étudiant dans cette classe</p>
              <p className="text-sm text-slate-400 mt-1">Les étudiants répartis apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider rounded-tl-lg">Matricule</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider rounded-tr-lg">Téléphone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {etudiants.map((etudiant) => (
                    <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {etudiant.matricule}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{etudiant.nom}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{etudiant.prenom}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{etudiant.email || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{etudiant.telephone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

const ClassesView = () => {
  // ... (existing hooks)
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [departementChef, setDepartementChef] = useState('')
  const [classes, setClasses] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // States pour la liste des étudiants
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedClassStudents, setSelectedClassStudents] = useState({ classe: null, etudiants: [], loading: false })

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    filiereId: '',
    niveauId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  // ... (loadData function remains same)
  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les classes
      const classesResult = await getClasses()
      if (classesResult.success) {
        setClasses(classesResult.classes)
      } else {
        showAlert(classesResult.error || 'Erreur lors du chargement des classes', 'error')
      }

      // Charger les filières du département
      const filieresResult = await getFilieres()
      if (Array.isArray(filieresResult)) {
        // Filtrer les filières du département de l'utilisateur
        const userFilieres = filieresResult.filter(f =>
          f.departement?.id === user?.departementId || f.departementId === user?.departementId
        )
        setFilieres(userFilieres)
        if (userFilieres.length > 0 && !formData.filiereId) {
          setFormData(prev => ({ ...prev, filiereId: userFilieres[0].id }))
        }
      }

      // Charger les niveaux
      const niveauxResult = await getAllNiveaux()
      if (Array.isArray(niveauxResult)) {
        setNiveaux(niveauxResult)
        if (niveauxResult.length > 0 && !formData.niveauId) {
          setFormData(prev => ({ ...prev, niveauId: niveauxResult[0].id }))
        }
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

  // ... (existing handlers: handleAdd, handleEdit, handleDelete, handleSave)
  const handleAdd = () => {
    setEditingClass(null)
    setFormData({
      code: '',
      nom: '',
      filiereId: filieres[0]?.id || '',
      niveauId: niveaux[0]?.id || ''
    })
    setShowModal(true)
  }

  const handleEdit = (classe) => {
    setEditingClass(classe)
    setFormData({
      code: classe.code,
      nom: classe.nom,
      filiereId: classe.filiereId,
      niveauId: classe.niveauId
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      return
    }

    try {
      const result = await deleteClasse(id)
      if (result.success) {
        showAlert('Classe supprimée avec succès', 'success')
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
    if (!formData.code || !formData.nom || !formData.filiereId || !formData.niveauId) {
      showAlert('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    try {
      setSaving(true)
      let result

      if (editingClass) {
        result = await updateClasse(editingClass.id, formData)
      } else {
        result = await createClasse(formData)
      }

      if (result.success) {
        showAlert(editingClass ? 'Classe modifiée avec succès' : 'Classe créée avec succès', 'success')
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

  const handleViewStudents = async (classe) => {
    setSelectedClassStudents({ classe, etudiants: [], loading: true })
    setShowStudentModal(true)

    try {
      const result = await getEtudiantsByClasse(classe.id)
      if (result.success) {
        setSelectedClassStudents(prev => ({ ...prev, etudiants: result.etudiants, loading: false }))
      } else {
        showAlert(result.error || 'Erreur lors du chargement des étudiants', 'error')
        setSelectedClassStudents(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error(err)
      showAlert('Erreur technique', 'error')
      setSelectedClassStudents(prev => ({ ...prev, loading: false }))
    }
  }

  const filteredClasses = classes.filter(classe =>
    `${classe.code} ${classe.nom || ''} ${classe.niveau || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
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
              <p className="text-slate-600">Chargement des classes...</p>
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
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">Aucune classe trouvée</p>
              <p className="text-slate-400 text-sm mt-2">Commencez par créer une nouvelle classe</p>
            </div>
          ) : (
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
                        {classe.nom && <p className="text-xs text-slate-400">{classe.nom}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FontAwesomeIcon icon={faUsers} className="text-sm" />
                      <span className="text-sm">{classe.effectif || 0} étudiants</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FontAwesomeIcon icon={faBook} className="text-sm" />
                      <span className="text-sm">{classe.nombreModules || 0} modules</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    {/* Bouton Voir les étudiants */}
                    <button
                      onClick={() => handleViewStudents(classe)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center"
                      title="Voir la liste des étudiants"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>

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
          )}

          {/* Modal d'ajout/modification */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingClass ? 'Modifier la classe' : 'Ajouter une classe'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code de la classe *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: GI-L3-A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la classe *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Génie Informatique L3 Groupe A"
                />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau *</label>
                <select
                  value={formData.niveauId}
                  onChange={(e) => setFormData({ ...formData, niveauId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>{niveau.code} - {niveau.nom}</option>
                  ))}
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
                  {editingClass ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal liste étudiants */}
          <StudentListModal
            isOpen={showStudentModal}
            onClose={() => setShowStudentModal(false)}
            classe={selectedClassStudents.classe}
            etudiants={selectedClassStudents.etudiants}
            loading={selectedClassStudents.loading}
          />
        </main>
      </div>
    </div>
  )
}

export default ClassesView
