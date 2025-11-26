import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUserTie } from '@fortawesome/free-solid-svg-icons'

const HeaderSP = ({ spName = "Secrétaire Particulière" }) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm lg:ml-0 fixed top-16 lg:top-0 right-0 left-0 lg:left-64 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{spName}</h2>
            <p className="text-xs sm:text-sm text-slate-600">Direction de la Scolarité et des Examens</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUserTie} className="text-white text-sm sm:text-base" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderSP

