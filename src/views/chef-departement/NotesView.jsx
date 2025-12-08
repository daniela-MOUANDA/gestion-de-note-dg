import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faGraduationCap, faSave, faEdit, faTrash, faSpinner, faFileExcel, 
  faUpload, faPlus, faCog, faCheckCircle, faTimes, faChartLine 
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { 
  getClasses, 
  getModules, 
  getEtudiantsByClasse,
  getParametresNotation,
  saveParametresNotation,
  getNotesByModuleClasse,
  saveNotes,
  deleteNote
} from '../../api/chefDepartement.js'

const NotesView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('')
  const [classes, setClasses] = useState([])
  const [modules, setModules] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [parametres, setParametres] = useState(null)
  const [notes, setNotes] = useState({}) // { etudiantId: { evaluationId: note } }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showParametresModal, setShowParametresModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  
  const [formParametres, setFormParametres] = useState({
    evaluations: [
      { id: Date.now(), type: 'TP', noteMax: 20, nombreEvaluations: 2, coefficient: 1 }
    ]
  })

  const typesEvaluation = [
    { value: 'TP', label: 'Travaux Pratiques (TP)' },
    { value: 'TD', label: 'Travaux Dirigés (TD)' },
    { value: 'INTERROGATION', label: 'Interrogation' },
    { value: 'CONTROLE', label: 'Contrôle Continu' },
    { value: 'EXAMEN', label: 'Examen Final' },
    { value: 'PROJET', label: 'Projet' },
    { value: 'ORAL', label: 'Oral' },
    { value: 'PRATIQUE', label: 'Pratique' }
  ]

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const classesResult = await getClasses()
      if (classesResult.success) {
        setClasses(classesResult.classes || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadModules = async () => {
      if (!selectedClasse || !selectedSemestre) {
        setModules([])
        setSelectedModule('')
        return
      }

      try {
        // Trouver la classe sélectionnée pour obtenir sa filière et son niveau
        const classeSelectionnee = classes.find(c => c.id === selectedClasse)
        if (!classeSelectionnee) {
          setModules([])
          return
        }

        const filiereId = classeSelectionnee.filiereId || classeSelectionnee.filiere_id
        const niveauCode = classeSelectionnee.niveauCode || classeSelectionnee.niveaux?.code

        // Vérifier la correspondance niveau-semestre
        const correspondanceNiveauSemestre = {
          'L1': ['S1', 'S2'],
          'L2': ['S3', 'S4'],
          'L3': ['S5', 'S6']
        }

        const semestresAutorises = correspondanceNiveauSemestre[niveauCode] || []
        
        // Vérification de sécurité (ne devrait normalement jamais se produire car le dropdown est filtré)
        if (!semestresAutorises.includes(selectedSemestre)) {
          console.error(`Semestre ${selectedSemestre} non autorisé pour ${niveauCode}`)
          setModules([])
          setSelectedModule('')
          return
        }

        // Charger tous les modules
        const result = await getModules()
        if (result.success) {
          // Filtrer les modules par filière de la classe ET par semestre
          const modulesFiltered = (result.modules || []).filter(module => {
            const moduleFiliereId = module.filiereId || module.filiere_id
            return moduleFiliereId === filiereId && module.semestre === selectedSemestre
          })
          setModules(modulesFiltered)
          
          // Réinitialiser le module sélectionné si il n'est plus dans la liste
          if (selectedModule && !modulesFiltered.find(m => m.id === selectedModule)) {
            setSelectedModule('')
          }
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    }

    loadModules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClasse, selectedSemestre, classes])

  useEffect(() => {
    if (selectedClasse && selectedModule && selectedSemestre) {
      loadEtudiantsAndNotes()
    } else {
      setEtudiants([])
      setNotes({})
    }
  }, [selectedClasse, selectedModule, selectedSemestre])

  const loadEtudiantsAndNotes = async () => {
    try {
      setLoading(true)
      
      // Charger les étudiants
      const etudiantsResult = await getEtudiantsByClasse(selectedClasse)
      if (etudiantsResult.success) {
        setEtudiants(etudiantsResult.etudiants || [])
      }

      // Charger les paramètres de notation
      const parametresResult = await getParametresNotation(selectedModule, selectedSemestre)
      if (parametresResult.success && parametresResult.parametres) {
        console.log('📊 Paramètres chargés:', parametresResult.parametres)
        setParametres(parametresResult.parametres)
      } else {
        console.log('⚠️ Aucun paramètre trouvé')
        setParametres(null)
      }

      // Charger les notes existantes
      const notesResult = await getNotesByModuleClasse(selectedModule, selectedClasse, selectedSemestre)
      console.log('📥 Notes reçues du serveur:', notesResult)
      if (notesResult.success) {
        // Organiser les notes par étudiant
        const notesOrganisees = {}
        notesResult.notes.forEach(note => {
          // Gérer les deux formats possibles: camelCase et snake_case
          const etudiantId = note.etudiantId || note.etudiant_id
          const evaluationId = note.evaluationId || note.evaluation_id
          const valeur = note.valeur
          
          console.log('📝 Note organisée:', { etudiantId, evaluationId, valeur })
          
          if (!notesOrganisees[etudiantId]) {
            notesOrganisees[etudiantId] = {}
          }
          notesOrganisees[etudiantId][evaluationId] = valeur
        })
        console.log('📦 Notes organisées finales:', notesOrganisees)
        setNotes(notesOrganisees)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigurer = () => {
    if (parametres) {
      setFormParametres({ evaluations: parametres.evaluations })
    } else {
      setFormParametres({
        evaluations: [
          { id: Date.now(), type: 'TP', noteMax: 20, nombreEvaluations: 2, coefficient: 1 }
        ]
      })
    }
    setShowParametresModal(true)
  }

  const ajouterEvaluation = () => {
    setFormParametres({
      ...formParametres,
      evaluations: [
        ...formParametres.evaluations,
        { id: Date.now(), type: 'CONTROLE', noteMax: 20, nombreEvaluations: 1, coefficient: 1 }
      ]
    })
  }

  const supprimerEvaluation = (id) => {
    setFormParametres({
      ...formParametres,
      evaluations: formParametres.evaluations.filter(e => e.id !== id)
    })
  }

  const modifierEvaluation = (id, champ, valeur) => {
    setFormParametres({
      ...formParametres,
      evaluations: formParametres.evaluations.map(e =>
        e.id === id ? { ...e, [champ]: valeur } : e
      )
    })
  }

  const handleSaveParametres = async () => {
    // Vérifier que toutes les évaluations ont une note max et un coefficient
    const hasInvalidEvaluation = formParametres.evaluations.some(e => 
      !e.noteMax || !e.coefficient || e.nombreEvaluations < 1
    )
    
    if (hasInvalidEvaluation) {
      showAlert('Veuillez remplir tous les champs pour chaque évaluation', 'error')
      return
    }

    // Vérifier qu'il n'y a pas de types en double
    const types = formParametres.evaluations.map(e => e.type)
    const duplicates = types.filter((type, index) => types.indexOf(type) !== index)
    
    if (duplicates.length > 0) {
      const typeLabel = typesEvaluation.find(t => t.value === duplicates[0])?.label || duplicates[0]
      showAlert(`⚠️ Vous avez créé plusieurs lignes pour "${typeLabel}". Supprimez les doublons et créez UNE SEULE ligne avec le nombre total d'évaluations.`, 'warning')
      return
    }

    try {
      setSaving(true)
      const result = await saveParametresNotation({
        moduleId: selectedModule,
        semestre: selectedSemestre,
        evaluations: formParametres.evaluations
      })

      if (result.success) {
        showAlert('Paramètres de notation enregistrés avec succès', 'success')
        setShowParametresModal(false)
        loadEtudiantsAndNotes()
      } else {
        showAlert(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaisirNotes = (etudiant) => {
    setSelectedEtudiant(etudiant)
    setShowNotesModal(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedEtudiant) return

    try {
      setSaving(true)
      const notesEtudiant = notes[selectedEtudiant.id] || {}
      
      // Préparer les notes pour l'envoi
      const notesToSave = Object.entries(notesEtudiant).map(([evaluationId, valeur]) => ({
        etudiantId: selectedEtudiant.id,
        moduleId: selectedModule,
        classeId: selectedClasse,
        semestre: selectedSemestre,
        evaluationId,
        valeur: parseFloat(valeur),
        anneeAcademique: '2024-2025'
      })).filter(note => note.valeur && !isNaN(note.valeur))

      console.log('📤 Envoi des notes:', { notesToSave, selectedEtudiant, selectedModule, selectedClasse, selectedSemestre })
      
      if (notesToSave.length === 0) {
        showAlert('Veuillez saisir au moins une note', 'warning')
        setSaving(false)
        return
      }

      const result = await saveNotes(notesToSave)

      if (result.success) {
        showAlert('Notes enregistrées avec succès', 'success')
        setShowNotesModal(false)
        loadEtudiantsAndNotes()
      } else {
        showAlert(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const calculerMoyenne = (etudiantId) => {
    if (!parametres || !notes[etudiantId]) return null

    let sommeNotesPonderees = 0
    let totalCoefficients = 0

    parametres.evaluations.forEach(evaluation => {
      for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
        const evalId = `${evaluation.id}_${i}`
        const note = notes[etudiantId]?.[evalId]
        
        if (note !== undefined && note !== null && note !== '') {
          // Convertir la note sur 20
          const noteSur20 = (parseFloat(note) / evaluation.noteMax) * 20
          sommeNotesPonderees += noteSur20 * evaluation.coefficient
          totalCoefficients += evaluation.coefficient
        }
      }
    })

    return totalCoefficients > 0 ? (sommeNotesPonderees / totalCoefficients).toFixed(2) : null
  }

  const getTotalCoefficients = () => {
    return formParametres.evaluations.reduce((sum, e) => sum + (parseFloat(e.coefficient || 0) * e.nombreEvaluations), 0)
  }

  // Obtenir les semestres autorisés pour la classe sélectionnée
  const getSemestresAutorises = () => {
    if (!selectedClasse) return []
    
    const classeSelectionnee = classes.find(c => c.id === selectedClasse)
    if (!classeSelectionnee) return []
    
    const niveauCode = classeSelectionnee.niveauCode || classeSelectionnee.niveaux?.code
    
    const correspondanceNiveauSemestre = {
      'L1': [
        { value: 'S1', label: 'Semestre 1 (L1)' },
        { value: 'S2', label: 'Semestre 2 (L1)' }
      ],
      'L2': [
        { value: 'S3', label: 'Semestre 3 (L2)' },
        { value: 'S4', label: 'Semestre 4 (L2)' }
      ],
      'L3': [
        { value: 'S5', label: 'Semestre 5 (L3)' },
        { value: 'S6', label: 'Semestre 6 (L3)' }
      ]
    }
    
    return correspondanceNiveauSemestre[niveauCode] || []
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
              onClick={() => showAlert('Fonctionnalité d\'import Excel en cours de développement', 'info')}
            >
              <FontAwesomeIcon icon={faUpload} />
              Importer Excel
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Classe *</label>
                <select
                  value={selectedClasse}
                  onChange={(e) => {
                    setSelectedClasse(e.target.value)
                    setSelectedModule('')
                    setSelectedSemestre('')
                  }}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>{classe.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Module *</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  disabled={!selectedClasse}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionner un module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>{module.code} - {module.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Semestre *</label>
                <select
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                  disabled={!selectedClasse}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionner un semestre</option>
                  {getSemestresAutorises().map((semestre) => (
                    <option key={semestre.value} value={semestre.value}>
                      {semestre.label}
                    </option>
                  ))}
                </select>
                {selectedClasse && getSemestresAutorises().length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Niveau de la classe non reconnu
                  </p>
                )}
              </div>
            </div>

            {selectedClasse && selectedModule && selectedSemestre && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleConfigurer}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCog} />
                  {parametres ? 'Modifier les paramètres de notation' : 'Configurer les paramètres de notation'}
                </button>
              </div>
            )}
          </div>

          {/* Affichage conditionnel */}
          {selectedClasse && selectedModule && selectedSemestre ? (
            parametres ? (
              <div className="space-y-6">
                {/* Résumé des paramètres */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                    Paramètres de notation configurés ({parametres.evaluations?.length || 0} type(s))
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(parametres.evaluations || []).map((evaluation, index) => (
                      <div key={`${evaluation.id}-${index}`} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-sm font-semibold text-purple-600 mb-1">
                          {typesEvaluation.find(t => t.value === evaluation.type)?.label}
                        </div>
                        <div className="text-xs text-slate-600">
                          {evaluation.nombreEvaluations} évaluation(s) sur {evaluation.noteMax} • Coef: {evaluation.coefficient}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tableau des notes */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase sticky left-0 bg-slate-50">
                            Étudiant
                          </th>
                          {(parametres.evaluations || []).map((evaluation, evalIndex) => (
                            Array.from({ length: evaluation.nombreEvaluations }).map((_, i) => (
                              <th key={`${evaluation.id}_${i+1}`} className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                                {typesEvaluation.find(t => t.value === evaluation.type)?.label.substring(0, 10)} {i+1}
                                <br />
                                <span className="text-xs text-slate-500">
                                  (/{evaluation.noteMax} • Coef: {evaluation.coefficient})
                                </span>
                              </th>
                            ))
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase bg-blue-50">
                            Moyenne
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {etudiants.length === 0 ? (
                          <tr>
                            <td colSpan={parametres.evaluations.reduce((sum, e) => sum + e.nombreEvaluations, 0) + 3} 
                                className="px-6 py-12 text-center text-slate-500">
                              Aucun étudiant trouvé dans cette classe.
                            </td>
                          </tr>
                        ) : (
                          etudiants.map((etudiant) => {
                            const moyenne = calculerMoyenne(etudiant.id)
                            return (
                              <tr key={etudiant.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 text-sm" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm text-slate-800">{etudiant.prenom} {etudiant.nom}</p>
                                      <p className="text-xs text-slate-500">{etudiant.matricule}</p>
                                    </div>
                                  </div>
                                </td>
                                {(parametres.evaluations || []).map((evaluation, evalIndex) => (
                                  Array.from({ length: evaluation.nombreEvaluations || 0 }).map((_, i) => {
                                    const evalId = `${evaluation.id}_${i+1}`
                                    const note = notes[etudiant.id]?.[evalId]
                                    const noteSur20 = note ? (parseFloat(note) / evaluation.noteMax) * 20 : null
                                    return (
                                      <td key={`${etudiant.id}_${evalId}`} className="px-4 py-3 text-center">
                                        {note !== undefined && note !== null && note !== '' ? (
                                          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                                            noteSur20 >= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {parseFloat(note).toFixed(2)}/{evaluation.noteMax}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-sm">-</span>
                                        )}
                                      </td>
                                    )
                                  })
                                ))}
                                <td className="px-4 py-3 text-center bg-blue-50">
                                  {moyenne ? (
                                    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${
                                      parseFloat(moyenne) >= 10 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                    }`}>
                                      {moyenne}/20
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-sm">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleSaisirNotes(etudiant)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    Saisir
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FontAwesomeIcon icon={faCog} className="text-6xl text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg mb-4">
                  Configurez d'abord les paramètres de notation pour ce module
                </p>
                <button
                  onClick={handleConfigurer}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 font-semibold"
                >
                  <FontAwesomeIcon icon={faCog} />
                  Configurer maintenant
                </button>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">
                Sélectionnez une classe, un module et un semestre pour voir les notes
              </p>
            </div>
          )}

          {/* Modal de configuration des paramètres */}
          <Modal
            isOpen={showParametresModal}
            onClose={() => setShowParametresModal(false)}
            title="Configuration des paramètres de notation"
            size="6xl"
          >
            <div className="p-4 space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  ⚠️ <strong>IMPORTANT :</strong> Créez UNE SEULE ligne par type d'évaluation
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded p-2 border-l-4 border-green-500">
                    <p className="font-semibold text-green-700 mb-1">✅ Correct :</p>
                    <p className="text-slate-700">TP → Nombre: <strong>6</strong> (toutes les TP en une ligne)</p>
                  </div>
                  <div className="bg-white rounded p-2 border-l-4 border-red-500">
                    <p className="font-semibold text-red-700 mb-1">❌ Incorrect :</p>
                    <p className="text-slate-700">TP → Nombre: 2, puis TP → Nombre: 4</p>
                  </div>
                </div>
              </div>

              {/* Tableau des évaluations */}
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Type d'évaluation</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Nombre</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Note Max</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Coefficient</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formParametres.evaluations.map((evaluation, index) => {
                      const types = formParametres.evaluations.map(e => e.type)
                      const isDuplicate = types.filter(t => t === evaluation.type).length > 1
                      return (
                      <tr key={evaluation.id} className={`border-b border-slate-200 hover:bg-slate-50 ${isDuplicate ? 'bg-orange-50' : ''}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={evaluation.type}
                              onChange={(e) => modifierEvaluation(evaluation.id, 'type', e.target.value)}
                              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDuplicate ? 'border-orange-500 border-2' : 'border-slate-300'}`}
                            >
                              {typesEvaluation.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                            {isDuplicate && (
                              <span className="text-orange-600 text-xs font-bold" title="Type en double!">⚠️</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={evaluation.nombreEvaluations}
                            onChange={(e) => modifierEvaluation(evaluation.id, 'nombreEvaluations', parseInt(e.target.value) || 1)}
                            min="1"
                            max="10"
                            className="w-full px-3 py-1.5 text-sm text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={evaluation.noteMax}
                            onChange={(e) => modifierEvaluation(evaluation.id, 'noteMax', parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="10">/10</option>
                            <option value="20">/20</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={evaluation.coefficient}
                            onChange={(e) => modifierEvaluation(evaluation.id, 'coefficient', parseFloat(e.target.value) || 1)}
                            min="0.5"
                            max="10"
                            step="0.5"
                            className="w-full px-3 py-1.5 text-sm text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {formParametres.evaluations.length > 1 && (
                            <button
                              onClick={() => supprimerEvaluation(evaluation.id)}
                              className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          )}
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={ajouterEvaluation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Ajouter une ligne
                </button>
                
                <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                  Total coefficients: <span className="text-lg">{getTotalCoefficients()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 -mx-4 px-4">
                <button
                  onClick={() => setShowParametresModal(false)}
                  disabled={saving}
                  className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveParametres}
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  <FontAwesomeIcon icon={faSave} />
                  Enregistrer
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal de saisie des notes */}
          <Modal
            isOpen={showNotesModal}
            onClose={() => setShowNotesModal(false)}
            title={`Saisir les notes - ${selectedEtudiant?.prenom} ${selectedEtudiant?.nom}`}
            size="6xl"
          >
            <div className="p-4 space-y-3">
              {selectedEtudiant && parametres && (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                        <p className="text-xs text-slate-600">Matricule: {selectedEtudiant.matricule}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs text-slate-600">Moyenne: </span>
                        <span className={`text-lg font-bold ${
                          calculerMoyenne(selectedEtudiant.id) >= 10 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculerMoyenne(selectedEtudiant.id) || '-'}/20
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tableau horizontal pour les notes */}
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-300">
                            Type d'évaluation
                          </th>
                          {parametres.evaluations.map(evaluation => (
                            Array.from({ length: evaluation.nombreEvaluations }).map((_, i) => (
                              <th key={`${evaluation.id}_${i+1}`} className="px-3 py-2 text-center text-xs font-semibold text-slate-700 border-r border-slate-300">
                                {typesEvaluation.find(t => t.value === evaluation.type)?.label.split(' ')[0]} {i+1}
                                <br />
                                <span className="text-xs font-normal text-slate-500">
                                  /{evaluation.noteMax} (×{evaluation.coefficient})
                                </span>
                              </th>
                            ))
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="px-3 py-3 text-sm font-medium text-slate-700 border-r border-slate-300 bg-slate-50">
                            Notes
                          </td>
                          {parametres.evaluations.map(evaluation => (
                            Array.from({ length: evaluation.nombreEvaluations }).map((_, i) => {
                              const evalId = `${evaluation.id}_${i+1}`
                              return (
                                <td key={evalId} className="px-2 py-2 border-r border-slate-300">
                                  <input
                                    type="number"
                                    value={notes[selectedEtudiant.id]?.[evalId] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      setNotes({
                                        ...notes,
                                        [selectedEtudiant.id]: {
                                          ...notes[selectedEtudiant.id],
                                          [evalId]: value
                                        }
                                      })
                                    }}
                                    min="0"
                                    max={evaluation.noteMax}
                                    step="0.25"
                                    placeholder={`/${evaluation.noteMax}`}
                                    className="w-full px-2 py-1.5 text-sm text-center border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                              )
                            })
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 -mx-4 px-4">
                    <button
                      onClick={() => setShowNotesModal(false)}
                      disabled={saving}
                      className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={saving}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                      <FontAwesomeIcon icon={faSave} />
                      Enregistrer les notes
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default NotesView
