import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserTie, faLock, faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'

const LoginSPView = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Rediriger si déjà connecté avec le bon rôle
  useEffect(() => {
    if (isAuthenticated && user?.role === 'SP_SCOLARITE') {
      navigate('/sp-scolarite/dashboard')
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Vérifier le rôle
        if (result.user.role !== 'SP_SCOLARITE') {
          setError('Vous n\'avez pas accès à cette page de connexion')
          setIsLoading(false)
          return
        }

        navigate('/sp-scolarite/dashboard')
      } else {
        setError(result.error || 'Erreur lors de la connexion')
        setIsLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUserTie} className="text-4xl text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">SP - Scolarité</h1>
            <p className="text-blue-100 text-sm">Secrétaire Particulière du Directeur</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="exemple@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
              {!isLoading && <FontAwesomeIcon icon={faArrowRight} />}
            </button>
          </form>

          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-center">
              Système de gestion INPTIC - Module SP Scolarité
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSPView

