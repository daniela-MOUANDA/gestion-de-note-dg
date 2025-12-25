import React, { createContext, useContext, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons'

const AlertContext = createContext()

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])

  const showAlert = React.useCallback((message, type = 'info') => {
    const id = Date.now()
    const alert = { id, message, type }

    setAlerts(prev => [...prev, alert])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 4000)
  }, [])

  const removeAlert = React.useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // Backward compatibility methods
  const success = React.useCallback((message) => showAlert(message, 'success'), [showAlert])
  const error = React.useCallback((message) => showAlert(message, 'error'), [showAlert])
  const warning = React.useCallback((message) => showAlert(message, 'warning'), [showAlert])
  const info = React.useCallback((message) => showAlert(message, 'info'), [showAlert])

  const value = React.useMemo(() => ({
    showAlert, success, error, warning, info
  }), [showAlert, success, error, warning, info])

  const getAlertStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500 border-green-600',
          text: 'text-white',
          icon: faCheckCircle,
          iconColor: 'text-white'
        }
      case 'error':
        return {
          bg: 'bg-red-500 border-red-600',
          text: 'text-white',
          icon: faExclamationTriangle,
          iconColor: 'text-white'
        }
      case 'warning':
        return {
          bg: 'bg-orange-500 border-orange-600',
          text: 'text-white',
          icon: faExclamationTriangle,
          iconColor: 'text-white'
        }
      default:
        return {
          bg: 'bg-blue-500 border-blue-600',
          text: 'text-white',
          icon: faInfoCircle,
          iconColor: 'text-white'
        }
    }
  }

  return (
    <AlertContext.Provider value={value}>
      {children}

      {/* Alert Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => {
          const styles = getAlertStyles(alert.type)
          return (
            <div
              key={alert.id}
              className={`${styles.bg} border ${styles.text} px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-in-right`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={styles.icon}
                    className={`${styles.iconColor} mr-3`}
                  />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className={`ml-3 ${styles.iconColor} hover:opacity-70 transition-opacity`}
                >
                  <FontAwesomeIcon icon={faTimes} className="text-sm" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AlertContext.Provider>
  )
}






