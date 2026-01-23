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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />

        <main className="flex-1 p-6 pt-24">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Requêtes et Réclamations</h1>
            <p className="text-slate-500">Soumettez vos demandes pédagogiques ou administratives</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section formulaire et téléversement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Formulaire - Carte blanche */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">Détails de la demande</h2>
                <div className="space-y-6">
                  {/* Raison de la réclamation */}
                  <div>
                    <label htmlFor="raison" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Objet de la réclamation
                    </label>
                    <input
                      type="text"
                      id="raison"
                      name="raison"
                      value={formData.raison}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-300"
                      placeholder="Ex: Erreur de saisie de note - Module Mathématiques"
                    />
                  </div>

                  {/* Type de réclamation */}
                  <div>
                    <label htmlFor="type" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Catégorie
                    </label>
                    <div className="relative">
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        <option value="note">Note incorrecte</option>
                        <option value="absence">Absence injustifiée</option>
                        <option value="document">Document manquant</option>
                        <option value="autre">Autre demande</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                        <FontAwesomeIcon icon={faChevronDown} fontSize="12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de téléversement */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">Pièces justificatives</h2>
                <div
                  className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-all flex flex-col items-center justify-center ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-xs border border-slate-100 flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faCloudArrowUp}
                      className="text-2xl text-slate-300"
                    />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">
                    Déposez vos documents ici
                  </p>
                  <p className="text-slate-400 text-xs mb-6">PDF, PNG ou JPG (max 5MB)</p>

                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold cursor-pointer transition-all text-sm shadow-sm"
                  >
                    Parcourir les fichiers
                  </label>

                  {formData.fichier && (
                    <div className="mt-4 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUpload} fontSize="10" />
                      {formData.fichier.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section explications détaillées */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">
                Description détaillée
              </h2>
              <textarea
                name="explications"
                value={formData.explications}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-300 resize-none"
                placeholder="Veuillez fournir un maximum de détails pour faciliter le traitement de votre demande..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-3" />
                Envoyer la réclamation
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded font-semibold transition-all"
              >
                <FontAwesomeIcon icon={faRedo} className="mr-3" />
                Réinitialiser
              </button>
            </div>
          </form>

          {/* Modal d'information pour note incorrecte */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                <div className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-full border border-amber-100">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 text-2xl" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 text-center mb-6">
                    Note importante
                  </h3>

                  <div className="space-y-4 text-center">
                    <p className="text-slate-600 text-sm leading-relaxed px-2">
                      Pour toute réclamation concernant une <span className="font-bold text-slate-800">note incorrecte</span>, l'envoi des copies de vos feuilles d'examen est <span className="font-bold">obligatoire</span>.
                    </p>
                    <div className="p-4 bg-slate-50 rounded border border-slate-100 text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Instructions</p>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        Si vous avez plusieurs feuilles, merci de les scanner et de créer <span className="font-bold">un seul document PDF unique</span>. Toute réclamation sans justificatif sera classée sans suite.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex bg-slate-50 p-6 gap-3">
                  <button
                    onClick={handleModalClose}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded font-bold transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all shadow-sm"
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

