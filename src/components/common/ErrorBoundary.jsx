import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle, faHome, faRedo } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI d'erreur
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur pour le débogage
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Oups ! Une erreur est survenue
          </h1>
          <p className="text-slate-600">
            Désolé, quelque chose s'est mal passé. Veuillez réessayer.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-2">Détails de l'erreur :</p>
            <pre className="text-xs text-red-700 overflow-auto max-h-48">
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faRedo} />
            Réessayer
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <FontAwesomeIcon icon={faHome} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary

