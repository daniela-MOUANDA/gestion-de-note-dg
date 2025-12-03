import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

const HeaderDEP = ({ depName }) => {
  const { user } = useAuth()
  const nomComplet = user ? `${user.prenom} ${user.nom}` : depName || 'Directeur des Études Pédagogiques'

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between mb-4">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800">Direction des Études Pédagogiques</h1>
        <p className="text-xs sm:text-sm text-slate-600">Directeur des Études Pédagogiques - Administration pédagogique</p>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <FontAwesomeIcon icon={faEnvelope} className="text-slate-600 text-lg sm:text-xl cursor-pointer hover:text-blue-600 transition-colors" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            0
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{nomComplet}</p>
            <p className="text-xs text-slate-600">DEP</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
            {user?.prenom?.[0] || 'D'}{user?.nom?.[0] || 'E'}
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderDEP

