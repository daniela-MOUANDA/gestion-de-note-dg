import AdminSidebar from '../common/AdminSidebar'
import AdminHeader from '../common/AdminHeader'

const ChefScolariteLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        {children}
      </div>
    </div>
  )
}

export default ChefScolariteLayout


