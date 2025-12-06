import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt, faPlus, faTrash, faClock, faMapMarkerAlt, faSpinner } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getEmploiDuTemps, createEmploiDuTemps, deleteEmploiDuTemps, getClasses, getModules, getEnseignants } from '../../api/chefDepartement.js'

const EmploiDuTempsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [departementChef, setDepartementChef] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('S1')
  const [classes, setClasses] = useState([])
  const [modules, setModules] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [emploisTemps, setEmploisTemps] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    classeId: '',
    moduleId: '',
    enseignantId: '',
    jour: 'LUNDI',
    heureDebut: '08:00',
    heureFin: '10:00',
    salle: '',
    semestre: 'S1',
    anneeAcademique: '2025-2026'
  })

  const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const heures = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClasse && selectedSemestre) {
      loadEmploiDuTemps()
    }
  }, [selectedClasse, selectedSemestre])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les classes
      const classesResult = await getClasses()
      if (classesResult.success) {
        setClasses(classesResult.classes)
      }

      // Charger les modules
      const modulesResult = await getModules()
      if (modulesResult.success) {
        setModules(modulesResult.modules)
      }

      // Charger les enseignants
      const enseignantsResult = await getEnseignants()
      if (enseignantsResult.success) {
        setEnseignants(enseignantsResult.enseignants)
      }

      // Récupérer le nom du département
      if (user?.departement) {
        setDepartementChef(user.departement.nom)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadEmploiDuTemps = async () => {
    if (!selectedClasse || !selectedSemestre) return

    try {
      const result = await getEmploiDuTemps(selectedClasse, selectedSemestre)
      if (result.success) {
        setEmploisTemps(result.emploisTemps)
      } else {
        showAlert('error', result.error || 'Erreur lors du chargement de l\'emploi du temps')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors du chargement de l\'emploi du temps')
    }
  }

  const handleAdd = () => {
    setFormData({
      classeId: selectedClasse,
      moduleId: '',
      enseignantId: '',
      jour: 'LUNDI',
      heureDebut: '08:00',
      heureFin: '10:00',
      salle: '',
      semestre: selectedSemestre,
      anneeAcademique: '2025-2026'
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.classeId || !formData.moduleId || !formData.enseignantId || !formData.jour || !formData.heureDebut || !formData.heureFin) {
      showAlert('error', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setSaving(true)
      const result = await createEmploiDuTemps(formData)
      
      if (result.success) {
        showAlert('success', 'Emploi du temps ajouté avec succès')
        setShowModal(false)
        loadEmploiDuTemps()
      } else {
        showAlert('error', result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) {
      return
    }

    try {
      const result = await deleteEmploiDuTemps(id)
      if (result.success) {
        showAlert('success', 'Emploi du temps supprimé avec succès')
        loadEmploiDuTemps()
      } else {
        showAlert('error', result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors de la suppression')
    }
  }

  const getEmploisByJour = (jour) => {
    return emploisTemps.filter(edt => edt.jour === jour).sort((a, b) => 
      a.heureDebut.localeCompare(b.heureDebut)
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Emploi du Temps</h1>
              <p className="text-sm text-slate-600">Gérez l'emploi du temps des classes de votre département</p>
            </div>
            <button
              onClick={handleAdd}
              disabled={!selectedClasse}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPlus} />
              Ajouter un cours
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>{classe.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
              <select
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
            </div>
          </div>

          {/* Emploi du temps */}
          {selectedClasse ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Heure</th>
                      {jours.map((jour) => (
                        <th key={jour} className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">
                          {jour}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {heures.map((heure) => (
                      <tr key={heure}>
                        <td className="px-4 py-3 font-medium text-slate-700">{heure}</td>
                        {jours.map((jour) => {
                          const cours = getEmploisByJour(jour).find(c => 
                            c.heureDebut <= heure && c.heureFin > heure
                          )
                          return (
                            <td key={jour} className="px-2 py-2">
                              {cours ? (
                                <div className="bg-blue-100 rounded-lg p-2 border-l-4 border-blue-500">
                                  <p className="text-xs font-semibold text-blue-900">{cours.module.code}</p>
                                  <p className="text-xs text-blue-700">{cours.module.nom}</p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    {cours.enseignant.prenom} {cours.enseignant.nom}
                                  </p>
                                  {cours.salle && (
                                    <p className="text-xs text-blue-500 mt-1">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                      {cours.salle}
                                    </p>
                                  )}
                                  <button
                                    onClick={() => handleDelete(cours.id)}
                                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">Sélectionnez une classe pour voir l'emploi du temps</p>
            </div>
          )}

          {/* Modal d'ajout */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Ajouter un cours"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Module *</label>
                <select
                  value={formData.moduleId}
                  onChange={(e) => {
                    const module = modules.find(m => m.id === e.target.value)
                    // Trouver l'enseignant assigné à ce module
                    const enseignant = module?.affectations?.[0]?.enseignant
                    setFormData({ 
                      ...formData, 
                      moduleId: e.target.value,
                      enseignantId: enseignant?.id || ''
                    })
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un module</option>
                  {modules.filter(m => m.classeId === selectedClasse).map((module) => (
                    <option key={module.id} value={module.id}>{module.code} - {module.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enseignant *</label>
                <select
                  value={formData.enseignantId}
                  onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un enseignant</option>
                  {enseignants.map((enseignant) => (
                    <option key={enseignant.id} value={enseignant.id}>
                      {enseignant.prenom} {enseignant.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jour *</label>
                <select
                  value={formData.jour}
                  onChange={(e) => setFormData({ ...formData, jour: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {jours.map((jour) => (
                    <option key={jour} value={jour}>{jour}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Heure début *</label>
                  <input
                    type="time"
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Heure fin *</label>
                  <input
                    type="time"
                    value={formData.heureFin}
                    onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Salle</label>
                <input
                  type="text"
                  value={formData.salle}
                  onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Salle 101"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default EmploiDuTempsView

