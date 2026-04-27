import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faChartLine, faMedal, faBook, faTrophy,
  faBell, faGraduationCap, faFolderOpen, faFileAlt,
  faCalendarAlt, faArrowRight, faExclamationCircle, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import StudentLayout from '../../components/student/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getMyInfo } from '../../api/student'
import { StudentModel } from '../../models/StudentModel'
import * as notifAPI from '../../api/notifications'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ─── Carte statistique ──────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <FontAwesomeIcon icon={icon} className="text-xl text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

// ─── Lien raccourci ─────────────────────────────────────────────────────
const ShortcutCard = ({ to, icon, label, desc, color }) => (
  <Link to={to}
    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <FontAwesomeIcon icon={icon} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-400 truncate">{desc}</p>
    </div>
    <FontAwesomeIcon icon={faArrowRight} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
  </Link>
)

const DashboardView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [student,  setStudent]  = useState(null)
  const [notifs,   setNotifs]   = useState([])
  const [notifCnt, setNotifCnt] = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) { navigate('/login-etudiant'); return }
    if (user.role !== 'ETUDIANT') { setError('Accès réservé aux étudiants.'); setLoading(false); return }

    const load = async () => {
      try {
        setLoading(true)
        const [infoRes, notifRes] = await Promise.allSettled([
          getMyInfo(),
          notifAPI.getNotifications(),
        ])

        if (infoRes.status === 'fulfilled' && infoRes.value.success) {
          const d = infoRes.value.data
          setStudent(new StudentModel({
            id: d.id, email: d.email, matricule: d.matricule,
            nom: d.nom, prenom: d.prenom, programme: d.programme,
            niveau: d.niveau, classe: d.classe, photo: d.photo,
            moyenneGenerale: d.moyenneGenerale || 0,
            credits: d.nbrCredits || d.credits || 0,
            totalModules: d.totalModules || 0,
            rangClasse: d.rangClasse || 0,
            estActif: d.estActif ?? true,
            estBoursier: d.estBoursier || false,
            semestre: d.semestreActuel || d.semestre || '',
            totalStudentsInClass: d.totalStudentsInClass || 0,
            promotion: d.promotion || d.annee_promotion,
          }))
          localStorage.setItem('student', JSON.stringify(d))
        } else {
          setError(infoRes.value?.error || 'Impossible de charger vos données.')
        }

        if (notifRes.status === 'fulfilled') {
          const list = notifRes.value?.notifications || notifRes.value || []
          setNotifs(Array.isArray(list) ? list.slice(0, 4) : [])
          setNotifCnt(Array.isArray(list) ? list.filter(n => !n.lue).length : 0)
        }
      } catch (e) {
        setError('Une erreur est survenue.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user, authLoading, navigate])

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600" />
        <p className="text-sm text-slate-500">Chargement en cours…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-sm w-full text-center">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-3xl text-red-400 mb-3" />
        <p className="text-slate-700 mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          Réessayer
        </button>
      </div>
    </div>
  )

  if (!student) return null

  const moyenne = student.moyenneGenerale ?? 0
  const moyenneColor = moyenne >= 14 ? 'bg-emerald-500' : moyenne >= 10 ? 'bg-blue-500' : 'bg-red-500'
  const currentYear  = new Date().getFullYear()
  const photoSrc = student.photo
    ? (student.photo.startsWith('http') ? student.photo : `${BACKEND_URL}${student.photo}`)
    : null

  return (
    <StudentLayout studentName={student.fullName} studentPhoto={student.photo} notifCount={notifCnt}>

      {/* ── Bannière identité ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-slate-200">
          {photoSrc
            ? <img src={photoSrc} alt={student.fullName} className="w-full h-full object-cover"
                   onError={e => e.target.style.display = 'none'} />
            : <FontAwesomeIcon icon={faUser} className="text-2xl text-slate-400" />
          }
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-800 truncate">Bonjour, {student.prenom} 👋</h1>
          <p className="text-sm text-slate-500 truncate">{student.programme || student.filiere || 'INPTIC'}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {student.classe && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                {student.classe}
              </span>
            )}
            {student.semestre && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                {student.semestre}
              </span>
            )}
            {student.estBoursier && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                Boursier
              </span>
            )}
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
              Actif
            </span>
          </div>
        </div>

        {/* Moyenne cercle */}
        <div className="flex-shrink-0 hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 border-slate-100 bg-white shadow-sm">
          <span className="text-base font-bold text-slate-800 leading-none">{moyenne.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400">/20</span>
        </div>
      </div>

      {/* ── Statistiques ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={faChartLine} label="Moyenne générale"
          value={`${moyenne.toFixed(2)}/20`}
          sub={student.semestre || 'Semestre en cours'}
          color={moyenneColor}
        />
        <StatCard icon={faMedal} label="Crédits validés"
          value={`${student.credits} cr.`}
          sub="Sur 60 au total"
          color="bg-violet-500"
        />
        <StatCard icon={faBook} label="Modules inscrits"
          value={student.totalModules || '—'}
          sub="Ce semestre"
          color="bg-amber-500"
        />
        <StatCard icon={faTrophy} label="Rang de classe"
          value={student.rangClasse ? `${student.rangClasse}e` : '—'}
          sub={student.totalStudentsInClass ? `sur ${student.totalStudentsInClass} étudiants` : 'Non disponible'}
          color="bg-rose-500"
        />
      </div>

      {/* ── Raccourcis ────────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Accès rapide</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        <ShortcutCard to="/notes"    icon={faGraduationCap} label="Mes Notes" desc="Notes, moyennes, crédits"  color="bg-blue-500" />
        <ShortcutCard to="/documents" icon={faFileAlt}      label="Documents" desc="Attestation, bulletins…"   color="bg-teal-500" />
        <ShortcutCard to="/mon-dossier" icon={faFolderOpen} label="Mon Dossier" desc="Inscription et pièces jointes" color="bg-orange-500" />
        <ShortcutCard to="/emploi-du-temps" icon={faCalendarAlt} label="Emploi du temps" desc="Planning de la semaine" color="bg-indigo-500" />
      </div>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {notifCnt > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{notifCnt}</span>
            )}
          </div>
          <Link to="/notifications" className="text-xs text-blue-600 font-medium hover:underline">Voir tout</Link>
        </div>

        {notifs.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Aucune notification</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifs.map((n, i) => (
              <li key={n.id || i} className={`flex items-start gap-3 px-5 py-3.5 ${!n.lue ? 'bg-blue-50/40' : ''}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.lue ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.lue ? 'font-semibold text-slate-800' : 'text-slate-600'} leading-snug`}>
                    {n.message || n.titre || 'Notification'}
                  </p>
                  {n.created_at && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </StudentLayout>
  )
}

export default DashboardView
