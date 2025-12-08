import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faCheckCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'

const Modal = ({ isOpen, onClose, type = 'info', title, message, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: faCheckCircle,
          iconColor: 'text-white',
          iconBg: 'bg-green-500',
          border: 'border-green-500',
          titleColor: 'text-green-700'
        }
      case 'error':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-white',
          iconBg: 'bg-red-500',
          border: 'border-red-500',
          titleColor: 'text-red-700'
        }
      case 'warning':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-white',
          iconBg: 'bg-orange-500',
          border: 'border-orange-500',
          titleColor: 'text-orange-700'
        }
      default:
        return {
          icon: faInfoCircle,
          iconColor: 'text-white',
          iconBg: 'bg-blue-500',
          border: 'border-blue-500',
          titleColor: 'text-blue-700'
        }
    }
  }

  const styles = getStyles()
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-[95vw]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop avec animation */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal avec animation */}
      <div className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size] || sizeClasses.md} w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-scale-in`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b-2 ${styles.border} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <FontAwesomeIcon 
                icon={styles.icon} 
                className={`${styles.iconColor} text-lg`}
              />
            </div>
            <div>
              {title && (
                <h3 className={`text-lg font-bold ${styles.titleColor}`}>
                  {title}
                </h3>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {message && (
              <p className="text-slate-700 text-base leading-relaxed mb-4">
                {message}
              </p>
            )}
            {children}
          </div>
        </div>

        {/* Footer - seulement si pas de children */}
        {!children && (
          <div className="p-6 border-t border-slate-200 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : type === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : type === 'warning'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal

