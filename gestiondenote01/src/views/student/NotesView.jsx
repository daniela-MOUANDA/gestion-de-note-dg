import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faDownload,
  faPrint,
  faFilePdf,
  faArrowTrendUp,
  faArrowTrendDown,
  faCheckCircle,
  faTimesCircle,
  faChartLine,
  faMedal,
  faBook
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const NotesView = () => {
  // Données par défaut pour l'affichage sans connexion
  const defaultStudentData = {
    id: 1,
    email: 'lidvige.mbo@example.com',
    matricule: '1045937',
    nom: 'MBO',
    prenom: 'Lidvige',
    programme: 'GI 2025 Génie Informatique',
    niveau: 'L3',
    moyenneGenerale: 14.5,
    credits: 24,
    totalModules: 15,
    rangClasse: 5,
    estActif: true,
    estBoursier: true,
    semestre: 'Semestre 5',
    derniereConnexion: new Date().toISOString()
  }

  const [student] = useState(() => {
    const studentData = localStorage.getItem('student')
    if (studentData) {
      return new StudentModel(JSON.parse(studentData))
    }
    return new StudentModel(defaultStudentData)
  })

  // Données simulées des notes
  const [grades] = useState([
    {
      id: 1,
      module: 'Programmation web',
      code: 'INFO3.01.MATTY',
      note1: 14,
      note2: 16,
      note3: null,
      examen: 16,
      moyenne: 15.5,
      credit: 6,
      statut: 'Validé',
      tendance: 'up'
    },
    {
      id: 2,
      module: 'Base de donnée',
      code: 'INFO3.01.OSSENI',
      note1: 12,
      note2: 5,
      note3: null,
      examen: 4,
      moyenne: 7,
      credit: 3,
      statut: 'Non validé',
      tendance: 'down'
    },
    {
      id: 3,
      module: 'Réseaux',
      code: 'INFO3.02.OSSENE',
      note1: 15,
      note2: 14,
      note3: 16,
      examen: 15,
      moyenne: 15,
      credit: 4,
      statut: 'Validé',
      tendance: 'up'
    },
    {
      id: 4,
      module: 'Système d\'exploitation',
      code: 'INFO3.03.MARTIN',
      note1: 10,
      note2: 12,
      note3: 11,
      examen: 13,
      moyenne: 11.5,
      credit: 3,
      statut: 'Non validé',
      tendance: 'down'
    },
    {
      id: 5,
      module: 'Algorithmique avancée',
      code: 'INFO3.04.DUPONT',
      note1: 18,
      note2: 17,
      note3: 19,
      examen: 18,
      moyenne: 18,
      credit: 5,
      statut: 'Validé',
      tendance: 'up'
    }
  ])

  const modulesValides = grades.filter(g => g.statut === 'Validé').length

  const handleDownloadPDF = () => {
    // TODO: Implémenter le téléchargement PDF
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Titre et boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Notes
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {student.semestre} - Année académique 2024-2025
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                <span className="hidden sm:inline">PDF</span>
                <span className="hidden md:inline ml-2">2.5 MB</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faPrint} className="mr-2" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            </div>
          </div>

          {/* Cartes de métriques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            {/* Moyenne générale */}
            <div className="bg-white rounded-lg border-l-4 border-blue-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Moyenne générale</p>
                  <p className="text-3xl font-bold text-slate-800">{student.moyenneGenerale}/20</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Crédits */}
            <div className="bg-white rounded-lg border-l-4 border-purple-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Crédits</p>
                  <p className="text-3xl font-bold text-slate-800">{student.credits}/60</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faMedal} className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Total de module */}
            <div className="bg-white rounded-lg border-l-4 border-violet-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Total de module</p>
                  <p className="text-3xl font-bold text-slate-800">{student.totalModules}</p>
                </div>
                <div className="bg-violet-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faBook} className="text-violet-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Modules validés */}
            <div className="bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Modules validés</p>
                  <p className="text-3xl font-bold text-slate-800">{modulesValides}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Détails des notes */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* En-tête de la section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-800">Détails des notes</h2>
              <p className="text-sm sm:text-base text-slate-600">
                Toutes les notes et évaluations du semestre
              </p>
            </div>

            {/* Tableau des notes */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] sm:max-h-[700px] lg:max-h-[800px]">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Module</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Note 1</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Note 2</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Note 3</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Examen</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Moyenne</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Crédit</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Statut</th>
                    <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, index) => (
                    <tr 
                      key={grade.id} 
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-slate-800">{grade.module}</p>
                          <p className="text-xs text-slate-500 mt-1">{grade.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">
                          {grade.note1 !== null ? `${grade.note1}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">
                          {grade.note2 !== null ? `${grade.note2}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">
                          {grade.note3 !== null ? `${grade.note3}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base font-semibold text-slate-800">
                          {grade.examen}/20
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          {grade.moyenne}/20
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">{grade.credit}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          grade.statut === 'Validé' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {grade.statut === 'Validé' ? (
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          ) : (
                            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                          )}
                          {grade.statut}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {grade.tendance === 'up' ? (
                            <FontAwesomeIcon 
                              icon={faArrowTrendUp} 
                              className="text-emerald-500 text-lg"
                            />
                          ) : (
                            <FontAwesomeIcon 
                              icon={faArrowTrendDown} 
                              className="text-red-500 text-lg"
                            />
                          )}
                        </div>
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

export default NotesView

