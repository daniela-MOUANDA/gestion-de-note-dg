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
          iconColor: 'text-green-500',
          iconBg: 'bg-green-100',
          border: 'border-green-500',
          titleColor: 'text-green-800'
        }
      case 'error':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-100',
          border: 'border-red-500',
          titleColor: 'text-red-800'
        }
      case 'warning':
        return {
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-500',
          iconBg: 'bg-yellow-100',
          border: 'border-yellow-500',
          titleColor: 'text-yellow-800'
        }
      default:
        return {
          icon: faInfoCircle,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-100',
          border: 'border-blue-500',
          titleColor: 'text-blue-800'
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
    '3xl': 'max-w-3xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop avec animation */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal avec animation */}
      <div className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size] || sizeClasses.md} w-full transform transition-all animate-scale-in`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b-2 ${styles.border}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center animate-bounce-in`}>
              <FontAwesomeIcon 
                icon={styles.icon} 
                className={`${styles.iconColor} text-xl`}
              />
            </div>
            <div>
              {title && (
                <h3 className={`text-xl font-bold ${styles.titleColor}`}>
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
        <div className="p-6">
          {message && (
            <p className="text-slate-700 text-base leading-relaxed mb-4">
              {message}
            </p>
          )}
          {children}
        </div>

        {/* Footer - seulement si pas de children */}
        {!children && (
          <div className="p-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : type === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
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

