import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faClipboardList, faSearch, faFilter, faDownload, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { useAuth } from '../../contexts/AuthContext'
import { getActionsAudit, getAgentsPourFiltre } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const AuditView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: alertError } = useAlert()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterAgent, setFilterAgent] = useState('all')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  
  const [activites, setActivites] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'CHEF_SERVICE_SCOLARITE') {
      console.warn(`Accès non autorisé à l'audit pour le rôle: ${user?.role}. Redirection...`)
      const role = user?.role?.trim().toUpperCase()
      if (role === 'SP_SCOLARITE') {
        navigate('/sp-scolarite/dashboard', { replace: true })
      } else if (role === 'AGENT_SCOLARITE') {
        navigate('/scolarite/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  // Charger les agents pour le filtre
  useEffect(() => {
    const loadAgents = async () => {
      if (user?.role === 'CHEF_SERVICE_SCOLARITE') {
        try {
          const agentsData = await getAgentsPourFiltre()
          setAgents(agentsData)
        } catch (err) {
          console.error('Erreur lors du chargement des agents:', err)
        }
      }
    }
    
    if (isAuthenticated && user?.role === 'CHEF_SERVICE_SCOLARITE') {
      loadAgents()
    }
  }, [isAuthenticated, user])

  // Charger les actions d'audit
  useEffect(() => {
    const loadActions = async () => {
      if (user?.role === 'CHEF_SERVICE_SCOLARITE') {
        try {
          setLoading(true)
          setError(null)
          
          const filters = {
            typeAction: filterType !== 'all' ? filterType : undefined,
            utilisateurId: filterAgent !== 'all' ? filterAgent : undefined,
            dateDebut: dateDebut || undefined,
            dateFin: dateFin || undefined,
            searchQuery: searchQuery.trim() || undefined
          }
          
          const actions = await getActionsAudit(filters)
          setActivites(actions)
          // Réinitialiser à la page 1 quand les filtres changent
          setCurrentPage(1)
        } catch (err) {
          console.error('Erreur lors du chargement des actions d\'audit:', err)
          setError(err.message || 'Erreur lors du chargement des actions d\'audit.')
          alertError(err.message || 'Erreur lors du chargement des actions d\'audit.')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    // Délai pour éviter trop de requêtes lors de la saisie
    const timeoutId = setTimeout(() => {
      if (isAuthenticated && user?.role === 'CHEF_SERVICE_SCOLARITE') {
        loadActions()
      }
    }, searchQuery ? 500 : 0) // Délai de 500ms si recherche, sinon immédiat
    
    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, user, filterType, filterAgent, dateDebut, dateFin, searchQuery, alertError])

  // Calculs de pagination
  const totalPages = Math.ceil(activites.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedActivites = activites.slice(startIndex, endIndex)

  // Fonctions de pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll vers le haut du tableau
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7
    
    if (totalPages <= maxPagesToShow) {
      // Afficher toutes les pages si moins de maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Afficher avec ellipses
      if (currentPage <= 3) {
        // Début
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Fin
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Milieu
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handleExportCSV = () => {
    if (activites.length === 0) {
      alertError('Aucune donnée à exporter')
      return
    }

    // Créer les en-têtes du CSV
    const headers = ['Date & Heure', 'Agent', 'Action', 'Détails', 'Type']
    
    // Créer les lignes de données (exporter toutes les données filtrées, pas seulement la page actuelle)
    const rows = activites.map(act => [
      act.date,
      act.agent,
      act.action,
      act.details || '',
      act.type
    ])
    
    // Construire le CSV
    let csvContent = headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n'
    })
    
    // Créer le blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const dateStr = dateDebut && dateFin 
      ? `_${dateDebut}_au_${dateFin}` 
      : `_${new Date().toISOString().split('T')[0]}`
    
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_activites${dateStr}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'connexion': return 'bg-blue-100 text-blue-700'
      case 'inscription': return 'bg-green-100 text-green-700'
      case 'attestation': return 'bg-purple-100 text-purple-700'
      case 'bulletin': return 'bg-blue-100 text-blue-700'
      case 'diplome': return 'bg-amber-100 text-amber-700'
      case 'message': return 'bg-cyan-100 text-cyan-700'
      case 'error': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading && activites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarChef />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderChef />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <LoadingSpinner size="lg" text="Chargement des actions d'audit..." />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChef />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faClipboardList} className="text-blue-600" />
              Audit & Activités
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Historique complet des actions des agents
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Ligne 1: Recherche et filtres */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rechercher..."
                />
              </div>

              <div className="flex gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="connexion">Connexions</option>
                  <option value="inscription">Inscriptions</option>
                  <option value="attestation">Attestations</option>
                  <option value="bulletin">Bulletins</option>
                  <option value="diplome">Diplômes</option>
                  <option value="message">Messages</option>
                  <option value="error">Erreurs</option>
                </select>

                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les agents</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 2: Filtres de date et export */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date de début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button 
                  onClick={() => {
                    setDateDebut('')
                    setDateFin('')
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors whitespace-nowrap"
                >
                  Réinitialiser dates
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Exporter CSV
                </button>
              </div>
            </div>

            {/* Résumé des résultats */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{activites.length}</span> activité(s) trouvée(s)
                {dateDebut && dateFin && (
                  <span className="ml-2">
                    du <span className="font-semibold">{dateDebut}</span> au <span className="font-semibold">{dateFin}</span>
                  </span>
                )}
                {activites.length > 0 && (
                  <span className="ml-2">
                    (Page {currentPage} sur {totalPages})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Détails</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Date & Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading && activites.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <LoadingSpinner size="md" text="Chargement des actions..." />
                      </td>
                    </tr>
                  ) : paginatedActivites.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        Aucune action trouvée pour les critères sélectionnés
                      </td>
                    </tr>
                  ) : (
                    paginatedActivites.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{act.agent}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{act.action}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{act.details || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{act.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(act.type)}`}>
                            {act.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {activites.length > 0 && totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Affichage de <span className="font-semibold text-slate-800">{startIndex + 1}</span> à{' '}
                    <span className="font-semibold text-slate-800">
                      {Math.min(endIndex, activites.length)}
                    </span>{' '}
                    sur <span className="font-semibold text-slate-800">{activites.length}</span> résultat(s)
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Bouton Précédent */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        currentPage === 1
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                      Précédent
                    </button>
                    
                    {/* Numéros de page */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                              ...
                            </span>
                          )
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg font-semibold transition-colors min-w-[40px] ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Bouton Suivant */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        currentPage === totalPages
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Suivant
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuditView

