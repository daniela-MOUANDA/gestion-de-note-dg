import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, 
  faArrowLeft, 
  faGraduationCap,
  faUserGraduate,
  faCalendarAlt,
  faChalkboardTeacher,
  faPlus,
  faSearch,
  faFileExcel,
  faUpload,
  faTimes,
  faEdit,
  faTrash,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const GererClassesView = () => {
  const { showAlert } = useAlert()
  const [selectedFiliere, setSelectedFiliere] = useState(null)
  const [selectedClasse, setSelectedClasse] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('Tous')
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newClass, setNewClass] = useState({ code: '', niveau: 'L1' })
  const [editingClass, setEditingClass] = useState(null)
  const [classToDelete, setClassToDelete] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [logoBase64, setLogoBase64] = useState('')

  // Charger le logo en Base64
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/images/logo.png')
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoBase64(reader.result)
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Erreur lors du chargement du logo:', error)
      }
    }
    loadLogo()
  }, [])

  // Fonction helper pour obtenir les classes de couleur
  const getColorClasses = (couleur) => {
    const colors = {
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      },
      indigo: {
        border: 'border-indigo-500',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        badge: 'bg-indigo-100 text-indigo-700'
      }
    }
    return colors[couleur] || colors.blue
  }

  // Données des filières
  const filieres = [
    {
      code: 'GI',
      nom: 'Génie Informatique',
      totalClasses: 8,
      totalEtudiants: 360,
      couleur: 'blue'
    },
    {
      code: 'RT',
      nom: 'Réseau et Télécom',
      totalClasses: 6,
      totalEtudiants: 240,
      couleur: 'indigo'
    }
  ]

  // Données des classes par filière (état initial)
  const [classesData, setClassesData] = useState({
    'GI': [
      { id: 1, code: 'GI-L3-A', niveau: 'L3', effectif: 45, enseignants: 3, modules: 8 },
      { id: 2, code: 'GI-L3-B', niveau: 'L3', effectif: 42, enseignants: 3, modules: 8 },
      { id: 3, code: 'GI-L2-A', niveau: 'L2', effectif: 48, enseignants: 4, modules: 7 },
      { id: 4, code: 'GI-L2-B', niveau: 'L2', effectif: 40, enseignants: 4, modules: 7 },
      { id: 5, code: 'GI-L1-A', niveau: 'L1', effectif: 50, enseignants: 5, modules: 6 },
      { id: 6, code: 'GI-L1-B', niveau: 'L1', effectif: 48, enseignants: 5, modules: 6 },
      { id: 7, code: 'GI-L1-C', niveau: 'L1', effectif: 45, enseignants: 5, modules: 6 },
      { id: 8, code: 'GI-L1-D', niveau: 'L1', effectif: 42, enseignants: 5, modules: 6 }
    ],
    'RT': [
      { id: 1, code: 'RT-L3-A', niveau: 'L3', effectif: 38, enseignants: 3, modules: 8 },
      { id: 2, code: 'RT-L3-B', niveau: 'L3', effectif: 40, enseignants: 3, modules: 8 },
      { id: 3, code: 'RT-L2-A', niveau: 'L2', effectif: 42, enseignants: 3, modules: 7 },
      { id: 4, code: 'RT-L2-B', niveau: 'L2', effectif: 38, enseignants: 3, modules: 7 },
      { id: 5, code: 'RT-L1-A', niveau: 'L1', effectif: 45, enseignants: 4, modules: 6 },
      { id: 6, code: 'RT-L1-B', niveau: 'L1', effectif: 37, enseignants: 4, modules: 6 }
    ]
  })

  // Données des étudiants par classe (exemple)
  const [etudiantsData, setEtudiantsData] = useState({
    1: [
      { id: 1, matricule: '1045937', nom: 'MBO', prenom: 'Lidvige', moyenne: 14.5 },
      { id: 2, matricule: '1045938', nom: 'DUPONT', prenom: 'Jean', moyenne: 15.2 },
      { id: 3, matricule: '1045939', nom: 'MARTIN', prenom: 'Marie', moyenne: 13.8 }
    ]
  })

  const totalClasses = filieres.reduce((sum, f) => sum + f.totalClasses, 0)
  const totalEtudiants = filieres.reduce((sum, f) => sum + f.totalEtudiants, 0)

  const handleFiliereClick = (filiere) => {
    setSelectedFiliere(filiere)
    setSelectedClasse(null)
    setSelectedNiveau('Tous')
  }

  const handleClasseClick = (classe) => {
    setSelectedClasse(classe)
  }

  const handleBack = () => {
    if (selectedClasse) {
      setSelectedClasse(null)
    } else if (selectedFiliere) {
      setSelectedFiliere(null)
      setSearchQuery('')
      setSelectedNiveau('Tous')
    }
  }

  // Validation du code de classe selon la filière
  const validateClassCode = (code, filiereCode) => {
    const upperCode = code.toUpperCase()
    return upperCode.startsWith(filiereCode + '-')
  }

  const handleAddClass = () => {
    if (!newClass.code || !selectedFiliere) return

    // Validation du code
    if (!validateClassCode(newClass.code, selectedFiliere.code)) {
      showAlert(`Le code de la classe doit commencer par "${selectedFiliere.code}-" (ex: ${selectedFiliere.code}-L1-A)`, 'error')
      return
    }

    const newClassData = {
      id: Date.now(),
      code: newClass.code.toUpperCase(),
      niveau: newClass.niveau,
      effectif: 0,
      enseignants: 0,
      modules: newClass.niveau === 'L1' ? 6 : newClass.niveau === 'L2' ? 7 : 8
    }

    setClassesData(prev => ({
      ...prev,
      [selectedFiliere.code]: [...(prev[selectedFiliere.code] || []), newClassData]
    }))

    setNewClass({ code: '', niveau: 'L1' })
    setShowAddClassModal(false)
    showAlert('Classe créée avec succès !', 'success')
  }

  const handleEditClass = (classe, e) => {
    e.stopPropagation() // Empêcher le clic sur la carte
    setEditingClass({ ...classe })
    setShowEditClassModal(true)
  }

  const handleUpdateClass = () => {
    if (!editingClass || !selectedFiliere) return

    // Validation du code
    if (!validateClassCode(editingClass.code, selectedFiliere.code)) {
      showAlert(`Le code de la classe doit commencer par "${selectedFiliere.code}-" (ex: ${selectedFiliere.code}-L1-A)`, 'error')
      return
    }

    setClassesData(prev => ({
      ...prev,
      [selectedFiliere.code]: prev[selectedFiliere.code].map(classe =>
        classe.id === editingClass.id
          ? {
              ...classe,
              code: editingClass.code.toUpperCase(),
              niveau: editingClass.niveau,
              modules: editingClass.niveau === 'L1' ? 6 : editingClass.niveau === 'L2' ? 7 : 8
            }
          : classe
      )
    }))

    setEditingClass(null)
    setShowEditClassModal(false)
    showAlert('Classe modifiée avec succès !', 'success')
  }

  const handleDeleteClass = (classe, e) => {
    e.stopPropagation() // Empêcher le clic sur la carte
    setClassToDelete(classe)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteClass = () => {
    if (!classToDelete || !selectedFiliere) return

    setClassesData(prev => ({
      ...prev,
      [selectedFiliere.code]: prev[selectedFiliere.code].filter(classe => classe.id !== classToDelete.id)
    }))

    // Supprimer aussi les étudiants de cette classe
    setEtudiantsData(prev => {
      const newData = { ...prev }
      delete newData[classToDelete.id]
      return newData
    })

    setClassToDelete(null)
    setShowDeleteConfirm(false)
    showAlert('Classe supprimée avec succès !', 'success')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file)
      } else {
        showAlert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)', 'error')
      }
    }
  }

  const handleImportStudents = async () => {
    if (!selectedFile || !selectedClasse) {
      showAlert('Veuillez sélectionner un fichier Excel', 'error')
      return
    }

    setIsUploading(true)
    
    // Simulation de l'import
    setTimeout(() => {
      // Simuler l'ajout d'étudiants depuis Excel
      const newStudents = [
        { id: Date.now() + 1, matricule: '1045940', nom: 'DURAND', prenom: 'Pierre', moyenne: 14.0 },
        { id: Date.now() + 2, matricule: '1045941', nom: 'BERNARD', prenom: 'Sophie', moyenne: 16.5 }
      ]

      setEtudiantsData(prev => ({
        ...prev,
        [selectedClasse.id]: [...(prev[selectedClasse.id] || []), ...newStudents]
      }))

      // Mettre à jour l'effectif de la classe
      setClassesData(prev => ({
        ...prev,
        [selectedFiliere.code]: prev[selectedFiliere.code].map(classe =>
          classe.id === selectedClasse.id
            ? { ...classe, effectif: classe.effectif + newStudents.length }
            : classe
        )
      }))

      setIsUploading(false)
      setSelectedFile(null)
      setShowImportModal(false)
      showAlert(`${newStudents.length} étudiants importés avec succès !`, 'success')
    }, 2000)
  }

  // Fonction de téléchargement PDF de la liste des étudiants
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Fonction pour dessiner l'en-tête (logo + infos école)
      const drawHeader = (isFirstPage = false) => {
        if (!isFirstPage) return

        // Logo
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25)
        }

        // Informations de l'école
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('RÉPUBLIQUE GABONAISE', pageWidth / 2, 15, { align: 'center' })
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('Union - Travail - Justice', pageWidth / 2, 20, { align: 'center' })
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Institut National de la Poste des Technologies', pageWidth / 2, 27, { align: 'center' })
        doc.text('de l\'Information et de la Communication (INPTIC)', pageWidth / 2, 32, { align: 'center' })

        // Titre du document
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`LISTE DES ÉTUDIANTS`, pageWidth / 2, 45, { align: 'center' })
        
        doc.setFontSize(12)
        doc.text(`${selectedClasse} - ${filiere.nom}`, pageWidth / 2, 52, { align: 'center' })
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Année académique 2024-2025`, pageWidth / 2, 58, { align: 'center' })
      }

      // Préparer les données du tableau
      const tableData = etudiants.map((etudiant, index) => [
        index + 1,
        etudiant.matricule,
        etudiant.nom,
        etudiant.prenom,
        etudiant.civilite === 'M' ? 'Masculin' : 'Féminin'
      ])

      // Générer le tableau
      let firstPage = true
      autoTable(doc, {
        head: [['N°', 'Matricule', 'Nom', 'Prénom', 'Sexe']],
        body: tableData,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 40, halign: 'left' },
          3: { cellWidth: 40, halign: 'left' },
          4: { cellWidth: 35, halign: 'center' }
        },
        didDrawPage: (data) => {
          // Dessiner l'en-tête seulement sur la première page
          if (firstPage) {
            drawHeader(true)
            firstPage = false
          }

          // Ajouter le pied de page seulement sur la dernière page
          const isLastPage = data.pageNumber === doc.internal.getNumberOfPages()
          if (isLastPage) {
            const finalY = data.cursor.y + 20
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Le Chef de Département', pageWidth - 50, finalY, { align: 'left' })
          }
        },
        margin: { top: 65, left: 14, right: 14 }
      })

      // Sauvegarder le PDF
      doc.save(`Liste_Etudiants_${selectedClasse}_${new Date().toISOString().split('T')[0]}.pdf`)
      showAlert('PDF téléchargé avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      showAlert('Erreur lors de la génération du PDF', 'error')
    }
  }

  // Vue principale : Cartes des filières
  if (!selectedFiliere && !selectedClasse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les classes
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Gérez les classes de votre département
              </p>
            </div>

            {/* Carte statistique globale */}
            <div className="bg-white rounded-lg border-l-4 border-slate-500 shadow-sm p-5 mb-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Nombre total de classes</p>
                  <p className="text-3xl font-bold text-slate-800">{totalClasses}</p>
                  <p className="text-xs text-slate-500 mt-2">Total étudiants: {totalEtudiants}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faUsers} className="text-slate-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Cartes des filières */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filieres.map((filiere) => {
                const colorClasses = getColorClasses(filiere.couleur)
                return (
                  <div
                    key={filiere.code}
                    onClick={() => handleFiliereClick(filiere)}
                    className={`bg-white rounded-lg border-l-4 ${colorClasses.border} shadow-sm p-5 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{filiere.nom}</h3>
                        <p className="text-xs text-slate-500">{filiere.code}</p>
                      </div>
                      <div className={`${colorClasses.bg} rounded-lg p-3`}>
                        <FontAwesomeIcon 
                          icon={faGraduationCap} 
                          className={`${colorClasses.text} text-xl`} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Classes</p>
                        <p className="text-2xl font-bold text-slate-800">{filiere.totalClasses}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Étudiants</p>
                        <p className="text-2xl font-bold text-slate-800">{filiere.totalEtudiants}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 flex items-center">
                        <span className="text-blue-600 font-medium">Cliquez pour voir les classes →</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue des classes d'une filière
  if (selectedFiliere && !selectedClasse) {
    const allClasses = classesData[selectedFiliere.code] || []
    const filteredClasses = allClasses.filter(classe => {
      const matchesSearch = classe.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classe.niveau.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesNiveau = selectedNiveau === 'Tous' || classe.niveau === selectedNiveau
      return matchesSearch && matchesNiveau
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour
              </button>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    Classes - {selectedFiliere.nom}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    {allClasses.length} {allClasses.length > 1 ? 'classes' : 'classe'} • {selectedFiliere.totalEtudiants} étudiants
                  </p>
                </div>
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Ajouter une classe
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher une classe par code ou niveau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            {/* Grille des classes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClasses.map((classe) => {
                const colorClasses = getColorClasses(selectedFiliere.couleur)
                return (
                  <div
                    key={classe.id}
                    onClick={() => handleClasseClick(classe)}
                    className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all transform hover:-translate-y-1 relative cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{classe.code}</h3>
                        <span className={`inline-block px-2 py-1 text-xs font-medium ${colorClasses.badge} rounded-full`}>
                          {classe.niveau}
                        </span>
                      </div>
                      <div className={`${colorClasses.bg} rounded-lg p-3`}>
                        <FontAwesomeIcon 
                          icon={faUsers} 
                          className={`${colorClasses.text} text-xl`} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Effectif</p>
                        <p className="text-lg font-bold text-slate-800">{classe.effectif}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Enseignants</p>
                        <p className="text-lg font-bold text-slate-800">{classe.enseignants}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Modules</p>
                        <p className="text-lg font-bold text-slate-800">{classe.modules}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">
                        Cliquez pour voir les détails →
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEditClass(classe, e)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClass(classe, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal de modification de classe */}
            {showEditClassModal && editingClass && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
                  <button
                    onClick={() => {
                      setShowEditClassModal(false)
                      setEditingClass(null)
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Modifier la classe</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Code de la classe
                      </label>
                      <input
                        type="text"
                        value={editingClass.code}
                        onChange={(e) => setEditingClass({ ...editingClass, code: e.target.value })}
                        placeholder={`Ex: ${selectedFiliere?.code}-L1-E`}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Le code doit commencer par <strong>{selectedFiliere?.code}-</strong>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Niveau
                      </label>
                      <select
                        value={editingClass.niveau}
                        onChange={(e) => setEditingClass({ ...editingClass, niveau: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowEditClassModal(false)
                          setEditingClass(null)
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleUpdateClass}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && classToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setClassToDelete(null)
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faTrash} className="text-red-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Supprimer la classe</h2>
                    <p className="text-slate-600">
                      Êtes-vous sûr de vouloir supprimer la classe <strong>{classToDelete.code}</strong> ?
                    </p>
                    {classToDelete.effectif > 0 && (
                      <p className="text-red-600 text-sm mt-2">
                        ⚠️ Cette classe contient {classToDelete.effectif} étudiant{classToDelete.effectif > 1 ? 's' : ''}. 
                        Tous les étudiants seront également supprimés.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setClassToDelete(null)
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmDeleteClass}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal d'ajout de classe */}
            {showAddClassModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
                  <button
                    onClick={() => {
                      setShowAddClassModal(false)
                      setNewClass({ code: '', niveau: 'L1' })
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Ajouter une classe</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Code de la classe
                      </label>
                      <input
                        type="text"
                        value={newClass.code}
                        onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                        placeholder={`Ex: ${selectedFiliere?.code}-L1-E`}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Le code doit commencer par <strong>{selectedFiliere?.code}-</strong>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Niveau
                      </label>
                      <select
                        value={newClass.niveau}
                        onChange={(e) => setNewClass({ ...newClass, niveau: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowAddClassModal(false)
                          setNewClass({ code: '', niveau: 'L1' })
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddClass}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue détaillée d'une classe
  if (selectedClasse) {
    const etudiants = etudiantsData[selectedClasse.id] || []
    const filiere = selectedFiliere

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Retour aux classes
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {selectedClasse.code}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {filiere.nom} • {selectedClasse.niveau}
              </p>
            </div>

            {/* Statistiques de la classe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
              <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Effectif</p>
                    <p className="text-3xl font-bold text-slate-800">{selectedClasse.effectif}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <FontAwesomeIcon icon={faUserGraduate} className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Enseignants</p>
                    <p className="text-3xl font-bold text-slate-800">{selectedClasse.enseignants}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="text-indigo-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-purple-500 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Modules</p>
                    <p className="text-3xl font-bold text-slate-800">{selectedClasse.modules}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des étudiants */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Liste des étudiants</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Télécharger PDF
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                    Importer via Excel
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Matricule</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prénom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {etudiants.length > 0 ? (
                      etudiants.map((etudiant) => (
                        <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                            {etudiant.matricule}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{etudiant.nom}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{etudiant.prenom}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              {etudiant.moyenne}/20
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                          Aucun étudiant trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal d'import Excel */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setSelectedFile(null)
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Importer des étudiants</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fichier Excel (.xlsx ou .xls)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-input"
                        />
                        <label htmlFor="file-input" className="cursor-pointer">
                          <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-slate-400 mb-3" />
                          <p className="text-sm text-slate-600 mb-2">
                            {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
                          </p>
                          <p className="text-xs text-slate-500">Format accepté: .xlsx, .xls</p>
                        </label>
                      </div>
                    </div>
                    {selectedFile && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Fichier sélectionné:</strong> {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Taille: {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowImportModal(false)
                          setSelectedFile(null)
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleImportStudents}
                        disabled={!selectedFile || isUploading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center"
                      >
                        {isUploading ? (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="mr-2 animate-spin" />
                            Import en cours...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="mr-2" />
                            Importer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }
}

export default GererClassesView
