import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope, 
  faIdCard, 
  faLock, 
  faSignInAlt,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { LoginController } from '../../controllers/LoginController'

const LoginView = () => {
  const navigate = useNavigate()
  const [controller] = useState(() => new LoginController())
  const [viewModel, setViewModel] = useState(controller.viewModel)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const result = await controller.handleLogin()
    
    if (result.success) {
      // Stocker les données de l'étudiant dans le localStorage
      localStorage.setItem('student', JSON.stringify(result.data))
      navigate('/dashboard')
    } else {
      setError(result.error || 'Erreur de connexion. Veuillez vérifier vos identifiants.')
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
              <FontAwesomeIcon icon={faGraduationCap} className="text-2xl text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
              Connexion
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm">
              Accédez à votre espace étudiant
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
                  value={viewModel.email}
                  onChange={(e) => {
                    const updated = controller.handleEmailChange(e.target.value)
                    setViewModel({ ...updated })
                  }}
                  placeholder="exemple@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 text-sm"
                />
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"
                />
              </div>
              {viewModel.errors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {viewModel.errors.email}
                </p>
              )}
            </div>

            {/* Matricule */}
            <div>
              <label htmlFor="matricule" className="block text-xs font-semibold text-slate-700 mb-1.5">
                <FontAwesomeIcon icon={faIdCard} className="mr-1.5 text-blue-600 text-xs" />
                Matricule
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="matricule"
                  value={viewModel.matricule}
                  onChange={(e) => {
                    const updated = controller.handleMatriculeChange(e.target.value)
                    setViewModel({ ...updated })
                  }}
                  placeholder="Votre numéro de matricule"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 text-sm"
                />
                <FontAwesomeIcon 
                  icon={faIdCard} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"
                />
              </div>
              {viewModel.errors.matricule && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {viewModel.errors.matricule}
                </p>
              )}
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
                  value={viewModel.password}
                  onChange={(e) => {
                    const updated = controller.handlePasswordChange(e.target.value)
                    setViewModel({ ...updated })
                  }}
                  placeholder="Votre mot de passe"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-800 placeholder-slate-400 text-sm"
                />
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"
                />
              </div>
              {viewModel.errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {viewModel.errors.password}
                </p>
              )}
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
              disabled={viewModel.isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="text-sm" />
              {viewModel.isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur
          <div className="my-4 flex items-center">
            <div className="flex-1 border-t border-slate-300"></div>
            <span className="px-3 text-xs text-slate-500">ou</span>
            <div className="flex-1 border-t border-slate-300"></div>
          </div> */}

          {/* Connexion Google
          <button className="w-full bg-white border-2 border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm">
            <FontAwesomeIcon icon={faGoogle} className="text-red-500" />
            Se connecter avec Google
          </button> */}

          {/* Lien d'inscription
          <p className="mt-4 text-center text-slate-600 text-xs">
            Vous n'avez pas encore de compte ?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              S'inscrire
            </a>
          </p> */}
        </div>
      </div>
    </div>
  )
}

export default LoginView

