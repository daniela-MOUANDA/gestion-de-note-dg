import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate, 
  faSearch, 
  faEye, 
  faEdit,
  faFilter,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'

const GererEtudiantsScolariteView = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filiereActive, setFiliereActive] = useState('Génie Informatique')
  const [niveauActive, setNiveauActive] = useState('Tous')
  const [anneeAcademique, setAnneeAcademique] = useState('2025')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  
  const [etudiants] = useState([
    // Étudiants 2025 - Génie Informatique
    { id: 1, matricule: 'INPTIC2025-001', nom: 'MBO', prenom: 'Lidvige', email: 'lidvigembo@mail.com', filiere: 'Génie Informatique', niveau: 'L1', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-15' },
    { id: 4, matricule: 'INPTIC2025-004', nom: 'BERNARD', prenom: 'Pierre', email: 'pierre.bernard@mail.com', filiere: 'Génie Informatique', niveau: 'L1', anneeAcademique: '2025', statut: 'Candidat admis', dateInscription: '' },
    { id: 6, matricule: 'INPTIC2025-006', nom: 'DURAND', prenom: 'Paul', email: 'paul.durand@mail.com', filiere: 'Génie Informatique', niveau: 'L2', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-18' },
    { id: 9, matricule: 'INPTIC2025-009', nom: 'PETIT', prenom: 'Luc', email: 'luc.petit@mail.com', filiere: 'Génie Informatique', niveau: 'L3', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-21' },
    // Étudiants 2025 - Réseau et Télécom
    { id: 2, matricule: 'INPTIC2025-002', nom: 'DUPONT', prenom: 'Jean', email: 'jean.dupont@mail.com', filiere: 'Réseau et Télécom', niveau: 'L1', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-16' },
    { id: 5, matricule: 'INPTIC2025-005', nom: 'DUBOIS', prenom: 'Sophie', email: 'sophie.dubois@mail.com', filiere: 'Réseau et Télécom', niveau: 'L1', anneeAcademique: '2025', statut: 'Candidat admis', dateInscription: '' },
    { id: 8, matricule: 'INPTIC2025-008', nom: 'LAMBERT', prenom: 'Thomas', email: 'thomas.lambert@mail.com', filiere: 'Réseau et Télécom', niveau: 'L2', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-20' },
    { id: 10, matricule: 'INPTIC2025-010', nom: 'ROUX', prenom: 'Emma', email: 'emma.roux@mail.com', filiere: 'Réseau et Télécom', niveau: 'L3', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-22' },
    // Étudiants 2025 - Management et Multimédias
    { id: 3, matricule: 'INPTIC2025-003', nom: 'MARTIN', prenom: 'Marie', email: 'marie.martin@mail.com', filiere: 'Management et Multimédias', niveau: 'L1', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-17' },
    { id: 7, matricule: 'INPTIC2025-007', nom: 'MOREAU', prenom: 'Julie', email: 'julie.moreau@mail.com', filiere: 'Management et Multimédias', niveau: 'L2', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-19' },
    { id: 11, matricule: 'INPTIC2025-011', nom: 'SIMON', prenom: 'Lucas', email: 'lucas.simon@mail.com', filiere: 'Management et Multimédias', niveau: 'L3', anneeAcademique: '2025', statut: 'Inscrit', dateInscription: '2025-01-23' },
    // Anciens étudiants 2024 - Génie Informatique
    { id: 12, matricule: 'INPTIC2024-001', nom: 'GARCIA', prenom: 'Antoine', email: 'antoine.garcia@mail.com', filiere: 'Génie Informatique', niveau: 'L2', anneeAcademique: '2024', statut: 'Inscrit', dateInscription: '2024-01-15' },
    { id: 13, matricule: 'INPTIC2024-002', nom: 'RODRIGUEZ', prenom: 'Camille', email: 'camille.rodriguez@mail.com', filiere: 'Génie Informatique', niveau: 'L3', anneeAcademique: '2024', statut: 'Inscrit', dateInscription: '2024-01-16' },
    // Anciens étudiants 2024 - Réseau et Télécom
    { id: 14, matricule: 'INPTIC2024-003', nom: 'LEFEBVRE', prenom: 'Alexandre', email: 'alexandre.lefebvre@mail.com', filiere: 'Réseau et Télécom', niveau: 'L2', anneeAcademique: '2024', statut: 'Inscrit', dateInscription: '2024-01-17' },
    // Anciens étudiants 2023 - Génie Informatique
    { id: 15, matricule: 'INPTIC2023-001', nom: 'MOREAU', prenom: 'Sophie', email: 'sophie.moreau@mail.com', filiere: 'Génie Informatique', niveau: 'L3', anneeAcademique: '2023', statut: 'Inscrit', dateInscription: '2023-01-15' },
  ])

  const filieres = ['Génie Informatique', 'Réseau et Télécom', 'Management et Multimédias']
  const niveaux = ['Tous', 'L1', 'L2', 'L3']
  const anneesAcademiques = ['2025', '2024', '2023']
  const statuts = ['Tous', 'Inscrit', 'Candidat admis']

  const getStatsByFiliere = (filiere) => {
    const etudiantsFiliere = etudiants.filter(e => 
      e.filiere === filiere && 
      e.anneeAcademique === anneeAcademique
    )
    return {
      total: etudiantsFiliere.length,
      inscrits: etudiantsFiliere.filter(e => e.statut === 'Inscrit').length,
      candidats: etudiantsFiliere.filter(e => e.statut === 'Candidat admis').length,
      l1: etudiantsFiliere.filter(e => e.niveau === 'L1').length,
      l2: etudiantsFiliere.filter(e => e.niveau === 'L2').length,
      l3: etudiantsFiliere.filter(e => e.niveau === 'L3').length
    }
  }

  const filteredEtudiants = etudiants.filter(etudiant => {
    const matchSearch = `${etudiant.nom} ${etudiant.prenom} ${etudiant.matricule} ${etudiant.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFiliere = etudiant.filiere === filiereActive
    const matchAnnee = etudiant.anneeAcademique === anneeAcademique
    const matchNiveau = niveauActive === 'Tous' || etudiant.niveau === niveauActive
    const matchStatut = filtreStatut === 'Tous' || etudiant.statut === filtreStatut
    return matchSearch && matchFiliere && matchAnnee && matchNiveau && matchStatut
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Gérer les étudiants
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Consultez et gérez les étudiants par filière
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Exporter
            </button>
          </div>

          {/* Onglets par filière */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6 overflow-hidden">
            <div className="flex flex-wrap border-b border-slate-200">
              {filieres.map((filiere) => {
                const stats = getStatsByFiliere(filiere)
                const isActive = filiereActive === filiere
                return (
                  <button
                    key={filiere}
                    onClick={() => setFiliereActive(filiere)}
                    className={`flex-1 min-w-[200px] px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 border-b-2 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                          {filiere}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {stats.inscrits} inscrits • {stats.candidats} candidats
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          L1: {stats.l1} • L2: {stats.l2} • L3: {stats.l3}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sélection année académique */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-semibold text-slate-700">Année académique:</label>
              <div className="flex gap-2">
                {anneesAcademiques.map(annee => (
                  <button
                    key={annee}
                    onClick={() => setAnneeAcademique(annee)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      anneeAcademique === annee
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {annee}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher un étudiant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faFilter} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <select
                  value={niveauActive}
                  onChange={(e) => setNiveauActive(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-slate-800"
                >
                  {niveaux.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faFilter} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-slate-800"
                >
                  {statuts.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* En-tête de la filière active */}
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{filiereActive}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Année académique {anneeAcademique} • {filteredEtudiants.length} étudiant{filteredEtudiants.length > 1 ? 's' : ''} trouvé{filteredEtudiants.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-slate-800">{getStatsByFiliere(filiereActive).inscrits}</p>
                  <p className="text-xs text-slate-600">Inscrits</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800">{getStatsByFiliere(filiereActive).candidats}</p>
                  <p className="text-xs text-slate-600">Candidats</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800">{getStatsByFiliere(filiereActive).total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
              </div>
            </div>
            {/* Répartition par niveau */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs font-semibold text-slate-700 mb-2">Répartition par niveau:</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">L1</span>
                  <span className="text-sm text-slate-600">{getStatsByFiliere(filiereActive).l1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">L2</span>
                  <span className="text-sm text-slate-600">{getStatsByFiliere(filiereActive).l2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">L3</span>
                  <span className="text-sm text-slate-600">{getStatsByFiliere(filiereActive).l3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des étudiants */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            {filteredEtudiants.length === 0 ? (
              <div className="p-12 text-center">
                <FontAwesomeIcon icon={faUserGraduate} className="text-4xl text-slate-300 mb-4" />
                <p className="text-slate-500">Aucun étudiant trouvé pour cette filière</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Matricule</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Prénom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Niveau</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date inscription</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEtudiants.map((etudiant) => (
                      <tr key={etudiant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faUserGraduate} className="text-emerald-600 mr-2" />
                            <span className="text-sm font-medium text-slate-800">{etudiant.matricule}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800">{etudiant.nom}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800">{etudiant.prenom}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{etudiant.email}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            etudiant.niveau === 'L1' 
                              ? 'bg-blue-100 text-blue-700'
                              : etudiant.niveau === 'L2'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {etudiant.niveau}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            etudiant.statut === 'Inscrit' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {etudiant.statut}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {etudiant.dateInscription || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default GererEtudiantsScolariteView
