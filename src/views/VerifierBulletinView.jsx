import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function formatStatutVisa(v) {
  if (v === 'VISE') return 'Visé par la Direction des Études et de la Pédagogie'
  if (v === 'EN_ATTENTE') return 'En attente de visa'
  return v || '—'
}

export default function VerifierBulletinView() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')
  const [state, setState] = useState({ loading: true, error: null, data: null })

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setState({ loading: false, error: 'Lien incomplet : aucun jeton de vérification.', data: null })
        return
      }
      try {
        const url = `${API_BASE}/public/verify-bulletin?token=${encodeURIComponent(token)}`
        const res = await fetch(url)
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setState({
            loading: false,
            error: json.error || 'Vérification impossible pour le moment.',
            data: null
          })
          return
        }
        setState({ loading: false, error: null, data: json })
      } catch (e) {
        if (!cancelled) {
          setState({ loading: false, error: e.message || 'Erreur réseau.', data: null })
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-600">Vérification en cours…</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-amber-600 text-lg font-semibold mb-2">Vérification impossible</div>
          <p className="text-slate-600 mb-6">{state.error}</p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  const { institution, bulletin, message } = state.data || {}
  const moy =
    bulletin?.moyenneSemestre != null ? Number(bulletin.moyenneSemestre).toFixed(2) : '—'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-emerald-700 text-white px-6 py-5">
            <p className="text-xs uppercase tracking-wide opacity-90">INPTIC — Vérification officielle</p>
            <h1 className="text-xl font-bold mt-1">Bulletin authentifié</h1>
            <p className="text-sm mt-2 text-emerald-100">
              Les informations ci-dessous sont issues du registre des bulletins de l&apos;établissement.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {institution?.nom && (
              <p className="text-xs text-slate-500 leading-relaxed">{institution.nom}</p>
            )}

            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500 shrink-0">Étudiant</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {bulletin?.etudiant?.nom} {bulletin?.etudiant?.prenom}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Matricule</dt>
                <dd className="font-mono text-slate-900">{bulletin?.etudiant?.matricule || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Classe / filière</dt>
                <dd className="text-right text-slate-900">
                  {bulletin?.classe}
                  {bulletin?.filiere ? ` — ${bulletin.filiere}` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Année & semestre</dt>
                <dd className="text-slate-900">
                  {bulletin?.anneeUniversitaire || '—'} — {bulletin?.semestre || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Moyenne du semestre</dt>
                <dd className="font-semibold text-slate-900">{moy}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Mention</dt>
                <dd className="text-slate-900">{bulletin?.mention || '—'}</dd>
              </div>
              {bulletin?.rang != null && bulletin?.effectifClasse != null && (
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">Rang</dt>
                  <dd className="text-slate-900">
                    {bulletin.rang} / {bulletin.effectifClasse}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Crédits validés</dt>
                <dd className="text-slate-900">
                  {bulletin?.creditsValides ?? '—'} / {bulletin?.creditsTotaux ?? '—'}
                </dd>
              </div>
              <div className="pt-1">
                <dt className="text-slate-500 text-sm mb-1">Décision du conseil / jury</dt>
                <dd className="font-semibold text-slate-900 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {bulletin?.decision || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <dt className="text-slate-500">Visa DEP</dt>
                <dd className="text-right text-slate-800 text-sm">{formatStatutVisa(bulletin?.statutVisa)}</dd>
              </div>
            </dl>

            {message && (
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{message}</p>
            )}

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Référence bulletin : <span className="font-mono">{bulletin?.id}</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          <Link to="/login" className="text-blue-700 hover:underline">
            Accès sécurisé — Connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
