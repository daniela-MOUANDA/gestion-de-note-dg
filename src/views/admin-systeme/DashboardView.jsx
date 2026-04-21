import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsers, faHistory, faShieldAlt, faCog, faChartLine,
    faCheckCircle, faExclamationTriangle, faClock, faServer
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getDashboardStats, getRecentLogs } from '../../api/adminSysteme'

const DashboardAdminSystemeView = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const nomComplet = user ? `${user.nom} ${user.prenom}` : 'Administrateur Système'

    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalStudents: 0,
        totalAuditLogs: 0,
        systemAlerts: 0
    })

    const [recentLogs, setRecentLogs] = useState([])

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsData, logsData] = await Promise.all([
                    getDashboardStats(),
                    getRecentLogs()
                ])
                setStats(statsData)
                setRecentLogs(logsData)
            } catch (err) {
                console.error('Erreur lors du chargement du dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadDashboardData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <AdminSidebar />
                <div className="lg:ml-64 min-h-screen">
                    <AdminHeader />
                    <main className="p-8 pt-36 lg:pt-40">
                        <LoadingSpinner text="Initialisation de l'espace administrateur..." />
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f4f6f9]">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-36 lg:pt-40">
                    {/* Header Section */}
                    <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">Console d'Administration</h1>
                                <p className="text-slate-500 mt-1">Gérez le système, les accès et surveillez l'activité.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                                    Système Opérationnel
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-xl">
                                <FontAwesomeIcon icon={faUsers} />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{stats.totalUsers}</div>
                            <div className="text-slate-500 text-sm">Utilisateurs Staff</div>
                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                {stats.activeUsers} actifs simultanément
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 text-xl">
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{stats.totalStudents}</div>
                            <div className="text-slate-500 text-sm">Comptes Étudiants</div>
                            <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                <Link to="/admin-systeme/etudiants/credentials" className="hover:underline">Gérer les accès →</Link>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-xl">
                                <FontAwesomeIcon icon={faHistory} />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{stats.totalAuditLogs}</div>
                            <div className="text-slate-500 text-sm">Entrées d'Audit</div>
                            <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                                <Link to="/admin-systeme/audit" className="hover:underline">Consulter les logs →</Link>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 text-xl">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{stats.systemAlerts}</div>
                            <div className="text-slate-500 text-sm">Alertes Système</div>
                            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} />
                                Nécessite votre attention
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Activity Monitoring */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faClock} className="text-slate-400" />
                                    Surveillance de l'activité
                                </h2>
                                <Link to="/admin-systeme/audit" className="text-xs font-bold text-indigo-600 uppercase hover:underline">Voir tout</Link>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {recentLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.type === 'success' ? 'bg-green-100 text-green-600' :
                                                    log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    <FontAwesomeIcon icon={log.type === 'success' ? faCheckCircle : log.type === 'warning' ? faExclamationTriangle : faClock} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{log.action}</p>
                                                    <p className="text-xs text-slate-500">Par {log.user}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">{log.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Maintenance */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faServer} className="text-indigo-600" />
                                    Actions de Maintenance
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:border-indigo-300 transition-all text-center group">
                                        <FontAwesomeIcon icon={faShieldAlt} className="text-2xl text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold text-slate-800">Accès Étudiants</span>
                                        <span className="text-xs text-slate-500 mt-1">Gérer les mots de passe</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:border-indigo-300 transition-all text-center group">
                                        <FontAwesomeIcon icon={faChartLine} className="text-2xl text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold text-slate-800">Logs d'Activités</span>
                                        <span className="text-xs text-slate-500 mt-1">Audit complet système</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:border-indigo-300 transition-all text-center group">
                                        <FontAwesomeIcon icon={faCog} className="text-2xl text-slate-500 mb-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold text-slate-800">Paramètres</span>
                                        <span className="text-xs text-slate-500 mt-1">Configuration globale</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:border-indigo-300 transition-all text-center group text-red-600">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold">Maintenance</span>
                                        <span className="text-xs text-red-400 mt-1">Actions critiques</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-slate-800">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">Statut des Services</h3>
                                        <p className="text-slate-500 text-sm">Mise à jour automatique en temps réel</p>
                                    </div>
                                    <FontAwesomeIcon icon={faServer} className="text-2xl text-slate-400" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Base de données Supabase</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">LIGNE</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Serveur API Node.js</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">LIGNE</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Services de Stockage</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">LIGNE</span>
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

export default DashboardAdminSystemeView
