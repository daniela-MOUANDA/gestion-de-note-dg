import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, verifyToken } from '../api/auth.js'
import { startSessionMonitoring, stopSessionMonitoring, resetSessionReferences } from '../utils/sessionManager.js'

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
    // Arrêter le monitoring de session
    stopSessionMonitoring()
    resetSessionReferences()
    
    // Nettoyer complètement le localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    
    // Rediriger vers la page de connexion
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
            // Toujours utiliser les données du serveur, jamais du localStorage
            setUser(result.user)
            setIsAuthenticated(true)
            // Si un nouveau token est renvoyé, le mettre à jour
            if (result.token) {
              localStorage.setItem('token', result.token)
            }
            // NE PAS stocker l'utilisateur dans localStorage pour éviter les incohérences
            localStorage.removeItem('user')
            
            // Démarrer le monitoring de session
            startSessionMonitoring((error) => {
              console.error('❌ Session invalide détectée:', error)
              // Ne déconnecter que si ce n'est pas une erreur réseau
              if (error && !error.includes('réseau') && !error.includes('timeout')) {
                handleLogout()
              } else {
                console.warn('⚠️ Erreur réseau détectée, session maintenue')
              }
            })
          } else {
            // Ne déconnecter que si ce n'est pas une erreur réseau
            if (result.error && !result.error.includes('réseau') && !result.error.includes('timeout')) {
              console.warn('❌ La vérification du token a échoué, déconnexion.', result.error)
              handleLogout()
            } else {
              console.warn('⚠️ Erreur réseau temporaire, session maintenue:', result.error)
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error)
          // Ne déconnecter que si ce n'est pas une erreur réseau
          if (error.message && !error.message.includes('fetch') && !error.message.includes('network')) {
            handleLogout()
          } else {
            console.warn('⚠️ Erreur réseau détectée, session maintenue')
          }
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
        // Réinitialiser les références du sessionManager avant de stocker le nouveau token
        // Cela évite la détection d'un changement d'utilisateur lors de la première vérification
        resetSessionReferences()
        
        // Stocker le token
        localStorage.setItem('token', result.token)
        console.log('✅ Token stocké dans localStorage:', result.token.substring(0, 20) + '...')
        
        // Vérifier que le token est bien stocké
        const storedToken = localStorage.getItem('token')
        if (!storedToken) {
          console.error('❌ Erreur: Le token n\'a pas été stocké correctement')
          return { success: false, error: 'Erreur lors du stockage du token' }
        }
        
        // Toujours utiliser les données du serveur
        setUser(result.user)
        setIsAuthenticated(true)
        // NE PAS stocker l'utilisateur dans localStorage
        localStorage.removeItem('user')
        
        // Attendre un peu avant de démarrer le monitoring pour s'assurer que le token est bien stocké
        setTimeout(() => {
          // Démarrer le monitoring de session
          startSessionMonitoring((error) => {
            console.error('❌ Session invalide détectée:', error)
            // Ne déconnecter que si ce n'est pas une erreur réseau
            if (error && !error.includes('réseau') && !error.includes('timeout')) {
              handleLogout()
            } else {
              console.warn('⚠️ Erreur réseau détectée, session maintenue')
            }
          })
        }, 500) // Attendre 500ms pour s'assurer que tout est bien initialisé
        
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
  // IMPORTANT: Toujours récupérer les données depuis le serveur après une mise à jour
  const updateUser = async (updatedUserData) => {
    if (user && updatedUserData) {
      // Mettre à jour temporairement l'état local
      const newUser = { ...user, ...updatedUserData }
      setUser(newUser)
      // NE PAS stocker dans localStorage - toujours récupérer depuis le serveur
      // Vérifier le token pour récupérer les données à jour
      try {
        const result = await verifyToken()
        if (result.valid && result.user) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
      }
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

