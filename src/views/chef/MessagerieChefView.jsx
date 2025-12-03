import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope,
  faEnvelopeOpen,
  faPaperPlane,
  faInbox,
  faStar,
  faTrash,
  faSearch,
  faPlus,
  faTimes,
  faUsers,
  faUserTie,
  faBuilding,
  faFilter,
  faReply,
  faArchive
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'

const MessagerieChefView = () => {
  const [activeTab, setActiveTab] = useState('recus') // recus, envoyes, archives
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  
  // État du formulaire de composition
  const [messageForm, setMessageForm] = useState({
    destinataireType: 'classe', // classe, directeur, administration
    destinataire: '',
    sujet: '',
    contenu: '',
    priorite: 'normale' // normale, urgente
  })

  // État pour la sélection en cascade (pour les classes)
  const [selectedFiliere, setSelectedFiliere] = useState('')

  // Données fictives des messages
  const [messages] = useState([
    {
      id: 1,
      expediteur: 'Directeur des Études',
      sujet: 'Réunion de coordination',
      contenu: 'Bonjour, nous organisons une réunion de coordination le 30 novembre à 14h pour discuter des modalités des examens...',
      date: '2025-11-25 10:30',
      lu: false,
      type: 'recu',
      priorite: 'urgente',
      starred: false
    },
    {
      id: 2,
      expediteur: 'Service Scolarité',
      sujet: 'Liste des étudiants inscrits',
      contenu: 'Veuillez trouver ci-joint la liste mise à jour des étudiants inscrits pour ce semestre...',
      date: '2025-11-24 15:20',
      lu: true,
      type: 'recu',
      priorite: 'normale',
      starred: true
    },
    {
      id: 3,
      expediteur: 'Classe L3 GI',
      sujet: 'Notes d\'examen publiées',
      contenu: 'Chers étudiants, les notes de l\'examen de Base de Données sont maintenant disponibles...',
      date: '2025-11-23 09:15',
      lu: true,
      type: 'envoye',
      priorite: 'normale',
      starred: false
    }
  ])

  // Options des destinataires
  const filieres = [
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'MM', nom: 'Management et Multimédias' }
  ]

  const classes = [
    { id: 1, nom: 'L1 GI - Groupe A', filiere: 'GI', niveau: 'L1' },
    { id: 2, nom: 'L1 GI - Groupe B', filiere: 'GI', niveau: 'L1' },
    { id: 3, nom: 'L2 GI - Groupe A', filiere: 'GI', niveau: 'L2' },
    { id: 4, nom: 'L2 GI - Groupe B', filiere: 'GI', niveau: 'L2' },
    { id: 5, nom: 'L3 GI - Groupe A', filiere: 'GI', niveau: 'L3' },
    { id: 6, nom: 'L3 GI - Groupe B', filiere: 'GI', niveau: 'L3' },
    { id: 7, nom: 'L1 RT - Groupe A', filiere: 'RT', niveau: 'L1' },
    { id: 8, nom: 'L1 RT - Groupe B', filiere: 'RT', niveau: 'L1' },
    { id: 9, nom: 'L2 RT - Groupe A', filiere: 'RT', niveau: 'L2' },
    { id: 10, nom: 'L3 RT - Groupe A', filiere: 'RT', niveau: 'L3' },
    { id: 11, nom: 'L1 MM - Groupe A', filiere: 'MM', niveau: 'L1' },
    { id: 12, nom: 'L2 MM - Groupe A', filiere: 'MM', niveau: 'L2' }
  ]

  const directeurs = [
    { id: 1, nom: 'Dr. MBARGA Emmanuel', poste: 'Directeur des Études' },
    { id: 2, nom: 'Prof. NJOYA André', poste: 'Directeur Général' }
  ]

  const administration = [
    { id: 1, nom: 'Service Scolarité', type: 'service' },
    { id: 2, nom: 'Service Financier', type: 'service' },
    { id: 3, nom: 'Service Informatique', type: 'service' },
    { id: 4, nom: 'Bibliothèque', type: 'service' }
  ]

  const handleComposeMessage = () => {
    setShowComposeModal(true)
    setMessageForm({
      destinataireType: 'classe',
      destinataire: '',
      sujet: '',
      contenu: '',
      priorite: 'normale'
    })
    setSelectedFiliere('')
  }

  const handleSendMessage = () => {
    // Logique d'envoi du message
    console.log('Message envoyé:', messageForm)
    alert('Message envoyé avec succès!')
    setShowComposeModal(false)
    setMessageForm({
      destinataireType: 'classe',
      destinataire: '',
      sujet: '',
      contenu: '',
      priorite: 'normale'
    })
  }

  const filteredMessages = messages.filter(msg => {
    const matchesTab = 
      (activeTab === 'recus' && msg.type === 'recu') ||
      (activeTab === 'envoyes' && msg.type === 'envoye') ||
      (activeTab === 'archives' && msg.archived)
    
    const matchesSearch = 
      msg.expediteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sujet.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTab && matchesSearch
  })

  const getDestinataireOptions = () => {
    switch (messageForm.destinataireType) {
      case 'classe':
        // Filtrer les classes selon la filière sélectionnée
        if (selectedFiliere) {
          return classes.filter(c => c.filiere === selectedFiliere)
        }
        return []
      case 'directeur':
        return directeurs
      case 'administration':
        return administration
      default:
        return []
    }
  }

  // Gérer le changement de type de destinataire
  const handleDestinataireTypeChange = (type) => {
    setMessageForm({ ...messageForm, destinataireType: type, destinataire: '' })
    setSelectedFiliere('')
  }

  // Gérer le changement de filière
  const handleFiliereChange = (filiereId) => {
    setSelectedFiliere(filiereId)
    setMessageForm({ ...messageForm, destinataire: '' })
  }

  const getDestinataireIcon = (type) => {
    const icons = {
      classe: faUsers,
      directeur: faUserTie,
      administration: faBuilding
    }
    return icons[type] || faUsers
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName="Dr. Jean KAMDEM" />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          {/* En-tête */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Messagerie Interne
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Communiquez avec vos étudiants et l'administration
              </p>
            </div>
            <button
              onClick={handleComposeMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Nouveau message
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar de navigation */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('recus')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'recus'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={faInbox} className="text-lg" />
                    <span>Boîte de réception</span>
                    <span className="ml-auto bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1">
                      {messages.filter(m => m.type === 'recu' && !m.lu).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('envoyes')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'envoyes'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
                    <span>Messages envoyés</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('archives')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'archives'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={faArchive} className="text-lg" />
                    <span>Archives</span>
                  </button>
                </div>

                <div className="border-t border-slate-200 p-4">
                  <div className="text-sm text-slate-600">
                    <div className="flex justify-between mb-2">
                      <span>Stockage utilisé</span>
                      <span className="font-semibold">15%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste et contenu des messages */}
            <div className="lg:col-span-9">
              {/* Barre de recherche et filtres */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Rechercher un message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    <FontAwesomeIcon icon={faFilter} />
                    <span>Filtrer</span>
                  </button>
                </div>
              </div>

              {/* Liste des messages */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {selectedMessage ? (
                  // Affichage détaillé d'un message
                  <div className="p-6">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      ← Retour à la liste
                    </button>
                    
                    <div className="border-b border-slate-200 pb-4 mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="text-2xl font-bold text-slate-800">{selectedMessage.sujet}</h2>
                        {selectedMessage.priorite === 'urgente' && (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} />
                          <span className="font-medium">{selectedMessage.expediteur}</span>
                        </div>
                        <span>•</span>
                        <span>{selectedMessage.date}</span>
                      </div>
                    </div>

                    <div className="prose max-w-none mb-6">
                      <p className="text-slate-700 leading-relaxed">{selectedMessage.contenu}</p>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <FontAwesomeIcon icon={faReply} />
                        Répondre
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <FontAwesomeIcon icon={faArchive} />
                        Archiver
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <FontAwesomeIcon icon={faTrash} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  // Liste des messages
                  <div className="divide-y divide-slate-200">
                    {filteredMessages.length === 0 ? (
                      <div className="p-12 text-center">
                        <FontAwesomeIcon icon={faEnvelope} className="text-6xl text-slate-300 mb-4" />
                        <p className="text-slate-500 text-lg">Aucun message</p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => setSelectedMessage(message)}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !message.lu ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <FontAwesomeIcon 
                                icon={message.lu ? faEnvelopeOpen : faEnvelope}
                                className={`text-2xl ${message.lu ? 'text-slate-400' : 'text-blue-600'}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={`font-semibold text-slate-800 truncate ${
                                  !message.lu ? 'font-bold' : ''
                                }`}>
                                  {message.expediteur}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {message.priorite === 'urgente' && (
                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                                      Urgent
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {message.date}
                                  </span>
                                </div>
                              </div>
                              <p className={`text-sm mb-1 ${!message.lu ? 'font-semibold text-slate-700' : 'text-slate-600'}`}>
                                {message.sujet}
                              </p>
                              <p className="text-sm text-slate-500 truncate">
                                {message.contenu}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Toggle starred
                                }}
                                className="text-slate-400 hover:text-yellow-500 transition-colors"
                              >
                                <FontAwesomeIcon 
                                  icon={faStar} 
                                  className={message.starred ? 'text-yellow-500' : ''}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de composition de message */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Nouveau message</h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type de destinataire */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type de destinataire
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'classe', label: 'Classe', icon: faUsers },
                    { value: 'directeur', label: 'Direction', icon: faUserTie },
                    { value: 'administration', label: 'Administration', icon: faBuilding }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleDestinataireTypeChange(type.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        messageForm.destinataireType === type.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={type.icon} className="text-xl" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection du destinataire - Mode cascade pour les classes */}
              {messageForm.destinataireType === 'classe' ? (
                <div className="space-y-4">
                  {/* Étape 1: Sélection de la filière */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold mr-2">1</span>
                      Sélectionnez la filière
                    </label>
                    <select
                      value={selectedFiliere}
                      onChange={(e) => handleFiliereChange(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choisir une filière...</option>
                      {filieres.map((filiere) => (
                        <option key={filiere.id} value={filiere.id}>
                          {filiere.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Étape 2: Sélection de la classe (affichée seulement si filière sélectionnée) */}
                  {selectedFiliere && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold mr-2">2</span>
                        Sélectionnez la classe
                      </label>
                      <select
                        value={messageForm.destinataire}
                        onChange={(e) => setMessageForm({ ...messageForm, destinataire: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choisir une classe...</option>
                        {getDestinataireOptions().map((classe) => (
                          <option key={classe.id} value={classe.id}>
                            {classe.nom}
                          </option>
                        ))}
                      </select>
                      {getDestinataireOptions().length === 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Aucune classe disponible pour cette filière
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Sélection normale pour les autres types de destinataires */
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destinataire
                  </label>
                  <select
                    value={messageForm.destinataire}
                    onChange={(e) => setMessageForm({ ...messageForm, destinataire: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un destinataire</option>
                    {getDestinataireOptions().map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.nom} {dest.matricule && `(${dest.matricule})`} {dest.poste && `- ${dest.poste}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priorité
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="priorite"
                      value="normale"
                      checked={messageForm.priorite === 'normale'}
                      onChange={(e) => setMessageForm({ ...messageForm, priorite: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Normale</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="priorite"
                      value="urgente"
                      checked={messageForm.priorite === 'urgente'}
                      onChange={(e) => setMessageForm({ ...messageForm, priorite: e.target.value })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">Urgente</span>
                  </label>
                </div>
              </div>

              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  value={messageForm.sujet}
                  onChange={(e) => setMessageForm({ ...messageForm, sujet: e.target.value })}
                  placeholder="Entrez le sujet du message"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageForm.contenu}
                  onChange={(e) => setMessageForm({ ...messageForm, contenu: e.target.value })}
                  placeholder="Tapez votre message ici..."
                  rows="8"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Aperçu du destinataire */}
              {messageForm.destinataire && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon 
                      icon={getDestinataireIcon(messageForm.destinataireType)}
                      className="text-blue-600 text-xl"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Message sera envoyé à:
                      </p>
                      {messageForm.destinataireType === 'classe' ? (
                        <div className="text-sm text-slate-600">
                          <p className="font-semibold">
                            {classes.find(c => c.id === parseInt(messageForm.destinataire))?.nom}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs">
                            <span>
                              🎓 {filieres.find(f => f.id === selectedFiliere)?.nom}
                            </span>
                            <span className="text-green-600 font-medium">
                              📢 Message groupé à toute la classe
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">
                          {getDestinataireOptions().find(d => d.id === parseInt(messageForm.destinataire))?.nom}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageForm.destinataire || !messageForm.sujet || !messageForm.contenu}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagerieChefView

