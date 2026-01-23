import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faChalkboardTeacher,
  faMapMarkerAlt,
  faDownload,
  faPrint,
  faFilePdf,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { DashboardController } from '../../controllers/DashboardController'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'
import { getMyInfo } from '../../api/student'

const EmploiDuTempsView = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [student, setStudent] = useState(null)
  const [controller] = useState(() => new DashboardController([]))
  const [viewModel, setViewModel] = useState(controller.viewModel)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        const result = await getMyInfo()

        if (result.success && result.data) {
          const studentModel = new StudentModel({
            ...result.data,
            moyenneGenerale: result.data.moyenneGenerale || 0,
            credits: result.data.nbrCredits || result.data.credits || 0,
            semestre: result.data.semestreActuel || result.data.semestre || '',
            timetable: result.data.timetable || []
          })

          setStudent(studentModel)

          // Mettre à jour le contrôleur avec l'emploi du temps réel
          controller.setCourses(studentModel.timetable || [])
          setViewModel({ ...controller.viewModel })
        } else {
          setError(result.error || "Impossible de charger les données")
        }

        setLoading(false)
      } catch (err) {
        console.error("Erreur lors du chargement de l'emploi du temps:", err)
        setError("Impossible de charger l'emploi du temps. Veuillez réessayer plus tard.")
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [controller])

  const handlePreviousWeek = () => {
    const updated = controller.previousWeek()
    setViewModel({ ...updated })
  }

  const handleNextWeek = () => {
    const updated = controller.nextWeek()
    setViewModel({ ...updated })
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  const daysOfWeek = controller.getDaysOfWeek()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500 mb-4" />
            <p className="text-slate-600 font-medium">Chargement de votre emploi du temps...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen p-6 pt-24">
          <Header studentName="Étudiant" />
          <div className="bg-white rounded-lg shadow-sm border border-red-100 p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Oups !</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student?.fullName || "Étudiant"} />

        <main className="flex-1 p-6 pt-24">
          {/* Titre et boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Emploi du temps</h1>
              <p className="text-slate-500">Consultez votre planning hebdomadaire et vos salles de cours</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
                <span className="hidden sm:inline">Télécharger PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faPrint} className="mr-2 text-slate-500" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            </div>
          </div>

          {/* Emploi du temps */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            {/* Navigation semaine */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
              <button
                onClick={handlePreviousWeek}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all w-full sm:w-auto justify-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                Semaine précédente
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">
                  {controller.getWeekLabel()}
                </h3>
              </div>
              <button
                onClick={handleNextWeek}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all w-full sm:w-auto justify-center"
              >
                Semaine suivante
                <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
              </button>
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {daysOfWeek.map((day) => {
                const courses = controller.getCoursesForDay(day)
                return (
                  <div
                    key={day.name}
                    className="flex flex-col bg-slate-50/50 rounded-lg border border-slate-100 p-4 min-h-[300px]"
                  >
                    <div className="mb-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{day.name}</div>
                      <div className="text-lg font-bold text-slate-700">{day.dateStr}</div>
                    </div>

                    {courses.length > 0 ? (
                      <div className="space-y-4">
                        {courses.map((course) => {
                          const isEvaluation = course.type?.toUpperCase() !== 'COURS'

                          return (
                            <div
                              key={course.id}
                              className={`rounded border p-3 shadow-xs transition-colors ${isEvaluation
                                ? 'bg-red-50 border-red-200 hover:border-red-300'
                                : 'bg-white border-slate-200 hover:border-blue-300'
                                }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${isEvaluation ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {course.type}
                                </span>
                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${isEvaluation ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-50'
                                  }`}>
                                  {course.horaire}
                                </span>
                              </div>

                              <p className={`text-sm font-bold leading-tight mb-3 ${isEvaluation ? 'text-red-900' : 'text-slate-800'
                                }`}>
                                {course.matiere}
                              </p>

                              <div className="space-y-1.5">
                                {course.professeur && (
                                  <div className={`flex items-center text-[11px] ${isEvaluation ? 'text-red-700/70' : 'text-slate-500'
                                    }`}>
                                    <FontAwesomeIcon icon={faChalkboardTeacher} className={`mr-2 w-3 ${isEvaluation ? 'text-red-400' : 'text-slate-400'
                                      }`} />
                                    {course.professeur}
                                  </div>
                                )}
                                {course.salle && (
                                  <div className={`flex items-center text-[11px] ${isEvaluation ? 'text-red-700/70' : 'text-slate-500'
                                    }`}>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className={`mr-2 w-3 ${isEvaluation ? 'text-red-400' : 'text-slate-400'
                                      }`} />
                                    <span className="font-semibold">{course.salle}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                        <p className="text-slate-300 text-xs font-medium italic">Aucun cours</p>
                      </div>
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

