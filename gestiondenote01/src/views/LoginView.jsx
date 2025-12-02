import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope, 
  faLock, 
  faSignInAlt,
  faUser,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'

const LoginView = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()
  const { success, error: showError } = useAlert()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Fonction pour rediriger selon le rôle
  const redirectByRole = (user) => {
    console.log('Redirection pour l\'utilisateur:', user)
    
    // Utiliser la route du dashboard depuis roleDetails si disponible
    if (user.roleDetails && user.roleDetails.routeDashboard) {
      console.log('✅ Redirection vers:', user.roleDetails.routeDashboard)
      navigate(user.roleDetails.routeDashboard, { replace: true })
      return
    }
    
    // Fallback: utiliser le code du rôle pour la redirection
    const roleCode = user.role || 'UNKNOWN'
    console.log('Redirection par code de rôle:', roleCode)
    
    switch (roleCode) {
      case 'ETUDIANT':
        navigate('/dashboard', { replace: true })
        break
      case 'CHEF_SERVICE_SCOLARITE':
        navigate('/chef-scolarite/dashboard', { replace: true })
        break
      case 'AGENT_SCOLARITE':
        navigate('/scolarite/dashboard', { replace: true })
        break
      case 'SP_SCOLARITE':
        console.log('✅ Redirection vers /sp-scolarite/dashboard pour SP_SCOLARITE')
        navigate('/sp-scolarite/dashboard', { replace: true })
        break
      case 'CHEF_DEPARTEMENT':
        navigate('/chef/dashboard', { replace: true })
        break
      case 'DEP':
        console.log('✅ Redirection vers /dep/dashboard pour DEP')
        navigate('/dep/dashboard', { replace: true })
        break
      default:
        console.warn('⚠️ Rôle non reconnu:', roleCode)
        // En cas de rôle non reconnu, rediriger vers la page de login
        navigate('/login', { replace: true })
    }
  }

  // Ne pas rediriger automatiquement - permettre à un autre utilisateur de se connecter
  // Chaque connexion écrasera le token précédent, ce qui est normal

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const result = await login(email, password)
      console.log('Résultat de la connexion:', result)
      
      if (result.success && result.user) {
        console.log('Utilisateur connecté:', result.user)
        console.log('Rôle de l\'utilisateur:', result.user.role)
        
        // Afficher le modal de succès
        const userName = `${result.user.prenom} ${result.user.nom}`
        setSuccessMessage(`Bienvenue ${userName} ! Connexion réussie.`)
        setShowSuccessModal(true)
        success(`Connexion réussie ! Bienvenue ${userName}`)
        
        // Rediriger après un court délai pour voir le modal
        setTimeout(() => {
          setShowSuccessModal(false)
          redirectByRole(result.user)
        }, 1500)
      } else {
        const errorMsg = result.error || 'Erreur lors de la connexion'
        setError(errorMsg)
        setShowErrorModal(true)
        showError(errorMsg)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err)
      const errorMsg = err.message || 'Une erreur est survenue'
      setError(errorMsg)
      setShowErrorModal(true)
      showError(errorMsg)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Effets de fond décoratifs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Carte principale */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Logo et titre */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg mb-3 shadow-lg">
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
              Connexion
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm">
              Administration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 text-blue-600 text-xs" />
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 text-sm"
                />
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faLock} className="mr-1.5 text-blue-600 text-xs" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 text-sm"
                />
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center text-sm">
                <span className="mr-2">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                  <span>Connexion en cours...</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-shimmer"></div>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} className="text-sm" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de succès */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Connexion réussie !"
        message={successMessage}
      />

      {/* Modal d'erreur */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Erreur de connexion"
        message={error}
      />

      {/* Loading overlay */}
      {isLoading && <LoadingSpinner fullScreen text="Connexion en cours..." />}
    </div>
  )
}

export default LoginView

