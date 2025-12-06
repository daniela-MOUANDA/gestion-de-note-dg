import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBell,
  faCheck,
  faTrash,
  faEye,
  faFileAlt,
  faClock,
  faGraduationCap,
  faCog,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { StudentModel } from '../../models/StudentModel'

const NotificationsView = () => {
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

  // Données simulées des notifications
  const notificationsData = [
    {
      id: 1,
      type: 'Académiques',
      icon: faFileAlt,
      message: 'Nouvelle note disponible : "Programmation web"',
      date: new Date(),
      isNew: true,
      action: 'Voir la note'
    },
    {
      id: 2,
      type: 'Personnelles',
      icon: faClock,
      message: 'Rappel : Conférence sur l\'IA à "16h00"',
      date: new Date(),
      isNew: true
    },
    {
      id: 3,
      type: 'Système',
      icon: faCog,
      message: 'Mise à jour du système disponible',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
      isNew: false
    }
  ]

  const [notifications] = useState(notificationsData)

  const stats = {
    academique: 1, // 1 notification académique
    systeme: 1, // 1 notification système
    personnelles: 1
  }

  const todayNotifications = notifications.filter(n => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const notifDate = new Date(n.date)
    notifDate.setHours(0, 0, 0, 0)
    return notifDate.getTime() === today.getTime()
  })

  const weekNotifications = notifications.filter(n => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const notifDate = new Date(n.date)
    return notifDate >= weekAgo && !todayNotifications.includes(n)
  })

  const getColorClasses = (type, isOld = false) => {
    // Si c'est une ancienne notification académique, utiliser orange
    if (type === 'Académiques' && isOld) {
      return {
        border: 'border-orange-500',
        tag: 'bg-orange-100 text-orange-700',
        iconBg: 'bg-orange-100',
        icon: 'text-orange-600'
      }
    }
    
    const colors = {
      'Académiques': {
        border: 'border-blue-500',
        tag: 'bg-blue-100 text-blue-700',
        iconBg: 'bg-blue-100',
        icon: 'text-blue-600'
      },
      'Personnelles': {
        border: 'border-emerald-500',
        tag: 'bg-emerald-100 text-emerald-700',
        iconBg: 'bg-emerald-100',
        icon: 'text-emerald-600'
      },
      'Système': {
        border: 'border-orange-500',
        tag: 'bg-orange-100 text-orange-700',
        iconBg: 'bg-orange-100',
        icon: 'text-orange-600'
      }
    }
    return colors[type] || colors['Académiques']
  }

  const handleMarkAsRead = () => {
    // TODO: Implémenter la fonctionnalité
    console.log('Marquer comme lu')
  }

  const handleDelete = () => {
    // TODO: Implémenter la fonctionnalité
    console.log('Supprimer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={student.fullName} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          {/* Titre */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Notifications
            </h1>
          </div>

          {/* Statistiques et actions */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6 border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Indicateurs circulaires */}
              <div className="flex gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-700 bg-white flex flex-col items-center justify-center relative p-2">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-700 text-sm sm:text-base mb-0.5" />
                      <span className="text-blue-700 font-bold text-xs sm:text-sm mb-0.5">{stats.academique}</span>
                      <span className="text-blue-700 text-[8px] sm:text-[10px] font-medium">Académique</span>
                    </div>
                    {stats.academique > 0 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-yellow-600 bg-white flex flex-col items-center justify-center relative p-2">
                      <FontAwesomeIcon icon={faCog} className="text-yellow-600 text-sm sm:text-base mb-0.5" />
                      <span className="text-yellow-600 font-bold text-xs sm:text-sm mb-0.5">{stats.systeme}</span>
                      <span className="text-yellow-600 text-[8px] sm:text-[10px] font-medium">Système</span>
                    </div>
                    {stats.systeme > 0 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-green-700 bg-white flex flex-col items-center justify-center relative p-2">
                      <FontAwesomeIcon icon={faUser} className="text-green-700 text-sm sm:text-base mb-0.5" />
                      <span className="text-green-700 font-bold text-xs sm:text-sm mb-0.5">{stats.personnelles}</span>
                      <span className="text-green-700 text-[8px] sm:text-[10px] font-medium">Personnelles</span>
                    </div>
                    {stats.personnelles > 0 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={handleMarkAsRead}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  <FontAwesomeIcon icon={faBell} className="mr-2" />
                  Marquer comme lu
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Section Aujourd'hui */}
          {todayNotifications.length > 0 && (
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">Aujourd'hui</h2>
                <p className="text-sm text-slate-600">{todayNotifications.length} nouvelle{todayNotifications.length > 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-3">
                {todayNotifications.map((notification) => {
                  const colors = getColorClasses(notification.type, false)
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 border-l-4 ${colors.border} border border-slate-200`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.iconBg} flex-shrink-0`}>
                            <FontAwesomeIcon icon={notification.icon} className={`${colors.icon} text-sm`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.tag}`}>
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-800 leading-relaxed">{notification.message}</p>
                          </div>
                        </div>
                        {notification.action && (
                          <button className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0">
                            <FontAwesomeIcon icon={faEye} className="mr-1.5 text-xs" />
                            {notification.action}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section Cette semaine */}
          {weekNotifications.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">Cette semaine</h2>
              </div>
              <div className="space-y-3">
                {weekNotifications.map((notification) => {
                  // Pour les notifications de la semaine, utiliser orange si académique (ancienne)
                  const colors = getColorClasses(notification.type, notification.type === 'Académiques')
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow-sm p-4 sm:p-5 border-l-4 ${colors.border} border border-slate-200`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.iconBg} flex-shrink-0`}>
                            <FontAwesomeIcon icon={notification.icon} className={`${colors.icon} text-sm`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.tag}`}>
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-slate-800 leading-relaxed">{notification.message}</p>
                          </div>
                        </div>
                        {notification.action && (
                          <button className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0">
                            <FontAwesomeIcon icon={faEye} className="mr-1.5 text-xs" />
                            {notification.action}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Message si aucune notification */}
          {notifications.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <FontAwesomeIcon icon={faBell} className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-600">Aucune notification</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default NotificationsView

