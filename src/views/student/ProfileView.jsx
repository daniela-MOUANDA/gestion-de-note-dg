import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faEnvelope, faPhone, faMapMarkerAlt, faCalendar,
  faGraduationCap, faIdCard, faSpinner, faShieldAlt, faUsers
} from '@fortawesome/free-solid-svg-icons'
import StudentLayout from '../../components/student/StudentLayout'
import { useAuth } from '../../contexts/AuthContext'
import { getMonProfilEtudiant } from '../../api/scolarite'
import { StudentModel } from '../../models/StudentModel'
import { useAlert } from '../../contexts/AlertContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ─── Champ lecture seule ─────────────────────────────────────────────────
const InfoField = ({ label, value, icon }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
      {icon && <FontAwesomeIcon icon={icon} className="w-3 h-3" />}
      {label}
    </p>
    <p className="text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-h-[36px] flex items-center">
      {value || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
    </p>
  </div>
)

// ─── Section carte ────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
      <FontAwesomeIcon icon={icon} className="text-blue-500 w-4 h-4" />
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
    </div>
    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
)

const ProfileView = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: alertError } = useAlert()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) { navigate('/login-etudiant'); return }
    if (user.role !== 'ETUDIANT') { navigate('/dashboard'); return }

    const load = async () => {
      try {
        const d = await getMonProfilEtudiant()
        setStudent(new StudentModel({
          ...d,
          credits: d.nbrCredits || d.credits || 0,
          totalModules: d.totalModules || 0,
          rangClasse: d.rangClasse || 0,
          classe: d.classe || '',
          semestre: d.semestreActuel || d.semestre || '',
          niveauDetail: d.niveauNom || d.niveau,
          anneeInscription: d.anneeAcademique ? d.anneeAcademique.split('-')[0] : '',
          contactParent: d.parents?.length > 0 ? d.parents[0] : null,
        }))
      } catch (e) {
        alertError(e.message || 'Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user?.id])

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center py-24">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600 mr-3" />
        <span className="text-slate-500">Chargement du profil…</span>
      </div>
    </StudentLayout>
  )

  if (!student) return (
    <StudentLayout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        Impossible de charger votre profil.
      </div>
    </StudentLayout>
  )

  const photoSrc = student.photo
    ? (student.photo.startsWith('http') ? student.photo : `${BACKEND_URL}${student.photo}`)
    : null

  const moyenne = student.moyenneGenerale ?? 0
  const moyenneColor = moyenne >= 14 ? 'text-emerald-600' : moyenne >= 10 ? 'text-blue-600' : 'text-red-600'

  return (
    <StudentLayout studentName={student.fullName} studentPhoto={student.photo}>

      {/* ── Bannière profil ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-start gap-5">

          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-4 ring-white shadow-md">
              {photoSrc
                ? <img src={photoSrc} alt={student.fullName} className="w-full h-full object-cover"
                       onError={e => e.target.style.display = 'none'} />
                : <FontAwesomeIcon icon={faUser} className="text-3xl text-slate-400" />
              }
            </div>
          </div>

          {/* Identité */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">{student.fullName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{student.programme || 'INPTIC'}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                #{student.matricule}
              </span>
              {student.classe && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                  {student.classe}
                </span>
              )}
              {student.semestre && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                  {student.semestre}
                </span>
              )}
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                {student.estActif ? 'Actif' : 'Inactif'}
              </span>
              {student.estBoursier && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                  Boursier
                </span>
              )}
            </div>
          </div>

          {/* Moyenne (visible desktop) */}
          <div className="hidden sm:flex flex-col items-center flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500 mb-1">Moyenne</p>
            <p className={`text-3xl font-bold ${moyenneColor}`}>{moyenne.toFixed(2)}</p>
            <p className="text-xs text-slate-400">/20</p>
          </div>
        </div>

        {/* Moyenne mobile */}
        <div className="sm:hidden mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <p className="text-sm text-slate-500">Moyenne générale</p>
          <p className={`ml-auto text-xl font-bold ${moyenneColor}`}>{moyenne.toFixed(2)}/20</p>
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Infos personnelles */}
        <Section title="Informations personnelles" icon={faUser}>
          <InfoField label="Nom"         value={student.nom}           icon={faUser} />
          <InfoField label="Prénom"      value={student.prenom} />
          <InfoField label="Email"       value={student.email}         icon={faEnvelope} />
          <InfoField label="Téléphone"   value={student.telephone}     icon={faPhone} />
          <InfoField label="Adresse"     value={student.adresse}       icon={faMapMarkerAlt} />
          <InfoField label="Date de naissance"
            value={student.dateNaissance
              ? new Date(student.dateNaissance).toLocaleDateString('fr-FR')
              : null}
            icon={faCalendar}
          />
        </Section>

        {/* Infos académiques */}
        <Section title="Informations académiques" icon={faGraduationCap}>
          <InfoField label="Matricule"       value={student.matricule}        icon={faIdCard} />
          <InfoField label="Filière"         value={student.filiere || student.programme} />
          <InfoField label="Niveau"          value={student.niveauDetail || student.niveau} />
          <InfoField label="Classe"          value={student.classe} />
          <InfoField label="Semestre actuel" value={student.semestre} />
          <InfoField label="Année d'inscription" value={student.anneeInscription} />
          <InfoField label="Crédits validés"
            value={student.credits ? `${student.credits} crédits` : null}
            icon={faShieldAlt}
          />
          <InfoField label="Statut"
            value={student.estActif ? 'Actif' : 'Inactif'}
          />
        </Section>

        {/* Contact parent */}
        {student.contactParent && (
          <Section title="Contact Parent / Tuteur" icon={faUsers}>
            <InfoField label="Nom complet"  value={student.contactParent.nom}       icon={faUser} />
            <InfoField label="Téléphone"    value={student.contactParent.telephone}  icon={faPhone} />
            <InfoField label="Email"        value={student.contactParent.email}      icon={faEnvelope} />
            <InfoField label="Lien"         value={student.contactParent.lien} />
          </Section>
        )}

      </div>
    </StudentLayout>
  )
}

export default ProfileView
