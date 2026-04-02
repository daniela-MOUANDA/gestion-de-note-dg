import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Composant pour protéger les routes selon l'authentification et les rôles
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à afficher si l'accès est autorisé
 * @param {boolean} props.requireAuth - Si true, nécessite une authentification
 * @param {string|string[]} props.allowedRoles - Rôles autorisés (optionnel)
 * @param {string} props.redirectTo - Route de redirection si non autorisé (défaut: '/login')
 */
const ProtectedRoute = ({
  children,
  requireAuth = true,
  allowedRoles = null,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  console.log('🛡️ [ProtectedRoute] Rendering:', {
    path: location.pathname,
    requireAuth,
    allowedRoles,
    isAuthenticated,
    userRole: user?.role,
    loading
  })

  // Afficher un spinner pendant le chargement de l'authentification
  if (loading) {
    return <LoadingSpinner fullScreen text="Vérification de l'authentification..." />
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    console.log('🛡️ [ProtectedRoute] Redirecting to login: Not authenticated')
    // Sauvegarder la route actuelle pour rediriger après connexion
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Si des rôles spécifiques sont requis
  if (allowedRoles && user) {
    const userRole = user.role
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    // Normaliser les rôles pour la comparaison
    const normalizedUserRole = userRole?.trim().toUpperCase()
    const normalizedRoles = rolesArray.map(r => r?.trim().toUpperCase())

    if (!normalizedRoles.includes(normalizedUserRole)) {
      console.log(`🛡️ [ProtectedRoute] Access Denied: User role ${normalizedUserRole} not in allowed roles:`, normalizedRoles)
      // Rediriger vers le dashboard de l'utilisateur ou la page d'accueil
      const userDashboard = getUserDashboard(userRole)
      console.log(`🛡️ [ProtectedRoute] Redirecting to dashboard: ${userDashboard}`)
      return <Navigate to={userDashboard} replace />
    }
    console.log('🛡️ [ProtectedRoute] Access Granted: Role match found')
  }

  // Accès autorisé
  return <>{children}</>
}

/**
 * Détermine le dashboard selon le rôle de l'utilisateur
 */
const getUserDashboard = (role) => {
  const roleCode = role?.trim().toUpperCase()

  switch (roleCode) {
    case 'ETUDIANT':
      return '/dashboard'
    case 'CHEF_SERVICE_SCOLARITE':
      return '/chef-scolarite/dashboard'
    case 'AGENT_SCOLARITE':
      return '/scolarite/dashboard'
    case 'SP_SCOLARITE':
      return '/sp-scolarite/dashboard'
    case 'CHEF_DEPARTEMENT':
    case 'COORD_PEDAGOGIQUE':
      return '/chef/departement/dashboard'
    case 'DEP':
      return '/dep/dashboard'
    case 'DG':
      return '/dg/dashboard'
    default:
      return '/login'
  }
}

export default ProtectedRoute

