import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  faBook,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'
import { getMesNotes } from '../../api/scolarite'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const NotesView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [student, setStudent] = useState(null)
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [moyenneGenerale, setMoyenneGenerale] = useState(0)
  const [credits, setCredits] = useState(0)
  const [totalModules, setTotalModules] = useState(0)
  const [modulesValides, setModulesValides] = useState(0)
  const [semestre, setSemestre] = useState('')

  useEffect(() => {
    const loadNotes = async () => {
      if (!isAuthenticated || !user || user.role !== 'ETUDIANT') {
        navigate('/login-etudiant')
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Charger les notes depuis l'API
        const notesData = await getMesNotes()

        if (notesData.success) {
          setGrades(notesData.notes || [])
          setMoyenneGenerale(notesData.moyenneGenerale || 0)
          setCredits(notesData.credits || 0)
          setTotalModules(notesData.totalModules || 0)
          setModulesValides(notesData.modulesValides || 0)
          setSemestre(notesData.semestre || '')

          // Charger les données de l'étudiant depuis localStorage ou créer un modèle minimal
          const studentData = localStorage.getItem('student')
          if (studentData) {
            const parsed = JSON.parse(studentData)
            setStudent(new StudentModel({
              ...parsed,
              moyenneGenerale: notesData.moyenneGenerale || parsed.moyenneGenerale || 0,
              credits: notesData.credits || parsed.credits || 0,
              totalModules: notesData.totalModules || parsed.totalModules || 0,
              semestre: notesData.semestre || parsed.semestre || ''
            }))
          } else {
            // Créer un modèle minimal si pas de données en localStorage
            setStudent(new StudentModel({
              id: user.id,
              email: user.email,
              nom: user.nom || '',
              prenom: user.prenom || '',
              moyenneGenerale: notesData.moyenneGenerale || 0,
              credits: notesData.credits || 0,
              totalModules: notesData.totalModules || 0,
              semestre: notesData.semestre || ''
            }))
          }
        } else {
          setError(notesData.error || 'Erreur lors du chargement des notes')
        }
      } catch (err) {
        console.error('Erreur lors du chargement des notes:', err)
        setError(err.message || 'Erreur lors du chargement des notes')
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [isAuthenticated, user, navigate])

  const handleDownloadPDF = () => {
    // TODO: Implémenter le téléchargement PDF
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header studentName="Chargement..." />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement de vos notes..." />
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header studentName="Erreur" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header studentName="Erreur" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Avertissement!</strong>
              <span className="block sm:inline"> Aucune information d'étudiant trouvée.</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName || `${student.prenom} ${student.nom}`} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24">
          {/* Titre et boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Notes
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {semestre || student.semestre || 'Semestre'} - Année académique 2025-2026
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
                  <p className="text-sm text-slate-500 mb-1">Moyenne générale du semestre en cours</p>
                  <p className="text-3xl font-bold text-slate-800">{moyenneGenerale.toFixed(2)}/20</p>
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
                  <p className="text-sm text-slate-500 mb-1">Crédits validés</p>
                  <p className="text-3xl font-bold text-slate-800">{credits}/60</p>
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
                  <p className="text-3xl font-bold text-slate-800">{totalModules}</p>
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
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
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
                          {grade.note1 !== null && grade.note1 !== undefined ? `${grade.note1}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">
                          {grade.note2 !== null && grade.note2 !== undefined ? `${grade.note2}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">
                          {grade.note3 !== null && grade.note3 !== undefined ? `${grade.note3}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base font-semibold text-slate-800">
                          {grade.examen !== null && grade.examen !== undefined ? `${grade.examen}/20` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          {grade.moyenne ? grade.moyenne.toFixed(2) : '0.00'}/20
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm sm:text-base text-slate-700">{grade.credit}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${grade.statut === 'Validé'
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

