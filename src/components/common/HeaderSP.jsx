import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUserTie, faUser } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

const HeaderSP = ({ spName = "Secrétaire Particulière" }) => {
  const { user } = useAuth()
  
  // Récupérer le prénom de l'utilisateur
  const userFirstName = user?.prenom || ''
  const userPhoto = user?.photo || null
  
  // Initiales : deux premières lettres du prénom
  const initials = userFirstName ? userFirstName.substring(0, 2).toUpperCase() : 'SP'
  
  // URL de la photo
  const photoUrl = userPhoto 
    ? (userPhoto.startsWith('http') ? userPhoto : `http://localhost:3000${userPhoto}`)
    : null

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm lg:ml-0 fixed top-16 lg:top-0 right-0 left-0 lg:left-64 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{spName}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <span className="hidden sm:inline-block font-medium text-slate-700 text-sm sm:text-base">
              {userFirstName || 'Utilisateur'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
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
                  <span className="text-white text-xs sm:text-sm font-semibold">{initials}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderSP

