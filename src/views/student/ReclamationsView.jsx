import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCloudArrowUp,
  faUpload,
  faPaperPlane,
  faRedo,
  faTimes,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const ReclamationsView = () => {
  // Données par défaut pour l'affichage sans connexion
  const defaultStudentData = {
    id: 1,
    email: 'lidvigembo@mail.com',
    matricule: 'INPTIC2025',
    nom: 'MBO',
    prenom: 'Lidvige',
    programme: 'GI 2025 Génie Informatique',
    niveau: 'L3',
    moyenneGenerale: 14.5,
    credits: 24,
    totalModules: 15,
    rangClasse: 5,
    estActif: true,
    estBoursier: true,
    semestre: 'Semestre 6',
    derniereConnexion: new Date().toISOString()
  }

  const [student] = useState(() => {
    const studentData = localStorage.getItem('student')
    if (studentData) {
      return new StudentModel(JSON.parse(studentData))
    }
    return new StudentModel(defaultStudentData)
  })

  const [formData, setFormData] = useState({
    raison: '',
    type: '',
    explications: '',
    fichier: null
  })

  const [isDragging, setIsDragging] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingType, setPendingType] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Si c'est le type de réclamation et que c'est "note incorrecte", afficher le modal
    if (name === 'type' && value === 'note') {
      setPendingType(value)
      setShowModal(true)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleModalConfirm = () => {
    setFormData(prev => ({
      ...prev,
      type: pendingType
    }))
    setShowModal(false)
    setPendingType('')
  }

  const handleModalClose = () => {
    setShowModal(false)
    setPendingType('')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        fichier: file
      }))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        fichier: file
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implémenter l'envoi de la réclamation
    console.log('Réclamation envoyée:', formData)
    alert('Réclamation envoyée avec succès!')
  }

  const handleReset = () => {
    setFormData({
      raison: '',
      type: '',
      explications: '',
      fichier: null
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Réclamations
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section formulaire et téléversement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Formulaire - Carte blanche */}
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <div className="space-y-4">
                  {/* Raison de la réclamation */}
                  <div>
                    <label htmlFor="raison" className="block text-sm font-medium text-slate-700 mb-2">
                      Raison de la réclamation
                    </label>
                    <input
                      type="text"
                      id="raison"
                      name="raison"
                      value={formData.raison}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                      placeholder="Entrez la raison de votre réclamation"
                    />
                  </div>

                  {/* Type de réclamation */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
                      Type de réclamation
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="note">Note incorrecte</option>
                      <option value="absence">Absence injustifiée</option>
                      <option value="document">Document manquant</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Zone de téléversement - Carte bleu-gris */}
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-md p-4 sm:p-6 border border-slate-500">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                    isDragging ? 'border-blue-400 bg-slate-600' : 'border-slate-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FontAwesomeIcon 
                    icon={faCloudArrowUp} 
                    className="text-4xl sm:text-5xl text-slate-300 mb-4" 
                  />
                  <p className="text-white text-sm sm:text-base mb-4">
                    Glisser et déposer ici ou cliquer sur téléverser
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium cursor-pointer transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Téléverser
                  </label>
                  {formData.fichier && (
                    <p className="text-slate-200 text-xs mt-3">
                      Fichier sélectionné: {formData.fichier.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section explications détaillées */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">
                Explications détaillées
              </h2>
              <textarea
                name="explications"
                value={formData.explications}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 resize-y"
                placeholder="Décrivez en détail votre réclamation..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                Envoyer
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center px-6 py-2.5 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faRedo} className="mr-2" />
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Modal d'information pour note incorrecte */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Bouton de fermeture */}
                <button
                  onClick={handleModalClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>

                {/* Icône d'alerte */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-600 text-2xl" />
                </div>

                {/* Titre */}
                <h3 className="text-xl font-bold text-slate-800 text-center mb-4">
                  Information importante
                </h3>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Pour une réclamation concernant une <strong>note incorrecte</strong>, vous devez obligatoirement joindre les <strong>feuilles de devoirs</strong> si l'évaluation a été effectuée sur table.
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-3">
                    <strong>Important :</strong> Si vous avez plusieurs évaluations pour un seul module, vous devez créer <strong>un seul document PDF</strong> contenant toutes vos évaluations.
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed mt-3 font-semibold text-orange-600">
                    Sans ces documents, votre réclamation ne sera pas prise en compte.
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleModalClose}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    J'ai compris
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ReclamationsView

