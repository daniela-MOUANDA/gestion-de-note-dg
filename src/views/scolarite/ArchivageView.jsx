import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArchive, faGraduationCap, faUserTimes, faArrowLeft, faCalendar,
  faSearch, faFileArchive, faAward, faUsers, faChartLine, faFileAlt, faEye
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'

const ArchivageView = () => {
  const location = useLocation()
  
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('') // 'diplomes', 'abandons', ou 'pv'
  const [selectedDiplome, setSelectedDiplome] = useState('') // 'DTS' ou 'Licence'
  const [selectedNiveauAbandon, setSelectedNiveauAbandon] = useState('') // 'L1', 'L2', 'L3'
  const [selectedNiveau, setSelectedNiveau] = useState('') // Pour les PV: 'L1', 'L2', 'L3'
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('') // Pour les PV: 'RT-1A', 'GI-2B', etc.
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmptyAlert, setShowEmptyAlert] = useState(false)
  const [emptyAlertMessage, setEmptyAlertMessage] = useState('')

  const promotions = [
    { id: '2025-2026', nom: '2025-2026', nbDiplomes: 145, nbAbandons: 23 },
    { id: '2023-2024', nom: '2023-2024', nbDiplomes: 138, nbAbandons: 19 },
    { id: '2022-2023', nom: '2022-2023', nbDiplomes: 142, nbAbandons: 21 },
    { id: '2021-2022', nom: '2021-2022', nbDiplomes: 135, nbAbandons: 18 }
  ]

  const filieres = [
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'MTIC', nom: 'Métiers des TIC' },
    { id: 'AV', nom: 'Audiovisuel' }
  ]

  // Données d'exemple pour les diplômés
  const diplomesData = {
    '2025-2026': {
      'DTS': {
        'RT': [
          { id: 1, nom: 'MBADINGA', prenom: 'Paul', matricule: 'RT2023-DTS-001', mention: 'Bien', moyenne: 14.5 },
          { id: 2, nom: 'OBIANG', prenom: 'Sophie', matricule: 'RT2023-DTS-002', mention: 'Très Bien', moyenne: 16.2 }
        ],
        'GI': [
          { id: 3, nom: 'NZAMBA', prenom: 'Jean', matricule: 'GI2023-DTS-001', mention: 'Assez Bien', moyenne: 13.1 }
        ],
        'MTIC': [],
        'AV': []
      },
      'Licence': {
        'RT': [
          { id: 4, nom: 'EKOMY', prenom: 'Marie', matricule: 'RT2022-L3-015', mention: 'Très Bien', moyenne: 15.8 }
        ],
        'GI': [
          { id: 5, nom: 'NKOGHE', prenom: 'David', matricule: 'GI2022-L3-023', mention: 'Bien', moyenne: 14.2 },
          { id: 6, nom: 'OVONO', prenom: 'Claire', matricule: 'GI2022-L3-024', mention: 'Très Bien', moyenne: 16.5 }
        ],
        'MTIC': [],
        'AV': []
      }
    },
    '2023-2024': {
      'DTS': { 'RT': [], 'GI': [], 'MTIC': [], 'AV': [] },
      'Licence': { 'RT': [], 'GI': [], 'MTIC': [], 'AV': [] }
    }
  }

  // Données d'exemple pour les abandons
  const abandonsData = {
    '2025-2026': {
      'L1': {
        'RT': [
          { id: 1, nom: 'MINTSA', prenom: 'Alain', matricule: 'RT2024-L1-045', dateAbandon: '2025-01-15', motif: 'Raisons personnelles' }
        ],
        'GI': [
          { id: 2, nom: 'KOMBILA', prenom: 'Esther', matricule: 'GI2024-L1-032', dateAbandon: '2024-12-10', motif: 'Réorientation' }
        ],
        'MTIC': [],
        'AV': []
      },
      'L2': {
        'RT': [],
        'GI': [
          { id: 3, nom: 'NDONG', prenom: 'Patrick', matricule: 'GI2023-L2-018', dateAbandon: '2025-02-20', motif: 'Difficultés financières' }
        ],
        'MTIC': [],
        'AV': []
      },
      'L3': {
        'RT': [], 'GI': [], 'MTIC': [], 'AV': []
      }
    },
    '2023-2024': {
      'L1': { 'RT': [], 'GI': [], 'MTIC': [], 'AV': [] },
      'L2': { 'RT': [], 'GI': [], 'MTIC': [], 'AV': [] },
      'L3': { 'RT': [], 'GI': [], 'MTIC': [], 'AV': [] }
    }
  }

  const handleBack = () => {
    if (selectedClasse) setSelectedClasse('')
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedNiveauAbandon) setSelectedNiveauAbandon('')
    else if (selectedDiplome) setSelectedDiplome('')
    else if (selectedCategory) setSelectedCategory('')
    else if (selectedPromotion) setSelectedPromotion('')
  }

  // Vue 1: Sélection de la promotion
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-purple-600" />
                Archivage
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Consultez les promotions passées, diplômés et abandons
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Sélectionnez une promotion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {promotions.map((promo) => (
                  <button key={promo.id} onClick={() => setSelectedPromotion(promo.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200">
                        <FontAwesomeIcon icon={faCalendar} className="text-3xl text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-purple-600 mb-3">{promo.nom}</div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-green-600" />
                          <span>{promo.nbDiplomes} diplômés</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faUserTimes} className="text-red-600" />
                          <span>{promo.nbAbandons} abandons</span>
                        </div>
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

  // Vue 2: Choix entre Diplômés et Abandons
  if (selectedPromotion && !selectedCategory) {
    const promo = promotions.find(p => p.id === selectedPromotion)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Archives - Promotion {promo?.nom}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Choisissez une catégorie à consulter
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <button onClick={() => setSelectedCategory('diplomes')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-5xl text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-green-600 mb-2">Diplômés</h3>
                  <p className="text-slate-600 mb-3">Consulter les étudiants diplômés</p>
                  <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                    {promo?.nbDiplomes} diplômés
                  </div>
                </div>
              </button>

              <button onClick={() => setSelectedCategory('abandons')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-red-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200">
                    <FontAwesomeIcon icon={faUserTimes} className="text-5xl text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-red-600 mb-2">Abandons</h3>
                  <p className="text-slate-600 mb-3">Consulter les abandons scolaires</p>
                  <div className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full font-semibold">
                    {promo?.nbAbandons} abandons
                  </div>
                </div>
              </button>

              <button onClick={() => setSelectedCategory('pv')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                    <FontAwesomeIcon icon={faFileArchive} className="text-5xl text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">PV Archivés</h3>
                  <p className="text-slate-600 mb-3">Consulter les procès-verbaux</p>
                  <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
                    60 PV disponibles
                  </div>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3a: Choix du type de diplôme (DTS ou Licence)
  if (selectedCategory === 'diplomes' && !selectedDiplome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Diplômés - Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le type de diplôme
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button onClick={() => setSelectedDiplome('DTS')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                    <FontAwesomeIcon icon={faAward} className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">DTS</h3>
                  <p className="text-slate-600">Diplôme de Technicien Supérieur</p>
                </div>
              </button>

              <button onClick={() => setSelectedDiplome('Licence')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">Licence</h3>
                  <p className="text-slate-600">Licence Professionnelle</p>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Classes par filière et niveau (pour les PV)
  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 35 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 32 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 28 }
    ]
  }

  // Vue 3b: Choix du niveau d'abandon
  if (selectedCategory === 'abandons' && !selectedNiveauAbandon) {
    const niveaux = ['L1', 'L2', 'L3']
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Abandons - Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau d'abandon
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {niveaux.map((niveau) => {
                const count = Object.values(abandonsData[selectedPromotion]?.[niveau] || {})
                  .reduce((acc, arr) => acc + arr.length, 0)
                const hasAbandons = count > 0
                
                const handleClick = () => {
                  if (hasAbandons) {
                    setSelectedNiveauAbandon(niveau)
                  } else {
                    setEmptyAlertMessage(`Aucun abandon en ${niveau} pour cette promotion`)
                    setShowEmptyAlert(true)
                  }
                }
                
                return (
                  <button key={niveau} onClick={handleClick}
                    className={`p-6 border-2 rounded-xl transition-all duration-200 group ${
                      hasAbandons 
                        ? 'bg-white border-slate-200 hover:border-red-500 hover:shadow-lg cursor-pointer' 
                        : 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60'
                    }`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${
                        hasAbandons ? 'text-slate-800 group-hover:text-red-600' : 'text-slate-400'
                      }`}>
                        {niveau}
                      </div>
                      <div className="text-sm text-slate-600 mb-3">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        hasAbandons ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count} abandon{count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Modal d'alerte pour niveau vide */}
            {showEmptyAlert && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faUsers} className="text-3xl text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun abandon</h3>
                    <p className="text-slate-600 text-sm">
                      {emptyAlertMessage}
                    </p>
                    <p className="text-green-600 text-sm mt-2 font-medium">
                      ✓ Tous les étudiants de ce niveau ont participé à la formation
                    </p>
                  </div>

                  <button onClick={() => setShowEmptyAlert(false)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                    Compris
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue 3c: Choix de la filière pour les PV
  if (selectedCategory === 'pv' && !selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV Archivés - Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez une filière
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => (
                  <button key={filiere.id} onClick={() => setSelectedFiliere(filiere.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-indigo-600" />
                      </div>
                      <div className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{filiere.id}</div>
                      <div className="text-sm text-slate-600 mb-2">{filiere.nom}</div>
                      <div className="text-xs px-3 py-1 bg-slate-100 rounded-full inline-block">
                        3 niveaux
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

  // Vue 4: Choix de la filière (pour diplômés ou abandons)
  if ((selectedDiplome || selectedNiveauAbandon) && !selectedFiliere) {
    const isDiplomes = selectedCategory === 'diplomes'
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${isDiplomes ? 'green' : 'red'}-50 to-slate-50`}>
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                {isDiplomes ? `Diplômés ${selectedDiplome}` : `Abandons ${selectedNiveauAbandon}`} - {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez une filière
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => {
                  const data = isDiplomes 
                    ? diplomesData[selectedPromotion]?.[selectedDiplome]?.[filiere.id] || []
                    : abandonsData[selectedPromotion]?.[selectedNiveauAbandon]?.[filiere.id] || []
                  const count = data.length
                  
                  return (
                    <button key={filiere.id} onClick={() => setSelectedFiliere(filiere.id)}
                      className={`p-6 border-2 border-slate-200 rounded-xl hover:border-${isDiplomes ? 'green' : 'red'}-500 hover:bg-${isDiplomes ? 'green' : 'red'}-50 transition-all duration-200 group`}>
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-${isDiplomes ? 'green' : 'red'}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-${isDiplomes ? 'green' : 'red'}-200`}>
                          <FontAwesomeIcon icon={faGraduationCap} className={`text-3xl text-${isDiplomes ? 'green' : 'red'}-600`} />
                        </div>
                        <div className={`text-xl font-bold text-slate-800 group-hover:text-${isDiplomes ? 'green' : 'red'}-600 mb-2`}>{filiere.id}</div>
                        <div className="text-sm text-slate-600 mb-2">{filiere.nom}</div>
                        <div className={`text-xs px-3 py-1 bg-slate-100 rounded-full inline-block`}>
                          {count} {isDiplomes ? 'diplômé' : 'abandon'}{count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4b: Choix du niveau pour les PV
  if (selectedCategory === 'pv' && selectedFiliere && !selectedNiveau) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV Archivés - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le niveau</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {['L1', 'L2', 'L3'].map((niveau) => (
                  <button key={niveau} onClick={() => setSelectedNiveau(niveau)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{niveau}</div>
                      <div className="text-sm text-slate-600 mb-2">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                      </div>
                      <div className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full inline-block">
                        3 classes
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

  // Vue 4c: Choix de la classe pour les PV
  if (selectedCategory === 'pv' && selectedFiliere && selectedNiveau && !selectedClasse) {
    const classes = getClasses(selectedFiliere, selectedNiveau)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV Archivés - {selectedFiliere} {selectedNiveau}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la classe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {classes.map((classe) => (
                  <button key={classe.id} onClick={() => setSelectedClasse(classe.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-indigo-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{classe.nom}</div>
                      <div className="text-sm text-slate-600 mb-2">
                        Effectif: {classe.effectif} étudiants
                      </div>
                      <div className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full inline-block">
                        5 PV archivés
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

  // Vue 5: Liste finale (diplômés, abandons, ou PV archivés)
  // Pour les PV, on vérifie qu'on a bien sélectionné la classe
  if (selectedCategory === 'pv' && !selectedClasse) {
    // Si on arrive ici pour les PV sans classe, retour automatique
    return null
  }

  const isDiplomes = selectedCategory === 'diplomes'
  const isPV = selectedCategory === 'pv'
  const etudiants = isDiplomes
    ? (diplomesData[selectedPromotion]?.[selectedDiplome]?.[selectedFiliere] || [])
    : isPV ? [] : (abandonsData[selectedPromotion]?.[selectedNiveauAbandon]?.[selectedFiliere] || [])

  // Données d'exemple pour les PV archivés par classe
  const getPVArchivesByClasse = () => {
    if (!isPV || !selectedClasse) return []
    
    // Extraire l'effectif de la classe sélectionnée
    const classes = getClasses(selectedFiliere, selectedNiveau)
    const classeInfo = classes.find(c => c.id === selectedClasse)
    const effectif = classeInfo?.effectif || 35
    
    return [
      { 
        id: 1, 
        type: 'Semestre 1', 
        session: 'Avant rattrapages', 
        dateArchivage: '2025-01-25', 
        tauxReussite: 84.8, 
        effectif: effectif,
        admis: Math.round(effectif * 0.848),
        ajourne: effectif - Math.round(effectif * 0.848),
        color: 'orange' 
      },
      { 
        id: 2, 
        type: 'Semestre 1', 
        session: 'Après rattrapages', 
        dateArchivage: '2025-02-18', 
        tauxReussite: 93.9, 
        effectif: effectif,
        admis: Math.round(effectif * 0.939),
        ajourne: effectif - Math.round(effectif * 0.939),
        color: 'green' 
      },
      { 
        id: 3, 
        type: 'Semestre 2', 
        session: 'Avant rattrapages', 
        dateArchivage: '2025-06-25', 
        tauxReussite: 85.3, 
        effectif: effectif,
        admis: Math.round(effectif * 0.853),
        ajourne: effectif - Math.round(effectif * 0.853),
        color: 'orange' 
      },
      { 
        id: 4, 
        type: 'Semestre 2', 
        session: 'Après rattrapages', 
        dateArchivage: '2025-07-15', 
        tauxReussite: 97.1, 
        effectif: effectif,
        admis: Math.round(effectif * 0.971),
        ajourne: effectif - Math.round(effectif * 0.971),
        color: 'green' 
      },
      { 
        id: 5, 
        type: 'Annuel', 
        session: 'Résultats finaux', 
        dateArchivage: '2025-07-18', 
        tauxReussite: 97, 
        effectif: effectif,
        admis: Math.round(effectif * 0.97),
        ajourne: effectif - Math.round(effectif * 0.97),
        color: 'blue' 
      }
    ]
  }

  const pvArchives = getPVArchivesByClasse()

  const filteredEtudiants = isPV ? [] : etudiants.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPV = isPV ? pvArchives.filter(pv =>
    pv.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pv.session.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-${isPV ? 'indigo' : isDiplomes ? 'green' : 'red'}-50 to-slate-50`}>
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              {isPV ? `PV Archivés - Classe ${selectedClasse}` : isDiplomes ? `Diplômés ${selectedDiplome}` : `Abandons ${selectedNiveauAbandon}`} {!isPV && `- ${selectedFiliere}`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Promotion {selectedPromotion} • {isPV ? filteredPV.length + ' PV archivés' : filteredEtudiants.length + ` ${isDiplomes ? 'diplômé' : 'abandon'}${filteredEtudiants.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {isPV ? (
            // Affichage des PV archivés
            filteredPV.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <FontAwesomeIcon icon={faFileArchive} className="text-6xl text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">Aucun PV archivé trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPV.map((pv) => {
                  const colors = {
                    orange: {
                      border: 'border-orange-200',
                      bgGradient: 'from-orange-500 to-orange-600',
                      bgLight: 'bg-orange-50',
                      text: 'text-orange-700',
                      borderLight: 'border-orange-200',
                      button: 'bg-orange-600 hover:bg-orange-700'
                    },
                    green: {
                      border: 'border-green-200',
                      bgGradient: 'from-green-500 to-green-600',
                      bgLight: 'bg-green-50',
                      text: 'text-green-700',
                      borderLight: 'border-green-200',
                      button: 'bg-green-600 hover:bg-green-700'
                    },
                    blue: {
                      border: 'border-blue-200',
                      bgGradient: 'from-blue-500 to-blue-600',
                      bgLight: 'bg-blue-50',
                      text: 'text-blue-700',
                      borderLight: 'border-blue-200',
                      button: 'bg-blue-600 hover:bg-blue-700'
                    }
                  }
                  const color = colors[pv.color]
                  
                  return (
                    <div key={pv.id} className={`bg-white rounded-xl shadow-md border-2 ${color.border} hover:shadow-lg transition-shadow p-6`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${color.bgGradient} rounded-full flex items-center justify-center text-white`}>
                          <FontAwesomeIcon icon={faFileAlt} className="text-2xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{pv.type}</h3>
                          <p className="text-sm text-slate-600">{pv.session}</p>
                        </div>
                      </div>

                      <div className={`${color.bgLight} rounded-lg p-4 space-y-2`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Date archivage:</span>
                          <span className={`font-semibold ${color.text}`}>{pv.dateArchivage}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Effectif:</span>
                          <span className={`font-semibold ${color.text}`}>{pv.effectif} étudiants</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Admis:</span>
                          <span className={`font-semibold ${color.text}`}>{pv.admis}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Ajournés:</span>
                          <span className={`font-semibold ${color.text}`}>{pv.ajourne}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Taux réussite:</span>
                          <span className={`font-bold text-lg ${color.text}`}>{pv.tauxReussite}%</span>
                        </div>
                        <div className={`mt-3 pt-3 border-t ${color.borderLight}`}>
                          <button className={`w-full px-4 py-2 ${color.button} text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors`}>
                            <FontAwesomeIcon icon={faEye} />
                            Consulter le PV
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : filteredEtudiants.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <FontAwesomeIcon icon={faFileArchive} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun {isDiplomes ? 'diplômé' : 'abandon'} trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEtudiants.map((etudiant) => (
                <div key={etudiant.id} className={`bg-white rounded-xl shadow-md border-2 border-${isDiplomes ? 'green' : 'red'}-200 hover:shadow-lg transition-shadow p-6`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br from-${isDiplomes ? 'green' : 'red'}-500 to-${isDiplomes ? 'green' : 'red'}-600 rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                      {etudiant.nom[0]}{etudiant.prenom[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{etudiant.nom} {etudiant.prenom}</h3>
                      <p className="text-sm text-slate-600">{etudiant.matricule}</p>
                    </div>
                  </div>

                  {isDiplomes ? (
                    <div className="bg-green-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Mention:</span>
                        <span className="font-semibold text-green-700">{etudiant.mention}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Moyenne:</span>
                        <span className="font-semibold text-green-700">{etudiant.moyenne}/20</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-700">Diplômé {selectedDiplome}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Date d'abandon:</span>
                        <span className="font-semibold text-red-700">{etudiant.dateAbandon}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-slate-600">Motif:</span>
                        <p className="text-sm font-medium text-red-700 mt-1">{etudiant.motif}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <FontAwesomeIcon icon={faUserTimes} className="text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-700">Abandon en {selectedNiveauAbandon}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ArchivageView

