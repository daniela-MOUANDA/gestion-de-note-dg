import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

const HeaderChef = ({ chefName = "M. ABDALLAH Junior" }) => {
  const { user } = useAuth()
  
  // Récupérer le prénom de l'utilisateur
  const userFirstName = user?.prenom || ''
  const userPhoto = user?.photo || null
  
  // Initiales : deux premières lettres du prénom
  const initials = userFirstName ? userFirstName.substring(0, 2).toUpperCase() : 'CH'
  
  // URL de la photo
  const photoUrl = userPhoto 
    ? (userPhoto.startsWith('http') ? userPhoto : `http://localhost:3000${userPhoto}`)
    : null

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 bg-white border-b border-slate-200 shadow-sm z-20">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Service Scolarité et des Examens
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Chef de Service - Administration et supervision
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <FontAwesomeIcon icon={faBell} className="text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">{userFirstName || chefName}</p>
              <p className="text-xs text-slate-600">Chef de Service</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center overflow-hidden">
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
                <span className="text-white text-xs font-semibold">{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderChef
