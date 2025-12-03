import SidebarChef from '../common/SidebarChef'
import HeaderChef from '../common/HeaderChef'

const ChefScolariteLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        {children}
      </div>
    </div>
  )
}

export default ChefScolariteLayout

