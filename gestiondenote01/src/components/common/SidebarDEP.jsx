import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { 
  faHome, 
  faUsers,
  faChartLine,
  faEnvelope,
  faClipboardList,
  faSignOutAlt,
  faBars,
  faTimes,
  faBuilding,
  faUserTie,
  faFileAlt,
  faStamp,
  faFileInvoice,
  faChartBar,
  faGraduationCap,
  faTrophy,
  faUser,
  faCog,
  faGavel
} from '@fortawesome/free-solid-svg-icons'

const SidebarDEP = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { success } = useAlert()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      success('Déconnexion réussie. À bientôt !')
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const menuItems = [
    { path: '/dep/dashboard', icon: faHome, label: 'Tableau de bord' },
    { path: '/dep/chefs-departement', icon: faUserTie, label: 'Chefs de Département' },
    { path: '/dep/departements', icon: faBuilding, label: 'Départements' },
    { path: '/dep/conseils', icon: faGavel, label: 'Conseils de Classes' },
    { path: '/dep/visas', icon: faStamp, label: 'Visas & Documents' },
    { path: '/dep/proces-verbaux', icon: faFileInvoice, label: 'Procès-Verbaux' },
    { path: '/dep/rapports', icon: faFileAlt, label: 'Rapports' },
    { path: '/dep/statistiques', icon: faChartBar, label: 'Statistiques' },
    { path: '/dep/etudiants', icon: faGraduationCap, label: 'Étudiants' },
    { path: '/dep/meilleurs-etudiants', icon: faTrophy, label: 'Meilleurs Étudiants' },
    { path: '/dep/messagerie', icon: faEnvelope, label: 'Messagerie' },
    { path: '/admin/profil', icon: faUser, label: 'Profil' },
    { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
  ]

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-30">
        <div className="w-64 h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl overflow-y-auto">
          <div className="p-6 border-b border-slate-700">
            <img 
              src="/images/logo.png" 
              alt="Logo INPTIC" 
              className="h-20 w-auto object-contain mx-auto"
            />
          </div>
          <div className="p-4 border-b border-slate-700">
            <p className="text-xs text-slate-400 px-3">Directeur des Études Pédagogiques</p>
          </div>
          <nav className="mt-6">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white border-r-4 border-blue-400 shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className={`mr-3 text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center px-6 py-3.5 mt-4 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg text-slate-400" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className="lg:hidden fixed top-0 left-0 z-50 w-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <img 
            src="/images/logo.png" 
            alt="Logo INPTIC" 
            className="h-8 w-auto object-contain"
          />
          <button
            className="text-white p-2 rounded-md hover:bg-slate-700 transition-colors"
            aria-label="Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
          </button>
        </div>
        {isMobileMenuOpen && (
          <nav className="bg-slate-800 border-t border-slate-700 max-h-[calc(100vh-64px)] overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-6 py-3.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className={`mr-3 text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => {
                setShowLogoutModal(true)
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center px-6 py-3.5 mt-4 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg text-slate-400" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </nav>
        )}
      </div>

      {/* Modal de déconnexion */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Déconnexion"
      >
        <div className="p-6">
          <p className="text-slate-700 mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoggingOut && <LoadingSpinner size="sm" />}
              Se déconnecter
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default SidebarDEP

