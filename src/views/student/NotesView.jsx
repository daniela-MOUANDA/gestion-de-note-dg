import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle, faTimesCircle, faSpinner, faExclamationCircle,
  faDownload, faChartBar, faMedal, faBook, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import StudentLayout from '../../components/student/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getMesNotes } from '../../api/scolarite'
import { StudentModel } from '../../models/StudentModel'

// ─── Badge statut ────────────────────────────────────────────────────────
const StatusBadge = ({ statut, parCompensation }) => {
  if (statut === 'Validé') return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      ${parCompensation ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
      {parCompensation ? 'Validé (comp.)' : 'Validé'}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
      <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
      Non validé
    </span>
  )
}

// ─── Barre de note ───────────────────────────────────────────────────────
const NoteBar = ({ value, max = 20 }) => {
  const pct = Math.min((value / max) * 100, 100)
  const color = value >= 14 ? 'bg-emerald-500' : value >= 10 ? 'bg-blue-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-bold w-12 text-right ${value >= 10 ? 'text-slate-800' : 'text-red-600'}`}>
        {value?.toFixed(2) ?? '—'}
      </span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-400 w-6">/20</span>
    </div>
  )
}

const NotesView = () => {
  const navigate  = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [student,  setStudent]  = useState(null)
  const [semestres, setSemestres] = useState({})   // { "S1": [notes], "S2": [notes], ... }
  const [activeTab, setActiveTab] = useState(null)
  const [stats,    setStats]    = useState({ moyenneGenerale: 0, credits: 0, totalModules: 0, modulesValides: 0 })
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'ETUDIANT') {
      navigate('/login-etudiant'); return
    }
    const load = async () => {
      try {
        const data = await getMesNotes()
        if (!data.success) { setError(data.error || 'Erreur lors du chargement'); return }

        setStats({
          moyenneGenerale: data.moyenneGenerale || 0,
          credits:         data.credits || 0,
          totalModules:    data.totalModules || 0,
          modulesValides:  data.modulesValides || 0,
        })

        // Grouper les notes par semestre
        const notes = data.notes || []
        const grouped = {}
        for (const n of notes) {
          const sem = n.semestre || data.semestre || 'S1'
          if (!grouped[sem]) grouped[sem] = []
          grouped[sem].push(n)
        }

        // Si les notes n'ont pas de champ semestre, mettre tout dans le semestre API
        if (notes.length > 0 && Object.keys(grouped).length === 1 && grouped[Object.keys(grouped)[0]] === notes) {
          // OK
        }

        setSemestres(grouped)

        // Onglet actif = semestre le plus récent (ex: S2 > S1)
        const keys = Object.keys(grouped).sort()
        setActiveTab(keys[keys.length - 1] || null)

        // Charger le StudentModel depuis localStorage
        const stored = localStorage.getItem('student')
        if (stored) {
          const p = JSON.parse(stored)
          setStudent(new StudentModel({ ...p, moyenneGenerale: data.moyenneGenerale || p.moyenneGenerale || 0 }))
        }
      } catch (e) {
        setError(e.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user, navigate])

  // ── Calculs semestre actif ─────────────────────────────────────────────
  const notesTab = activeTab ? (semestres[activeTab] || []) : []
  const moyTab   = notesTab.length
    ? notesTab.reduce((s, n) => s + (n.moyenne || 0) * (n.coefficient || 1), 0) /
      notesTab.reduce((s, n) => s + (n.coefficient || 1), 0)
    : 0
  const creditsTab = notesTab.reduce((s, n) => s + (n.statut === 'Validé' ? (n.credit || 0) : 0), 0)

  const rankText = student?.rangClasse
    ? `${student.rangClasse}${student.rangClasse === 1 ? 'er' : 'ème'} / ${student.totalStudentsInClass || '—'}`
    : '—'

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center py-24">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600 mr-3" />
        <span className="text-slate-500">Chargement des notes…</span>
      </div>
    </StudentLayout>
  )

  if (error) return (
    <StudentLayout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-400 mt-0.5" />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout studentName={student?.fullName} studentPhoto={student?.photo}>

      {/* ── Résumé global ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Moyenne générale',  value: `${stats.moyenneGenerale.toFixed(2)}/20`, icon: faChartBar,      color: 'bg-blue-500' },
          { label: 'Crédits validés',   value: `${stats.credits} cr.`,                   icon: faMedal,          color: 'bg-violet-500' },
          { label: 'Modules inscrits',  value: stats.totalModules,                        icon: faBook,           color: 'bg-amber-500' },
          { label: 'Modules validés',   value: stats.modulesValides,                      icon: faCheckCircle,    color: 'bg-emerald-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <FontAwesomeIcon icon={s.icon} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Onglets semestres ─────────────────────────────────────────── */}
      {Object.keys(semestres).length > 0 ? (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {Object.keys(semestres).sort().map(sem => (
              <button key={sem} onClick={() => setActiveTab(sem)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0
                  ${activeTab === sem
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {sem}
              </button>
            ))}
          </div>

          {/* ── Résumé du semestre sélectionné ─────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500">Moyenne {activeTab}</p>
              <p className={`text-2xl font-bold ${moyTab >= 10 ? 'text-slate-800' : 'text-red-600'}`}>
                {moyTab.toFixed(2)}<span className="text-base font-normal text-slate-400">/20</span>
              </p>
            </div>
            <div className="w-px bg-slate-100 self-stretch" />
            <div>
              <p className="text-xs text-slate-500">Crédits acquis</p>
              <p className="text-2xl font-bold text-slate-800">
                {creditsTab}<span className="text-base font-normal text-slate-400"> cr.</span>
              </p>
            </div>
            <div className="w-px bg-slate-100 self-stretch" />
            <div>
              <p className="text-xs text-slate-500">Rang classe</p>
              <p className="text-2xl font-bold text-slate-800">{rankText}</p>
            </div>
            <div className="ml-auto self-center">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold
                ${moyTab >= 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {moyTab >= 10 ? '✓ Semestre validé' : '✗ Non validé'}
              </span>
            </div>
          </div>

          {/* ── Tableau des notes ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Détail des notes — {activeTab} ({notesTab.length} module{notesTab.length > 1 ? 's' : ''})
              </h2>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                Imprimer
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Évaluations</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Moy.</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Coef.</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Crédits</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {notesTab.map((g, i) => (
                    <tr key={g.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{g.module || g.nom || '—'}</p>
                        {g.code && <p className="text-xs text-slate-400 mt-0.5">{g.code}</p>}
                        {g.ue  && <p className="text-xs text-slate-400">UE : {g.ue}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {g.evaluations?.length > 0
                            ? g.evaluations.map((ev, j) => (
                                <div key={j} className="flex flex-col items-center bg-slate-100 rounded px-2 py-1 min-w-[48px]">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold leading-tight">{ev.name}</span>
                                  <span className="text-sm font-bold text-slate-700">{ev.valeur}</span>
                                </div>
                              ))
                            : <span className="text-xs text-slate-400 italic">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <NoteBar value={g.moyenne} />
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-600">{g.coefficient ?? '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-bold ${g.statut === 'Validé' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {g.statut === 'Validé' ? (g.credit || 0) : 0}
                          <span className="text-xs font-normal text-slate-400"> / {g.credit || 0}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge statut={g.statut} parCompensation={g.parCompensation} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {notesTab.map((g, i) => (
                <div key={g.id || i} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{g.module || '—'}</p>
                      {g.code && <p className="text-xs text-slate-400">{g.code}</p>}
                    </div>
                    <StatusBadge statut={g.statut} parCompensation={g.parCompensation} />
                  </div>
                  <NoteBar value={g.moyenne} />
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Coef. : <b className="text-slate-700">{g.coefficient ?? '—'}</b></span>
                    <span>Crédits : <b className={g.statut === 'Validé' ? 'text-emerald-600' : 'text-slate-400'}>
                      {g.statut === 'Validé' ? (g.credit || 0) : 0}/{g.credit || 0}
                    </b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note de bas de page — compensation */}
          {notesTab.some(n => n.parCompensation) && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 flex-shrink-0" />
              <span>Les modules marqués <strong>Validé (comp.)</strong> ont été validés par compensation avec d'autres modules du même semestre.</span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FontAwesomeIcon icon={faBook} className="text-3xl text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Aucune note disponible pour le moment.</p>
        </div>
      )}

    </StudentLayout>
  )
}

export default NotesView
