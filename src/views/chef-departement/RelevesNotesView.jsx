import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faGraduationCap, faFileAlt, faSearch, faDownload, faSpinner,
    faCheckCircle, faTimesCircle, faTrophy, faTable, faPrint
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getClasses, getBulletinData } from '../../api/chefDepartement.js'
import * as XLSX from 'xlsx'

const RelevesNotesView = () => {
    const { user } = useAuth()
    const { showAlert } = useAlert()

    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState([])
    const [selectedClasse, setSelectedClasse] = useState('')
    const [selectedSemestre, setSelectedSemestre] = useState('')

    const [bulletinData, setBulletinData] = useState([])
    const [metaData, setMetaData] = useState(null)

    useEffect(() => {
        loadClasses()
    }, [])

    useEffect(() => {
        if (selectedClasse && selectedSemestre) {
            loadBulletin()
        } else {
            setBulletinData([])
            setMetaData(null)
        }
    }, [selectedClasse, selectedSemestre])

    const loadClasses = async () => {
        try {
            const result = await getClasses()
            if (result.success) {
                setClasses(result.classes || [])
            } else {
                showAlert(result.error || 'Erreur lors du chargement des classes', 'error')
            }
        } catch (error) {
            showAlert('Erreur lors du chargement des classes', 'error')
        }
    }

    const loadBulletin = async () => {
        setLoading(true)
        try {
            const result = await getBulletinData(selectedClasse, selectedSemestre)
            if (result.success) {
                setBulletinData(result.data || [])
                setMetaData(result.meta)
            } else {
                showAlert(result.error || 'Erreur lors du chargement du relevé', 'error')
                setBulletinData([])
                setMetaData(null)
            }
        } catch (error) {
            showAlert('Erreur lors du chargement du relevé', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Organiser les modules par UE pour l'en-tête (Copied from PlanchesView)
    const ueGroups = useMemo(() => {
        if (!bulletinData.length || !bulletinData[0].modules) return []

        const groups = []
        const modules = bulletinData[0].modules

        modules.forEach(m => {
            const ueCode = m.ue || 'Sans UE'
            const ueName = m.nom_ue || ''
            let group = groups.find(g => g.code === ueCode)

            if (!group) {
                group = {
                    code: ueCode,
                    name: ueName,
                    modules: []
                }
                groups.push(group)
            }
            group.modules.push(m)
        })

        return groups
    }, [bulletinData])

    const getSelectedClasseInfo = () => {
        return classes.find(c => c.id === selectedClasse)
    }

    const getStatusText = (status, type = 'ue') => {
        if (type === 'ue') {
            switch (status) {
                case 'VALIDE':
                case 'ACQUIS': return 'UE Acquise'
                case 'COMPENSE': return 'UE Acquise par Comp.'
                case 'AJOURNE': return 'UE non Acquise'
                default: return status?.replace(/_/g, ' ') || 'UE non Acquise'
            }
        } else {
            return status === 'VALIDE' ? `Semestre validé` : `Semestre non validé`
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'VALIDE':
            case 'ACQUIS': return 'text-green-600 bg-green-100'
            case 'COMPENSE': return 'text-amber-600 bg-amber-100'
            case 'AJOURNE': return 'text-red-600 bg-red-100'
            default: return 'text-slate-500 bg-slate-100'
        }
    }

    const getStatusDot = (status) => {
        switch (status) {
            case 'VALIDE':
            case 'ACQUIS': return 'bg-green-500'
            case 'COMPENSE': return 'bg-amber-500'
            case 'AJOURNE': return 'bg-red-500'
            default: return 'bg-slate-300'
        }
    }

    const exportExcel = () => {
        if (!bulletinData.length) return
        const data = bulletinData.map(item => {
            const row = {
                'Rang': item.rang,
                'Matricule': item.etudiant.matricule,
                'Nom': item.etudiant.nom,
                'Prénom': item.etudiant.prenom,
                'Moyenne Générale': item.moyenneGenerale,
                'Crédits Validés': item.totalCreditsValides,
                'Statut': item.statut
            }
            item.modules.forEach(mod => {
                row[`${mod.code} - ${mod.nom}`] = mod.moyenne
            })
            return row
        })
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Relevé")
        const classeNom = getSelectedClasseInfo()?.nom || 'Classe'
        XLSX.writeFile(wb, `Releve_${classeNom}_${selectedSemestre}.xlsx`)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-40 lg:pt-36">

                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Relevé de Notes</h1>
                            <p className="text-sm text-slate-500 uppercase font-semibold">Consultation des performances et validation</p>
                        </div>
                        {bulletinData.length > 0 && (
                            <button
                                onClick={exportExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                            >
                                <FontAwesomeIcon icon={faTable} />
                                Exporter Excel
                            </button>
                        )}
                    </div>

                    {/* Filtres */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                        <div className="w-full sm:w-64">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Classe</label>
                            <select
                                value={selectedClasse}
                                onChange={(e) => setSelectedClasse(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sélectionner une classe</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom} {c.filieres?.code ? `(${c.filieres.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semestre</label>
                            <select
                                value={selectedSemestre}
                                onChange={(e) => setSelectedSemestre(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sélectionner un semestre</option>
                                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(s => (
                                    <option key={s} value={s}>{s.replace('S', 'Semestre ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tableau Design Pro */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden min-h-[600px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-24">
                                <FontAwesomeIcon icon={faSpinner} className="text-5xl text-blue-500 animate-spin mb-4" />
                                <p className="text-slate-500 font-medium">Chargement des données...</p>
                            </div>
                        ) : bulletinData.length > 0 ? (
                            <div className="flex flex-col h-full">
                                {/* Official Header Area */}
                                <div className="p-8 border-b border-slate-200">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-start gap-4">
                                            <div className="w-24 h-24 bg-white flex items-center justify-center rounded-lg border border-slate-100 shadow-sm">
                                                <img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                                            </div>
                                            <div className="max-w-[350px] pt-2">
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700">Institut National de la Poste,</p>
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700">des Technologies de l'Information</p>
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700 mb-2">et de la Communication</p>
                                            </div>
                                        </div>
                                        <div className="text-center flex-1">
                                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">RELEVÉ DE NOTES</h2>
                                            <p className="text-xl font-bold text-blue-800 uppercase">
                                                {getSelectedClasseInfo()?.filieres?.nom || getSelectedClasseInfo()?.nom}
                                                ({getSelectedClasseInfo()?.nom || ''})
                                            </p>
                                            <p className="text-lg font-bold text-slate-600 uppercase">
                                                {selectedSemestre?.replace('S', 'Semestre ')}
                                            </p>
                                        </div>
                                        <div className="text-right min-w-[250px] pt-2">
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Année Académique 2024-2025</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Container */}
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full text-xs border-collapse">
                                        <thead className="sticky top-0 z-20 bg-slate-50 uppercase tracking-tighter">
                                            {/* Row 1: UE Headers */}
                                            <tr>
                                                <th rowSpan={2} className="border border-slate-300 p-1 min-w-[40px] sticky left-0 z-30 bg-slate-100 font-black">N°</th>
                                                <th rowSpan={2} className="border border-slate-300 p-2 min-w-[250px] sticky left-10 z-30 bg-slate-100 font-black">Nom et Prénom</th>
                                                {ueGroups.map((ue, idx) => (
                                                    <th
                                                        key={ue.code}
                                                        colSpan={ue.modules.length + 3}
                                                        className={`border border-slate-300 px-2 py-1 text-center font-bold text-[10px] ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-slate-50'}`}
                                                    >
                                                        {ue.code} : {ue.name}
                                                    </th>
                                                ))}
                                                <th colSpan={4} className="border border-slate-300 p-2 bg-slate-800 text-white text-center">RÉSULTATS SEMESTRIELS</th>
                                            </tr>

                                            {/* Row 2: Module Names (Vertical) */}
                                            <tr className="bg-white">
                                                {ueGroups.map(ue => (
                                                    <>
                                                        {ue.modules.map(m => (
                                                            <th key={m.id} className="border border-slate-300 p-1 min-w-[80px] h-32 relative overflow-hidden bg-white">
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="block w-24 text-[10px] font-bold text-center transform -rotate-90 leading-tight whitespace-nowrap uppercase">
                                                                        {m.nom}
                                                                    </span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                        <th className="border border-slate-300 p-1 min-w-[70px] bg-blue-50 font-black text-slate-800 text-[9px]">MOY {ue.code}</th>
                                                        <th className="border border-slate-300 p-1 min-w-[60px] bg-white text-[9px] uppercase">CTS</th>
                                                        <th className="border border-slate-300 p-1 min-w-[100px] bg-white text-[9px] uppercase">STATUT</th>
                                                    </>
                                                ))}
                                                <th className="border border-slate-300 p-1 min-w-[70px] bg-slate-100 text-[9px] uppercase">TOTAL CTS</th>
                                                <th className="border border-slate-300 p-1 min-w-[80px] bg-blue-600 text-white font-black uppercase text-[9px]">MOY GEN</th>
                                                <th className="border border-slate-300 p-1 min-w-[60px] bg-slate-100 text-[9px] uppercase">RANG</th>
                                                <th className="border border-slate-300 p-1 min-w-[120px] bg-white text-[9px] uppercase font-bold text-center">DÉCISION DU JURY</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-200">
                                            {bulletinData.map((row, idx) => (
                                                <tr key={row.etudiant.id} className="hover:bg-blue-50/30 transition-colors h-10 border-b border-slate-200">
                                                    <td className="border border-slate-200 p-1 text-center font-bold sticky left-0 z-10 bg-white">{idx + 1}</td>
                                                    <td className="border border-slate-200 p-2 font-bold sticky left-10 z-10 bg-white">
                                                        <div className="truncate uppercase text-[9px]">{row.etudiant.nom} {row.etudiant.prenom}</div>
                                                        <div className="text-[8px] text-slate-400 font-normal">{row.etudiant.matricule}</div>
                                                    </td>

                                                    {ueGroups.map(ueGroup => {
                                                        const ueData = row.uesValidees?.find(u => u.ue === ueGroup.code) || {}
                                                        return (
                                                            <>
                                                                {ueGroup.modules.map(m => {
                                                                    const modNote = row.modules.find(rm => rm.id === m.id)
                                                                    const val = typeof modNote?.moyenne === 'number' ? modNote.moyenne : null
                                                                    return (
                                                                        <td
                                                                            key={m.id}
                                                                            className={`border border-slate-200 p-1 text-center font-medium ${val != null && val < 10 ? 'bg-red-50 text-red-700' : 'text-slate-700'}`}
                                                                        >
                                                                            {typeof val === 'number'
                                                                                ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                                                                : '-'}
                                                                        </td>
                                                                    )
                                                                })}
                                                                <td className={`border border-slate-300 p-1 text-center font-black bg-blue-50/30 text-[10px] ${typeof ueData.moyenne === 'number' && ueData.moyenne < 10 ? 'text-red-700' : 'text-slate-900'}`}>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className={`w-2 h-2 rounded-full ${getStatusDot(ueData.status)}`}></span>
                                                                        {typeof ueData.moyenne === 'number'
                                                                            ? ueData.moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                                                            : '-'}
                                                                    </div>
                                                                </td>
                                                                <td className="border border-slate-300 p-1 text-center font-bold bg-white text-[9px]">{ueData.credits || 0}</td>
                                                                <td className={`border border-slate-300 p-1 text-[9px] font-bold text-center leading-tight bg-white uppercase ${getStatusColor(ueData.status)}`}>
                                                                    {getStatusText(ueData.status, 'ue')}
                                                                </td>
                                                            </>
                                                        )
                                                    })}

                                                    <td className="border border-slate-300 p-1 text-center font-bold bg-slate-50 text-[10px]">{row.totalCreditsValides || 0}</td>
                                                    <td className={`border border-slate-300 p-1 text-center font-black text-[11px] bg-blue-600/5 ${typeof row.moyenneGenerale === 'number' && row.moyenneGenerale < 10 ? 'text-red-700' : 'text-blue-900'}`}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className={`w-2 h-2 rounded-full ${typeof row.moyenneGenerale === 'number' && row.moyenneGenerale >= 10 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                            {typeof row.moyenneGenerale === 'number'
                                                                ? row.moyenneGenerale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                                                : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-300 p-1 text-center font-black bg-slate-100 text-[10px] text-slate-800">{row.rang || '-'}</td>
                                                    <td className="border border-slate-300 p-2 text-[10px] bg-white">
                                                        <div className="flex flex-col gap-0.5 font-bold uppercase italic center text-center">
                                                            <span className={row.statut === 'VALIDE' ? 'text-green-700' : 'text-red-700'}>
                                                                {getStatusText(row.statut, 'semestre')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : selectedClasse && selectedSemestre ? (
                            <div className="flex flex-col items-center justify-center p-24 text-slate-400 text-center">
                                <FontAwesomeIcon icon={faTable} className="text-6xl mb-4 opacity-20" />
                                <p className="text-lg font-medium">Aucun résultat trouvé pour cette sélection.</p>
                                <p className="text-sm">Vérifiez que toutes les notes et paramètres sont configurés.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-24 text-slate-400 text-center">
                                <FontAwesomeIcon icon={faFileAlt} className="text-6xl mb-4 opacity-20" />
                                <p className="text-lg font-medium">Veuillez sélectionner une classe et un semestre.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default RelevesNotesView
