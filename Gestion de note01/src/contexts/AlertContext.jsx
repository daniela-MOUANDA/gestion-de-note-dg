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

  const showAlert = (message, type = 'info') => {
    const id = Date.now()
    const alert = { id, message, type }
    
    setAlerts(prev => [...prev, alert])
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 4000)
  }

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  // Backward compatibility methods
  const success = (message) => showAlert(message, 'success')
  const error = (message) => showAlert(message, 'error')
  const warning = (message) => showAlert(message, 'warning')
  const info = (message) => showAlert(message, 'info')

  const getAlertStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: faCheckCircle,
          iconColor: 'text-green-600'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: faExclamationTriangle,
          iconColor: 'text-red-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-600'
        }
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: faInfoCircle,
          iconColor: 'text-blue-600'
        }
    }
  }

  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info }}>
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

