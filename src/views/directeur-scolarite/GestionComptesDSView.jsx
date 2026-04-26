/**
 * Gestion des comptes — Directeur de la Scolarité
 * Peut créer des comptes SP_SCOLARITE et CHEF_SERVICE_SCOLARITE.
 */
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faPlus, faEdit, faTrash, faCheckCircle,
  faTimesCircle, faSearch, faSpinner, faUserTie, faShieldAlt
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { getAllComptes, createCompte, updateCompte, deleteCompte, toggleActif } from '../../api/comptes.js'
import { useAlert } from '../../contexts/AlertContext'

const ROLES_ALLOWED = ['SP_SCOLARITE', 'CHEF_SERVICE_SCOLARITE', 'AGENT_SCOLARITE']

const ROLE_LABELS = {
  SP_SCOLARITE: 'Secrétaire Particulière',
  CHEF_SERVICE_SCOLARITE: 'Chef de Service Scolarité',
  AGENT_SCOLARITE: 'Agent Scolarité',
}

const ROLE_COLORS = {
  SP_SCOLARITE: 'bg-purple-100 text-purple-800',
  CHEF_SERVICE_SCOLARITE: 'bg-blue-100 text-blue-800',
  AGENT_SCOLARITE: 'bg-slate-100 text-slate-700',
}

const GestionComptesDSView = () => {
  const { success, error: showError } = useAlert()
  const [comptes,   setComptes]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', username: '', password: '',
    role: 'SP_SCOLARITE', actif: true,
  })

  const load = async () => {
    try {
      setLoading(true)
      const res = await getAllComptes()
      const all = res?.comptes || res?.data || (Array.isArray(res) ? res : [])
      setComptes(all.filter(c => ROLES_ALLOWED.includes(c.role)))
    } catch (e) {
      showError('Erreur lors du chargement des comptes')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ nom: '', prenom: '', email: '', username: '', password: '', role: 'SP_SCOLARITE', actif: true })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ nom: c.nom, prenom: c.prenom, email: c.email, username: c.username, password: '', role: c.role, actif: c.actif })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom || !form.email || !form.username || (!editing && !form.password)) {
      showError('Veuillez remplir tous les champs obligatoires.'); return
    }
    try {
      setSaving(true)
      if (editing) {
        await updateCompte(editing.id, form)
        success('Compte mis à jour.')
      } else {
        await createCompte(form)
        success('Compte créé avec succès.')
      }
      setShowModal(false)
      load()
    } catch (e) { showError(e.message || 'Erreur lors de l\'enregistrement') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce compte ?')) return
    try {
      await deleteCompte(id)
      success('Compte supprimé.')
      load()
    } catch (e) { showError(e.message || 'Erreur lors de la suppression') }
  }

  const handleToggle = async (id) => {
    try {
      await toggleActif(id)
      load()
    } catch (e) { showError(e.message || 'Erreur') }
  }

  const filtered = comptes.filter(c =>
    `${c.nom} ${c.prenom} ${c.email} ${c.username}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                Gestion des comptes
              </h1>
              <p className="text-slate-500 mt-1">Comptes du service de la scolarité</p>
            </div>
            <button onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} /> Nouveau compte
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-5 relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher par nom, email, username…" />
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-500 mb-3" />
              <p className="text-slate-500">Chargement…</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Rôle</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Aucun compte trouvé</td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{c.nom} {c.prenom}</div>
                        <div className="text-xs text-slate-400">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{c.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[c.role] || 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABELS[c.role] || c.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggle(c.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${c.actif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                          <FontAwesomeIcon icon={c.actif ? faCheckCircle : faTimesCircle} />
                          {c.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(c)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors">
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
        </main>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editing ? 'Modifier le compte' : 'Créer un compte'}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Nom *</label>
                <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Prénom *</label>
                <input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Username *</label>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Mot de passe {editing ? '(laisser vide = inchangé)' : '*'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 block mb-1">Rôle *</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm">
                {ROLES_ALLOWED.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : null}
                {editing ? 'Enregistrer' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionComptesDSView
