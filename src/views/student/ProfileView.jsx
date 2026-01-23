import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendar,
  faGraduationCap,
  faIdCard
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
  }, [isAuthenticated, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen">
          <Header studentName="Chargement..." />
          <main className="p-6 pt-24 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement de votre profil..." />
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Erreur!</strong>
              <span className="block sm:inline"> Impossible de charger votre profil.</span>
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
        <Header studentName={student.fullName} />

        <main className="p-6 pt-24">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Mon profil</h1>
            <p className="text-slate-600">Informations personnelles et académiques</p>
          </div>

          {/* Carte principale du profil */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Photo */}
              <div className="w-24 h-24 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  className="text-4xl text-slate-400"
                  style={{ display: student.photo ? 'none' : 'flex' }}
                />
              </div>

              {/* Informations */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{student.fullName}</h2>
                <p className="text-slate-600 mb-4">{student.programme || 'INPTIC 2025'}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded border border-slate-200">
                    {student.niveauDetail || student.niveau}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded border border-green-200">
                    Étudiant actif
                  </span>
                  {student.semestre && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded border border-slate-200">
                      {student.semestre}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-slate-600">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-slate-400" />
                    {student.email}
                  </div>
                  {student.telephone && (
                    <div className="flex items-center text-slate-600">
                      <FontAwesomeIcon icon={faPhone} className="mr-2 text-slate-400" />
                      {student.telephone}
                    </div>
                  )}
                </div>
              </div>

              {/* Moyenne */}
              <div className="bg-slate-100 rounded-lg p-6 text-center border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Moyenne générale</p>
                <p className="text-4xl font-bold text-slate-800">{student.moyenneGenerale}/20</p>
              </div>
            </div>
          </div>

          {/* Grille d'informations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                Informations personnelles
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                  <input
                    type="text"
                    value={student.nom}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={student.prenom}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={student.email}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={student.telephone || 'Non renseigné'}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={student.adresse || 'Non renseigné'}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de naissance</label>
                  <input
                    type="text"
                    value={student.dateNaissance || 'Non renseigné'}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-6">
              {/* Informations académiques */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                  Informations académiques
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Matricule</label>
                    <input
                      type="text"
                      value={student.matricule}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Filière</label>
                    <input
                      type="text"
                      value={student.filiere || student.programme?.split(' ')[0] || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Niveau</label>
                    <input
                      type="text"
                      value={student.niveau}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Semestre</label>
                    <input
                      type="text"
                      value={student.semestre || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Année d'inscription</label>
                    <input
                      type="text"
                      value={student.anneeInscription || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
                    <input
                      type="text"
                      value={student.estActif ? 'Actif' : 'Inactif'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact parent/tuteur */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                  Contact Parent / Tuteur
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={student.contactParent?.nom || 'Non renseigné'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={student.contactParent?.telephone || 'Non renseigné'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={student.contactParent?.email || 'Non renseigné'}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfileView
