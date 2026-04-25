import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleDashboardTitle } from '../../config/roleMenuConfig'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

/**
 * Header unifié pour tous les rôles administratifs
 * Affiche le titre approprié selon le rôle de l'utilisateur connecté
 */
const AdminHeader = ({ title }) => {
    const { user } = useAuth()

    // Récupérer les informations de l'utilisateur
    const userFirstName = user?.prenom || ''
    const userLastName = user?.nom || ''
    const userPhoto = user?.photo || null
    const roleCode = user?.role || user?.roleDetails?.code
    const roleName = user?.roleDetails?.nom

    // Générer les initiales : première lettre du prénom + première lettre du nom
    const initials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase() || 'AD'

    // URL de la photo
    const photoUrl = userPhoto
        ? (userPhoto.startsWith('http') ? userPhoto : `${BACKEND_URL}${userPhoto}`)
        : null

    // Titre du header : utilise le titre personnalisé ou le titre par défaut du rôle
    const headerTitle = title || getRoleDashboardTitle(roleCode, roleName)

    return (
        <header className="bg-white border-b border-slate-200 shadow-sm lg:ml-0 fixed top-16 lg:top-0 right-0 left-0 lg:left-64 z-20">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{headerTitle}</h2>
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
                                        alt={`${userFirstName} ${userLastName}`}
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

export default AdminHeader
