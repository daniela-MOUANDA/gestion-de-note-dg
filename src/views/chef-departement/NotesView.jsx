import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGraduationCap, faSave, faEdit, faTrash, faSpinner, faFileExcel, faUpload } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getNotes, saveNote, deleteNote, getClasses, getModules, getEtudiantsByClasse } from '../../api/chefDepartement.js'

const NotesView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [departementChef, setDepartementChef] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('S1')
  const [classes, setClasses] = useState([])
  const [modules, setModules] = useState([])
  const [notes, setNotes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    etudiantId: '',
    inscriptionId: '',
    moduleId: '',
    enseignantId: '',
    classeId: '',
    typeNote: 'CONTINU',
    valeur: '',
    coefficient: '1.0',
    semestre: 'S1',
    anneeAcademique: '2025-2026',
    commentaire: ''
  })

  const typesNote = [
    { value: 'CONTINU', label: 'Contrôle Continu' },
    { value: 'EXAMEN', label: 'Examen' },
    { value: 'RATTRAPAGE', label: 'Rattrapage' },
    { value: 'ORAL', label: 'Oral' },
    { value: 'PRATIQUE', label: 'Pratique' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClasse && selectedModule && selectedSemestre) {
      loadNotes()
    }
  }, [selectedClasse, selectedModule, selectedSemestre])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les classes
      const classesResult = await getClasses()
      if (classesResult.success) {
        setClasses(classesResult.classes)
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

  useEffect(() => {
    if (selectedClasse) {
      loadModules()
    }
  }, [selectedClasse])

  const loadModules = async () => {
    try {
      const result = await getModules(selectedClasse)
      if (result.success) {
        setModules(result.modules)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const loadNotes = async () => {
    if (!selectedClasse || !selectedModule || !selectedSemestre) return

    try {
      // Charger les étudiants de la classe
      const etudiantsResult = await getEtudiantsByClasse(selectedClasse)
      if (etudiantsResult.success) {
        const etudiants = etudiantsResult.etudiants || []
        
        // Charger les notes pour chaque étudiant
        const notesResult = await getNotes(selectedClasse, selectedModule, selectedSemestre)
        const notesData = notesResult.success ? notesResult.notes || [] : []
        
        // Combiner les étudiants avec leurs notes
        const notesWithEtudiants = etudiants.map(etudiant => {
          const etudiantNotes = notesData.filter(n => n.etudiantId === etudiant.etudiant?.id || n.etudiant?.id === etudiant.etudiant?.id)
          return {
            etudiant: etudiant.etudiant || etudiant,
            inscriptionId: etudiant.inscriptionId || etudiant.id,
            notes: etudiantNotes
          }
        })
        
        setNotes(notesWithEtudiants)
      } else {
        showAlert('error', etudiantsResult.error || 'Erreur lors du chargement des étudiants')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors du chargement des notes')
    }
  }

  const handleAddNote = (etudiant) => {
    setEditingNote(null)
    setFormData({
      etudiantId: etudiant.etudiant.id,
      inscriptionId: etudiant.inscriptionId,
      moduleId: selectedModule,
      enseignantId: user?.id || '',
      classeId: selectedClasse,
      typeNote: 'CONTINU',
      valeur: '',
      coefficient: '1.0',
      semestre: selectedSemestre,
      anneeAcademique: '2025-2026',
      commentaire: ''
    })
    setShowModal(true)
  }

  const handleEditNote = (note) => {
    setEditingNote(note)
    setFormData({
      etudiantId: note.etudiant.id,
      inscriptionId: note.inscriptionId,
      moduleId: selectedModule,
      enseignantId: user?.id || '',
      classeId: selectedClasse,
      typeNote: note.typeNote,
      valeur: note.valeur.toString(),
      coefficient: note.coefficient.toString(),
      semestre: selectedSemestre,
      anneeAcademique: '2025-2026',
      commentaire: note.commentaire || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.valeur || parseFloat(formData.valeur) < 0 || parseFloat(formData.valeur) > 20) {
      showAlert('error', 'La note doit être entre 0 et 20')
      return
    }

    try {
      setSaving(true)
      const result = await saveNote(formData)
      
      if (result.success) {
        showAlert('success', 'Note enregistrée avec succès')
        setShowModal(false)
        loadNotes()
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

  const handleDelete = async (noteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return
    }

    try {
      const result = await deleteNote(noteId)
      if (result.success) {
        showAlert('success', 'Note supprimée avec succès')
        loadNotes()
      } else {
        showAlert('error', result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('error', 'Erreur lors de la suppression')
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Gestion des Notes</h1>
              <p className="text-sm text-slate-600">Ajoutez et gérez les notes des étudiants par classe et module</p>
            </div>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUpload} />
              Importer Excel
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Classe *</label>
              <select
                value={selectedClasse}
                onChange={(e) => {
                  setSelectedClasse(e.target.value)
                  setSelectedModule('')
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>{classe.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Module *</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={!selectedClasse}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Sélectionner un module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.code} - {module.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semestre *</label>
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

          {/* Tableau des notes */}
          {selectedClasse && selectedModule && selectedSemestre ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Matricule</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom & Prénom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Coefficient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {notes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          Aucune note trouvée. Ajoutez des notes pour les étudiants de cette classe.
                        </td>
                      </tr>
                    ) : (
                      notes.map((noteItem) => (
                        <tr key={noteItem.etudiant.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono font-semibold text-slate-800">{noteItem.etudiant.matricule}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{noteItem.etudiant.prenom} {noteItem.etudiant.nom}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {noteItem.notes.length > 0 ? (
                              <div className="space-y-1">
                                {noteItem.notes.map((note) => (
                                  <span key={note.id} className="inline-block px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                    {typesNote.find(t => t.value === note.typeNote)?.label || note.typeNote}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Aucune note</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {noteItem.notes.length > 0 ? (
                              <div className="space-y-1">
                                {noteItem.notes.map((note) => (
                                  <span key={note.id} className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                                    note.valeur >= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {note.valeur}/20
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {noteItem.notes.length > 0 ? (
                              <div className="space-y-1">
                                {noteItem.notes.map((note) => (
                                  <span key={note.id} className="text-sm text-slate-600">
                                    {note.coefficient}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAddNote(noteItem)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ajouter une note"
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                              {noteItem.notes.length > 0 && (
                                <>
                                  <button
                                    onClick={() => handleEditNote(noteItem.notes[0])}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Modifier"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(noteItem.notes[0].id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">Sélectionnez une classe, un module et un semestre pour voir les notes</p>
            </div>
          )}

          {/* Modal d'ajout/modification de note */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={editingNote ? 'Modifier la note' : 'Ajouter une note'}
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de note *</label>
                <select
                  value={formData.typeNote}
                  onChange={(e) => setFormData({ ...formData, typeNote: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {typesNote.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Note (sur 20) *</label>
                  <input
                    type="number"
                    value={formData.valeur}
                    onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="20"
                    step="0.25"
                    placeholder="Ex: 15.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Coefficient</label>
                  <input
                    type="number"
                    value={formData.coefficient}
                    onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0.5"
                    max="5"
                    step="0.5"
                    placeholder="Ex: 1.0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
                <textarea
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Commentaire optionnel..."
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
                  <FontAwesomeIcon icon={faSave} />
                  {editingNote ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default NotesView

