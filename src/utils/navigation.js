/**
 * Utilitaire centralisé pour la navigation dans l'application
 * Remplace window.location.href pour une navigation SPA
 */

let navigateInstance = null

/**
 * Initialise l'instance de navigation
 * À appeler dans le composant App ou Router
 */
export const initNavigation = (navigate) => {
  navigateInstance = navigate
}

/**
 * Navigue vers une route sans recharger la page
 * @param {string} path - Chemin de destination
 * @param {Object} options - Options de navigation (replace, state, etc.)
 */
export const navigateTo = (path, options = {}) => {
  if (navigateInstance) {
    navigateInstance(path, options)
  } else {
    // Fallback si navigate n'est pas initialisé (devrait rarement arriver)
    console.warn('Navigation non initialisée, utilisation de window.location')
    window.location.href = path
  }
}

/**
 * Redirige vers la page de connexion
 * @param {string} reason - Raison de la redirection (optionnel)
 */
export const redirectToLogin = (reason = null) => {
  if (reason) {
    console.warn('Redirection vers login:', reason)
  }
  navigateTo('/login', { replace: true })
}

/**
 * Redirige vers le dashboard selon le rôle
 * @param {string} role - Rôle de l'utilisateur
 */
export const redirectToDashboard = (role) => {
  const roleCode = role?.trim().toUpperCase()
  
  switch (roleCode) {
    case 'ETUDIANT':
      navigateTo('/dashboard', { replace: true })
      break
    case 'CHEF_SERVICE_SCOLARITE':
      navigateTo('/chef-scolarite/dashboard', { replace: true })
      break
    case 'AGENT_SCOLARITE':
      navigateTo('/scolarite/dashboard', { replace: true })
      break
    case 'SP_SCOLARITE':
      navigateTo('/sp-scolarite/dashboard', { replace: true })
      break
    case 'CHEF_DEPARTEMENT':
    case 'COORD_PEDAGOGIQUE':
      navigateTo('/chef/departement/dashboard', { replace: true })
      break
    case 'DEP':
      navigateTo('/dep/dashboard', { replace: true })
      break
    case 'DG':
      navigateTo('/dg/dashboard', { replace: true })
      break
    case 'DIRECTEUR_SCOLARITE':
      navigateTo('/directeur-scolarite/dashboard', { replace: true })
      break
    case 'ADMIN_SYSTEME':
      navigateTo('/admin-systeme/dashboard', { replace: true })
      break
    default:
      redirectToLogin('Rôle non reconnu')
  }
}

/**
 * Gère les erreurs d'authentification et redirige si nécessaire
 * @param {Response} response - Réponse HTTP
 * @returns {boolean} - true si une redirection a été effectuée
 */
export const handleAuthError = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    redirectToLogin('Session expirée')
    return true
  }
  return false
}

