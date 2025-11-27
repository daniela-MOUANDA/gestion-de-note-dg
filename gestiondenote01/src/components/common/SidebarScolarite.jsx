import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHome, 
  faFileExcel,
  faUserCheck,
  faSignOutAlt,
  faBars,
  faTimes,
  faUserGraduate,
  faArchive,
  faFileAlt,
  faEnvelope,
  faAward,
  faFileInvoice
} from '@fortawesome/free-solid-svg-icons'

const SidebarScolarite = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { path: '/scolarite/dashboard', icon: faHome, label: 'Tableau de bord' },
    { path: '/scolarite/importer-candidats', icon: faFileExcel, label: 'Importer candidats admis' },
    { path: '/scolarite/inscriptions', icon: faUserCheck, label: 'Gérer les inscriptions' },
    // { path: '/scolarite/etudiants', icon: faUserGraduate, label: 'Gérer les étudiants' },
    { path: '/scolarite/attestations', icon: faFileAlt, label: 'Attestations de scolarité' },
    { path: '/scolarite/archives-attestations', icon: faFileInvoice, label: 'Archives des attestations' },
    { path: '/scolarite/messagerie', icon: faEnvelope, label: 'Messagerie' },
    { path: '/scolarite/bulletins', icon: faFileAlt, label: 'Bulletins' },
    { path: '/scolarite/diplomes', icon: faAward, label: 'Diplômes' },
    { path: '/scolarite/proces-verbaux', icon: faFileAlt, label: 'Procès-Verbaux' },
    { path: '/scolarite/archivage', icon: faArchive, label: 'Archivage' },
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
            <Link
              to="/login-etudiant"
              className="flex items-center px-6 py-3.5 mt-4 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg text-slate-400" />
              <span className="font-medium text-sm">Déconnexion</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Sidebar Mobile - Hamburger Menu */}
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
                  className={`flex items-center px-6 py-3.5 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className="mr-3 text-lg"
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            <Link
              to="/login-etudiant"
              className="flex items-center px-6 py-3.5 text-slate-300 hover:bg-slate-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg" />
              <span className="font-medium">Déconnexion</span>
            </Link>
          </nav>
        )}
      </div>
    </>
  )
}

export default SidebarScolarite

