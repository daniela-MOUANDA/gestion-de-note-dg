import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope, faArrowLeft, faPaperPlane, faUser, faUsers, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'

const MessagerieSPView = () => {
  const [destinataire, setDestinataire] = useState('')
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const destinataires = [
    { id: 'directeur', nom: 'Directeur de la Scolarité et des Examens', role: 'Supérieur hiérarchique' },
    { id: 'chef_service', nom: 'Chef de Service Scolarité', role: 'Chef de service' },
    { id: 'agents', nom: 'Agents de la Scolarité', role: 'Groupe' },
    { id: 'collegues', nom: 'Mes collègues', role: 'Groupe' }
  ]

  const handleEnvoyer = (e) => {
    e.preventDefault()
    setShowConfirmation(true)
    setTimeout(() => {
      setDestinataire('')
      setSujet('')
      setMessage('')
      setShowConfirmation(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          <div className="mb-6">
            <Link to="/sp-scolarite/dashboard" className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour au tableau de bord
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
              Messagerie interne
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Communiquez avec votre hiérarchie et vos collègues
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8">
              <form onSubmit={handleEnvoyer} className="space-y-6">
                {/* Destinataire */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Destinataire *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {destinataires.map((dest) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setDestinataire(dest.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          destinataire === dest.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon 
                            icon={dest.role === 'Groupe' ? faUsers : faUser} 
                            className={destinataire === dest.id ? 'text-blue-600' : 'text-slate-400'}
                          />
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{dest.nom}</p>
                            <p className="text-xs text-slate-500">{dest.role}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sujet */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Objet du message..."
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Rédigez votre message..."
                    required
                  />
                </div>

                {/* Bouton d'envoi */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDestinataire('')
                      setSujet('')
                      setMessage('')
                    }}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!destinataire || !sujet || !message}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      !destinataire || !sujet || !message
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Envoyer le message
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Modal de confirmation */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Message envoyé !</h3>
                  <p className="text-slate-600">Votre message a été envoyé avec succès.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MessagerieSPView

