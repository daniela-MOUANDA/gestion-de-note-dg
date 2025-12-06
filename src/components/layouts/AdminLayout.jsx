import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from '../common/AdminSidebar'
import AdminHeader from '../common/AdminHeader'

const AdminLayout = ({ children }) => {
  const { user } = useAuth()
  const role = user?.role

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout


