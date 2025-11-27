import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faClipboardList, faSearch, faFilter, faDownload
} from '@fortawesome/free-solid-svg-icons'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'

const AuditView = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterAgent, setFilterAgent] = useState('all')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const [activites] = useState([
    { id: 1, agent: 'Marie NZAMBA', action: 'Connexion', details: 'Authentification réussie', date: '27/11/2024 14:32', type: 'connexion' },
    { id: 2, agent: 'Marie NZAMBA', action: 'Inscription validée', details: 'ANDEME MBO Lidvige - GI-1A', date: '27/11/2024 14:30', type: 'inscription' },
    { id: 3, agent: 'Jeanne OBIANG', action: 'Connexion', details: 'Authentification réussie', date: '27/11/2024 09:15', type: 'connexion' },
    { id: 4, agent: 'Jeanne OBIANG', action: 'Attestation générée', details: 'N°0460/INPTIC/DG/DSE/2024', date: '27/11/2024 09:15', type: 'attestation' },
    { id: 5, agent: 'Paul MBADINGA', action: 'Bulletin distribué', details: 'RT-2A - Semestre 1', date: '26/11/2024 16:40', type: 'bulletin' },
    { id: 6, agent: 'Marie NZAMBA', action: 'Message envoyé', details: 'Classe GI-1A (35 étudiants)', date: '26/11/2024 15:20', type: 'message' },
    { id: 7, agent: 'Sophie ELLA', action: 'Tentative de connexion échouée', details: '3 tentatives avec mot de passe incorrect', date: '26/11/2024 11:15', type: 'error' },
    { id: 8, agent: 'Paul MBADINGA', action: 'Diplôme distribué', details: 'DTS - RT-2024', date: '26/11/2024 10:30', type: 'diplome' },
  ])

  const agents = ['Marie NZAMBA', 'Jeanne OBIANG', 'Paul MBADINGA', 'Sophie ELLA']

  const filteredActivites = activites.filter(act => {
    const matchSearch = act.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       act.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || act.type === filterType
    const matchAgent = filterAgent === 'all' || act.agent === filterAgent
    const matchDate = isInDateRange(act.date)
    
    return matchSearch && matchType && matchAgent && matchDate
  })

  const parseDate = (dateStr) => {
    // Format: "27/11/2024 14:32"
    const [datePart] = dateStr.split(' ')
    const [day, month, year] = datePart.split('/')
    return new Date(year, month - 1, day)
  }

  const isInDateRange = (activityDate) => {
    if (!dateDebut && !dateFin) return true
    
    const actDate = parseDate(activityDate)
    
    if (dateDebut && !dateFin) {
      const debut = new Date(dateDebut)
      return actDate >= debut
    }
    
    if (!dateDebut && dateFin) {
      const fin = new Date(dateFin)
      fin.setHours(23, 59, 59, 999)
      return actDate <= fin
    }
    
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    fin.setHours(23, 59, 59, 999)
    
    return actDate >= debut && actDate <= fin
  }

  const handleExportCSV = () => {
    // Créer les en-têtes du CSV
    const headers = ['Date & Heure', 'Agent', 'Action', 'Détails', 'Type']
    
    // Créer les lignes de données
    const rows = filteredActivites.map(act => [
      act.date,
      act.agent,
      act.action,
      act.details,
      act.type
    ])
    
    // Construire le CSV
    let csvContent = headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
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
                    <option key={agent} value={agent}>{agent}</option>
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
                <span className="font-semibold text-slate-800">{filteredActivites.length}</span> activité(s) trouvée(s)
                {dateDebut && dateFin && (
                  <span className="ml-2">
                    du <span className="font-semibold">{dateDebut}</span> au <span className="font-semibold">{dateFin}</span>
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
                  {filteredActivites.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{act.agent}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{act.action}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{act.details}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{act.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(act.type)}`}>
                          {act.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuditView

