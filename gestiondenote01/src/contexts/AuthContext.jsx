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
        const token = localStorage.getItem('token')
        
        if (storedUser && token) {
          // Charger d'abord les données du localStorage pour un affichage immédiat
          setUser(storedUser)
          setIsAuthenticated(true)
          
          // Ensuite, vérifier que le token est toujours valide
          try {
            const result = await verifyToken()
            
            if (result.valid && result.user) {
              // Mettre à jour avec les données fraîches du serveur
              setUser(result.user)
              setIsAuthenticated(true)
              // S'assurer que le token est toujours dans localStorage
              if (!localStorage.getItem('token')) {
                console.warn('Token manquant après vérification, mais utilisateur valide')
              }
            } else {
              // Token invalide mais on garde les données pour l'affichage
              // L'utilisateur devra se reconnecter pour les actions nécessitant un token valide
              console.warn('Token invalide, mais données utilisateur conservées pour affichage')
            }
          } catch (verifyError) {
            console.warn('Erreur lors de la vérification du token, utilisation des données du localStorage:', verifyError)
            // On garde les données du localStorage même si la vérification échoue
          }
        } else if (storedUser && !token) {
          // Utilisateur présent mais pas de token - problème de session
          console.warn('Utilisateur présent dans localStorage mais token manquant')
          setUser(storedUser)
          setIsAuthenticated(false) // Pas authentifié car pas de token
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
  const login = async (email, password, matricule = null) => {
    try {
      setLoading(true)
      const result = await apiLogin(email, password, matricule)
      
      if (result.success && result.user) {
        // Vérifier que le token a bien été stocké
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('Token non stocké après connexion')
          // Essayer de récupérer le token depuis la réponse
          if (result.token) {
            localStorage.setItem('token', result.token)
            localStorage.setItem('user', JSON.stringify(result.user))
            console.log('Token récupéré depuis la réponse et stocké')
          } else {
            return { success: false, error: 'Erreur lors du stockage de la session' }
          }
        }
        
        // Double vérification
        const tokenAfterStorage = localStorage.getItem('token')
        if (!tokenAfterStorage) {
          console.error('Token toujours absent après tentative de stockage')
          return { success: false, error: 'Impossible de stocker la session. Vérifiez les paramètres du navigateur.' }
        }
        
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

