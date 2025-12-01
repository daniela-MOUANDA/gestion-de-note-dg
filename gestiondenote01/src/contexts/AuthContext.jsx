import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, verifyToken } from '../api/auth.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
    // Optionnel: rediriger vers la page de connexion
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [])

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const result = await verifyToken()
          if (result.valid && result.user) {
            setUser(result.user)
            setIsAuthenticated(true)
            // Si un nouveau token est renvoyé, le mettre à jour
            if (result.token) {
              localStorage.setItem('token', result.token)
            }
          } else {
            console.warn('La vérification du token a échoué, déconnexion.', result.error)
            handleLogout()
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error)
          handleLogout()
        }
      } else {
        setIsAuthenticated(false)
      }
      setLoading(false)
    }

    checkAuthStatus()
  }, [handleLogout])

  // Fonction de connexion
  const login = async (email, password, matricule = null) => {
    try {
      setLoading(true)
      const result = await apiLogin(email, password, matricule)
      
      if (result.success && result.user && result.token) {
        localStorage.setItem('token', result.token)
        setUser(result.user)
        setIsAuthenticated(true)
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error || 'Erreur lors de la connexion' }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return { success: false, error: error.message || 'Erreur lors de la connexion' }
    } finally {
      setLoading(false)
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setLoading(true)
      await apiLogout() // Appelle le backend pour invalider le token côté serveur
    } catch (error) {
      console.error('Erreur lors de la déconnexion côté serveur:', error)
    } finally {
      handleLogout() // Nettoie toujours le client
      setLoading(false)
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return user?.role === role
  }

  // Vérifier si l'utilisateur a un des rôles spécifiés
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  // Mettre à jour les données de l'utilisateur (par exemple après upload de photo)
  const updateUser = (updatedUserData) => {
    if (user && updatedUserData) {
      const newUser = { ...user, ...updatedUserData }
      setUser(newUser)
      // Mettre à jour aussi localStorage pour persister les changements
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

