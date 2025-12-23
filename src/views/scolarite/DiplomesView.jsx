import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faAward, faArrowLeft, faCalendar, faGraduationCap, faCheckCircle,
  faDownload, faCheck, faMedal
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'

const DiplomesView = () => {
  const location = useLocation()
  
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedTypeDiplome, setSelectedTypeDiplome] = useState('') // 'DTS' ou 'Licence'
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [diplomesRecuperes, setDiplomesRecuperes] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)

  const promotions = [
    { id: '2023-2024', nom: '2023-2024', nbDiplomes: 145 },
    { id: '2022-2023', nom: '2022-2023', nbDiplomes: 138 },
    { id: '2021-2022', nom: '2021-2022', nbDiplomes: 142 },
    { id: '2020-2021', nom: '2020-2021', nbDiplomes: 135 }
  ]

  const filieres = [
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'MTIC', nom: 'Métiers des TIC' },
    { id: 'AV', nom: 'Audiovisuel' }
  ]

  const niveaux = ['L1', 'L2', 'L3']

  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 10 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 8 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 7 }
    ]
  }

  // Données d'exemple pour les diplômés
  const getDiplomes = (typeDiplome, filiere, classe) => {
    const annee = selectedPromotion.split('-')[0]
    return [
      { 
        id: 1, 
        nom: 'MBADINGA', 
        prenom: 'Paul', 
        matricule: `${filiere}${annee}-${typeDiplome}-001`,
        moyenne: 14.5,
        mention: 'Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-001`
      },
      { 
        id: 2, 
        nom: 'OBIANG', 
        prenom: 'Sophie', 
        matricule: `${filiere}${annee}-${typeDiplome}-002`,
        moyenne: 16.2,
        mention: 'Très Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-002`
      },
      { 
        id: 3, 
        nom: 'NZAMBA', 
        prenom: 'Jean', 
        matricule: `${filiere}${annee}-${typeDiplome}-003`,
        moyenne: 13.1,
        mention: 'Assez Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-003`
      },
      { 
        id: 4, 
        nom: 'ONDO', 
        prenom: 'Marie', 
        matricule: `${filiere}${annee}-${typeDiplome}-004`,
        moyenne: 15.8,
        mention: 'Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-004`
      },
      { 
        id: 5, 
        nom: 'EKOMY', 
        prenom: 'Pierre', 
        matricule: `${filiere}${annee}-${typeDiplome}-005`,
        moyenne: 12.3,
        mention: 'Passable',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-005`
      },
      { 
        id: 6, 
        nom: 'BITEGUE', 
        prenom: 'Anne', 
        matricule: `${filiere}${annee}-${typeDiplome}-006`,
        moyenne: 17.1,
        mention: 'Très Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-006`
      },
      { 
        id: 7, 
        nom: 'MVOU', 
        prenom: 'Patrick', 
        matricule: `${filiere}${annee}-${typeDiplome}-007`,
        moyenne: 11.5,
        mention: 'Passable',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-007`
      },
      { 
        id: 8, 
        nom: 'EBANG', 
        prenom: 'Claire', 
        matricule: `${filiere}${annee}-${typeDiplome}-008`,
        moyenne: 14.9,
        mention: 'Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-008`
      },
      { 
        id: 9, 
        nom: 'NGOUA', 
        prenom: 'André', 
        matricule: `${filiere}${annee}-${typeDiplome}-009`,
        moyenne: 13.7,
        mention: 'Assez Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-009`
      },
      { 
        id: 10, 
        nom: 'MABIKA', 
        prenom: 'Laure', 
        matricule: `${filiere}${annee}-${typeDiplome}-010`,
        moyenne: 15.2,
        mention: 'Bien',
        dateObtention: '2024-07-15',
        numeroDiplome: `${typeDiplome}-${annee}-${filiere}-010`
      }
    ]
  }

  const handleBack = () => {
    if (selectedClasse) setSelectedClasse('')
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedTypeDiplome) setSelectedTypeDiplome('')
    else if (selectedPromotion) setSelectedPromotion('')
  }

  const handleMarquerRecupere = (etudiant) => {
    setSelectedEtudiant(etudiant)
    setShowConfirm(true)
  }

  const confirmerRecuperation = () => {
    const key = `${selectedPromotion}-${selectedTypeDiplome}-${selectedFiliere}-${selectedClasse}-${selectedEtudiant.id}`
    setDiplomesRecuperes({ ...diplomesRecuperes, [key]: true })
    setShowConfirm(false)
    setSelectedEtudiant(null)
  }

  const isDiplomeRecupere = (etudiantId) => {
    const key = `${selectedPromotion}-${selectedTypeDiplome}-${selectedFiliere}-${selectedClasse}-${etudiantId}`
    return diplomesRecuperes[key] || false
  }

  // Vue 1: Sélection de la promotion
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faAward} className="text-amber-600" />
                Gestion des Diplômes
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Gérez la remise des diplômes DTS et Licence aux étudiants
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Sélectionnez une promotion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {promotions.map((promo) => (
                  <button 
                    key={promo.id} 
                    onClick={() => setSelectedPromotion(promo.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 hover:shadow-lg transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200">
                        <FontAwesomeIcon icon={faCalendar} className="text-3xl text-amber-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-amber-600 mb-2">{promo.nom}</div>
                      <div className="text-xs px-3 py-1 bg-slate-100 rounded-full inline-block">
                        {promo.nbDiplomes} diplômés
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

  // Vue 2: Sélection du type de diplôme (DTS ou Licence)
  if (!selectedTypeDiplome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Diplômes - Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le type de diplôme
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button 
                onClick={() => setSelectedTypeDiplome('DTS')}
                className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                    <FontAwesomeIcon icon={faMedal} className="text-5xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">DTS</h3>
                  <p className="text-slate-600">Diplôme de Technicien Supérieur</p>
                </div>
              </button>

              <button 
                onClick={() => setSelectedTypeDiplome('Licence')}
                className="p-8 border-2 border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200">
                    <FontAwesomeIcon icon={faAward} className="text-5xl text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-amber-600 mb-2">Licence</h3>
                  <p className="text-slate-600">Diplôme de Licence Professionnelle</p>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3: Sélection de la filière
  if (!selectedFiliere) {
    const color = selectedTypeDiplome === 'DTS' ? 'blue' : 'amber'
    
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${color}-50 to-slate-50`}>
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Diplômes {selectedTypeDiplome} - Promotion {selectedPromotion}
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
                    key={filiere.id}
                    onClick={() => setSelectedFiliere(filiere.id)}
                    className={`p-6 border-2 border-slate-200 rounded-xl hover:border-${color}-500 hover:bg-${color}-50 transition-all duration-200 group`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-${color}-200`}>
                        <FontAwesomeIcon icon={faGraduationCap} className={`text-3xl text-${color}-600`} />
                      </div>
                      <div className={`text-2xl font-bold text-slate-800 group-hover:text-${color}-600 mb-2`}>{filiere.id}</div>
                      <div className="text-sm text-slate-600">{filiere.nom}</div>
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

  // Vue 4: Sélection du niveau
  if (!selectedNiveau) {
    const color = selectedTypeDiplome === 'DTS' ? 'blue' : 'amber'
    
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${color}-50 to-slate-50`}>
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Diplômes {selectedTypeDiplome} - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le niveau</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {niveaux.map((niveau) => (
                  <button 
                    key={niveau}
                    onClick={() => setSelectedNiveau(niveau)}
                    className={`p-6 border-2 border-slate-200 rounded-xl hover:border-${color}-500 hover:bg-${color}-50 transition-all duration-200 group`}>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-amber-600 mb-2">{niveau}</div>
                      <div className="text-sm text-slate-600">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
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

  // Vue 5: Sélection de la classe
  if (!selectedClasse) {
    const color = selectedTypeDiplome === 'DTS' ? 'blue' : 'amber'
    const classes = getClasses(selectedFiliere, selectedNiveau)
    
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${color}-50 to-slate-50`}>
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Diplômes {selectedTypeDiplome} - {selectedFiliere} {selectedNiveau}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la classe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {classes.map((classe) => (
                  <button 
                    key={classe.id}
                    onClick={() => setSelectedClasse(classe.id)}
                    className={`p-6 border-2 border-slate-200 rounded-xl hover:border-${color}-500 hover:bg-${color}-50 transition-all duration-200 group`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-${color}-200`}>
                        <FontAwesomeIcon icon={faGraduationCap} className={`text-3xl text-${color}-600`} />
                      </div>
                      <div className={`text-2xl font-bold text-slate-800 group-hover:text-${color}-600 mb-2`}>{classe.nom}</div>
                      <div className="text-sm text-slate-600">
                        {classe.effectif} diplômés
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

  // Vue 6: Liste des diplômes
  const diplomes = getDiplomes(selectedTypeDiplome, selectedFiliere, selectedClasse)
  const nbRecuperes = diplomes.filter(d => isDiplomeRecupere(d.id)).length
  const nbNonRecuperes = diplomes.length - nbRecuperes
  const color = selectedTypeDiplome === 'DTS' ? 'blue' : 'amber'

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${color}-50 to-slate-50`}>
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Diplômes {selectedTypeDiplome} - Classe {selectedClasse}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Promotion {selectedPromotion}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
                  <FontAwesomeIcon icon={faAward} className={`text-${color}-600 text-xl`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total diplômes</p>
                  <p className="text-2xl font-bold text-slate-800">{diplomes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Récupérés</p>
                  <p className="text-2xl font-bold text-green-600">{nbRecuperes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faAward} className="text-orange-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Non récupérés</p>
                  <p className="text-2xl font-bold text-orange-600">{nbNonRecuperes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Liste des diplômés</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">N° Diplôme</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nom et Prénom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Moyenne</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Mention</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {diplomes.map((etudiant) => {
                    const estRecupere = isDiplomeRecupere(etudiant.id)
                    return (
                      <tr 
                        key={etudiant.id}
                        className={`${estRecupere ? 'bg-slate-50 opacity-60' : 'hover:bg-amber-50'} transition-colors`}>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{etudiant.numeroDiplome}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 font-medium">{etudiant.matricule}</td>
                        <td className="px-6 py-4 text-sm text-slate-800">
                          {etudiant.prenom} {etudiant.nom}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{etudiant.moyenne.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            etudiant.moyenne >= 18 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border border-yellow-300' :
                            etudiant.moyenne >= 16 ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            etudiant.moyenne >= 14 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            etudiant.moyenne >= 12 ? 'bg-green-100 text-green-800 border border-green-200' :
                            etudiant.moyenne >= 10 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {etudiant.mention}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {estRecupere ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              <FontAwesomeIcon icon={faCheck} />
                              Récupéré
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              Non récupéré
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className={`px-3 py-1.5 bg-${color}-100 text-${color}-700 rounded-lg text-xs font-semibold hover:bg-${color}-200 transition-colors flex items-center gap-1`}>
                              <FontAwesomeIcon icon={faDownload} />
                              Télécharger
                            </button>
                            {!estRecupere && (
                              <button
                                onClick={() => handleMarquerRecupere(etudiant)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors flex items-center gap-1">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                Marquer récupéré
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <FontAwesomeIcon icon={faAward} className={`text-3xl text-${color}-600`} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmer la récupération</h3>
            </div>
            <p className="text-slate-600 mb-6 text-center">
              Confirmez-vous que <strong>{selectedEtudiant?.prenom} {selectedEtudiant?.nom}</strong> a récupéré son diplôme <strong>{selectedTypeDiplome}</strong> physiquement ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmerRecuperation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Oui, confirmer
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setSelectedEtudiant(null)
                }}
                className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiplomesView

