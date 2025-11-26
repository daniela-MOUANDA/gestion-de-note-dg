import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope, faArrowLeft, faUsers, faUserCircle, faGlobe,
  faPaperPlane, faCheck, faGraduationCap
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'

const MessagerieScolareView = () => {
  const [typeMessage, setTypeMessage] = useState('') // 'individuel', 'groupe', 'collectif'
  const [selectedFormation, setSelectedFormation] = useState('') // 'Initial 1' ou 'Initial 2'
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [messageObjet, setMessageObjet] = useState('')
  const [messageCorps, setMessageCorps] = useState('')
  const [messageSent, setMessageSent] = useState(false)

  const filieres = ['RT', 'GI', 'MTIC', 'AV']

  // Fonction pour obtenir les niveaux selon formation et filière
  const getNiveaux = (formation, filiere) => {
    if (formation === 'Initial 2') {
      if (filiere === 'MTIC') {
        return ['L1', 'L2', 'L3']
      }
      return ['L1']
    }
    return ['L1', 'L2', 'L3']
  }

  // Fonction pour obtenir les classes
  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 35 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 32 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 28 }
    ]
  }

  // Données d'exemple pour les étudiants
  const getEtudiants = (classe) => {
    const filiereCode = classe.split('-')[0]
    const niveau = classe.split('-')[1].charAt(0)
    return [
      { id: 1, nom: 'MBADINGA', prenom: 'Paul', matricule: `${filiereCode}2024-L${niveau}-001`, email: 'paul.mbadinga@student.inptic.ga' },
      { id: 2, nom: 'OBIANG', prenom: 'Sophie', matricule: `${filiereCode}2024-L${niveau}-002`, email: 'sophie.obiang@student.inptic.ga' },
      { id: 3, nom: 'NZAMBA', prenom: 'Jean', matricule: `${filiereCode}2024-L${niveau}-003`, email: 'jean.nzamba@student.inptic.ga' },
      { id: 4, nom: 'ONDO', prenom: 'Marie', matricule: `${filiereCode}2024-L${niveau}-004`, email: 'marie.ondo@student.inptic.ga' },
      { id: 5, nom: 'EKOMY', prenom: 'Pierre', matricule: `${filiereCode}2024-L${niveau}-005`, email: 'pierre.ekomy@student.inptic.ga' },
      { id: 6, nom: 'BITEGUE', prenom: 'Anne', matricule: `${filiereCode}2024-L${niveau}-006`, email: 'anne.bitegue@student.inptic.ga' },
      { id: 7, nom: 'MVOU', prenom: 'Patrick', matricule: `${filiereCode}2024-L${niveau}-007`, email: 'patrick.mvou@student.inptic.ga' },
      { id: 8, nom: 'EBANG', prenom: 'Claire', matricule: `${filiereCode}2024-L${niveau}-008`, email: 'claire.ebang@student.inptic.ga' }
    ]
  }

  const handleBack = () => {
    if (messageSent) {
      // Réinitialiser tout
      setMessageSent(false)
      setTypeMessage('')
      setSelectedFormation('')
      setSelectedFiliere('')
      setSelectedClasse('')
      setSelectedEtudiant(null)
      setMessageObjet('')
      setMessageCorps('')
    } else if (messageObjet || messageCorps) {
      setMessageObjet('')
      setMessageCorps('')
    } else if (selectedEtudiant) {
      setSelectedEtudiant(null)
    } else if (selectedClasse) {
      setSelectedClasse('')
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    } else if (selectedFormation) {
      setSelectedFormation('')
    } else if (typeMessage) {
      setTypeMessage('')
    }
  }

  const handleSendMessage = () => {
    // Simulation d'envoi
    setMessageSent(true)
    setTimeout(() => {
      setMessageSent(false)
      setTypeMessage('')
      setSelectedFormation('')
      setSelectedFiliere('')
      setSelectedClasse('')
      setSelectedEtudiant(null)
      setMessageObjet('')
      setMessageCorps('')
    }, 3000)
  }

  // Vue 0: Message envoyé avec succès
  if (messageSent) {
    let destinataires = ''
    if (typeMessage === 'individuel') {
      destinataires = `${selectedEtudiant.prenom} ${selectedEtudiant.nom}`
    } else if (typeMessage === 'groupe') {
      const classes = getClasses(selectedFiliere, selectedClasse.split('-')[1].charAt(0))
      const classe = classes.find(c => c.id === selectedClasse)
      destinataires = `${classe.effectif} étudiants de la classe ${selectedClasse}`
    } else {
      destinataires = 'Tous les étudiants de l\'école'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-500">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FontAwesomeIcon icon={faCheck} className="text-5xl text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-3">Message envoyé avec succès !</h2>
                  <p className="text-slate-600 mb-6">
                    Votre message a été envoyé à : <span className="font-semibold">{destinataires}</span>
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-slate-600 mb-2"><span className="font-semibold">Objet :</span> {messageObjet}</p>
                    <p className="text-sm text-slate-600"><span className="font-semibold">Message :</span> {messageCorps}</p>
                  </div>
                  <p className="text-sm text-slate-500">Redirection automatique dans quelques secondes...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 1: Choix du type de message
  if (!typeMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
                Messagerie
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Envoyez des messages aux étudiants
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <button 
                onClick={() => setTypeMessage('individuel')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                    <FontAwesomeIcon icon={faUserCircle} className="text-5xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">Message individuel</h3>
                  <p className="text-slate-600">Envoyer un message à un étudiant en particulier</p>
                </div>
              </button>

              <button 
                onClick={() => setTypeMessage('groupe')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                    <FontAwesomeIcon icon={faUsers} className="text-5xl text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">Message groupé</h3>
                  <p className="text-slate-600">Envoyer un message à une classe spécifique</p>
                </div>
              </button>

              <button 
                onClick={() => setTypeMessage('collectif')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                    <FontAwesomeIcon icon={faGlobe} className="text-5xl text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-purple-600 mb-2">Message collectif</h3>
                  <p className="text-slate-600">Envoyer un message à tous les étudiants de l'école</p>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 2a: Choix de la formation (pour message individuel)
  if (typeMessage === 'individuel' && !selectedFormation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Message individuel
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la formation de l'étudiant
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la formation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {['Initial 1', 'Initial 2'].map((formation) => (
                  <button 
                    key={formation}
                    onClick={() => setSelectedFormation(formation)}
                    className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{formation}</div>
                      <div className="text-sm text-slate-600">
                        {formation === 'Initial 1' ? 'Formation initiale classique' : 'Formation initiale spécialisée'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3a/2b: Choix de la filière
  if ((typeMessage === 'individuel' || typeMessage === 'groupe') && !selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {typeMessage === 'individuel' ? 'Message individuel' : 'Message groupé'}
                {typeMessage === 'individuel' && ` - ${selectedFormation}`}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la filière
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => (
                  <button 
                    key={filiere}
                    onClick={() => setSelectedFiliere(filiere)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600">{filiere}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4a/3b: Choix de la classe
  if ((typeMessage === 'individuel' || typeMessage === 'groupe') && selectedFiliere && !selectedClasse) {
    const niveaux = typeMessage === 'individuel' ? getNiveaux(selectedFormation, selectedFiliere) : ['L1', 'L2', 'L3']
    const toutesLesClasses = niveaux.flatMap(niveau => getClasses(selectedFiliere, niveau))

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {typeMessage === 'individuel' ? 'Message individuel' : 'Message groupé'} - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la classe</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {toutesLesClasses.map((classe) => (
                  <button 
                    key={classe.id}
                    onClick={() => setSelectedClasse(classe.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faUsers} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{classe.nom}</div>
                      <div className="text-sm text-slate-600">
                        {classe.effectif} étudiants
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 5a: Sélection de l'étudiant (pour message individuel)
  if (typeMessage === 'individuel' && selectedClasse && !selectedEtudiant) {
    const etudiants = getEtudiants(selectedClasse)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Message individuel - Classe {selectedClasse}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez l'étudiant destinataire
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Liste des étudiants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {etudiants.map((etudiant) => (
                  <button 
                    key={etudiant.id}
                    onClick={() => setSelectedEtudiant(etudiant)}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 group-hover:text-blue-600">
                          {etudiant.prenom} {etudiant.nom}
                        </div>
                        <div className="text-sm text-slate-600">{etudiant.matricule}</div>
                        <div className="text-xs text-slate-500">{etudiant.email}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue finale: Rédaction du message
  const getDestinatairesInfo = () => {
    if (typeMessage === 'individuel' && selectedEtudiant) {
      return {
        titre: `Message à ${selectedEtudiant.prenom} ${selectedEtudiant.nom}`,
        description: `Classe ${selectedClasse} • ${selectedEtudiant.email}`
      }
    } else if (typeMessage === 'groupe' && selectedClasse) {
      const classes = getClasses(selectedFiliere, selectedClasse.split('-')[1].charAt(0))
      const classe = classes.find(c => c.id === selectedClasse)
      return {
        titre: `Message groupé - Classe ${selectedClasse}`,
        description: `${classe.effectif} étudiants destinataires`
      }
    } else if (typeMessage === 'collectif') {
      return {
        titre: 'Message collectif',
        description: 'Tous les étudiants de l\'INPTIC'
      }
    }
    return { titre: '', description: '' }
  }

  const destinatairesInfo = getDestinatairesInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarScolarite />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderScolarite scolariteName="Service Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              {destinatairesInfo.titre}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {destinatairesInfo.description}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Rédiger votre message</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Objet du message *
                  </label>
                  <input 
                    type="text"
                    value={messageObjet}
                    onChange={(e) => setMessageObjet(e.target.value)}
                    placeholder="Ex: Information importante concernant les examens"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message *
                  </label>
                  <textarea 
                    value={messageCorps}
                    onChange={(e) => setMessageCorps(e.target.value)}
                    placeholder="Rédigez votre message ici..."
                    rows="8"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                    <strong>Destinataire(s) :</strong> {destinatairesInfo.description}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleSendMessage}
                    disabled={!messageObjet || !messageCorps}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                      messageObjet && messageCorps
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Envoyer le message
                  </button>
                  <button 
                    onClick={handleBack}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MessagerieScolareView

