import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faQuestionCircle,
  faSearch,
  faEnvelope,
  faPhone,
  faClock,
  faChevronDown,
  faChevronUp,
  faBook,
  faGraduationCap,
  faFileAlt,
  faCalendarAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const AideView = () => {
  // Données par défaut pour l'affichage sans connexion
  const defaultStudentData = {
    id: 1,
    email: 'lidvigembo@mail.com',
    matricule: 'INPTIC2025',
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
    semestre: 'Semestre 6',
    derniereConnexion: new Date().toISOString()
  }

  const [student] = useState(() => {
    const studentData = localStorage.getItem('student')
    if (studentData) {
      return new StudentModel(JSON.parse(studentData))
    }
    return new StudentModel(defaultStudentData)
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  const faqCategories = [
    {
      id: 'general',
      title: 'Questions générales',
      icon: faQuestionCircle,
      questions: [
        {
          id: 1,
          question: 'Comment accéder à mon espace étudiant ?',
          answer: 'Vous pouvez accéder à votre espace étudiant en utilisant votre email et votre numéro d\'étudiant sur la page de connexion.'
        },
        {
          id: 2,
          question: 'J\'ai oublié mon mot de passe, que faire ?',
          answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé.'
        },
        {
          id: 3,
          question: 'Comment modifier mes informations personnelles ?',
          answer: 'Rendez-vous dans la section "Profil" et contactez l\'administration pour toute modification de vos informations personnelles.'
        }
      ]
    },
    {
      id: 'notes',
      title: 'Notes et évaluations',
      icon: faGraduationCap,
      questions: [
        {
          id: 4,
          question: 'Comment consulter mes notes ?',
          answer: 'Accédez à la section "Notes" dans le menu de navigation pour voir toutes vos notes par module.'
        },
        {
          id: 5,
          question: 'Comment faire une réclamation sur une note ?',
          answer: 'Rendez-vous dans la section "Réclamations", remplissez le formulaire et joignez les documents nécessaires (feuilles de devoirs si évaluation sur table).'
        },
        {
          id: 6,
          question: 'Quand sont publiées les notes ?',
          answer: 'Les notes sont généralement publiées dans les 15 jours suivant l\'évaluation. Vous recevrez une notification lorsqu\'une nouvelle note est disponible.'
        }
      ]
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: faFileAlt,
      questions: [
        {
          id: 7,
          question: 'Comment télécharger mes documents ?',
          answer: 'Allez dans la section "Documents", sélectionnez le type de document souhaité, puis cliquez sur "Télécharger".'
        },
        {
          id: 8,
          question: 'Quels documents sont disponibles ?',
          answer: 'Vous pouvez télécharger votre emploi du temps, vos bulletins de notes, et autres documents académiques officiels.'
        }
      ]
    },
    {
      id: 'emploi',
      title: 'Emploi du temps',
      icon: faCalendarAlt,
      questions: [
        {
          id: 9,
          question: 'Comment consulter mon emploi du temps ?',
          answer: 'Accédez à la section "Emploi du temps" pour voir votre planning hebdomadaire. Vous pouvez également le télécharger en PDF.'
        },
        {
          id: 10,
          question: 'Mon emploi du temps n\'est pas à jour, que faire ?',
          answer: 'Contactez le secrétariat académique ou votre responsable de filière pour signaler le problème.'
        }
      ]
    }
  ]

  const toggleFaq = (questionId) => {
    setOpenFaq(openFaq === questionId ? null : questionId)
  }

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Aide
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Trouvez des réponses à vos questions fréquentes
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 mb-6">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          {/* FAQ par catégories */}
          <div className="space-y-6 mb-6">
            {filteredFaqs.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-md border border-slate-200">
                <div className="p-4 sm:p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={category.icon} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                      {category.title}
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-200">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="p-4 sm:p-6">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="text-sm sm:text-base font-medium text-slate-800 pr-4">
                          {faq.question}
                        </span>
                        <FontAwesomeIcon
                          icon={openFaq === faq.id ? faChevronUp : faChevronDown}
                          className="text-slate-400 flex-shrink-0"
                        />
                      </button>
                      {openFaq === faq.id && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section contact */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 sm:p-8 border border-blue-500 text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Besoin d'aide supplémentaire ?</h2>
            <p className="text-blue-100 mb-6 text-sm sm:text-base">
              Notre équipe est là pour vous aider. Contactez-nous par email ou téléphone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FontAwesomeIcon icon={faEnvelope} className="text-xl" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 mb-1">Email</p>
                  <p className="text-sm font-medium">support@inptic.edu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FontAwesomeIcon icon={faPhone} className="text-xl" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 mb-1">Téléphone</p>
                  <p className="text-sm font-medium">+237 XXX XXX XXX</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="text-xl" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 mb-1">Horaires</p>
                  <p className="text-sm font-medium">Lun-Ven: 8h-17h</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AideView

