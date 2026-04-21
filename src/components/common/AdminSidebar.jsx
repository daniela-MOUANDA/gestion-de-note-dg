import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { faSignOutAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { getRoleMenu } from '../../config/roleMenuConfig'

/**
 * Sidebar unifié pour tous les rôles administratifs
 * Affiche le menu approprié selon le rôle de l'utilisateur connecté
 */
const AdminSidebar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { logout, user } = useAuth()
    const { success } = useAlert()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Récupérer le menu basé sur le rôle de l'utilisateur
    const roleCode = user?.role || user?.roleDetails?.code
    const menuItems = getRoleMenu(roleCode)

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
        <>
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-30">
                <div className="w-64 h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl overflow-y-auto">
                    <div className="p-6 border-b border-slate-700">
                        <Link to={menuItems[0]?.path || '#'}>
                            <img
                                src="/images/logo.png"
                                alt="Logo INPTIC"
                                className="h-20 w-auto object-contain mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </Link>
                    </div>
                    <nav className="mt-6">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={(e) => {
                                        if (isActive) {
                                            e.preventDefault()
                                            window.location.reload()
                                        }
                                    }}
                                    className={`flex items-center px-6 py-3.5 transition-all duration-200 ${isActive
                                        ? 'bg-blue-600 text-white border-r-4 border-blue-400 shadow-lg'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        className={`mr-3 text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}
                                    />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full flex items-center px-6 py-3.5 mt-4 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg text-slate-400" />
                            <span className="font-medium text-sm">Déconnexion</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Sidebar Mobile */}
            <div className="lg:hidden fixed top-0 left-0 z-50 w-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-lg">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <img
                        src="/images/logo.png"
                        alt="Logo INPTIC"
                        className="h-8 w-auto object-contain"
                    />
                    <button
                        className="text-white p-2 rounded-md hover:bg-slate-700 transition-colors"
                        aria-label="Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
                    </button>
                </div>
                {isMobileMenuOpen && (
                    <nav className="bg-slate-800 border-t border-slate-700 max-h-[calc(100vh-64px)] overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-6 py-3.5 transition-all ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        className="mr-3 text-lg"
                                    />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => {
                                setShowLogoutModal(true)
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full flex items-center px-6 py-3.5 text-slate-300 hover:bg-slate-700"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-lg" />
                            <span className="font-medium">Déconnexion</span>
                        </button>
                    </nav>
                )}
            </div>

            {/* Modal de déconnexion */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => !isLoggingOut && setShowLogoutModal(false)}
                type="warning"
                title="Confirmer la déconnexion"
                message={`Êtes-vous sûr de vouloir vous déconnecter${user ? `, ${user.nom} ${user.prenom}` : ''} ?`}
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
        </>
    )
}

export default AdminSidebar
