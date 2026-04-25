import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
const LOGO_SRC = '/images/logo-connexion.png'

const NAVY = {
  deep: '#0a1628',
  mid: '#0f2744',
  dark: '#061018'
}

function formatSexe(v) {
  if (!v) return '—'
  const s = String(v).toUpperCase()
  if (s === 'M' || s === 'MASCULIN') return 'Masculin'
  if (s === 'F' || s === 'FEMININ' || s === 'FÉMININ') return 'Féminin'
  return v
}

function formatDateNaissance(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}

function photoSrc(photo) {
  if (!photo) return null
  if (photo.startsWith('http://localhost:3000') || photo.startsWith('https://localhost:3000')) {
    const pathOnly = photo.replace(/^https?:\/\/localhost:3000/i, '')
    return `${BACKEND_URL}${pathOnly.startsWith('/') ? '' : '/'}${pathOnly}`
  }
  if (photo.startsWith('http')) return photo
  return `${BACKEND_URL}${photo.startsWith('/') ? '' : '/'}${photo}`
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`grid grid-cols-[minmax(120px,1fr)_auto] items-center gap-4 border-b border-slate-100 pb-3 last:border-0 ${className}`}>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 text-right">{children}</dd>
    </div>
  )
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

  const shell = (inner) => (
    <div
      className="min-h-[100dvh] antialiased"
      style={{
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
        background: `linear-gradient(165deg, ${NAVY.deep} 0%, ${NAVY.mid} 42%, #e8eef5 42%, #f1f5f9 100%)`
      }}
    >
      <div className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6 sm:pt-12">{inner}</div>
    </div>
  )

  if (state.loading) {
    return shell(
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl bg-white/95 p-10 shadow-xl ring-1 ring-slate-200/80 backdrop-blur">
        <div
          className="h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200"
          style={{ borderTopColor: NAVY.mid }}
          aria-hidden
        />
        <p className="mt-5 text-sm font-medium text-slate-600">Vérification en cours…</p>
      </div>
    )
  }

  if (state.error) {
    return shell(
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
        <div
          className="px-6 py-5 text-white"
          style={{ background: `linear-gradient(135deg, ${NAVY.deep}, ${NAVY.mid})` }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">E-Notes — INPTIC</p>
          <h1 className="mt-1 text-xl font-bold">Vérification impossible</h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-600">{state.error}</p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-semibold hover:underline"
            style={{ color: NAVY.mid }}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  const { institution, bulletin, message } = state.data || {}
  const etu = bulletin?.etudiant || {}
  const moy =
    bulletin?.moyenneSemestre != null ? Number(bulletin.moyenneSemestre).toFixed(2) : '—'
  const pUrl = photoSrc(etu.photo)
  const nomComplet = [etu.prenom, etu.nom].filter(Boolean).join(' ').trim() || '—'

  return shell(
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90">
      {/* Bandeau — bleu marine (charte connexion) */}
      <div
        className="relative px-6 pb-8 pt-6 text-white"
        style={{ background: `linear-gradient(135deg, ${NAVY.deep} 0%, ${NAVY.mid} 55%, ${NAVY.dark} 100%)` }}
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-sky-400/15 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-24 w-48 rounded-full bg-white/5 blur-xl" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200/90">
          INPTIC — vérification officielle
        </p>
        <h1 className="relative mt-2 text-2xl font-bold tracking-tight sm:text-[1.65rem]">Bulletin authentifié</h1>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/85">
          Les informations ci-dessous proviennent du registre officiel des bulletins de l&apos;établissement.
        </p>
      </div>

      <div className="relative -mt-4 rounded-t-2xl bg-white px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
        {/* Logo (même fichier que la page de connexion) */}
        <div className="mb-6 flex justify-center border-b border-slate-100 pb-6">
          <img
            src={LOGO_SRC}
            alt="E-Notes — INPTIC"
            className="h-auto w-full max-w-[280px] object-contain sm:max-w-[320px]"
            width={320}
            height={148}
            decoding="async"
          />
        </div>

        {/* Identité + photo */}
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl shadow-md ring-2 ring-[#0f2744]/25 ring-offset-2 ring-offset-white sm:h-32 sm:w-32">
              {pUrl ? (
                <img src={pUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-slate-300" aria-hidden>
                  {(etu.nom?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Étudiant</p>
            <p className="mt-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl">{nomComplet}</p>
            <p className="mt-1 font-mono text-sm text-slate-600">{etu.matricule || '—'}</p>
          </div>
        </div>

        {institution?.nom && (
          <p className="mb-5 rounded-xl bg-slate-50 px-3 py-2.5 text-center text-[11px] leading-relaxed text-slate-600">
            {institution.nom}
          </p>
        )}

        <dl className="space-y-0">
          <Field label="Date de naissance">{formatDateNaissance(etu.dateNaissance)}</Field>
          <Field label="Sexe">{formatSexe(etu.sexe)}</Field>
          <Field label="Nationalité">{etu.nationalite || '—'}</Field>
          <Field label="Classe / filière">
            <span className="block max-w-[220px] sm:max-w-[280px] ml-auto text-right">
              {bulletin?.classe}
              {bulletin?.filiere ? ` — ${bulletin.filiere}` : ''}
            </span>
          </Field>
          <Field label="Année & semestre">
            {bulletin?.anneeUniversitaire || '—'} — {bulletin?.semestre || '—'}
          </Field>
          <Field label="Moyenne du semestre">
            <span className="text-base font-bold" style={{ color: NAVY.mid }}>
              {moy}
              <span className="text-sm font-semibold text-slate-500"> /20</span>
            </span>
          </Field>
          <Field label="Mention">{bulletin?.mention || '—'}</Field>
          {bulletin?.rang != null && bulletin?.effectifClasse != null && (
            <Field label="Rang">
              {bulletin.rang} / {bulletin.effectifClasse}
            </Field>
          )}
          <Field label="Crédits validés">
            {bulletin?.creditsValides ?? '—'} / {bulletin?.creditsTotaux ?? '—'}
          </Field>
        </dl>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Décision du conseil / jury</p>
          <div
            className="rounded-xl border px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${NAVY.mid}, #155e75)`,
              borderColor: `${NAVY.mid}55`
            }}
          >
            {bulletin?.decision || '—'}
          </div>
        </div>

        {message && (
          <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-[10px] text-slate-400">
          Référence bulletin{' '}
          <span className="break-all font-mono text-slate-500">{bulletin?.id}</span>
        </p>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-600">
            Questions ?{' '}
            <a href="mailto:info@Enotes.com" className="font-semibold hover:underline" style={{ color: NAVY.mid }}>
              info@Enotes.com
            </a>
          </p>
          <Link to="/login" className="mt-3 inline-block text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">
            Accès sécurisé — Connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
