import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, 
  faChartLine, 
  faMedal, 
  faBook, 
  faTrophy,
  faClock,
  faChevronLeft,
  faChevronRight,
  faChalkboardTeacher,
  faMapMarkerAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { StudentModel } from '../../models/StudentModel'
import { DashboardController } from '../../controllers/DashboardController'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'

const DashboardView = () => {
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

  const [student, setStudent] = useState(() => {
    // Essayer de récupérer depuis localStorage, sinon utiliser les données par défaut
    const studentData = localStorage.getItem('student')
    if (studentData) {
      return new StudentModel(JSON.parse(studentData))
    }
    return new StudentModel(defaultStudentData)
  })
  
  const [controller] = useState(() => new DashboardController())
  const [viewModel, setViewModel] = useState(controller.viewModel)

  const handlePreviousWeek = () => {
    const updated = controller.previousWeek()
    setViewModel({ ...updated })
  }

  const handleNextWeek = () => {
    const updated = controller.nextWeek()
    setViewModel({ ...updated })
  }

  const daysOfWeek = controller.getDaysOfWeek()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Message de bienvenue */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-slate-800">
              Bienvenue, {student.fullName} !
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Nous sommes ravis de vous revoir. Voici un aperçu de votre tableau de bord.
            </p>
          </div>

          {/* Carte étudiant et dernière connexion */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 lg:justify-between">
            {/* Carte d'information étudiant */}
            <div className="lg:flex-1 lg:max-w-2xl bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg flex-shrink-0">
                  <FontAwesomeIcon icon={faUser} className="text-2xl sm:text-3xl" />
                </div>
                <div className="flex-1 w-full">
                  <p className="text-base sm:text-lg font-semibold text-slate-800 mb-3">
                    {student.identifiantComplet}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 text-xs" />
                      Étudiant actif
                    </span>
                    {student.estBoursier && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 text-xs" />
                        Boursier
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                      {student.semestre}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dernière connexion */}
            <div className="lg:flex-shrink-0 lg:w-80 bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-3">
                <FontAwesomeIcon icon={faClock} className="text-blue-600 mr-2 text-lg" />
                <h3 className="text-sm font-medium text-slate-600">Dernière connexion</h3>
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-800">
                {student.derniereConnexion 
                  ? new Date(student.derniereConnexion).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Métriques clés */}
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

            {/* Total modules */}
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

            {/* Rang de classe */}
            <div className="bg-white rounded-lg border-l-4 border-orange-500 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Rang de classe</p>
                  <p className="text-3xl font-bold text-slate-800">{student.rangClasse}/45</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <FontAwesomeIcon icon={faTrophy} className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Emploi du temps */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <button
                onClick={handlePreviousWeek}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 w-full sm:w-auto justify-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                Semaine précédente
              </button>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 text-center">
                {controller.getWeekLabel()}
              </h3>
              <button
                onClick={handleNextWeek}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 w-full sm:w-auto justify-center"
              >
                Semaine suivante
                <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {daysOfWeek.map((day) => {
                const courses = controller.getCoursesForDay(day.name)
                return (
                  <div
                    key={day.name}
                    className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200 min-h-[180px] sm:min-h-[200px]"
                  >
                    <h4 className="font-semibold text-sm sm:text-base text-slate-800 mb-3 pb-2 border-b border-slate-200">
                      {day.name} {day.dateStr}
                    </h4>
                    {courses.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="bg-white rounded-lg p-2 sm:p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="inline-block text-white text-xs px-2 py-1 rounded mb-2 bg-gradient-to-r from-blue-600 to-blue-700 font-medium">
                              {course.type}
                            </span>
                            <p className="text-xs sm:text-sm font-medium text-slate-700 mb-1">
                              {course.horaire}
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                              {course.matiere}
                            </p>
                            {course.professeur && (
                              <div className="flex items-center text-xs text-slate-600 mb-1">
                                <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-1.5 text-blue-600" />
                                {course.professeur}
                              </div>
                            )}
                            {course.salle && (
                              <div className="flex items-center text-xs text-slate-600">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1.5 text-red-500" />
                                {course.salle}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">Aucun</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardView

