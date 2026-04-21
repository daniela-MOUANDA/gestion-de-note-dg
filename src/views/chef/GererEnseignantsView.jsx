import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChalkboardTeacher, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch, 
  faEnvelope, 
  faPhone,
  faTimes,
  faUsers,
  faUserTie,
  faUserClock,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'

const GererEnseignantsView = () => {
  const { showAlert } = useAlert()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingEnseignant, setEditingEnseignant] = useState(null)
  const [enseignantToDelete, setEnseignantToDelete] = useState(null)
  
  const [enseignants, setEnseignants] = useState([
    { id: 1, nom: 'DUPONT', prenom: 'Pierre', email: 'pierre.dupont@inptic.edu', telephone: '077 00 00 01', specialite: 'Informatique', statut: 'Actif', type: 'Permanent' },
    { id: 2, nom: 'MARTIN', prenom: 'Marie', email: 'marie.martin@inptic.edu', telephone: '077 00 00 02', specialite: 'Mathématiques', statut: 'Actif', type: 'Permanent' },
    { id: 3, nom: 'BERNARD', prenom: 'Jean', email: 'jean.bernard@inptic.edu', telephone: '077 00 00 03', specialite: 'Réseaux', statut: 'Actif', type: 'Vacataire' },
    { id: 4, nom: 'DUBOIS', prenom: 'Sophie', email: 'sophie.dubois@inptic.edu', telephone: '077 00 00 04', specialite: 'Base de données', statut: 'Actif', type: 'Permanent' },
    { id: 5, nom: 'PETIT', prenom: 'Thomas', email: 'thomas.petit@inptic.edu', telephone: '077 00 00 05', specialite: 'Programmation', statut: 'Actif', type: 'Vacataire' },
    { id: 6, nom: 'LEROY', prenom: 'Julie', email: 'julie.leroy@inptic.edu', telephone: '077 00 00 06', specialite: 'Sécurité informatique', statut: 'Actif', type: 'Permanent' },
  ])

  // Calcul des statistiques
  const stats = {
    total: enseignants.length,
    permanents: enseignants.filter(e => e.type === 'Permanent').length,
    vacataires: enseignants.filter(e => e.type === 'Vacataire').length,
    actifs: enseignants.filter(e => e.statut === 'Actif').length
  }

  const [newEnseignant, setNewEnseignant] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialite: '',
    statut: 'Actif',
    type: 'Permanent'
  })

  const specialites = [
    'Informatique',
    'Mathématiques',
    'Réseaux',
    'Base de données',
    'Programmation',
    'Systèmes d\'exploitation',
    'Intelligence artificielle',
    'Sécurité informatique'
  ]

  const filteredEnseignants = enseignants.filter(enseignant =>
    `${enseignant.nom} ${enseignant.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enseignant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enseignant.specialite.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewEnseignant(prev => ({ ...prev, [name]: value }))
  }

  const handleAddEnseignant = () => {
    if (!newEnseignant.nom || !newEnseignant.prenom || !newEnseignant.email) {
      showAlert('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    const enseignant = {
      id: Date.now(),
      ...newEnseignant
    }

    setEnseignants(prev => [...prev, enseignant])
    setNewEnseignant({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      specialite: '',
      statut: 'Actif',
      type: 'Permanent'
    })
    setShowAddModal(false)
    showAlert('Enseignant ajouté avec succès !', 'success')
  }

  const handleEditEnseignant = (enseignant) => {
    setEditingEnseignant({ ...enseignant })
    setShowEditModal(true)
  }

  const handleUpdateEnseignant = () => {
    if (!editingEnseignant) return

    setEnseignants(prev =>
      prev.map(e => e.id === editingEnseignant.id ? editingEnseignant : e)
    )

    setEditingEnseignant(null)
    setShowEditModal(false)
    showAlert('Enseignant modifié avec succès !', 'success')
  }

  const handleDeleteEnseignant = (enseignant) => {
    setEnseignantToDelete(enseignant)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteEnseignant = () => {
    if (!enseignantToDelete) return

    setEnseignants(prev => prev.filter(e => e.id !== enseignantToDelete.id))
    setEnseignantToDelete(null)
    setShowDeleteConfirm(false)
    showAlert('Enseignant supprimé avec succès !', 'success')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les enseignants
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Gérez les enseignants de votre département
              </p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Ajouter un enseignant
            </button>
          </div>

          {/* Statistiques des enseignants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Total Enseignants</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUsers} className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Permanents</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.permanents}</p>
                  <p className="text-xs text-slate-400 mt-1">{((stats.permanents / stats.total) * 100).toFixed(0)}% du total</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUserTie} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Vacataires</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.vacataires}</p>
                  <p className="text-xs text-slate-400 mt-1">{((stats.vacataires / stats.total) * 100).toFixed(0)}% du total</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUserClock} className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Actifs</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.actifs}</p>
                  <p className="text-xs text-slate-400 mt-1">{((stats.actifs / stats.total) * 100).toFixed(0)}% du total</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>
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
                placeholder="Rechercher un enseignant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          {/* Liste des enseignants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEnseignants.map((enseignant) => (
              <div key={enseignant.id} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faChalkboardTeacher} />
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    enseignant.statut === 'Actif' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {enseignant.statut}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {enseignant.nom} {enseignant.prenom}
                </h3>
                <p className="text-sm text-slate-600 mb-2">{enseignant.specialite}</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  enseignant.type === 'Permanent' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {enseignant.type}
                </span>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-slate-600">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-slate-400" />
                    {enseignant.email}
                  </div>
                  <div className="flex items-center text-xs text-slate-600">
                    <FontAwesomeIcon icon={faPhone} className="mr-2 text-slate-400" />
                    {enseignant.telephone}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => handleEditEnseignant(enseignant)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-1" />
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDeleteEnseignant(enseignant)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal d'ajout d'enseignant */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewEnseignant({
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      specialite: '',
                      statut: 'Actif',
                      type: 'Permanent'
                    })
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Ajouter un enseignant</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={newEnseignant.nom}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="DUPONT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      value={newEnseignant.prenom}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Pierre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={newEnseignant.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="pierre.dupont@inptic.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={newEnseignant.telephone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="077 00 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Spécialité</label>
                    <select
                      name="specialite"
                      value={newEnseignant.specialite}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une spécialité</option>
                      {specialites.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                    <select
                      name="type"
                      value={newEnseignant.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Vacataire">Vacataire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                    <select
                      name="statut"
                      value={newEnseignant.statut}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewEnseignant({
                        nom: '',
                        prenom: '',
                        email: '',
                        telephone: '',
                        specialite: '',
                        statut: 'Actif',
                        type: 'Permanent'
                      })
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddEnseignant}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal d'édition d'enseignant */}
          {showEditModal && editingEnseignant && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingEnseignant(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Modifier l'enseignant</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={editingEnseignant.nom}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, nom: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={editingEnseignant.prenom}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, prenom: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={editingEnseignant.email}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={editingEnseignant.telephone}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, telephone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Spécialité</label>
                    <select
                      value={editingEnseignant.specialite}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, specialite: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une spécialité</option>
                      {specialites.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      value={editingEnseignant.type}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Vacataire">Vacataire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                    <select
                      value={editingEnseignant.statut}
                      onChange={(e) => setEditingEnseignant({ ...editingEnseignant, statut: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingEnseignant(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateEnseignant}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmation de suppression */}
          {showDeleteConfirm && enseignantToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setEnseignantToDelete(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faTrash} className="text-red-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Supprimer l'enseignant</h2>
                  <p className="text-slate-600">
                    Êtes-vous sûr de vouloir supprimer <strong>{enseignantToDelete.nom} {enseignantToDelete.prenom}</strong> ?
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setEnseignantToDelete(null)
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteEnseignant}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default GererEnseignantsView
