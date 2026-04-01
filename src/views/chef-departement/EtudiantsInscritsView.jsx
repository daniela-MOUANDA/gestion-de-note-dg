import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faGraduationCap, faEye, faChartLine, faUser, faEnvelope, faPhone, faCalendar, faMapMarkerAlt, faVenusMars, faTimes } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../contexts/AuthContext'
import { getEtudiants, getEtudiantDetails } from '../../api/chefDepartement'
import { getFilieres } from '../../api/scolarite'

const EtudiantsInscritsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [etudiants, setEtudiants] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('TOUS')
  const [filterNiveau, setFilterNiveau] = useState('TOUS')
  const [filterSemestre, setFilterSemestre] = useState('TOUS')
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])

  // Options de semestres
  const semestresOptions = [
    { value: 'TOUS', label: 'Choisir le semestre' },
    { value: 'S1', label: 'Semestre 1 (L1)' },
    { value: 'S2', label: 'Semestre 2 (L1)' },
    { value: 'S3', label: 'Semestre 3 (L2)' },
    { value: 'S4', label: 'Semestre 4 (L2)' },
    { value: 'S5', label: 'Semestre 5 (L3)' },
    { value: 'S6', label: 'Semestre 6 (L3)' }
  ]
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // Modal de profil
  const [showModal, setShowModal] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const departementChef = user?.departement?.nom || 'Département'

  // Charger les filières du département
  useEffect(() => {
    const loadFilieres = async () => {
      try {
        const filieresData = await getFilieres({ sansGroupes: true })
        setFilieres(filieresData || [])
      } catch (error) {
        console.error('Erreur lors du chargement des filières:', error)
      }
    }
    loadFilieres()
  }, [])

  // Charger les niveaux
  useEffect(() => {
    const loadNiveaux = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/niveaux`)
        if (response.ok) {
          const niveauxData = await response.json()
          setNiveaux(niveauxData || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des niveaux:', error)
      }
    }
    loadNiveaux()
  }, [])

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Charger les étudiants
  const loadEtudiants = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getEtudiants(currentPage, limit, {
        filiere: filterFiliere,
        niveau: filterNiveau,
        semestre: filterSemestre,
        search: searchQuery
      })

      if (result.success) {
        setEtudiants(result.etudiants || [])
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
      } else {
        showAlert(result.error || 'Erreur lors du chargement des étudiants', 'error')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error)
      showAlert('Erreur lors du chargement des étudiants', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filterFiliere, filterNiveau, filterSemestre, searchQuery, showAlert])

  useEffect(() => {
    loadEtudiants()
  }, [loadEtudiants])

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [filterFiliere, filterNiveau, filterSemestre, searchQuery])

  // Ouvrir le modal de profil
  const handleVoirProfil = async (etudiantId) => {
    try {
      setLoadingDetails(true)
      setShowModal(true)
      // Passer le semestre sélectionné pour calculer la moyenne du bon semestre
      const result = await getEtudiantDetails(etudiantId, filterSemestre)
      
      if (result.success) {
        setSelectedEtudiant(result.etudiant)
      } else {
        showAlert(result.error || 'Erreur lors du chargement du profil', 'error')
        setShowModal(false)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      showAlert('Erreur lors du chargement du profil', 'error')
      setShowModal(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Étudiants Inscrits</h1>
            <p className="text-sm text-slate-600">Liste des étudiants inscrits dans votre département : {departementChef}</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterFiliere}
                onChange={(e) => setFilterFiliere(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Toutes les filières</option>
                {filieres.map(filiere => (
                  <option key={filiere.id} value={filiere.code}>{filiere.nom || filiere.code}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterNiveau}
                onChange={(e) => setFilterNiveau(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Tous les niveaux</option>
                {niveaux.map(niveau => (
                  <option key={niveau.id} value={niveau.code}>{niveau.code} - {niveau.nom}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterSemestre}
                onChange={(e) => setFilterSemestre(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                {semestresOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 flex items-center justify-center">
              <LoadingSpinner text="Chargement des étudiants..." />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Matricule</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom & Prénom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Filière</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Niveau</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Moyenne</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Crédits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {etudiants.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                            Aucun étudiant trouvé
                          </td>
                        </tr>
                      ) : (
                        etudiants.map((etudiant) => (
                          <tr key={etudiant.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono font-semibold text-slate-800">{etudiant.matricule}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{etudiant.prenom} {etudiant.nom}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {etudiant.filiere}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {etudiant.niveau}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{etudiant.moyenneGenerale}/20</span>
                                <div className="w-16 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      etudiant.moyenneGenerale >= 16 ? 'bg-green-600' :
                                      etudiant.moyenneGenerale >= 14 ? 'bg-blue-600' :
                                      etudiant.moyenneGenerale >= 12 ? 'bg-yellow-600' :
                                      etudiant.moyenneGenerale >= 10 ? 'bg-orange-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${Math.min((etudiant.moyenneGenerale / 20) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">{etudiant.credits || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                etudiant.statut === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {etudiant.statut}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleVoirProfil(etudiant.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir les détails"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Affichage de {(currentPage - 1) * limit + 1} à {Math.min(currentPage * limit, total)} sur {total} étudiants
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal de profil étudiant */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setSelectedEtudiant(null)
            }}
            title="Profil de l'étudiant"
            size="4xl"
          >
            {loadingDetails ? (
              <div className="p-8 flex items-center justify-center">
                <LoadingSpinner text="Chargement du profil..." />
              </div>
            ) : selectedEtudiant ? (
              <div className="p-6 space-y-6">
                {/* En-tête avec nom et moyenne */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          {selectedEtudiant.prenom} {selectedEtudiant.nom}
                        </h3>
                        <p className="text-slate-600">Matricule: {selectedEtudiant.matricule}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-1">Moyenne générale</p>
                      <p className={`text-3xl font-bold ${
                        selectedEtudiant.moyenneGenerale >= 16 ? 'text-green-600' :
                        selectedEtudiant.moyenneGenerale >= 14 ? 'text-blue-600' :
                        selectedEtudiant.moyenneGenerale >= 12 ? 'text-yellow-600' :
                        selectedEtudiant.moyenneGenerale >= 10 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedEtudiant.moyenneGenerale}/20
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations personnelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                      Informations personnelles
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Nom complet</p>
                        <p className="font-medium text-slate-800">{selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Date de naissance</p>
                        <p className="font-medium text-slate-800">
                          {selectedEtudiant.dateNaissance || selectedEtudiant.date_naissance
                            ? new Date(selectedEtudiant.dateNaissance || selectedEtudiant.date_naissance).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Lieu de naissance</p>
                        <p className="font-medium text-slate-800">{selectedEtudiant.lieuNaissance || selectedEtudiant.lieu_naissance || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Sexe</p>
                        <p className="font-medium text-slate-800">
                          {selectedEtudiant.sexe === 'M' ? 'Masculin' : selectedEtudiant.sexe === 'F' ? 'Féminin' : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
                      Contact
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="font-medium text-slate-800">{selectedEtudiant.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                        <p className="font-medium text-slate-800">{selectedEtudiant.telephone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations académiques */}
                {selectedEtudiant.inscriptions && selectedEtudiant.inscriptions.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                      Informations académiques
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedEtudiant.inscriptions.map((inscription, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">Filière</p>
                          <p className="font-medium text-slate-800 mb-3">
                            {inscription.filieres?.code || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">Niveau</p>
                          <p className="font-medium text-slate-800 mb-3">
                            {inscription.niveaux?.code || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">Classe</p>
                          <p className="font-medium text-slate-800">
                            {inscription.classes?.code || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistiques académiques */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} className="text-emerald-600" />
                    Statistiques académiques
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Moyenne générale actuelle</p>
                      <p className={`text-2xl font-bold ${
                        selectedEtudiant.moyenneGenerale >= 16 ? 'text-green-600' :
                        selectedEtudiant.moyenneGenerale >= 14 ? 'text-blue-600' :
                        selectedEtudiant.moyenneGenerale >= 12 ? 'text-yellow-600' :
                        selectedEtudiant.moyenneGenerale >= 10 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedEtudiant.moyenneGenerale}/20
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {filterSemestre && filterSemestre !== 'TOUS' 
                          ? `Crédits validés (${semestresOptions.find(s => s.value === filterSemestre)?.label || filterSemestre})`
                          : 'Total crédits validés'}
                      </p>
                      <p className="text-2xl font-bold text-slate-800">{selectedEtudiant.totalCredits || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default EtudiantsInscritsView
