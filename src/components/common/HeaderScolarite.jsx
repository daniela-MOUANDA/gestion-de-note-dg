import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUser, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

const HeaderScolarite = ({ scolariteName = 'Service Scolarité' }) => {
  const { user, logout } = useAuth()
  const { success } = useAlert()
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Récupérer le prénom de l'utilisateur
  const userFirstName = user?.prenom || ''
  const userPhoto = user?.photo || null
  
  // Initiales : deux premières lettres du prénom
  const initials = userFirstName ? userFirstName.substring(0, 2).toUpperCase() : 'SS'
  
  // URL de la photo
  const photoUrl = userPhoto 
    ? (userPhoto.startsWith('http') ? userPhoto : `http://localhost:3000${userPhoto}`)
    : null

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

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 lg:top-0 z-30 lg:z-40 mb-4">
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
              {userFirstName || scolariteName}
            </span>
            <div 
              className="relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden"
                title={userFirstName || scolariteName}
              >
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={userFirstName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${photoUrl ? 'hidden' : ''}`}>
                  {initials || <FontAwesomeIcon icon={faUser} />}
                </div>
              </div>
              
              {/* Menu déroulant */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-0.5 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <Link
                    to="/admin/profil"
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="mr-3 text-slate-500" />
                    Profil
                  </Link>
                  <button
                    onClick={() => setShowLogoutModal(true)}
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
    </header>
  )
}

export default HeaderScolarite

