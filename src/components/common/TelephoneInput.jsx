import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

/**
 * Composant Input pour les numéros de téléphone gabonais
 * Format: 9 chiffres commençant par 07, 06 ou 01
 */
const TelephoneInput = ({ 
  value, 
  onChange, 
  name = "telephone",
  label = "Téléphone *",
  placeholder = "Ex: 077123456",
  required = true,
  disabled = false,
  className = "",
  showIcon = true,
  showValidation = true
}) => {
  const [error, setError] = useState('')

  // Validation du numéro de téléphone gabonais
  const validateTelephone = (tel) => {
    if (!tel) {
      if (required) {
        return 'Le numéro de téléphone est requis'
      }
      return ''
    }

    // Retirer tous les caractères non numériques
    const cleanTel = tel.replace(/\D/g, '')

    // Vérifier la longueur
    if (cleanTel.length !== 9) {
      return 'Le numéro doit contenir exactement 9 chiffres'
    }

    // Vérifier le préfixe
    const prefix = cleanTel.substring(0, 2)
    if (!['07', '06', '01'].includes(prefix)) {
      return 'Le numéro doit commencer par 07, 06 ou 01'
    }

    return ''
  }

  const handleChange = (e) => {
    let inputValue = e.target.value

    // Ne permettre que des chiffres
    inputValue = inputValue.replace(/\D/g, '')

    // Limiter à 9 chiffres
    if (inputValue.length > 9) {
      inputValue = inputValue.substring(0, 9)
    }

    // Mettre à jour la valeur
    onChange({
      target: {
        name: name,
        value: inputValue
      }
    })

    // Valider en temps réel
    if (showValidation) {
      const validationError = validateTelephone(inputValue)
      setError(validationError)
    }
  }

  const handleBlur = () => {
    if (showValidation) {
      const validationError = validateTelephone(value)
      setError(validationError)
    }
  }

  const isValid = value && validateTelephone(value) === ''
  const hasError = error && value

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <FontAwesomeIcon 
              icon={faPhone} 
              className={`text-sm ${hasError ? 'text-red-500' : isValid ? 'text-green-500' : 'text-slate-400'}`}
            />
          </div>
        )}
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={9}
          className={`w-full ${showIcon ? 'pl-10' : 'pl-4'} pr-4 py-2 border ${
            hasError 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : isValid 
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
          } rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        />
        {hasError && showValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" />
          </div>
        )}
      </div>
      {hasError && showValidation && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
          {error}
        </p>
      )}
      {!hasError && value && isValid && showValidation && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Numéro valide
        </p>
      )}
    </div>
  )
}

export default TelephoneInput









