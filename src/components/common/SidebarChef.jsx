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
  faFileExcel,
  faUserCheck,
  faFileAlt,
  faFileInvoice,
  faAward,
  faArchive,
  faUser,
  faCog
} from '@fortawesome/free-solid-svg-icons'

const SidebarChef = () => {
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
    { path: '/chef-scolarite/dashboard', icon: faHome, label: 'Tableau de bord' },
    { path: '/chef-scolarite/gestion-comptes', icon: faUsers, label: 'Gestion des comptes' },
    { path: '/chef-scolarite/audit', icon: faClipboardList, label: 'Audit & Activités' },
    { path: '/chef-scolarite/statistiques', icon: faChartLine, label: 'Statistiques' },
    { path: '/chef-scolarite/importer-candidats', icon: faFileExcel, label: 'Importer candidats' },
    { path: '/chef-scolarite/inscriptions', icon: faUserCheck, label: 'Gérer inscriptions' },
    { path: '/chef-scolarite/attestations', icon: faFileAlt, label: 'Attestations' },
    { path: '/chef-scolarite/archives-attestations', icon: faFileInvoice, label: 'Archives attestations' },
    { path: '/chef-scolarite/bulletins', icon: faFileAlt, label: 'Bulletins' },
    { path: '/chef-scolarite/diplomes', icon: faAward, label: 'Diplômes' },
    { path: '/chef-scolarite/proces-verbaux', icon: faFileAlt, label: 'Procès-Verbaux' },
    { path: '/chef-scolarite/archivage', icon: faArchive, label: 'Archivage' },
    { path: '/chef-scolarite/messagerie', icon: faEnvelope, label: 'Messagerie' },
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
            <p className="text-center text-sm text-slate-300 mt-2">Chef de Service</p>
          </div>
          <nav className="mt-6">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-4 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 border-l-4 border-blue-400 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-3 text-lg" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="absolute bottom-0 w-64 border-t border-slate-700 bg-slate-900">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center w-full px-6 py-4 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Bouton Menu Mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
      </button>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <img 
                src="/images/logo.png" 
                alt="Logo INPTIC" 
                className="h-20 w-auto object-contain mx-auto"
              />
              <p className="text-center text-sm text-slate-300 mt-2">Chef de Service</p>
            </div>
            <nav className="mt-6">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 border-l-4 border-blue-400 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3 text-lg" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-0 w-64 border-t border-slate-700 bg-slate-900">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center w-full px-6 py-4 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg" />
                Déconnexion
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Modal de déconnexion */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        type="warning"
        title="Confirmer la déconnexion"
        message={`Êtes-vous sûr de vouloir vous déconnecter${user ? `, ${user.prenom} ${user.nom}` : ''} ?`}
      >
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={() => setShowLogoutModal(false)}
            disabled={isLoggingOut}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <FontAwesomeIcon icon={faSignOutAlt} className="animate-spin" />
                <span>Déconnexion...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Se déconnecter</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Loading overlay pour la déconnexion */}
      {isLoggingOut && <LoadingSpinner fullScreen text="Déconnexion en cours..." />}
    </>
  )
}

export default SidebarChef
