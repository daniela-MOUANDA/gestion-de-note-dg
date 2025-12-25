import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faCalendarAlt,
  faMapMarkerAlt,
  faChartLine
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'
import { useAuth } from '../../contexts/AuthContext'
import { getMonProfilEtudiant } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const ProfileView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: alertError } = useAlert()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStudentProfile = async () => {
      // Vérifier que l'utilisateur est authentifié et est un étudiant
      if (!isAuthenticated || !user) {
        navigate('/login-etudiant')
        return
      }

      if (user.role !== 'ETUDIANT') {
        alertError('Accès refusé. Cette page est réservée aux étudiants.')
        navigate('/dashboard')
        return
      }

      try {
        setLoading(true)
        const etudiantData = await getMonProfilEtudiant()
        setStudent(new StudentModel({
          ...etudiantData,
          credits: etudiantData.nbrCredits || etudiantData.credits || 0,
          totalModules: etudiantData.totalModules || 0,
          rangClasse: etudiantData.rangClasse || 0,
          classe: etudiantData.classe || '',
          semestre: etudiantData.semestreActuel || etudiantData.semestre || '',
          niveauDetail: etudiantData.niveauNom || etudiantData.niveau,
          anneeInscription: etudiantData.anneeAcademique ? etudiantData.anneeAcademique.split('-')[0] : '',
          contactParent: etudiantData.parents && etudiantData.parents.length > 0 ? etudiantData.parents[0] : null
        }))
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
        alertError(error.message || 'Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    loadStudentProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header studentName="Chargement..." />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement de votre profil..." />
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> Impossible de charger votre profil.</span>
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
        <Header studentName={student.fullName} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-24">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Mon profil
            </h1>
          </div>

          {/* Carte de résumé du profil */}
          <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0 overflow-hidden relative">
                  {student.photo ? (
                    <img
                      src={student.photo.startsWith('http') ? student.photo : `http://localhost:3000${student.photo}`}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-2xl sm:text-3xl"
                    style={{ display: student.photo ? 'none' : 'flex' }}
                  />
                </div>
                <div className="flex-1 w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    {student.fullName}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mb-3">
                    {student.programme || 'INPTIC 2025'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                      {student.niveauDetail || student.niveau}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 text-xs" />
                      Étudiant actif
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                      {student.semestre}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-600" />
                      {student.email}
                    </div>
                    {student.telephone && (
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-blue-600" />
                        {student.telephone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Moyenne générale à droite */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 flex-shrink-0 w-full sm:w-48 lg:w-56 relative">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-100">Moyenne générale</h3>
                  <FontAwesomeIcon icon={faChartLine} className="text-xl sm:text-2xl text-white opacity-90" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-white text-center">{student.moyenneGenerale}/20</p>
              </div>
            </div>
          </div>

          {/* Grille des informations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles - Carte de gauche qui occupe toute la hauteur */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                Informations personnelles
              </h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                  <input
                    type="text"
                    value={student.nom}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={student.prenom}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={student.email}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Numéro</label>
                  <input
                    type="text"
                    value={student.telephone || ''}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={student.adresse || ''}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de naissance</label>
                  <input
                    type="text"
                    value={student.dateNaissance || ''}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    value={student.lieuNaissance || ''}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Colonne de droite - Deux cartes empilées */}
            <div className="space-y-6 flex flex-col h-full">
              {/* Informations académiques */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Informations académiques
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Matricule</label>
                    <input
                      type="text"
                      value={student.matricule}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Filière</label>
                    <input
                      type="text"
                      value={student.filiere || student.programme?.split(' ')[0] || ''}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Niveau</label>
                    <input
                      type="text"
                      value={student.niveau}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Semestre</label>
                    <input
                      type="text"
                      value={student.semestre || ''}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Inscription</label>
                    <input
                      type="text"
                      value={student.anneeInscription || ''}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
                    <input
                      type="text"
                      value={student.estActif ? 'Actif' : 'Inactif'}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Parent/Tuteur */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Contact Parent / Tuteur
                </h3>
                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={student.contactParent?.nom || ''}
                        readOnly
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={student.contactParent?.telephone || ''}
                        readOnly
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={student.contactParent?.email || ''}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section des notes (Optionnelle sur le profil mais demandée par le user) */}
          {student.grades && student.grades.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Notes Récentes</h3>
                <p className="text-sm text-slate-600">Aperçu rapide de vos dernières évaluations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Module</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.grades.slice(0, 5).map((grade) => (
                      <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">{grade.module}</div>
                          <div className="text-xs text-slate-500">{grade.code}</div>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className={`text-sm font-bold ${grade.moyenne >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {grade.moyenne}/20
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${grade.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {grade.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <button
                  onClick={() => navigate('/notes')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Voir toutes mes notes →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProfileView

