import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faGraduationCap, faEye, faChartLine } from '@fortawesome/free-solid-svg-icons'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'

const EtudiantsView = () => {
  const [etudiants, setEtudiants] = useState([
    { id: 1, matricule: '26001', nom: 'MBO', prenom: 'Lidvige', filiere: 'GI', niveau: 'L3', moyenne: 16.5, credits: 24, statut: 'Actif' },
    { id: 2, matricule: '26002', nom: 'MBADINGA', prenom: 'Paul', filiere: 'RT', niveau: 'L2', moyenne: 14.8, credits: 18, statut: 'Actif' },
    { id: 3, matricule: '26003', nom: 'OBIANG', prenom: 'Sophie', filiere: 'GI', niveau: 'L1', moyenne: 15.2, credits: 12, statut: 'Actif' },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('TOUS')
  const [filterNiveau, setFilterNiveau] = useState('TOUS')

  const filteredEtudiants = etudiants.filter(etudiant => {
    const matchesSearch = `${etudiant.nom} ${etudiant.prenom} ${etudiant.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFiliere = filterFiliere === 'TOUS' || etudiant.filiere === filterFiliere
    const matchesNiveau = filterNiveau === 'TOUS' || etudiant.niveau === filterNiveau
    return matchesSearch && matchesFiliere && matchesNiveau
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Étudiants</h1>
            <p className="text-sm text-slate-600">Visualisez les données des étudiants et leurs résultats scolaires</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="GI">Génie Informatique</option>
                <option value="RT">Réseaux et Télécommunications</option>
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
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
              </select>
            </div>
          </div>

          {/* Tableau */}
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
                  {filteredEtudiants.map((etudiant) => (
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
                          <span className="font-bold text-slate-800">{etudiant.moyenne}/20</span>
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(etudiant.moyenne / 20) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{etudiant.credits}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          etudiant.statut === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {etudiant.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
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

export default EtudiantsView

