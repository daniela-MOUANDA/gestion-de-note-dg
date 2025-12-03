import { useAuth } from '../../contexts/AuthContext'
import SidebarSP from '../common/SidebarSP'
import SidebarScolarite from '../common/SidebarScolarite'
import SidebarChef from '../common/SidebarChef'
import SidebarChefDepartement from '../common/SidebarChefDepartement'
import HeaderSP from '../common/HeaderSP'
import HeaderScolarite from '../common/HeaderScolarite'
import HeaderChef from '../common/HeaderChef'

const AdminLayout = ({ children }) => {
  const { user } = useAuth()
  const role = user?.role

  // Déterminer le sidebar et header selon le rôle
  const getSidebar = () => {
    switch (role) {
      case 'SP_SCOLARITE':
        return <SidebarSP />
      case 'AGENT_SCOLARITE':
        return <SidebarScolarite />
      case 'CHEF_SERVICE_SCOLARITE':
        return <SidebarChef />
      case 'CHEF_DEPARTEMENT':
        return <SidebarChefDepartement />
      default:
        return <SidebarSP />
    }
  }

  const getHeader = () => {
    switch (role) {
      case 'SP_SCOLARITE':
        return <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
      case 'AGENT_SCOLARITE':
        return <HeaderScolarite scolariteName="Service Scolarité" />
      case 'CHEF_SERVICE_SCOLARITE':
        return <HeaderChef />
      case 'CHEF_DEPARTEMENT':
        return <HeaderChef chefName="Chef de Département" />
      default:
        return <HeaderSP spName="Administration" />
    }
  }

  const getMainPadding = () => {
    switch (role) {
      case 'SP_SCOLARITE':
        return 'mt-28 lg:mt-20'
      case 'AGENT_SCOLARITE':
        return 'mt-16 lg:mt-0'
      case 'CHEF_SERVICE_SCOLARITE':
      case 'CHEF_DEPARTEMENT':
        return 'mt-28 lg:mt-20'
      default:
        return 'mt-28 lg:mt-20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {getSidebar()}
      <div className="flex flex-col lg:ml-64 min-h-screen">
        {getHeader()}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${getMainPadding()}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

