import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faPrint,
  faCheckCircle,
  faTimesCircle,
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

        const notesData = await getMesNotes()

        if (notesData.success) {
          setGrades(notesData.notes || [])
          setMoyenneGenerale(notesData.moyenneGenerale || 0)
          setCredits(notesData.credits || 0)
          setTotalModules(notesData.totalModules || 0)
          setModulesValides(notesData.modulesValides || 0)
          setSemestre(notesData.semestre || '')

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

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen">
          <Header studentName="Chargement..." />
          <main className="p-6 pt-24 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement de vos notes..." />
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen">
          <Header studentName="Erreur" />
          <main className="p-6 pt-24">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen">
          <Header studentName="Erreur" />
          <main className="p-6 pt-24">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              <strong className="font-bold">Avertissement!</strong>
              <span className="block sm:inline"> Aucune information d'étudiant trouvée.</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen">
        <Header studentName={student.fullName || `${student.prenom} ${student.nom}`} />

        <main className="p-6 pt-24">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Mes Notes</h1>
              <p className="text-slate-600">
                {semestre || student.semestre || 'Semestre'} - Année académique 2025-2026
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                <FontAwesomeIcon icon={faPrint} className="mr-2" />
                Imprimer
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Télécharger PDF
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-600 mb-1">Moyenne générale</p>
              <p className="text-3xl font-bold text-slate-800">{moyenneGenerale.toFixed(2)}/20</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-600 mb-1">Crédits validés</p>
              <p className="text-3xl font-bold text-slate-800">{credits}/60</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-600 mb-1">Total modules</p>
              <p className="text-3xl font-bold text-slate-800">{totalModules}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-600 mb-1">Modules validés</p>
              <p className="text-3xl font-bold text-slate-800">{modulesValides}</p>
            </div>
          </div>

          {/* Tableau des notes */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Détails des notes</h2>
              <p className="text-sm text-slate-600 mt-1">Toutes les notes et évaluations du semestre</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Évaluations</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Moyenne</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Crédit</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, index) => (
                    <tr
                      key={grade.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{grade.module}</p>
                          <p className="text-xs text-slate-500">{grade.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="flex flex-wrap gap-2">
                          {grade.evaluations && grade.evaluations.length > 0 ? (
                            grade.evaluations.map((evalu, i) => (
                              <div key={i} className="flex flex-col items-center bg-slate-100 rounded px-2 py-1 min-w-[50px]">
                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{evalu.name}</span>
                                <span className="text-sm font-semibold text-slate-700">{evalu.valeur}/20</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-xs">Aucune note</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">
                        {grade.moyenne ? grade.moyenne.toFixed(2) : '0.00'}/20
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-700">{grade.credit}</td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${grade.statut === 'Validé'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                        >
                          {grade.statut === 'Validé' ? (
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          ) : (
                            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                          )}
                          {grade.statut}
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

export default NotesView
