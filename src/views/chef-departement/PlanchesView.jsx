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
import { getClasses, getBulletinData, exportPlanchePDF, exportPlancheExcel, exportAnnualPlanchePDF, exportAnnualPlancheExcel, getAnnualBulletinData } from '../../api/chefDepartement.js'
import * as XLSX from 'xlsx'
import { abbreviateClasseLabel } from '../../utils/classeLabel'
import { buildPlancheDownloadFilename } from '../../utils/plancheFileName'

const PLANCHE_PHASE_OPTIONS = [
    { value: '', label: 'Phase du semestre (optionnel)' },
    { value: 'avant_rattrapage', label: 'Avant rattrapage' },
    { value: 'apres_rattrapage', label: 'Après rattrapage' },
    { value: 'apres_soutenance', label: 'Après soutenance' }
]

const PlanchesView = () => {
    const { user } = useAuth()
    const { showAlert } = useAlert()

    console.log('🚀 [PlanchesView] Component Rendering:', {
        userRole: user?.role,
        hasUser: !!user
    })

    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState([])
    const [selectedClasse, setSelectedClasse] = useState('')
    const [selectedSemestre, setSelectedSemestre] = useState('')
    const [planchePhase, setPlanchePhase] = useState('')

    const [bulletinData, setBulletinData] = useState([])
    const [metaData, setMetaData] = useState(null)
    const [error, setError] = useState(null)

    if (error) {
        return (
            <div className="p-20 text-red-600 bg-white min-h-screen">
                <h1 className="text-2xl font-bold">Erreur de chargement</h1>
                <p>{error.message}</p>
                <pre className="mt-4 p-4 bg-slate-100 rounded">{error.stack}</pre>
            </div>
        )
    }

    useEffect(() => {
        console.log('🚀 [PlanchesView] Mounted. Loading classes...')
        loadClasses()
    }, [])

    useEffect(() => {
        if (selectedClasse && selectedSemestre) {
            fetchData()
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

    const fetchData = async () => {
        if (!selectedClasse || !selectedSemestre) {
            setBulletinData([])
            setMetaData(null) // Keep metaData reset for consistency
            return
        }

        try {
            setLoading(true)
            let response
            if (selectedSemestre === 'ANNUEL') {
                response = await getAnnualBulletinData(selectedClasse)
            } else {
                response = await getBulletinData(selectedClasse, selectedSemestre)
            }

            if (response.success) {
                setBulletinData(response.data || [])
                setMetaData(response.meta || null) // Ensure metaData is set if available
            } else {
                showAlert(response.error || 'Erreur lors du chargement des données', 'error')
                setBulletinData([])
                setMetaData(null)
            }
        } catch (error) {
            console.error('Erreur chargement données:', error)
            showAlert('Erreur lors du chargement des données', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Organiser les modules par UE pour l'en-tête
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

    const getStatusText = (status, type = 'ue') => {
        if (type === 'ue') {
            switch (status) {
                case 'VALIDE':
                case 'ACQUIS':
                case 'ACQUISE':
                    return 'UE Acquise'
                case 'COMPENSE':
                case 'ACQUISE_PAR_COMPENSATION':
                    return 'UE Acquise par Compensation'
                case 'AJOURNE':
                case 'NON_ACQUIS':
                case 'NON_ACQUISE':
                    return 'UE non Acquise'
                default:
                    return status?.replace(/_/g, ' ') || 'UE non Acquise'
            }
        } else {
            const semestreLabel = selectedSemestre?.startsWith('S')
                ? `Semestre ${selectedSemestre.replace('S', '')}`
                : 'Semestre'
            return status === 'VALIDE'
                ? `${semestreLabel} valide`
                : `${semestreLabel} non valide`
        }
    }

    const getJuryAvisText = (row) => {
        const statusText = getStatusText(row.statut, 'semestre')
        const raw = row.avisJury

        // Remplacer les anciens libellés génériques par la version avec numéro de semestre.
        if (
            !raw ||
            /semestre\s+valide/i.test(raw) ||
            /semestre\s+non\s+valide/i.test(raw)
        ) {
            return statusText.toUpperCase()
        }

        return typeof raw === 'string' ? raw.toUpperCase() : statusText.toUpperCase()
    }

    /** Avis du jury : majuscules + gras — vert (admission stage, diplôme / classe sup.), rouge (redouble, semestre non valide) */
    const getJuryAvisClassName = (row) => {
        const base = 'font-black uppercase leading-tight text-[9px] tracking-tight'
        const k = row.avisJuryKind
        if (k === 'REDOUBLE_L2' || k === 'SEMESTRE_NOK') {
            return `${base} text-red-600`
        }
        if (k === 'DIPLOME' || k === 'STAGE' || k === 'SEMESTRE_OK') {
            return `${base} text-green-700`
        }
        return row.statut === 'VALIDE' ? `${base} text-green-700` : `${base} text-red-600`
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'VALIDE':
            case 'ACQUIS':
            case 'ACQUISE':
                return 'text-green-600 bg-green-100'
            case 'COMPENSE':
            case 'ACQUISE_PAR_COMPENSATION':
                return 'text-amber-600 bg-amber-100'
            case 'AJOURNE':
            case 'NON_ACQUIS':
            case 'NON_ACQUISE':
                return 'text-red-600 bg-red-100'
            default:
                return 'text-slate-500 bg-slate-100'
        }
    }

    const getStatusDot = (status) => {
        switch (status) {
            case 'VALIDE':
            case 'ACQUIS':
            case 'ACQUISE':
                return 'bg-green-500'
            case 'COMPENSE':
            case 'ACQUISE_PAR_COMPENSATION':
                return 'bg-amber-500'
            case 'AJOURNE':
            case 'NON_ACQUIS':
            case 'NON_ACQUISE':
                return 'bg-red-500'
            default:
                return 'bg-slate-300'
        }
    }

    const getSelectedClasseInfo = () => {
        return classes.find(c => c.id === selectedClasse)
    }

    const getDisplayProgramme = () => {
        const classeInfo = getSelectedClasseInfo()
        if (!classeInfo) return ''

        const classeNom = abbreviateClasseLabel(classeInfo.nom || '', classeInfo)
        const filiereCode = classeInfo.filieres?.code || ''
        if (filiereCode && !classeNom.includes(`(${filiereCode})`)) return `${classeNom} (${filiereCode})`
        return classeNom
    }

    const planchePhaseLabel = useMemo(
        () => PLANCHE_PHASE_OPTIONS.find((o) => o.value === planchePhase)?.label || '',
        [planchePhase]
    )

    const getAvailableSemestres = () => {
        const info = getSelectedClasseInfo()
        if (!info) return []

        const niveau = info.niveau || ''
        if (niveau.includes('L1')) return ['S1', 'S2']
        if (niveau.includes('L2')) return ['S3', 'S4']
        if (niveau.includes('L3')) return ['S5', 'S6']
        if (niveau.includes('M1')) return ['S7', 'S8']
        if (niveau.includes('M2')) return ['S9', 'S10']

        return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
    }

    const exportToPDF = async () => {
        if (!selectedClasse || !selectedSemestre) return

        try {
            setLoading(true)
            let blob
            if (selectedSemestre === 'ANNUEL') {
                blob = await exportAnnualPlanchePDF(selectedClasse)
            } else {
                blob = await exportPlanchePDF(selectedClasse, selectedSemestre)
            }

            // Créer un lien pour le téléchargement
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const classInfo = getSelectedClasseInfo()
            const period = selectedSemestre === 'ANNUEL' ? 'ANNUEL' : selectedSemestre
            link.setAttribute('download', buildPlancheDownloadFilename(classInfo, period, 'pdf'))

            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)

            showAlert('Planche générée avec succès', 'success')
        } catch (error) {
            console.error('Erreur export PDF:', error)
            showAlert('Erreur lors de la génération du PDF', 'error')
        } finally {
            setLoading(false)
        }
    }

    const exportToExcel = async () => {
        if (!selectedClasse || !selectedSemestre) return

        try {
            setLoading(true)
            const classInfo = getSelectedClasseInfo()
            const rawClasseNom = classInfo?.nom || 'Classe'
            const classeAffichee = getDisplayProgramme() || rawClasseNom
            const filiereNom = classInfo?.filieres?.nom || ''
            const phaseLabel = planchePhase ? planchePhaseLabel : ''

            let blob
            if (selectedSemestre === 'ANNUEL') {
                blob = await exportAnnualPlancheExcel(selectedClasse, classeAffichee, filiereNom, phaseLabel)
            } else {
                blob = await exportPlancheExcel(selectedClasse, selectedSemestre, classeAffichee, filiereNom, phaseLabel)
            }

            // Créer un lien pour le téléchargement
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const period = selectedSemestre === 'ANNUEL' ? 'ANNUEL' : selectedSemestre
            link.setAttribute('download', buildPlancheDownloadFilename(classInfo, period, 'xlsx'))

            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)

            showAlert('Planche Excel générée avec succès', 'success')
        } catch (error) {
            console.error('Erreur export Excel:', error)
            showAlert('Erreur lors de la génération du fichier Excel', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-40 lg:pt-36">

                    {/* Header Controls */}
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex flex-wrap gap-4 items-end">
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
                                            {(() => {
                                                const classeNom = abbreviateClasseLabel(c.nom, c)
                                                const filiereCode = c.filieres?.code
                                                if (filiereCode && !classeNom.includes(`(${filiereCode})`)) {
                                                    return `${classeNom} (${filiereCode})`
                                                }
                                                return classeNom
                                            })()}
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
                                    <option value="">Semestre</option>
                                    {getAvailableSemestres().map(s => (
                                        <option key={s} value={s}>{s.replace('S', 'Semestre ')}</option>
                                    ))}
                                    {selectedClasse && (
                                        <option value="ANNUEL" className="font-bold text-blue-600">
                                            ANNUEL ({getAvailableSemestres().join(' + ')})
                                        </option>
                                    )}
                                </select>
                            </div>

                            <div className="w-full sm:w-56">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mention</label>
                                <select
                                    value={planchePhase}
                                    onChange={(e) => setPlanchePhase(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {PLANCHE_PHASE_OPTIONS.map((opt) => (
                                        <option key={opt.value || 'none'} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {bulletinData.length > 0 && (
                                <>
                                    <button
                                        onClick={exportToPDF}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                        PDF
                                    </button>
                                    <button
                                        onClick={exportToExcel}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faTable} />
                                        Excel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Planche Content */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden min-h-[600px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-24">
                                <FontAwesomeIcon icon={faSpinner} className="text-5xl text-blue-500 animate-spin mb-4" />
                                <p className="text-slate-500 font-medium">Génération de la planche en cours...</p>
                            </div>
                        ) : bulletinData.length > 0 ? (
                            <div className="flex flex-col h-full">
                                {/* Official Header Area (Internal Scroll) */}
                                <div className="p-8 border-b border-slate-200">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-start gap-4">
                                            <div className="w-24 h-24 bg-white flex items-center justify-center rounded-lg border border-slate-100 shadow-sm relative z-10">
                                                <img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                                            </div>
                                            <div className="max-w-[350px] pt-2">
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700">Institut National de la Poste,</p>
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700">des Technologies de l'Information</p>
                                                <p className="text-[11px] font-bold leading-tight uppercase text-slate-700 mb-2">et de la Communication</p>
                                            </div>
                                        </div>
                                        <div className="text-center flex-1">
                                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                                {selectedSemestre === 'ANNUEL' ? 'Résultats Annuels' : 'Résultats du Semestre'}
                                            </h2>
                                            <p className="text-xl font-bold text-blue-800 uppercase">
                                                {getDisplayProgramme()}
                                            </p>
                                            <p className="text-lg font-bold text-slate-600 uppercase">
                                                {selectedSemestre === 'ANNUEL'
                                                    ? `ANNUEL (${getAvailableSemestres().join(' + ')})`
                                                    : selectedSemestre?.replace('S', 'SEMESTRE ')}
                                            </p>
                                            {planchePhase && (
                                                <p className="text-sm sm:text-base font-semibold text-amber-900 uppercase tracking-wide mt-2 border-t border-slate-300 pt-2">
                                                    {planchePhaseLabel}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right min-w-[250px] pt-2">
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Année Académique 2024-2025</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Container with Horizontal Scroll */}
                                <div className="overflow-x-auto min-h-[400px]">
                                    {selectedSemestre === 'ANNUEL' ? (
                                        <table className="w-max min-w-full border-collapse border border-slate-300 bg-white" id="planche-table">
                                            <thead className="sticky top-0 z-20 shadow-sm">
                                                {/* Row 1: Main Headers — tons pastel (lisibles, moins agressifs) */}
                                                <tr className="bg-slate-200/95 text-slate-800 font-bold text-[10px] uppercase">
                                                    <th rowSpan={2} className="border border-slate-300 p-2 w-10 sticky left-0 z-30 bg-slate-100 border-r-2 border-r-slate-300">N°</th>
                                                    <th rowSpan={2} className="border border-slate-300 p-2 min-w-[250px] sticky left-10 z-30 bg-slate-100 border-r-2 border-r-slate-300 whitespace-nowrap">Nom et Prénom</th>
                                                    <th rowSpan={2} className="border border-slate-300 p-2 w-11 bg-slate-100">Sexe</th>
                                                    <th rowSpan={2} className="border border-slate-300 p-2 w-10 bg-slate-100">Âge</th>

                                                    {/* Semestre 1 Blocks */}
                                                    <th colSpan={7} className="border border-slate-300 p-2 bg-sky-100/90 text-slate-800">
                                                        {metaData?.semestreA ? `SEMESTRE ${metaData.semestreA.replace('S', '')}` : 'SEMESTRE 1'}
                                                    </th>

                                                    {/* Semestre 2 Blocks */}
                                                    <th colSpan={7} className="border border-slate-300 p-2 bg-violet-100/90 text-slate-800">
                                                        {metaData?.semestreB ? `SEMESTRE ${metaData.semestreB.replace('S', '')}` : 'SEMESTRE 2'}
                                                    </th>

                                                    {/* Annuel Summary */}
                                                    <th colSpan={6} className="border border-slate-300 p-2 bg-teal-100/90 text-slate-800">RÉSULTATS ANNUELS</th>
                                                </tr>

                                                <tr className="bg-slate-50 text-slate-800 text-[9px] font-black uppercase">
                                                    {/* S1 sub-headers — codes UE réels issus des bulletins */}
                                                    <th className="border border-slate-300 p-1 max-w-[5.5rem] truncate" title={metaData?.ueOrderS1?.[0]}>{metaData?.semestreA || 'S1'} {metaData?.ueOrderS1?.[0] ?? 'UE1'}</th>
                                                    <th className="border border-slate-300 p-1">CTS</th>
                                                    <th className="border border-slate-300 p-1 max-w-[5.5rem] truncate" title={metaData?.ueOrderS1?.[1]}>{metaData?.semestreA || 'S1'} {metaData?.ueOrderS1?.[1] ?? 'UE2'}</th>
                                                    <th className="border border-slate-300 p-1">CTS</th>
                                                    <th className="border border-slate-300 p-1 bg-sky-50">MOY {metaData?.semestreA || 'S1'}</th>
                                                    <th className="border border-slate-300 p-1 bg-sky-50">CTS {metaData?.semestreA || 'S1'}</th>
                                                    <th className="border border-slate-300 p-1 bg-sky-50">RANG {metaData?.semestreA || 'S1'}</th>

                                                    {/* S2 sub-headers */}
                                                    <th className="border border-slate-300 p-1 max-w-[5.5rem] truncate" title={metaData?.ueOrderS2?.[0]}>{metaData?.semestreB || 'S2'} {metaData?.ueOrderS2?.[0] ?? 'UE1'}</th>
                                                    <th className="border border-slate-300 p-1">CTS</th>
                                                    <th className="border border-slate-300 p-1 max-w-[5.5rem] truncate" title={metaData?.ueOrderS2?.[1]}>{metaData?.semestreB || 'S2'} {metaData?.ueOrderS2?.[1] ?? 'UE2'}</th>
                                                    <th className="border border-slate-300 p-1">CTS</th>
                                                    <th className="border border-slate-300 p-1 bg-violet-50">MOY {metaData?.semestreB || 'S2'}</th>
                                                    <th className="border border-slate-300 p-1 bg-violet-50">CTS {metaData?.semestreB || 'S2'}</th>
                                                    <th className="border border-slate-300 p-1 bg-violet-50">RANG {metaData?.semestreB || 'S2'}</th>

                                                    {/* Annual sub-headers */}
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">MOY ANN</th>
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">CTS ANN</th>
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">TAUX VAL. AN.</th>
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">RANG</th>
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">DÉCISION</th>
                                                    <th className="border border-slate-300 p-1 bg-teal-50 text-slate-800">MENTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulletinData.map((row, idx) => {
                                                    const k1a = metaData?.ueOrderS1?.[0]
                                                    const k1b = metaData?.ueOrderS1?.[1]
                                                    const k2a = metaData?.ueOrderS2?.[0]
                                                    const k2b = metaData?.ueOrderS2?.[1]
                                                    const s1_ue1 = k1a ? row.s1?.ues?.find(u => u.ue === k1a) || {} : {}
                                                    const s1_ue2 = k1b ? row.s1?.ues?.find(u => u.ue === k1b) || {} : {}
                                                    const s2_ue1 = k2a ? row.s2?.ues?.find(u => u.ue === k2a) || {} : {}
                                                    const s2_ue2 = k2b ? row.s2?.ues?.find(u => u.ue === k2b) || {} : {}

                                                    return (
                                                        <tr
                                                            key={row.etudiant.id}
                                                            className="table-row-hover border-b border-slate-200 h-10 transition-all duration-150"
                                                        >
                                                            <td className="border border-slate-300 p-1 text-center font-bold sticky left-0 z-10 bg-white border-r-2">{idx + 1}</td>
                                                            <td className="border border-slate-300 p-2 font-bold sticky left-10 z-10 bg-white border-r-2 text-left whitespace-nowrap uppercase text-[10px] min-w-[250px]">
                                                                {row.etudiant.nom} {row.etudiant.prenom}
                                                            </td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-white text-[10px] w-11">{row.sexe ?? '—'}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-white text-[10px] w-10">{row.age != null ? row.age : '—'}</td>

                                                            {/* S1 values */}
                                                            <td className="border border-slate-300 p-1 text-center text-[10px]">{s1_ue1.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px] bg-slate-50">{s1_ue1.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px]">{s1_ue2.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px] bg-slate-50">{s1_ue2.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50 text-[10px]">{row.s1?.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50 text-[10px]">{row.s1?.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-blue-50 text-[10px]">{row.s1?.rang ?? '-'}</td>

                                                            {/* S2 values */}
                                                            <td className="border border-slate-300 p-1 text-center text-[10px]">{s2_ue1.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px] bg-slate-50">{s2_ue1.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px]">{s2_ue2.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center text-[10px] bg-slate-50">{s2_ue2.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-indigo-50 text-[10px]">{row.s2?.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-indigo-50 text-[10px]">{row.s2?.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-indigo-50 text-[10px]">{row.s2?.rang ?? '-'}</td>

                                                            {/* Annual values */}
                                                            <td className="border border-slate-300 p-1 text-center font-black bg-blue-100 text-[10px]">{row.annuel?.moyenne?.toFixed(2) || '-'}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold bg-slate-50 text-[10px]">{row.annuel?.credits || 0}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-black bg-teal-50 text-[10px]">
                                                                {row.annuel?.tauxValidation != null ? `${row.annuel.tauxValidation}%` : '-'}
                                                            </td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold text-[10px]">{row.annuel?.rang || '-'}</td>
                                                            <td
                                                                className={`border border-slate-300 p-1 text-[8px] font-black text-center leading-tight max-w-[11rem] ${
                                                                    row.annuel?.decisionKind === 'ADMIS'
                                                                        ? 'text-green-700'
                                                                        : row.annuel?.decisionKind === 'REDOUBLE'
                                                                          ? 'text-red-700'
                                                                          : 'text-orange-700'
                                                                }`}
                                                            >
                                                                {row.annuel?.decision}
                                                            </td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold text-[9px] uppercase">{row.annuel?.mention}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-xs border-collapse" id="planche-table">
                                            <thead className="sticky top-0 z-20 bg-slate-50 uppercase tracking-tighter">
                                                {/* Row 1: UE Grouping Labels */}
                                                <tr>
                                                    <th rowSpan={4} className="border border-slate-300 p-1 min-w-[40px] sticky left-0 z-30 bg-white">N°</th>
                                                    <th rowSpan={4} className="border border-slate-300 p-2 min-w-[250px] sticky left-10 z-30 bg-white">Nom et Prénom (Matières)</th>
                                                    <th className="border border-slate-300 p-1 min-w-[72px] bg-white"></th>
                                                    {ueGroups.map((ue, idx) => (
                                                        <th
                                                            key={ue.code}
                                                            colSpan={ue.modules.length + 3}
                                                            className={`border border-slate-300 px-2 py-1 text-center font-bold text-[10px] ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-slate-50'}`}
                                                        >
                                                            {ue.code} : {ue.name}
                                                        </th>
                                                    ))}
                                                    <th colSpan={3} className="border border-slate-300 p-2 bg-slate-100 text-center">Moyenne Générale</th>
                                                    <th rowSpan={4} className="border border-slate-300 p-2 min-w-[150px] bg-slate-50 font-bold uppercase">Avis du Jury</th>
                                                </tr>

                                                {/* Row 2: Module Names + UE Summaries */}
                                                <tr className="bg-white">
                                                    <th className="border border-slate-300 p-1 min-w-[72px] h-32 relative overflow-hidden bg-white">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="block w-20 text-[10px] font-bold text-center transform -rotate-90 leading-tight uppercase">
                                                                Matières
                                                            </span>
                                                        </div>
                                                    </th>
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
                                                            <th rowSpan={1} className="border border-slate-300 p-1 min-w-[70px] bg-blue-50 font-black text-slate-800 text-[9px]">Moyenne {ue.code}</th>
                                                            <th rowSpan={1} className="border border-slate-300 p-1 min-w-[70px] bg-white text-[9px] uppercase">Crédits</th>
                                                            <th rowSpan={1} className="border border-slate-300 p-1 min-w-[120px] bg-white text-[9px] uppercase">Statut UE</th>
                                                        </>
                                                    ))}
                                                    <th rowSpan={1} className="border border-slate-300 p-1 min-w-[70px] bg-slate-50 text-[9px] uppercase whitespace-nowrap">Total Crédits</th>
                                                    <th rowSpan={1} className="border border-slate-300 p-1 min-w-[80px] bg-blue-600 text-white font-black uppercase text-[9px]">Moyenne Générale</th>
                                                    <th rowSpan={1} className="border border-slate-300 p-1 min-w-[60px] bg-slate-50 text-[9px] uppercase">Rang MGC</th>
                                                </tr>

                                                {/* Row 3: Credits values per module + sums */}
                                                <tr className="bg-white font-bold text-[10px]">
                                                    <th className="border border-slate-300 p-1 text-center font-bold text-slate-700 bg-white">
                                                        Crédits
                                                    </th>
                                                    {ueGroups.map(ue => {
                                                        const totalCredits = ue.modules.reduce((sum, m) => sum + (m.credit || 0), 0)
                                                        return (
                                                            <>
                                                                {ue.modules.map(m => (
                                                                    <th key={`cr-${m.id}`} className="border border-slate-300 p-1 text-center font-bold text-slate-600">
                                                                        {m.credit}
                                                                    </th>
                                                                ))}
                                                                <th className="border border-slate-300 p-1 bg-blue-100/50"></th>
                                                                <th className="border border-slate-300 p-1 text-center bg-slate-50">{totalCredits}</th>
                                                                <th className="border border-slate-300 p-1 bg-slate-50"></th>
                                                            </>
                                                        )
                                                    })}
                                                    <th className="border border-slate-300 p-1 text-center bg-slate-100">30</th>
                                                    <th className="border border-slate-300 p-1 text-center bg-blue-600/10">30</th>
                                                    <th className="border border-slate-300 p-1 bg-slate-100"></th>
                                                </tr>

                                                {/* Row 4: Coefficients values per module + sums */}
                                                <tr className="bg-white font-bold text-[10px]">
                                                    <th className="border border-slate-300 p-1 text-center font-bold text-slate-700 bg-white">
                                                        Coefficients
                                                    </th>
                                                    {ueGroups.map(ue => {
                                                        const totalCoeff = ue.modules.reduce((sum, m) => sum + (m.credit || 0), 0)
                                                        return (
                                                            <>
                                                                {ue.modules.map(m => (
                                                                    <th key={`co-${m.id}`} className="border border-slate-300 p-1 text-center text-slate-500 font-medium">
                                                                        {m.credit?.toFixed(2).replace('.', ',')}
                                                                    </th>
                                                                ))}
                                                                <th className="border border-slate-300 p-1 text-center bg-blue-50 font-black">{totalCoeff.toFixed(2).replace('.', ',')}</th>
                                                                <th className="border border-slate-300 p-1 bg-slate-50"></th>
                                                                <th className="border border-slate-300 p-1 bg-slate-50"></th>
                                                            </>
                                                        )
                                                    })}
                                                    <th className="border border-slate-300 p-1 text-center bg-slate-100/50">30,00</th>
                                                    <th className="border border-slate-300 p-1 text-center bg-blue-600/20 font-black">30,00</th>
                                                    <th className="border border-slate-300 p-1 bg-slate-100"></th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {bulletinData.map((row, rowIndex) => (
                                                    <tr
                                                        key={row.etudiant.id}
                                                        className="table-row-hover transition-all duration-150 h-10 border-b border-slate-200"
                                                    >
                                                        <td className="border border-slate-200 p-1 text-center font-bold sticky left-0 z-10 bg-white">{rowIndex + 1}</td>
                                                        <td className="border border-slate-200 p-2 font-bold sticky left-10 z-10 bg-white">
                                                            <div className="truncate uppercase text-[9px]">{row.etudiant.nom} {row.etudiant.prenom}</div>
                                                        </td>
                                                        <td className="border border-slate-200 p-1 bg-white"></td>

                                                        {ueGroups.map((ueGroup, groupIdx) => {
                                                            const ueData = row.uesValidees?.find(u => u.ue === ueGroup.code) || {}
                                                            return (
                                                                <>
                                                            {ueGroup.modules.map(m => {
                                                                        const moduleGrade = row.modules.find(rm => rm.id === m.id)
                                                                        const val = typeof moduleGrade?.moyenne === 'number' ? moduleGrade.moyenne : null
                                                                        return (
                                                                            <td
                                                                                key={`${row.etudiant.id}-${m.id}`}
                                                                                className={`border border-slate-200 p-1 text-center font-medium ${
                                                                                    val == null
                                                                                        ? 'text-slate-700'
                                                                                        : val < 6
                                                                                            ? 'bg-red-50 text-red-700'
                                                                                            : val < 10
                                                                                                ? 'bg-yellow-50 text-yellow-700'
                                                                                                : 'bg-white text-slate-700'
                                                                                }`}
                                                                            >
                                                                                {typeof val === 'number'
                                                                                  ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                                                                  : '-'}
                                                                            </td>
                                                                        )
                                                                    })}

                                                                    {/* Summary Columns for UE */}
                                                                    <td className={`border border-slate-300 p-1 text-center font-black text-[10px] ${
                                                                        typeof ueData.moyenne !== 'number'
                                                                            ? 'bg-white text-slate-900'
                                                                            : ueData.moyenne < 6
                                                                                ? 'bg-red-50 text-red-700'
                                                                                : ueData.moyenne < 10
                                                                                    ? 'bg-yellow-50 text-yellow-700'
                                                                                    : 'bg-white text-slate-900'
                                                                    }`}>
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <span className={`w-2 h-2 rounded-full ${getStatusDot(ueData.status)}`}></span>
                                                                            {typeof ueData.moyenne === 'number'
                                                                              ? ueData.moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                              : '-'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="border border-slate-300 p-1 text-center font-bold bg-white text-[9px]">
                                                                        {ueData.credits || 0}
                                                                    </td>
                                                                    <td className={`border border-slate-300 p-1 text-[9px] font-bold text-center leading-tight bg-white uppercase ${getStatusColor(ueData.status)}`}>
                                                                        {getStatusText(ueData.status, 'ue')}
                                                                    </td>
                                                                </>
                                                            )
                                                        })}

                                                        {/* FINAL COLUMNS */}
                                                        <td className="border border-slate-300 p-1 text-center font-bold bg-slate-50 text-[10px]">
                                                            {row.totalCreditsValides || 0}
                                                        </td>
                                                        <td className={`border border-slate-300 p-1 text-center font-black text-[11px] ${
                                                            typeof row.moyenneGenerale !== 'number'
                                                                ? 'bg-white text-blue-900'
                                                                : row.moyenneGenerale < 6
                                                                    ? 'bg-red-50 text-red-700'
                                                                    : row.moyenneGenerale < 10
                                                                        ? 'bg-yellow-50 text-yellow-700'
                                                                        : 'bg-white text-blue-900'
                                                        }`}>
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={`w-2 h-2 rounded-full ${typeof row.moyenneGenerale === 'number' && row.moyenneGenerale >= 10 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                {typeof row.moyenneGenerale === 'number'
                                                                  ? row.moyenneGenerale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                                                  : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="border border-slate-300 p-1 text-center font-black bg-slate-100 text-[10px] text-slate-800">
                                                            {row.rang || '-'}
                                                        </td>
                                                        <td className="border border-slate-300 p-2 text-[10px] bg-white">
                                                            <div className="flex flex-col items-center justify-center text-center">
                                                                <span className={getJuryAvisClassName(row)}>
                                                                    {getJuryAvisText(row)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        ) : selectedClasse && selectedSemestre ? (
                            <div className="flex flex-col items-center justify-center p-24 text-slate-400">
                                <FontAwesomeIcon icon={faTable} className="text-6xl mb-4 opacity-20" />
                                <p className="text-lg font-medium">Aucun résultat trouvé pour cette sélection.</p>
                                <p className="text-sm">Vérifiez que des notes ont été saisies pour tous les modules.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-24 text-slate-400">
                                <FontAwesomeIcon icon={faTable} className="text-6xl mb-4 opacity-20" />
                                <p className="text-lg font-medium">Veuillez sélectionner une classe et un semestre.</p>
                                <p className="text-sm">Utilisez les menus en haut pour visualiser la planche de délibération.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default PlanchesView
