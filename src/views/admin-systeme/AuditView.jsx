import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHistory, faSearch, faFilter, faDownload, faChevronLeft, faChevronRight,
    faCalendarAlt, faUserShield, faSync
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { getAuditLogs, getAuditUsers } from '../../api/adminSysteme'
import { useAlert } from '../../contexts/AlertContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const AuditAdminSystemeView = () => {
    const { showAlert } = useAlert()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterUser, setFilterUser] = useState('all')
    const [dateDebut, setDateDebut] = useState('')
    const [dateFin, setDateFin] = useState('')

    const [activites, setActivites] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        loadFilterData()
        loadLogs()
    }, [])

    const loadFilterData = async () => {
        try {
            const usersData = await getAuditUsers()
            setUsers(usersData)
        } catch (err) {
            console.error('Erreur agents:', err)
        }
    }

    const loadLogs = async (e) => {
        if (e) e.preventDefault()
        setSearching(true)
        try {
            const filters = {
                typeAction: filterType !== 'all' ? filterType : undefined,
                utilisateurId: filterUser !== 'all' ? filterUser : undefined,
                dateDebut: dateDebut || undefined,
                dateFin: dateFin || undefined,
                searchQuery: searchQuery.trim() || undefined
            }
            const data = await getAuditLogs(filters)
            setActivites(data)
            setCurrentPage(1)
        } catch (err) {
            showAlert(err.message, 'error')
        } finally {
            setLoading(false)
            setSearching(false)
        }
    }

    const handleExportCSV = () => {
        if (activites.length === 0) {
            showAlert('Aucune donnée à exporter', 'info')
            return
        }

        const headers = ['Date & Heure', 'Utilisateur', 'Action', 'Détails', 'Type']
        const rows = activites.map(act => [
            act.date,
            act.agent,
            act.action,
            act.details || '',
            act.type
        ])

        let csvContent = headers.join(',') + '\n'
        rows.forEach(row => {
            csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `audit_systeme_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
    }

    const getTypeColor = (type) => {
        const t = type.toLowerCase()
        if (t.includes('connexion')) return 'bg-blue-100 text-blue-700'
        if (t.includes('inscription')) return 'bg-green-100 text-green-700'
        if (t.includes('error')) return 'bg-red-100 text-red-700'
        if (t.includes('attestation')) return 'bg-purple-100 text-purple-700'
        return 'bg-slate-100 text-slate-700'
    }

    // Pagination logic
    const totalPages = Math.ceil(activites.length / itemsPerPage)
    const paginatedData = activites.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    if (loading) return <div className="pt-32"><LoadingSpinner text="Chargement du journal d'audit..." /></div>

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="lg:ml-64 min-h-screen">
                <AdminHeader />

                <main className="p-4 sm:p-6 lg:p-8 pt-36 lg:pt-40">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faHistory} />
                                </div>
                                Journal d'Audit Système
                            </h1>
                            <p className="text-slate-500 mt-1">Surveillez toutes les actions effectuées sur la plateforme.</p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            Exporter Logs
                        </button>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                        <form onSubmit={loadLogs} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Recherche</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Action, détails..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Utilisateur</label>
                                <div className="relative">
                                    <select
                                        value={filterUser}
                                        onChange={(e) => setFilterUser(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none"
                                    >
                                        <option value="all">Tous les utilisateurs</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.nom} ({u.role})</option>
                                        ))}
                                    </select>
                                    <FontAwesomeIcon icon={faUserShield} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Type d'action</label>
                                <div className="relative">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none"
                                    >
                                        <option value="all">Tous les types</option>
                                        <option value="connexion">Connexions</option>
                                        <option value="inscription">Inscriptions</option>
                                        <option value="attestation">Attestations</option>
                                        <option value="bulletin">Bulletins</option>
                                        <option value="error">Erreurs</option>
                                        <option value="pv">PV & Délibérations</option>
                                    </select>
                                    <FontAwesomeIcon icon={faFilter} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={dateDebut}
                                        onChange={(e) => setDateDebut(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                    <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="flex items-end gap-3 md:col-span-2 lg:col-span-1">
                                <button
                                    type="submit"
                                    disabled={searching}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={searching ? faSync : faFilter} className={searching ? 'animate-spin' : ''} />
                                    Filtrer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilterType('all')
                                        setFilterUser('all')
                                        setDateDebut('')
                                        setDateFin('')
                                        loadLogs()
                                    }}
                                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Utilisateur</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Détails</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((act) => (
                                            <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{act.agent}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-slate-700">{act.action}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-slate-500 max-w-md truncate" title={act.details}>
                                                        {act.details}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-slate-500">{act.date}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeColor(act.type)}`}>
                                                        {act.type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                Aucun log trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Page <span className="font-bold">{currentPage}</span> sur {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AuditAdminSystemeView
