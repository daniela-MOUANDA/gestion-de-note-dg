import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserFriends,
  faPlus,
  faSpinner,
  faEnvelope,
  faPhone,
  faLock,
  faUser,
  faToggleOn,
  faToggleOff,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAlert } from '../../contexts/AlertContext'
import {
  getCoordinateursPedagogiques,
  createCoordinateurPedagogiqueApi,
  updateCoordinateurPedagogiqueApi,
  deleteCoordinateurPedagogiqueApi
} from '../../api/chefDepartement'

const emptyForm = () => ({
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '',
  telephone: ''
})

const CoordinateursPedagogiquesView = () => {
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [editPatch, setEditPatch] = useState({})
  const [confirmDeleteRow, setConfirmDeleteRow] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCoordinateursPedagogiques()
      if (res.success) setRows(res.coordinateurs || [])
      else showAlert(res.error || 'Erreur de chargement', 'error')
    } catch (e) {
      console.error(e)
      showAlert('Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createCoordinateurPedagogiqueApi({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        motDePasse: form.motDePasse,
        telephone: form.telephone || undefined
      })
      if (res.success) {
        if (res.emailEnvoye) {
          showAlert(
            'Compte créé. Un e-mail de confirmation avec les identifiants a été envoyé à l’adresse indiquée.',
            'success'
          )
        } else {
          showAlert(
            res.avertissementEmail === 'SMTP non configuré'
              ? 'Compte créé. La messagerie (SMTP) n’est pas configurée sur le serveur : transmettez les identifiants manuellement.'
              : `Compte créé, mais l’e-mail n’a pas pu être envoyé : ${res.avertissementEmail || 'erreur inconnue'}. Communiquez les accès manuellement.`,
            'warning'
          )
        }
        setForm(emptyForm())
        await load()
      } else showAlert(res.error || 'Création impossible', 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r) => {
    setEditingId(r.id)
    setEditPatch({
      nom: r.nom,
      prenom: r.prenom,
      telephone: r.telephone || '',
      motDePasse: ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPatch({})
  }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      const body = {
        nom: editPatch.nom,
        prenom: editPatch.prenom,
        telephone: editPatch.telephone || null
      }
      if (editPatch.motDePasse) body.motDePasse = editPatch.motDePasse
      const res = await updateCoordinateurPedagogiqueApi(id, body)
      if (res.success) {
        showAlert('Coordinateur mis à jour', 'success')
        cancelEdit()
        await load()
      } else showAlert(res.error || 'Mise à jour impossible', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (r) => {
    setSaving(true)
    try {
      const res = await updateCoordinateurPedagogiqueApi(r.id, { actif: !r.actif })
      if (res.success) {
        showAlert(r.actif ? 'Compte désactivé' : 'Compte réactivé', 'success')
        await load()
      } else showAlert(res.error || 'Action impossible', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmDeleteRow) return
    setSaving(true)
    try {
      const res = await deleteCoordinateurPedagogiqueApi(confirmDeleteRow.id)
      if (res.success) {
        showAlert('Compte coordinateur supprimé définitivement.', 'success')
        setConfirmDeleteRow(null)
        cancelEdit()
        await load()
      } else showAlert(res.error || 'Suppression impossible', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Modal
        isOpen={!!confirmDeleteRow}
        onClose={() => !saving && setConfirmDeleteRow(null)}
        type="warning"
        title="Supprimer ce coordinateur ?"
        message={
          confirmDeleteRow
            ? `Le compte de ${confirmDeleteRow.nom} ${confirmDeleteRow.prenom} (${confirmDeleteRow.email}) sera supprimé définitivement. Cette action est irréversible.`
            : ''
        }
      >
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => setConfirmDeleteRow(null)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={confirmDelete}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
            Supprimer
          </button>
        </div>
      </Modal>

      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28 max-w-6xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FontAwesomeIcon icon={faUserFriends} className="text-blue-600" />
              Coordinateurs pédagogiques
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Créez des comptes distincts pour vos collaborateurs : mêmes accès que vous sur le département,
              sans partager votre identifiant (sessions et audit séparés).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} className="text-emerald-600" />
                Nouveau compte
              </h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Prénom</label>
                    <input
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.prenom}
                      onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Nom</label>
                    <input
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.nom}
                      onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faEnvelope} className="text-slate-400" /> Email (connexion)
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faPhone} className="text-slate-400" /> Téléphone (optionnel)
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faLock} className="text-slate-400" /> Mot de passe (min. 8 caractères)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.motDePasse}
                    onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : null}
                  Créer le compte
                </button>
              </form>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Équipe</h2>
              {loading ? (
                <div className="flex justify-center py-12 text-slate-500">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
                </div>
              ) : rows.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucun coordinateur pour l’instant.</p>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {rows.map((r) => (
                    <li key={r.id} className="py-4 first:pt-0">
                      {editingId === r.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                              value={editPatch.prenom}
                              onChange={(e) => setEditPatch((p) => ({ ...p, prenom: e.target.value }))}
                            />
                            <input
                              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                              value={editPatch.nom}
                              onChange={(e) => setEditPatch((p) => ({ ...p, nom: e.target.value }))}
                            />
                          </div>
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                            placeholder="Téléphone"
                            value={editPatch.telephone}
                            onChange={(e) => setEditPatch((p) => ({ ...p, telephone: e.target.value }))}
                          />
                          <input
                            type="password"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                            placeholder="Nouveau mot de passe (optionnel)"
                            autoComplete="new-password"
                            value={editPatch.motDePasse}
                            onChange={(e) => setEditPatch((p) => ({ ...p, motDePasse: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(r.id)}
                              disabled={saving}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-800">
                              {r.nom} {r.prenom}
                              {!r.actif && (
                                <span className="ml-2 text-xs font-normal text-amber-700">(désactivé)</span>
                              )}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                              <FontAwesomeIcon icon={faEnvelope} /> {r.email}
                            </p>
                            {r.telephone && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                <FontAwesomeIcon icon={faPhone} /> {r.telephone}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleActif(r)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              title={r.actif ? 'Désactiver le compte' : 'Réactiver'}
                            >
                              <FontAwesomeIcon icon={r.actif ? faToggleOn : faToggleOff} className="text-blue-600" />
                              {r.actif ? 'Actif' : 'Inactif'}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-800 hover:bg-slate-200"
                            >
                              <FontAwesomeIcon icon={faUser} /> Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRow(r)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                              title="Supprimer définitivement ce compte"
                            >
                              <FontAwesomeIcon icon={faTrash} /> Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CoordinateursPedagogiquesView
