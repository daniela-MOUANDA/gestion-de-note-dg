import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

const LoadingSpinner = ({ size = 'md', text = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <FontAwesomeIcon 
        icon={faSpinner} 
        className={`${sizeClasses[size]} text-blue-600 animate-spin`}
      />
      {text && (
        <p className="text-slate-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner

