import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons'

const HeaderChef = ({ chefName = "M. ABDALLAH Junior" }) => {
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
              <p className="text-sm font-semibold text-slate-800">{chefName}</p>
              <p className="text-xs text-slate-600">Chef de Service</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderChef
