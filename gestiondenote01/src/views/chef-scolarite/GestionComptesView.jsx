import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faPlus, faEdit, faTrash, faCheckCircle, faTimesCircle, faSearch, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { getAllComptes, createCompte, updateCompte, deleteCompte, toggleActif } from '../../api/comptes.js'
import { useAlert } from '../../contexts/AlertContext'

const GestionComptesView = () => {
  const { success, error: showError } = useAlert()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create') // 'create' ou 'edit'
  const [currentCompte, setCurrentCompte] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    username: '',
    password: '',
    role: 'Agent',
    actif: true
  })

  const [comptes, setComptes] = useState([])

  // Charger les comptes au montage du composant
  useEffect(() => {
    loadComptes()
  }, [])

  const loadComptes = async () => {
    try {
      setLoading(true)
      const result = await getAllComptes()
      if (result.success) {
        // Formater les dates pour l'affichage
        const formattedComptes = result.comptes.map(compte => ({
          ...compte,
          dateCreation: new Date(compte.dateCreation).toLocaleDateString('fr-FR'),
          derniereConnexion: compte.derniereConnexion 
            ? new Date(compte.derniereConnexion).toLocaleString('fr-FR')
            : '-'
        }))
        setComptes(formattedComptes)
      } else {
        showError(result.error || 'Erreur lors du chargement des comptes')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError(error.message || 'Erreur lors du chargement des comptes')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (type, compte = null) => {
    setModalType(type)
    setCurrentCompte(compte)
    if (type === 'edit' && compte) {
      setFormData({
        nom: compte.nom,
        prenom: compte.prenom,
        email: compte.email,
        username: compte.username,
        password: '',
        role: compte.role,
        actif: compte.actif
      })
    } else {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        username: '',
        password: '',
        role: 'Agent',
        actif: true
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      if (modalType === 'create') {
        const result = await createCompte(formData)
        if (result.success) {
          success('Compte créé avec succès !')
          setShowModal(false)
          await loadComptes() // Recharger la liste
        } else {
          showError(result.error || 'Erreur lors de la création du compte')
        }
      } else {
        // Pour la modification, ne pas envoyer le mot de passe s'il est vide
        const updateData = { ...formData }
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password
        }
        
        const result = await updateCompte(currentCompte.id, updateData)
        if (result.success) {
          success('Compte modifié avec succès !')
          setShowModal(false)
          await loadComptes() // Recharger la liste
        } else {
          showError(result.error || 'Erreur lors de la modification du compte')
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError(error.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActif = async (compte) => {
    try {
      const result = await toggleActif(compte.id, !compte.actif)
      if (result.success) {
        success(`Compte ${!compte.actif ? 'activé' : 'désactivé'} avec succès !`)
        await loadComptes() // Recharger la liste
      } else {
        showError(result.error || 'Erreur lors de la modification du statut')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError(error.message || 'Une erreur est survenue')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      try {
        const result = await deleteCompte(id)
        if (result.success) {
          success('Compte supprimé avec succès !')
          await loadComptes() // Recharger la liste
        } else {
          showError(result.error || 'Erreur lors de la suppression du compte')
        }
      } catch (error) {
        console.error('Erreur:', error)
        showError(error.message || 'Une erreur est survenue')
      }
    }
  }

  const filteredComptes = comptes.filter(c =>
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const countByStat = {
    total: comptes.length,
    actifs: comptes.filter(c => c.actif).length,
    agents: comptes.filter(c => c.role === 'Agent').length,
    sp: comptes.filter(c => c.role === 'SP-Scolarité').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
              Gestion des comptes
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Créez et gérez les comptes des agents et de la SP-Scolarité
            </p>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-3xl font-bold text-slate-800">{countByStat.total}</h3>
              <p className="text-sm text-slate-600">Total comptes</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <h3 className="text-3xl font-bold text-slate-800">{countByStat.actifs}</h3>
              <p className="text-sm text-slate-600">Comptes actifs</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-3xl font-bold text-slate-800">{countByStat.agents}</h3>
              <p className="text-sm text-slate-600">Agents</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <h3 className="text-3xl font-bold text-slate-800">{countByStat.sp}</h3>
              <p className="text-sm text-slate-600">SP-Scolarité</p>
            </div>
          </div>

          {/* Barre de recherche et bouton créer */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rechercher par nom, email, username..."
                />
              </div>
              <button
                onClick={() => handleOpenModal('create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPlus} />
                Créer un compte
              </button>
            </div>
          </div>

          {/* Table des comptes */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <FontAwesomeIcon icon={faSpinner} className="text-blue-600 text-3xl animate-spin" />
                <span className="ml-3 text-slate-600">Chargement des comptes...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Nom complet</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Dernière connexion</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredComptes.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                          Aucun compte trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredComptes.map((compte) => (
                    <tr key={compte.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{compte.prenom} {compte.nom}</p>
                        <p className="text-xs text-slate-500">Créé le {compte.dateCreation}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{compte.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{compte.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          compte.role === 'SP-Scolarité' 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {compte.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActif(compte)}
                          className="flex items-center gap-2"
                        >
                          <FontAwesomeIcon 
                            icon={compte.actif ? faCheckCircle : faTimesCircle} 
                            className={compte.actif ? 'text-green-600' : 'text-red-600'}
                          />
                          <span className={`text-sm font-semibold ${
                            compte.actif ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {compte.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{compte.derniereConnexion}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal('edit', compte)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(compte.id)}
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
            )}
          </div>
        </main>
      </div>

      {/* Modal Créer/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">
              {modalType === 'create' ? 'Créer un nouveau compte' : 'Modifier le compte'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {modalType === 'create' ? 'Mot de passe *' : 'Nouveau mot de passe'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={modalType === 'create'}
                    placeholder={modalType === 'edit' ? 'Laisser vide pour ne pas changer' : ''}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Agent">Agent</option>
                  <option value="SP-Scolarité">SP-Scolarité</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="actif" className="text-sm font-semibold text-slate-700">
                  Compte actif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {modalType === 'create' ? 'Créer' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionComptesView

