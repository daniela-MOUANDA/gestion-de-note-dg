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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />

        <main className="flex-1 p-6 pt-24">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Centre d'Aide</h1>
            <p className="text-slate-500">Trouvez rapidement des réponses à vos questions techniques ou administratives</p>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 mb-8">
            <div className="relative group">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Comment pouvons-nous vous aider aujourd'hui ?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* FAQ par catégories */}
          <div className="space-y-6 mb-10">
            {filteredFaqs.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-white shadow-xs border border-slate-100 flex items-center justify-center text-slate-400">
                      <FontAwesomeIcon icon={category.icon} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {category.title}
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="p-0 transition-all">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 transition-colors group"
                      >
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                          {faq.question}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaq === faq.id ? 'bg-blue-50 text-blue-600 rotate-180' : 'text-slate-300'}`}>
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            fontSize="12"
                          />
                        </div>
                      </button>
                      {openFaq === faq.id && (
                        <div className="px-6 pb-6 pt-0 animate-fadeIn">
                          <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section contact */}
          <div className="bg-slate-900 rounded-lg p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Pas encore de réponse ?</h2>
              <p className="text-slate-400 text-sm">
                Notre assistance technique est disponible pour vous accompagner dans toutes vos démarches sur la plateforme.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full lg:w-3/5">
              <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
                  <p className="text-xs font-semibold text-white truncate">support@inptic.edu</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FontAwesomeIcon icon={faPhone} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Téléphone</p>
                  <p className="text-xs font-semibold text-white">+241 XX XX XX XX</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horaires</p>
                  <p className="text-xs font-semibold text-white whitespace-nowrap">Lun-Ven: 08h - 17h</p>
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

