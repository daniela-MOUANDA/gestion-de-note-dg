import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUser, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

const HeaderScolarite = ({ scolariteName = 'Service Scolarité' }) => {
  const initials = scolariteName.split(' ').map(n => n[0]).join('').toUpperCase()
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 lg:top-0 z-30 lg:z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            Espace Service Scolarité
          </h2>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all duration-200"
              aria-label="Notifications"
            >
              <FontAwesomeIcon icon={faBell} className="text-lg" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <span className="hidden sm:inline-block font-medium text-slate-700 text-sm sm:text-base">
              {scolariteName}
            </span>
            <div 
              className="relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700"
                title={scolariteName}
              >
                {initials || <FontAwesomeIcon icon={faUser} />}
              </div>
              
              {/* Menu déroulant */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-0.5 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <Link
                    to="/scolarite/profil"
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="mr-3 text-slate-500" />
                    Profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderScolarite

