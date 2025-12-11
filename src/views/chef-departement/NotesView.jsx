import * as XLSX from 'xlsx'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faSave, faEdit, faTrash, faSpinner, faFileExcel,
  faUpload, faPlus, faCog, faCheckCircle, faTimes, faChartLine, faDownload
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
  const [showImportModal, setShowImportModal] = useState(false)
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

  const handleSaveAll = async () => {
    if (!selectedClasse || !selectedModule || !selectedSemestre) return

    if (!window.confirm('Voulez-vous vraiment enregistrer toutes les notes affichées ?')) {
      return
    }

    try {
      setSaving(true)
      const allNotesToSave = []

      Object.entries(notes).forEach(([etudiantId, notesEtudiant]) => {
        Object.entries(notesEtudiant).forEach(([evaluationId, valeur]) => {
          if (valeur !== undefined && valeur !== '' && !isNaN(parseFloat(valeur))) {
            allNotesToSave.push({
              etudiantId,
              moduleId: selectedModule,
              classeId: selectedClasse,
              semestre: selectedSemestre,
              evaluationId,
              valeur: parseFloat(valeur),
              anneeAcademique: '2024-2025'
            })
          }
        })
      })

      if (allNotesToSave.length === 0) {
        showAlert('Aucune note à enregistrer', 'warning')
        setSaving(false)
        return
      }

      const result = await saveNotes(allNotesToSave)

      if (result.success) {
        showAlert('Toutes les notes ont été enregistrées avec succès', 'success')
        loadEtudiantsAndNotes()
      } else {
        showAlert(result.error || 'Erreur lors de la sauvegarde globale', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la sauvegarde globale', 'error')
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

  // Gestion de l'import Excel
  const handleImportClick = () => {
    if (!selectedClasse || !selectedModule || !selectedSemestre) {
      showAlert('Veuillez d\'abord sélectionner une classe, un module et un semestre', 'warning')
      return
    }
    if (!parametres) {
      showAlert('Veuillez d\'abord configurer les paramètres de notation', 'warning')
      return
    }
    setShowImportModal(true)
  }

  const handleDownloadTemplate = () => {
    if (!etudiants.length || !parametres) return

    // 1. Préparer les en-têtes
    const headers = ['Matricule', 'Nom', 'Prénom']
    const evalIds = []

    parametres.evaluations.forEach(evaluation => {
      const typeLabel = typesEvaluation.find(t => t.value === evaluation.type)?.label || evaluation.type
      for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
        headers.push(`${typeLabel} ${i} (/${evaluation.noteMax})`)
        evalIds.push(`${evaluation.id}_${i}`) // Stocker l'ID pour le mapping inverse si besoin
      }
    })

    // 2. Préparer les données
    const data = etudiants.map(etudiant => {
      const row = {
        'Matricule': etudiant.matricule,
        'Nom': etudiant.nom,
        'Prénom': etudiant.prenom
      }
      // Initialiser les colonnes de notes à vide
      headers.slice(3).forEach(h => row[h] = '')
      return row
    })

    // 3. Créer le workbook
    const ws = XLSX.utils.json_to_sheet(data, { header: headers })

    // Ajuster la largeur des colonnes
    const wscols = [
      { wch: 15 }, // Matricule
      { wch: 20 }, // Nom
      { wch: 20 }, // Prénom
      ...headers.slice(3).map(() => ({ wch: 15 })) // Colonnes de notes
    ]
    ws['!cols'] = wscols

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Notes")

    // 4. Télécharger
    XLSX.writeFile(wb, `Notes_${classes.find(c => c.id === selectedClasse)?.nom}_${selectedModule}_${selectedSemestre}.xlsx`)
  }

  const processExcelData = (jsonData) => {
    const newNotes = { ...notes }
    let count = 0
    let errors = []
    let skipped = 0

    // Debug: Voir les colonnes du fichier importé
    if (jsonData.length > 0) {
      console.log('📊 Colonnes trouvées dans le fichier:', Object.keys(jsonData[0]))
      console.log('📊 Nombre de lignes:', jsonData.length)
    }

    // Construire la liste ordonnée des évaluations attendues
    const evaluationsAttendues = []
    parametres.evaluations.forEach(evaluation => {
      const typeLabel = typesEvaluation.find(t => t.value === evaluation.type)?.label || evaluation.type
      for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
        const headerName = `${typeLabel} ${i} (/${evaluation.noteMax})`
        evaluationsAttendues.push({
          headerName,
          id: `${evaluation.id}_${i}`,
          max: evaluation.noteMax,
          type: evaluation.type,
          typeLabel,
          numero: i,
          normalized: headerName.toLowerCase().replace(/\s+/g, ' ').trim(),
          variants: [
            headerName.toLowerCase().replace(/\s+/g, ' ').trim(),
            `${typeLabel} ${i}`.toLowerCase().replace(/\s+/g, ' ').trim(),
            `${typeLabel.toLowerCase()} ${i}`.trim(),
            `${evaluation.type} ${i}`.toLowerCase().trim()
          ]
        })
      }
    })

    console.log('📋 Évaluations attendues:', evaluationsAttendues.map(e => e.headerName))
    console.log('📋 Nombre d\'évaluations attendues:', evaluationsAttendues.length)

    // Créer un mapping des colonnes Excel (en tenant compte de l'ordre)
    // Identifier les colonnes de notes (après Matricule, Nom, Prénom)
    const firstRow = jsonData[0] || {}
    const allColumns = Object.keys(firstRow)
    const noteColumns = allColumns.filter(col => {
      const colLower = col.toLowerCase().trim()
      return colLower !== 'matricule' && colLower !== 'nom' && colLower !== 'prenom' && 
             colLower !== 'prénom' && colLower !== 'matricule ' && colLower !== 'nom ' && colLower !== 'prenom '
    })
    
    console.log('📊 Colonnes de notes trouvées dans Excel:', noteColumns)
    console.log('📊 Nombre de colonnes de notes:', noteColumns.length)

    jsonData.forEach((row, index) => {
      // Set pour suivre les colonnes déjà utilisées pour cette ligne
      const usedColumns = new Set()
      // Recherche flexible du matricule (parfois "Matricule " avec espace)
      const matriculeKey = Object.keys(row).find(k => 
        k.trim().toLowerCase() === 'matricule' || 
        k.trim().toLowerCase().includes('matricule')
      )
      const matricule = matriculeKey ? String(row[matriculeKey]).trim() : null

      if (!matricule || matricule === '') {
        skipped++
        return
      }

      const etudiant = etudiants.find(e => String(e.matricule).trim() == String(matricule).trim())
      if (!etudiant) {
        errors.push(`Ligne ${index + 2}: Étudiant avec matricule ${matricule} non trouvé`)
        skipped++
        return
      }

      if (!newNotes[etudiant.id]) newNotes[etudiant.id] = {}

      // Mapper les colonnes Excel aux évaluations attendues par ordre
      // Utiliser l'ordre des colonnes pour éviter les conflits avec les noms dupliqués
      evaluationsAttendues.forEach((expectedEval, evalIndex) => {
        let rowKey = null
        let matchedColumnIndex = -1

        // Stratégie 1: Correspondance par position (si le nombre de colonnes correspond)
        // C'est la méthode la plus fiable quand les colonnes sont dans le bon ordre
        if (noteColumns.length === evaluationsAttendues.length) {
          if (evalIndex < noteColumns.length && !usedColumns.has(evalIndex)) {
            rowKey = noteColumns[evalIndex]
            matchedColumnIndex = evalIndex
            usedColumns.add(matchedColumnIndex)
            console.log(`📍 Mapping par position: ${expectedEval.headerName} -> ${rowKey} (index ${evalIndex})`)
          }
        }

        // Stratégie 2: Si pas de mapping par position, chercher par nom
        if (!rowKey) {
          // Chercher toutes les colonnes qui correspondent au nom
          const matchingColumns = noteColumns
            .map((col, colIndex) => {
              if (usedColumns.has(colIndex)) return null // Ignorer les colonnes déjà utilisées
              
              const colNormalized = col.toLowerCase().replace(/\s+/g, ' ').trim()
              // Correspondance exacte
              if (colNormalized === expectedEval.normalized || col.trim() === expectedEval.headerName.trim()) {
                return { col, colIndex, score: 100 }
              }
              // Correspondance avec variantes
              const variantMatch = expectedEval.variants.findIndex(v => 
                colNormalized.includes(v) || v.includes(colNormalized)
              )
              if (variantMatch >= 0) {
                return { col, colIndex, score: 80 - variantMatch * 10 }
              }
              // Correspondance partielle par type et numéro
              if (colNormalized.includes(expectedEval.typeLabel.toLowerCase()) && 
                  colNormalized.includes(String(expectedEval.numero))) {
                return { col, colIndex, score: 50 }
              }
              return null
            })
            .filter(Boolean)
            .sort((a, b) => {
              // Trier par score, puis par proximité de la position attendue
              if (b.score !== a.score) return b.score - a.score
              return Math.abs(a.colIndex - evalIndex) - Math.abs(b.colIndex - evalIndex)
            })

          // Prendre la meilleure correspondance
          if (matchingColumns.length > 0) {
            const bestMatch = matchingColumns[0]
            rowKey = bestMatch.col
            matchedColumnIndex = bestMatch.colIndex
            usedColumns.add(matchedColumnIndex)
            console.log(`🔍 Mapping par nom: ${expectedEval.headerName} -> ${rowKey} (index ${matchedColumnIndex}, score: ${bestMatch.score})`)
          }
        }

        if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
          const val = row[rowKey]
          const numVal = parseFloat(val)

          if (isNaN(numVal)) {
            errors.push(`Ligne ${index + 2}: Note invalide pour ${expectedEval.headerName} (${etudiant.nom}): "${val}"`)
          } else if (numVal < 0) {
            errors.push(`Ligne ${index + 2}: Note négative pour ${expectedEval.headerName} (${etudiant.nom}): ${numVal}`)
          } else if (numVal > expectedEval.max) {
            // Note hors limites : on l'importe quand même mais on ajuste à la limite max
            console.log(`⚠️ Note hors limites pour ${etudiant.nom} - ${expectedEval.headerName}: ${numVal} > ${expectedEval.max}, ajustée à ${expectedEval.max}`)
            newNotes[etudiant.id][expectedEval.id] = expectedEval.max
            count++
            errors.push(`Ligne ${index + 2}: Note ${numVal} ajustée à ${expectedEval.max} (max) pour ${expectedEval.headerName} (${etudiant.nom})`)
          } else {
            console.log(`✅ Import: ${etudiant.nom} - ${expectedEval.headerName} (${expectedEval.id}) = ${numVal}`)
            newNotes[etudiant.id][expectedEval.id] = numVal
            count++
          }
        } else {
          // Colonne non trouvée - message d'erreur clair
          const colonnesDisponibles = noteColumns.filter(col => 
            col.toLowerCase().includes(expectedEval.typeLabel.toLowerCase()) ||
            col.toLowerCase().includes(expectedEval.type.toLowerCase())
          )
          
          if (colonnesDisponibles.length > 0) {
            errors.push(`Ligne ${index + 2}: Colonne "${expectedEval.headerName}" non trouvée pour ${etudiant.nom}. Colonnes similaires trouvées: ${colonnesDisponibles.slice(0, 3).join(', ')}`)
          } else {
            errors.push(`Ligne ${index + 2}: Le nom de la colonne "${expectedEval.headerName}" ne correspond pas aux colonnes du système pour ${etudiant.nom}. Vérifiez que le nom de la colonne dans Excel correspond exactement à celui du template.`)
          }
          console.log(`ℹ️ Colonne "${expectedEval.headerName}" non trouvée pour ${etudiant.nom} (ligne ${index + 2})`)
        }
      })
    })

    console.log(`📊 Import terminé: ${count} notes importées, ${errors.length} erreurs, ${skipped} lignes ignorées`)

    // Afficher un message résumé avec des messages d'erreur clairs
    if (errors.length > 0) {
      // Grouper les erreurs par type pour un message plus clair
      const erreursColonnes = errors.filter(e => e.includes('ne correspond pas') || e.includes('non trouvée'))
      const autresErreurs = errors.filter(e => !e.includes('ne correspond pas') && !e.includes('non trouvée'))
      
      let errorMessage = ''
      
      if (erreursColonnes.length > 0) {
        errorMessage += `⚠️ PROBLÈME DE CORRESPONDANCE DES COLONNES\n\n`
        errorMessage += `Les noms des colonnes dans votre fichier Excel ne correspondent pas exactement aux noms attendus par le système.\n\n`
        errorMessage += `📋 Colonnes attendues par le système :\n`
        evaluationsAttendues.forEach((e, idx) => {
          errorMessage += `${idx + 1}. ${e.headerName}\n`
        })
        errorMessage += `\n📊 Colonnes trouvées dans votre fichier :\n`
        noteColumns.forEach((c, idx) => {
          errorMessage += `${idx + 1}. ${c}\n`
        })
        errorMessage += `\n💡 SOLUTION :\n`
        errorMessage += `Téléchargez le template Excel depuis le système (bouton "Télécharger Template") et utilisez-le comme base. Ne modifiez pas les noms des colonnes.\n\n`
      }
      
      if (autresErreurs.length > 0) {
        errorMessage += `⚠️ AUTRES ERREURS :\n`
        autresErreurs.slice(0, 5).forEach(err => {
          errorMessage += `• ${err}\n`
        })
        if (autresErreurs.length > 5) {
          errorMessage += `... et ${autresErreurs.length - 5} autre(s) erreur(s)\n`
        }
      }
      
      showAlert(
        `Import effectué : ${count} notes importées avec ${errors.length} problème(s)\n\n${errorMessage}`,
        'warning'
      )
    } else if (count > 0) {
      showAlert(`${count} notes importées avec succès pour ${jsonData.length} étudiants`, 'success')
    } else {
      showAlert(
        `Aucune note valide trouvée dans le fichier.\n\n` +
        `Vérifiez que :\n` +
        `- Les noms des colonnes correspondent exactement au template\n` +
        `- Les notes sont des nombres valides\n` +
        `- Les matricules des étudiants sont corrects`,
        'warning'
      )
    }

    setNotes(newNotes)
    setShowImportModal(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        processExcelData(data)
      } catch (error) {
        console.error('Erreur lecture Excel:', error)
        showAlert('Erreur lors de la lecture du fichier Excel', 'error')
      }
    }
    reader.readAsBinaryString(file)
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
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={handleSaveAll}
                disabled={saving || !selectedClasse}
              >
                <FontAwesomeIcon icon={faSave} />
                Tout Enregistrer
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                onClick={handleImportClick}
              >
                <FontAwesomeIcon icon={faUpload} />
                Importer Excel
              </button>
            </div>
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
                              <th key={`${evaluation.id}_${i + 1}`} className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                                {typesEvaluation.find(t => t.value === evaluation.type)?.label.substring(0, 10)} {i + 1}
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
                                    const evalId = `${evaluation.id}_${i + 1}`
                                    const note = notes[etudiant.id]?.[evalId]
                                    const noteSur20 = note ? (parseFloat(note) / evaluation.noteMax) * 20 : null
                                    return (
                                      <td key={`${etudiant.id}_${evalId}`} className="px-4 py-3 text-center">
                                        {note !== undefined && note !== null && note !== '' ? (
                                          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${noteSur20 >= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                                    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${parseFloat(moyenne) >= 10 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
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
                        <span className={`text-lg font-bold ${calculerMoyenne(selectedEtudiant.id) >= 10 ? 'text-green-600' : 'text-red-600'
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
                              <th key={`${evaluation.id}_${i + 1}`} className="px-3 py-2 text-center text-xs font-semibold text-slate-700 border-r border-slate-300">
                                {typesEvaluation.find(t => t.value === evaluation.type)?.label.split(' ')[0]} {i + 1}
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
                              const evalId = `${evaluation.id}_${i + 1}`
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

          {/* Modal d'import Excel */}
          <Modal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            title="Importer des notes depuis Excel"
            size="2xl"
          >
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faDownload} />
                  Étape 1 : Télécharger le modèle
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                  Téléchargez le fichier Excel modèle contenant la liste des étudiants de cette classe.
                  Ce fichier inclut automatiquement les colonnes pour les évaluations configurées.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faFileExcel} />
                  Télécharger le modèle Excel
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUpload} />
                  Étape 2 : Remplir et Importer
                </h4>
                <p className="text-sm text-purple-800 mb-4">
                  Remplissez les notes dans le fichier téléchargé (sans modifier les matricules) puis importez-le ici.
                  Seules les notes valides seront importées.
                </p>
                <div className="relative border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:bg-purple-100 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-purple-400 mb-2 group-hover:text-purple-600 transition-colors" />
                  <p className="text-purple-900 font-medium">Cliquez ou glissez le fichier ici</p>
                  <p className="text-xs text-purple-600 mt-1">Formats acceptés : .xlsx, .xls</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Fermer
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
