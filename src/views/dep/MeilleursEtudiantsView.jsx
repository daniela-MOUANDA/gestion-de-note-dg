import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faMedal, faAward, faGraduationCap, faFilter } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'

const MeilleursEtudiantsView = () => {
  const [meilleursEtudiants, setMeilleursEtudiants] = useState([
    { id: 1, rang: 1, matricule: '26001', nom: 'MBO', prenom: 'Lidvige', filiere: 'GI', niveau: 'L3', moyenne: 18.5, credits: 24, mention: 'Très Bien' },
    { id: 2, rang: 2, matricule: '26015', nom: 'NDONGO', prenom: 'Marie', filiere: 'GI', niveau: 'L3', moyenne: 17.8, credits: 24, mention: 'Très Bien' },
    { id: 3, rang: 3, matricule: '26023', nom: 'ESSONO', prenom: 'Jean', filiere: 'RT', niveau: 'L3', moyenne: 17.2, credits: 24, mention: 'Bien' },
    { id: 4, rang: 4, matricule: '26008', nom: 'MBALLA', prenom: 'Sophie', filiere: 'GI', niveau: 'L2', moyenne: 16.9, credits: 18, mention: 'Bien' },
    { id: 5, rang: 5, matricule: '26012', nom: 'ONDO', prenom: 'Pierre', filiere: 'RT', niveau: 'L2', moyenne: 16.5, credits: 18, mention: 'Bien' },
  ])
  const [filterFiliere, setFilterFiliere] = useState('TOUS')
  const [filterNiveau, setFilterNiveau] = useState('TOUS')

  const getRangIcon = (rang) => {
    switch(rang) {
      case 1: return { icon: faTrophy, color: 'text-yellow-500', bg: 'bg-yellow-100' }
      case 2: return { icon: faMedal, color: 'text-slate-400', bg: 'bg-slate-100' }
      case 3: return { icon: faMedal, color: 'text-amber-600', bg: 'bg-amber-100' }
      default: return { icon: faAward, color: 'text-blue-500', bg: 'bg-blue-100' }
    }
  }

  const getMentionColor = (mention) => {
    switch(mention) {
      case 'Très Bien': return 'bg-purple-100 text-purple-800'
      case 'Bien': return 'bg-blue-100 text-blue-800'
      case 'Assez Bien': return 'bg-green-100 text-green-800'
      case 'Passable': return 'bg-amber-100 text-amber-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const filteredEtudiants = meilleursEtudiants.filter(etudiant => {
    const matchesFiliere = filterFiliere === 'TOUS' || etudiant.filiere === filterFiliere
    const matchesNiveau = filterNiveau === 'TOUS' || etudiant.niveau === filterNiveau
    return matchesFiliere && matchesNiveau
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-yellow-500" />
                Meilleurs Étudiants
              </h1>
              <p className="text-sm text-slate-600">Classement des meilleurs étudiants par filière et niveau</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Classement */}
          <div className="space-y-4">
            {filteredEtudiants.map((etudiant) => {
              const rangInfo = getRangIcon(etudiant.rang)
              return (
                <div key={etudiant.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-16 h-16 ${rangInfo.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <FontAwesomeIcon icon={rangInfo.icon} className={`${rangInfo.color} text-2xl`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-slate-800">#{etudiant.rang}</span>
                          <h3 className="text-lg font-bold text-slate-800">{etudiant.prenom} {etudiant.nom}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {etudiant.matricule}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <FontAwesomeIcon icon={faGraduationCap} />
                            {etudiant.filiere} - {etudiant.niveau}
                          </span>
                          <span>Crédits: {etudiant.credits}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-800">{etudiant.moyenne}/20</div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${getMentionColor(etudiant.mention)}`}>
                          {etudiant.mention}
                        </span>
                      </div>
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(etudiant.moyenne / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Statistiques du classement */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-6 border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-2xl" />
                <h3 className="font-bold text-slate-800">Premier</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredEtudiants[0]?.prenom} {filteredEtudiants[0]?.nom}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Moyenne: {filteredEtudiants[0]?.moyenne}/20
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon icon={faMedal} className="text-slate-400 text-2xl" />
                <h3 className="font-bold text-slate-800">Deuxième</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredEtudiants[1]?.prenom} {filteredEtudiants[1]?.nom}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Moyenne: {filteredEtudiants[1]?.moyenne}/20
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-2">
                <FontAwesomeIcon icon={faMedal} className="text-amber-600 text-2xl" />
                <h3 className="font-bold text-slate-800">Troisième</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredEtudiants[2]?.prenom} {filteredEtudiants[2]?.nom}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Moyenne: {filteredEtudiants[2]?.moyenne}/20
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MeilleursEtudiantsView

