import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faChartLine,
  faMedal,
  faBook,
  faTrophy,
  faClock,
  faCalendar,
  faFileAlt,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
  faBell,
  faGraduationCap,
  faFolderOpen,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import { StudentModel } from '../../models/StudentModel'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { useAuth } from '../../contexts/AuthContext'
import { getMyInfo } from '../../api/student'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

const DashboardView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger les données de l'étudiant au montage du composant
  useEffect(() => {
    const loadStudentData = async () => {
      if (!isAuthenticated || !user) {
        navigate('/login-student')
        return
      }

      if (user.role !== 'ETUDIANT') {
        setError('Accès refusé. Vous devez être un étudiant pour accéder à cette page.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const result = await getMyInfo()

        if (result.success && result.data) {
          const studentData = new StudentModel({
            id: result.data.id,
            email: result.data.email,
            matricule: result.data.matricule,
            nom: result.data.nom,
            prenom: result.data.prenom,
            programme: result.data.programme,
            niveau: result.data.niveau,
            classe: result.data.classe,
            photo: result.data.photo,
            moyenneGenerale: result.data.moyenneGenerale || 0,
            credits: result.data.nbrCredits || result.data.credits || 0,
            totalModules: result.data.totalModules || 0,
            rangClasse: result.data.rangClasse || 0,
            estActif: result.data.estActif || true,
            estBoursier: result.data.estBoursier || false,
            semestre: result.data.semestreActuel || result.data.semestre || '',
            totalStudentsInClass: result.data.totalStudentsInClass || 0,
            derniereConnexion: user.derniereConnexion || new Date().toISOString(),
            promotion: result.data.promotion || result.data.annee_promotion
          })

          setStudent(studentData)
          localStorage.setItem('student', JSON.stringify(result.data))
        } else {
          setError(result.error || 'Erreur lors du chargement des données')
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données de l\'étudiant:', err)
        setError('Une erreur est survenue lors du chargement de vos données')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadStudentData()
    }
  }, [isAuthenticated, user, authLoading, navigate])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-5xl text-blue-600 animate-spin mb-4" />
          <p className="text-lg text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-5xl text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erreur</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!student) return null

  // Déterminer l'année de promotion (année d'entrée + 3 ans pour une licence)
  const currentYear = new Date().getFullYear()
  const promotionYear = student.promotion || currentYear

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />

        <main className="p-6 pt-24">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Tableau de Bord
            </h1>
            <p className="text-slate-600">
              Vue d'ensemble de votre parcours académique
            </p>
          </div>

          {/* Carte d'identité et info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profil étudiant */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {student.photo ? (
                    <img
                      src={student.photo.startsWith('http') ? student.photo : `${BACKEND_URL}${student.photo}`}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-3xl text-slate-400"
                    style={{ display: student.photo ? 'none' : 'flex' }}
                  />
                </div>

                {/* Informations */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    {student.fullName}
                  </h2>
                  <p className="text-sm text-slate-600 mb-3">
                    Matricule: {student.matricule}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <FontAwesomeIcon icon={faGraduationCap} className="mr-1.5" />
                      {student.classe || student.niveau}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <FontAwesomeIcon icon={faCalendar} className="mr-1.5" />
                      Promotion {promotionYear}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" />
                      Étudiant actif
                    </span>
                    {student.estBoursier && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <FontAwesomeIcon icon={faMedal} className="mr-1.5" />
                        Boursier
                      </span>
                    )}
                    {student.semestre && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        {student.semestre}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dernière connexion */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faClock} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dernière connexion</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {student.derniereConnexion
                      ? new Date(student.derniereConnexion).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : 'Aujourd\'hui'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques académiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Moyenne générale */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-600" />
                </div>
                <span className="text-xs text-slate-500">Semestre actuel</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">
                {student.moyenneGenerale.toFixed(2)}/20
              </p>
              <p className="text-xs text-slate-600">Moyenne générale</p>
            </div>

            {/* Crédits validés */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faMedal} className="text-purple-600" />
                </div>
                <span className="text-xs text-slate-500">Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">
                {student.credits}/60
              </p>
              <p className="text-xs text-slate-600">Crédits validés</p>
            </div>

            {/* Total modules */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBook} className="text-emerald-600" />
                </div>
                <span className="text-xs text-slate-500">Ce semestre</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">
                {student.totalModules}
              </p>
              <p className="text-xs text-slate-600">Modules inscrits</p>
            </div>

            {/* Rang de classe */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTrophy} className="text-orange-600" />
                </div>
                <span className="text-xs text-slate-500">Classement</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">
                {student.rangClasse ? `${student.rangClasse}/${student.totalStudentsInClass || '--'}` : 'N/A'}
              </p>
              <p className="text-xs text-slate-600">Rang de classe</p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => navigate('/notes')}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-xl" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Mes Notes</h3>
              <p className="text-xs text-slate-600">Consulter mes résultats</p>
            </button>

            <button
              onClick={() => navigate('/emploi-du-temps')}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-purple-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <FontAwesomeIcon icon={faCalendar} className="text-purple-600 text-xl" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Emploi du Temps</h3>
              <p className="text-xs text-slate-600">Planning de la semaine</p>
            </button>

            <button
              onClick={() => navigate('/documents')}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-emerald-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <FontAwesomeIcon icon={faFileAlt} className="text-emerald-600 text-xl" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Documents</h3>
              <p className="text-xs text-slate-600">Mes documents scolaires</p>
            </button>

            <button
              onClick={() => navigate('/mon-dossier')}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-orange-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <FontAwesomeIcon icon={faFolderOpen} className="text-orange-600 text-xl" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Mon Dossier</h3>
              <p className="text-xs text-slate-600">Documents d'inscription</p>
            </button>
          </div>

          {/* Notifications/Annonces */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faBell} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Bienvenue à l'INPTIC !</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Pensez à compléter votre dossier d'inscription en téléversant vos documents dans la section "Mon Dossier".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardView
