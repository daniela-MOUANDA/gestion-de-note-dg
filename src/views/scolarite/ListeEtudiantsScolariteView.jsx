import { useState, useEffect, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faPen, faSpinner, faUsers } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import {
  getFilieres,
  getPromotions,
  getNiveauxAll,
  getListeEtudiantsScolarite,
  updateEtudiantInfo
} from '../../api/scolarite'
import { pickPromotionForCurrentAcademicYear } from '../../utils/academicYear.js'

/** Libellé court pour la colonne Filière (évite les lignes très hautes). */
const filiereCourt = (r) => {
  const code = (r.filiereCode || '').trim()
  if (code) return code
  const nom = (r.filiereNom || '').trim()
  if (!nom) return '—'
  return nom.length > 22 ? `${nom.slice(0, 20)}…` : nom
}

const filiereTooltip = (r) => {
  const nom = (r.filiereNom || '').trim()
  const code = (r.filiereCode || '').trim()
  if (nom && code) return `${nom} (${code})`
  return nom || code || undefined
}

const ListeEtudiantsScolariteView = () => {
  const { success, error: showError } = useAlert()

  const [promotions, setPromotions] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [promotionId, setPromotionId] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [niveauId, setNiveauId] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [promos, fils, nivs] = await Promise.all([
          getPromotions(),
          getFilieres({ sansGroupes: true }),
          getNiveauxAll()
        ])
        setPromotions(promos || [])
        setFilieres(fils || [])
        setNiveaux(nivs || [])
        const pick = pickPromotionForCurrentAcademicYear(promos || [])
        if (pick?.id) setPromotionId(pick.id)
      } catch (e) {
        console.error(e)
        showError(e.message || 'Impossible de charger les filtres')
      }
    }
    loadRefs()
  }, [showError])

  const fetchListe = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getListeEtudiantsScolarite({
        promotionId: promotionId || undefined,
        filiereId: filiereId || undefined,
        niveauId: niveauId || undefined
      })
      setRows(res.data || [])
    } catch (e) {
      console.error(e)
      showError(e.message || 'Erreur lors du chargement')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [promotionId, filiereId, niveauId, showError])

  useEffect(() => {
    fetchListe()
  }, [fetchListe])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const blob = `${r.nom} ${r.prenom} ${r.matricule} ${r.email || ''} ${r.telephone || ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search])

  const openEdit = (r) => {
    setEditRow(r)
    setForm({
      nom: r.nom || '',
      prenom: r.prenom || '',
      email: r.email || '',
      telephone: r.telephone || ''
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      await updateEtudiantInfo(editRow.etudiantId, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim() || null
      })
      setRows((prev) =>
        prev.map((line) =>
          line.etudiantId === editRow.etudiantId
            ? {
                ...line,
                nom: form.nom.trim(),
                prenom: form.prenom.trim(),
                email: form.email.trim(),
                telephone: form.telephone.trim() || null
              }
            : line
        )
      )
      success('Informations mises à jour.')
      setEditOpen(false)
      setEditRow(null)
    } catch (e) {
      showError(e.message || 'Échec de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 pt-28 sm:p-6 sm:pt-28 lg:p-8 lg:pt-32">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                Liste étudiants
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Filtrez par année académique, filière et niveau. Modifiez nom, prénom, email et téléphone.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Année académique</label>
              <select
                value={promotionId}
                onChange={(e) => setPromotionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes les promotions</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.annee}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Filière</label>
              <select
                value={filiereId}
                onChange={(e) => setFiliereId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom || f.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="block text-xs font-semibold uppercase text-slate-500">Niveau</label>
              <select
                value={niveauId}
                onChange={(e) => setNiveauId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.code || n.nom}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={fetchListe}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Chargement…
                </>
              ) : (
                'Actualiser'
              )}
            </button>
          </div>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher (nom, prénom, matricule, email…)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              {filtered.length} ligne(s) affichée(s) {rows.length !== filtered.length ? `sur ${rows.length}` : ''}
            </p>
          </div>

          <p className="mb-2 text-xs text-slate-500">
            Tableau large : faites défiler horizontalement pour voir toutes les colonnes.
          </p>
          <div className="max-w-full overflow-x-auto overflow-y-visible rounded-xl border border-slate-200 bg-white shadow-sm overscroll-x-contain">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                  <th className="whitespace-nowrap p-3">Matricule</th>
                  <th className="whitespace-nowrap p-3">Nom</th>
                  <th className="whitespace-nowrap p-3">Prénom</th>
                  <th className="whitespace-nowrap p-3">Email</th>
                  <th className="whitespace-nowrap p-3">Téléphone</th>
                  <th className="w-28 whitespace-nowrap p-3">Filière</th>
                  <th className="whitespace-nowrap p-3">Niveau</th>
                  <th className="whitespace-nowrap p-3">Année</th>
                  <th className="whitespace-nowrap p-3">Statut</th>
                  <th className="whitespace-nowrap p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.inscriptionId}-${r.etudiantId}`} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap p-2 font-mono text-xs">{r.matricule || '—'}</td>
                    <td className="whitespace-nowrap p-2 font-medium">{r.nom}</td>
                    <td className="whitespace-nowrap p-2">{r.prenom}</td>
                    <td className="whitespace-nowrap p-2 text-slate-700" title={r.email || undefined}>
                      {r.email || '—'}
                    </td>
                    <td className="whitespace-nowrap p-2">{r.telephone || '—'}</td>
                    <td
                      className="whitespace-nowrap p-2 text-xs font-medium"
                      title={filiereTooltip(r)}
                    >
                      {filiereCourt(r)}
                    </td>
                    <td className="whitespace-nowrap p-2 text-xs">{r.niveauCode || r.niveauNom || '—'}</td>
                    <td className="whitespace-nowrap p-2 text-xs">{r.anneeAcademique || '—'}</td>
                    <td className="whitespace-nowrap p-2 text-xs">{r.statutInscription || '—'}</td>
                    <td className="whitespace-nowrap p-2 text-center">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <FontAwesomeIcon icon={faPen} />
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <p className="p-8 text-center text-slate-500">Aucun étudiant pour ces critères.</p>
            )}
          </div>
        </main>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Modifier l&apos;étudiant</h2>
            <p className="mt-1 text-xs text-slate-500">
              {editRow?.matricule} — les changements s&apos;appliquent au dossier étudiant (toutes inscriptions liées).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nom</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Prénom</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Téléphone</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !saving && setEditOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListeEtudiantsScolariteView
