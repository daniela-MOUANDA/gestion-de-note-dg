import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faChevronRight,
  faChalkboardTeacher,
  faMapMarkerAlt,
  faDownload,
  faPrint,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons'
import { DashboardController } from '../../controllers/DashboardController'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const EmploiDuTempsView = () => {
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

  const handleDownloadPDF = () => {
    // TODO: Implémenter le téléchargement PDF
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  const daysOfWeek = controller.getDaysOfWeek()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          {/* Titre et boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Emploi du temps</h1>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                <span className="hidden sm:inline">2.5 MB</span>
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

          {/* Emploi du temps */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            {/* Navigation semaine */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 pb-4 border-b border-slate-200">
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

            {/* Grille des jours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {daysOfWeek.map((day) => {
                const courses = controller.getCoursesForDay(day.name)
                return (
                  <div
                    key={day.name}
                    className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200 shadow-sm min-h-[200px] sm:min-h-[250px]"
                  >
                    <h4 className="font-semibold text-sm sm:text-base text-slate-800 mb-3 pb-2 border-b border-slate-200">
                      {day.name} {day.dateStr}
                    </h4>
                    {courses.length > 0 ? (
                      <div className="space-y-3">
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <span className={`inline-block text-white text-xs px-2 py-1 rounded mb-2 font-medium ${
                              course.type === 'Cours' 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                                : 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                            }`}>
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
                      <p className="text-slate-400 text-sm text-center py-8">Aucun</p>
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

export default EmploiDuTempsView

