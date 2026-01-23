import { useState, useEffect } from 'react'
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
  faUser,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { useAuth } from '../../contexts/AuthContext'
import * as notificationAPI from '../../api/notifications'

const NotificationsView = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationAPI.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
      setError('Impossible de charger les notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      await loadNotifications()
    } catch (err) {
      console.error('Erreur marquage comme lu:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer toutes les notifications ?')) {
      return
    }
    try {
      await notificationAPI.deleteAllNotifications()
      await loadNotifications()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const handleDeleteOne = async (id) => {
    try {
      await notificationAPI.deleteNotification(id)
      await loadNotifications()
    } catch (err) {
      console.error('Erreur suppression notification:', err)
    }
  }

  const handleMarkOneAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      await loadNotifications()
    } catch (err) {
      console.error('Erreur marquage notification:', err)
    }
  }

  // Calculer les statistiques
  const stats = {
    academique: notifications.filter(n => n.type === 'ACADEMIQUE').length,
    systeme: notifications.filter(n => n.type === 'SYSTEME').length,
    personnelles: notifications.filter(n => n.type === 'PERSONNEL').length,
    inscription: notifications.filter(n => n.type === 'INSCRIPTION').length
  }

  // Filtrer par date
  const todayNotifications = notifications.filter(n => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const notifDate = new Date(n.date_creation)
    notifDate.setHours(0, 0, 0, 0)
    return notifDate.getTime() === today.getTime()
  })

  const weekNotifications = notifications.filter(n => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const notifDate = new Date(n.date_creation)
    return notifDate >= weekAgo && !todayNotifications.includes(n)
  })

  const olderNotifications = notifications.filter(n => {
    return !todayNotifications.includes(n) && !weekNotifications.includes(n)
  })

  const getIcon = (type) => {
    switch (type) {
      case 'ACADEMIQUE':
        return faGraduationCap
      case 'INSCRIPTION':
        return faFileAlt
      case 'SYSTEME':
        return faCog
      case 'PERSONNEL':
        return faUser
      default:
        return faBell
    }
  }

  const getColorClasses = (type, isRead = false) => {
    const baseColors = {
      'ACADEMIQUE': {
        border: 'border-blue-500',
        tag: 'bg-blue-100 text-blue-700',
        iconBg: 'bg-blue-100',
        icon: 'text-blue-600'
      },
      'INSCRIPTION': {
        border: 'border-green-500',
        tag: 'bg-green-100 text-green-700',
        iconBg: 'bg-green-100',
        icon: 'text-green-600'
      },
      'PERSONNEL': {
        border: 'border-purple-500',
        tag: 'bg-purple-100 text-purple-700',
        iconBg: 'bg-purple-100',
        icon: 'text-purple-600'
      },
      'SYSTEME': {
        border: 'border-orange-500',
        tag: 'bg-orange-100 text-orange-700',
        iconBg: 'bg-orange-100',
        icon: 'text-orange-600'
      }
    }

    if (isRead) {
      return {
        border: 'border-slate-200',
        tag: 'bg-slate-100 text-slate-600',
        iconBg: 'bg-slate-100',
        icon: 'text-slate-400'
      }
    }

    return baseColors[type] || baseColors['SYSTEME']
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR')
  }

  const renderNotification = (notification, isOld = false) => {
    const colors = getColorClasses(notification.type, notification.lu)
    const icon = getIcon(notification.type)

    return (
      <div
        key={notification.id}
        className={`bg-white rounded-lg shadow-sm border ${notification.lu ? 'border-slate-200 opacity-75' : 'border-slate-300'} p-5 hover:border-blue-200 transition-all group`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-12 h-12 rounded flex items-center justify-center ${colors.iconBg} flex-shrink-0 transition-transform group-hover:scale-105`}>
              <FontAwesomeIcon icon={icon} className={`${colors.icon} text-lg`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${colors.tag}`}>
                  {notification.type}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="text-[11px] font-medium text-slate-400">{formatDate(notification.date_creation)}</span>
                {!notification.lu && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                )}
              </div>
              <h4 className="font-semibold text-slate-800 mb-1">{notification.titre}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{notification.message}</p>

              {notification.lien && (
                <a
                  href={notification.lien}
                  className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <FontAwesomeIcon icon={faEye} />
                  Voir plus
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!notification.lu && (
              <button
                onClick={() => handleMarkOneAsRead(notification.id)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Marquer comme lu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
            )}
            <button
              onClick={() => handleDeleteOne(notification.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header studentName={user?.nom || 'Étudiant'} />
          <main className="flex-1 p-6 pt-24">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">Chargement des notifications...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header studentName={user?.nom || 'Étudiant'} />

        <main className="flex-1 p-6 pt-24">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Centre de Notifications</h1>
            <p className="text-slate-500">Restez informé de vos notes, événements et mises à jour système</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Statistiques et actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Indicateurs */}
              <div className="flex gap-12">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
                    <FontAwesomeIcon icon={faGraduationCap} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{stats.academique}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Académique</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-2">
                    <FontAwesomeIcon icon={faFileAlt} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{stats.inscription}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inscription</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-2">
                    <FontAwesomeIcon icon={faCog} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{stats.systeme}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Système</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-2">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <span className="text-xl font-bold text-slate-800">{stats.personnelles}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel</span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={handleMarkAsRead}
                  className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-all shadow-sm text-sm"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Tout marquer comme lu
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded font-semibold transition-all text-sm"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Vider
                </button>
              </div>
            </div>
          </div>

          {/* Section Aujourd'hui */}
          {todayNotifications.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800">Aujourd'hui</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                  {todayNotifications.length} Nouveau{todayNotifications.length > 1 ? 'x' : ''}
                </span>
              </div>
              <div className="space-y-4">
                {todayNotifications.map(notification => renderNotification(notification, false))}
              </div>
            </div>
          )}

          {/* Section Cette semaine */}
          {weekNotifications.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-600">Cette semaine</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <div className="space-y-4">
                {weekNotifications.map(notification => renderNotification(notification, false))}
              </div>
            </div>
          )}

          {/* Section Plus anciennes */}
          {olderNotifications.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-500">Plus anciennes</h2>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <div className="space-y-4">
                {olderNotifications.map(notification => renderNotification(notification, true))}
              </div>
            </div>
          )}

          {/* Message si aucune notification */}
          {notifications.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon icon={faBell} className="text-3xl text-slate-200" />
              </div>
              <h3 className="text-slate-700 font-bold mb-1">Aucune notification</h3>
              <p className="text-slate-400 text-sm">Votre centre de notifications est vide pour le moment.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default NotificationsView
