import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, verifyToken, getCurrentUser, getUserFromStorage } from '../api/auth.js'

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

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier d'abord dans le localStorage
        const storedUser = getUserFromStorage()
        
        if (storedUser) {
          // Vérifier que le token est toujours valide
          const result = await verifyToken()
          
          if (result.valid && result.user) {
            setUser(result.user)
            setIsAuthenticated(true)
          } else {
            // Token invalide, nettoyer
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true)
      const result = await apiLogin(email, password)
      
      if (result.success && result.user) {
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
      await apiLogout()
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Nettoyer quand même l'état local
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } finally {
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

