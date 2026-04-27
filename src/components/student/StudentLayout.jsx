/**
 * Layout principal de l'espace étudiant.
 * - Desktop : sidebar fixe 240px gauche
 * - Mobile  : barre de navigation en bas (bottom tab bar, style app mobile)
 */
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHome, faGraduationCap, faUser, faBell, faEllipsisH,
  faSignOutAlt, faFolderOpen, faFileAlt, faCalendarAlt,
  faExclamationTriangle, faQuestionCircle, faChevronRight,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// Items navigation principale
const NAV_MAIN = [
  { path: '/dashboard',        icon: faHome,               label: 'Tableau de bord' },
  { path: '/notes',            icon: faGraduationCap,      label: 'Mes Notes' },
  { path: '/profil',           icon: faUser,               label: 'Mon Profil' },
  { path: '/notifications',    icon: faBell,               label: 'Notifications' },
]

// Items secondaires (visible dans sidebar desktop + menu mobile "Plus")
const NAV_SECONDARY = [
  { path: '/mon-dossier',      icon: faFolderOpen,         label: 'Mon Dossier' },
  { path: '/documents',        icon: faFileAlt,            label: 'Documents' },
  { path: '/emploi-du-temps',  icon: faCalendarAlt,        label: 'Emploi du temps' },
  { path: '/reclamations',     icon: faExclamationTriangle,label: 'Réclamations' },
  { path: '/aide',             icon: faQuestionCircle,     label: 'Aide' },
]

const NavItem = ({ path, icon, label, active, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
      ${active
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
  >
    <FontAwesomeIcon icon={icon} className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
    <span>{label}</span>
    {active && <FontAwesomeIcon icon={faChevronRight} className="ml-auto w-3 h-3 opacity-70" />}
  </Link>
)

const StudentLayout = ({ children, studentName, studentPhoto, notifCount = 0 }) => {
  const location = useLocation()
  const navigate  = useNavigate()
  const { logout, user } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (path) => location.pathname === path
  const currentLabel = [...NAV_MAIN, ...NAV_SECONDARY].find(n => n.path === location.pathname)?.label || 'Espace Étudiant'

  const handleLogout = async () => {
    await logout()
    navigate('/login-etudiant')
  }

  // fermer le menu "Plus" au changement de route
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── SIDEBAR DESKTOP ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 z-30">

        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-100">
          <img src="/images/logo.png" alt="INPTIC" className="h-10 w-auto object-contain" />
        </div>

        {/* Profil mini */}
        {(studentName || user) && (
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {studentPhoto
                  ? <img src={studentPhoto.startsWith('http') ? studentPhoto : `${BACKEND_URL}${studentPhoto}`}
                         alt="" className="w-full h-full object-cover"
                         onError={e => { e.target.style.display = 'none' }} />
                  : <FontAwesomeIcon icon={faUser} className="text-blue-600 text-sm" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{studentName || `${user?.prenom} ${user?.nom}`}</p>
                <p className="text-xs text-slate-400">Étudiant</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation principale */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_MAIN.map(item => (
            <NavItem key={item.path} {...item}
              active={isActive(item.path)}
              extra={item.path === '/notifications' && notifCount > 0
                ? <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount}</span>
                : null
              }
            />
          ))}

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 mb-1">Autres</p>
          </div>
          {NAV_SECONDARY.map(item => (
            <NavItem key={item.path} {...item} active={isActive(item.path)} />
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 py-3 border-t border-slate-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="lg:ml-60 flex flex-col min-h-screen">

        {/* Header top (desktop + mobile) */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-3">
          {/* Titre page courante (mobile) */}
          <span className="lg:hidden text-base font-bold text-slate-800">{currentLabel}</span>
          {/* Logo mobile */}
          <img src="/images/logo.png" alt="" className="lg:hidden h-7 w-auto object-contain ml-auto" />
          {/* Spacer desktop */}
          <span className="hidden lg:block flex-1 text-base font-semibold text-slate-700">{currentLabel}</span>

          {/* Notifications badge desktop */}
          <Link to="/notifications" className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors relative">
            <FontAwesomeIcon icon={faBell} className="text-slate-500 text-base" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV MOBILE ────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex">
          {NAV_MAIN.map(item => {
            const active = isActive(item.path)
            return (
              <Link key={item.path} to={item.path}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors
                  ${active ? 'text-blue-600' : 'text-slate-500'}`}
              >
                <span className={`relative flex items-center justify-center w-8 h-6`}>
                  <FontAwesomeIcon icon={item.icon} className={`text-lg ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.path === '/notifications' && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </span>
                <span>{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
          {/* Bouton "Plus" */}
          <button onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium
              ${moreOpen ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="flex items-center justify-center w-8 h-6">
              <FontAwesomeIcon icon={faEllipsisH} className={`text-lg ${moreOpen ? 'text-blue-600' : 'text-slate-400'}`} />
            </span>
            <span>Plus</span>
          </button>
        </div>
      </nav>

      {/* ── DRAWER "Plus" MOBILE ─────────────────────────────────────────── */}
      {moreOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMoreOpen(false)} />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pb-safe">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100">
              <span className="text-base font-bold text-slate-800">Menu</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1">
              {NAV_SECONDARY.map(item => (
                <NavItem key={item.path} {...item} active={isActive(item.path)} onClick={() => setMoreOpen(false)} />
              ))}
            </div>
            <div className="px-4 pb-6 border-t border-slate-100 mt-2 pt-3">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentLayout
