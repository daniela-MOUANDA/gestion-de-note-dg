import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGraduationCap, faSearch, faFilter, faDownload, faEye } from '@fortawesome/free-solid-svg-icons'
import SidebarChefDepartement from '../../components/common/SidebarChefDepartement'
import HeaderChefDepartement from '../../components/common/HeaderChefDepartement'
import { useAuth } from '../../contexts/AuthContext'

const EtudiantsInscritsView = () => {
  const { user } = useAuth()
  const [departementChef] = useState('Génie Informatique')
  
  const [etudiants, setEtudiants] = useState([
    { id: 1, matricule: '26001', nom: 'MBO', prenom: 'Lidvige', email: 'lidvige.mbo@example.com', filiere: 'GI', niveau: 'L3', statut: 'Inscrit', dateInscription: '2025-01-10' },
    { id: 2, matricule: '26002', nom: 'MBADINGA', prenom: 'Paul', email: 'paul.mbadinga@example.com', filiere: 'GI', niveau: 'L2', statut: 'Inscrit', dateInscription: '2025-01-12' },
    { id: 3, matricule: '26003', nom: 'OBIANG', prenom: 'Sophie', email: 'sophie.obiang@example.com', filiere: 'GI', niveau: 'L1', statut: 'Inscrit', dateInscription: '2025-01-15' },
    { id: 4, matricule: '26004', nom: 'ONDO', prenom: 'Marie', email: 'marie.ondo@example.com', filiere: 'GI', niveau: 'L3', statut: 'Inscrit', dateInscription: '2025-01-08' },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('TOUS')
  const [filterStatut, setFilterStatut] = useState('TOUS')

  const filteredEtudiants = etudiants.filter(etudiant => {
    const matchesSearch = `${etudiant.nom} ${etudiant.prenom} ${etudiant.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNiveau = filterNiveau === 'TOUS' || etudiant.niveau === filterNiveau
    const matchesStatut = filterStatut === 'TOUS' || etudiant.statut === filterStatut
    return matchesSearch && matchesNiveau && matchesStatut
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChefDepartement />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChefDepartement chefName={user ? `${user.prenom} ${user.nom}` : 'Chef de Département'} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Étudiants Inscrits</h1>
            <p className="text-sm text-slate-600">Liste des étudiants inscrits dans votre département : {departementChef}</p>
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
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="Inscrit">Inscrit</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
              <p className="text-sm text-slate-600 mb-1">Total étudiants</p>
              <p className="text-2xl font-bold text-slate-800">{etudiants.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
              <p className="text-sm text-slate-600 mb-1">L1</p>
              <p className="text-2xl font-bold text-slate-800">{etudiants.filter(e => e.niveau === 'L1').length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
              <p className="text-sm text-slate-600 mb-1">L2</p>
              <p className="text-2xl font-bold text-slate-800">{etudiants.filter(e => e.niveau === 'L2').length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-amber-500">
              <p className="text-sm text-slate-600 mb-1">L3</p>
              <p className="text-2xl font-bold text-slate-800">{etudiants.filter(e => e.niveau === 'L3').length}</p>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Liste des étudiants</h2>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <FontAwesomeIcon icon={faDownload} />
                Exporter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nom & Prénom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Filière</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Niveau</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Date inscription</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{etudiant.email}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(etudiant.dateInscription).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          etudiant.statut === 'Inscrit' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
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

export default EtudiantsInscritsView

