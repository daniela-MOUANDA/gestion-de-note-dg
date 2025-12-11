import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faGraduationCap, faFileAlt, faSearch, faDownload, faSpinner, faCheckCircle, faTimesCircle, faTrophy
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
    const [metaData, setMetaData] = useState(null) // { evaluationsConfig, semestre }

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
            console.log('📋 Classes chargées:', result)
            if (result.success) {
                setClasses(result.classes || [])
            } else {
                showAlert(result.error || 'Erreur lors du chargement des classes', 'error')
            }
        } catch (error) {
            console.error('Erreur chargement classes:', error)
            showAlert('Erreur lors du chargement des classes', 'error')
        }
    }

    const loadBulletin = async () => {
        setLoading(true)
        try {
            console.log('📊 Chargement bulletin:', { selectedClasse, selectedSemestre })
            const result = await getBulletinData(selectedClasse, selectedSemestre)
            console.log('📊 Résultat bulletin:', result)
            if (result.success) {
                setBulletinData(result.data || [])
                setMetaData(result.meta)
                
                // Messages informatifs selon les métadonnées
                if (result.meta) {
                    console.log('📊 Métadonnées:', {
                        modulesCount: result.meta.modulesCount,
                        etudiantsCount: result.meta.etudiantsCount,
                        notesCount: result.meta.notesCount,
                        parametresCount: result.meta.parametresCount
                    })
                    
                    if (result.data && result.data.length === 0) {
                        if (result.meta.etudiantsCount === 0) {
                            showAlert('Aucun étudiant inscrit dans cette classe', 'warning')
                        } else if (result.meta.modulesCount === 0) {
                            showAlert('Aucun module trouvé pour cette filière et ce semestre. Veuillez créer des modules d\'abord.', 'warning')
                        } else if (result.meta.parametresCount === 0) {
                            showAlert('Aucun paramètre de notation configuré pour les modules de ce semestre. Veuillez configurer les paramètres d\'évaluation.', 'warning')
                        } else if (result.meta.notesCount === 0) {
                            showAlert('Aucune note enregistrée pour ce semestre. Veuillez saisir les notes des étudiants.', 'warning')
                        } else {
                            showAlert('Aucune donnée trouvée pour cette classe et ce semestre', 'warning')
                        }
                    }
                } else if (result.data && result.data.length === 0) {
                    showAlert('Aucune donnée trouvée pour cette classe et ce semestre', 'warning')
                }
            } else {
                showAlert(result.error || 'Erreur lors du chargement du relevé', 'error')
                setBulletinData([])
                setMetaData(null)
            }
        } catch (error) {
            console.error('Erreur chargement bulletin:', error)
            showAlert('Erreur lors du chargement du relevé: ' + (error.message || 'Erreur inconnue'), 'error')
            setBulletinData([])
            setMetaData(null)
        } finally {
            setLoading(false)
        }
    }

    const exportExcel = () => {
        if (!bulletinData.length) return

        // Préparer les données pour Excel
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

            // Ajouter les colonnes des modules
            item.modules.forEach(mod => {
                row[`${mod.code} - ${mod.nom}`] = mod.moyenne
            })

            return row
        })

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Relevé")

        // Nom du fichier
        const classeNom = classes.find(c => c.id === selectedClasse)?.nom || 'Classe'
        XLSX.writeFile(wb, `Releve_${classeNom}_${selectedSemestre}.xlsx`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">

                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Relevé de Notes</h1>
                            <p className="text-sm text-slate-600">Consultation des performances et validation du semestre</p>
                        </div>
                        {bulletinData.length > 0 && (
                            <button
                                onClick={exportExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                Exporter Excel
                            </button>
                        )}
                    </div>

                    {/* Filtres */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                        <div className="w-full sm:w-64">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                            <select
                                value={selectedClasse}
                                onChange={(e) => setSelectedClasse(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Sélectionner une classe</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom} {c.filieres?.code ? `(${c.filieres.code})` : ''} {c.filiere ? `(${c.filiere})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-64">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Semestre</label>
                            <select
                                value={selectedSemestre}
                                onChange={(e) => setSelectedSemestre(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Sélectionner un semestre</option>
                                <option value="S1">Semestre 1</option>
                                <option value="S2">Semestre 2</option>
                                <option value="S3">Semestre 3</option>
                                <option value="S4">Semestre 4</option>
                                <option value="S5">Semestre 5</option>
                                <option value="S6">Semestre 6</option>
                            </select>
                        </div>
                    </div>

                    {/* Tableau */}
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                        </div>
                    ) : bulletinData.length > 0 && bulletinData[0]?.modules?.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-16">Rang</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider sticky left-16 bg-slate-50 z-10 w-64">Étudiant</th>

                                            {/* En-têtes Modules groupés par UE */}
                                            {bulletinData[0].modules.map((mod, index) => {
                                                const ue = mod.ue || 'UE1'
                                                const prevMod = index > 0 ? bulletinData[0].modules[index - 1] : null
                                                const prevUE = prevMod?.ue || 'UE1'
                                                const isFirstOfUE = ue !== prevUE
                                                
                                                return (
                                                    <th 
                                                        key={mod.id} 
                                                        className={`px-2 py-3 text-center text-xs font-semibold text-slate-700 border-l min-w-[100px] ${
                                                            isFirstOfUE ? 'border-l-2 border-l-blue-400 bg-blue-50/30' : 'border-slate-100'
                                                        }`}
                                                    >
                                                        <div className="truncate w-24 mx-auto" title={mod.nom}>
                                                            {mod.code}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-normal">
                                                            ({mod.credit} Crédits)
                                                        </div>
                                                        <div className="text-[9px] font-bold text-blue-600 mt-0.5">
                                                            {ue}
                                                        </div>
                                                    </th>
                                                )
                                            })}

                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-l border-slate-200 bg-blue-50/50">Moy. Gen.</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-blue-50/50">Crédits</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-blue-50/50">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {bulletinData.map((item) => (
                                            <tr key={item.etudiant?.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 sticky left-0 bg-white z-10 font-medium text-slate-900 border-r border-slate-100">
                                                    {item.rang !== null && item.rang !== undefined ? (
                                                        <>
                                                            {item.rang === 1 && <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 mr-1" />}
                                                            {item.rang === 2 && <FontAwesomeIcon icon={faTrophy} className="text-slate-400 mr-1" />}
                                                            {item.rang === 3 && <FontAwesomeIcon icon={faTrophy} className="text-amber-600 mr-1" />}
                                                            {item.rang}e
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 sticky left-16 bg-white z-10 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                    <div className="font-medium text-slate-900">{item.etudiant?.nom || ''} {item.etudiant?.prenom || ''}</div>
                                                    <div className="text-xs text-slate-500">{item.etudiant?.matricule || ''}</div>
                                                </td>

                                                {/* Notes Modules (déjà triés par UE dans le service) */}
                                                {item.modules?.map((mod, index) => {
                                                    const ue = mod.ue || 'UE1'
                                                    const prevMod = index > 0 ? item.modules[index - 1] : null
                                                    const prevUE = prevMod?.ue || 'UE1'
                                                    const isFirstOfUE = ue !== prevUE
                                                    
                                                    return (
                                                        <td 
                                                            key={mod.id} 
                                                            className={`px-2 py-3 text-center border-l ${
                                                                isFirstOfUE ? 'border-l-2 border-l-blue-400 bg-blue-50/30' : 'border-slate-100'
                                                            }`}
                                                        >
                                                            {mod.moyenne !== null && mod.moyenne !== undefined ? (
                                                                <span className={`text-sm font-medium ${mod.valide ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {mod.moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">-</span>
                                                            )}
                                                        </td>
                                                    )
                                                }) || <td colSpan={bulletinData[0]?.modules?.length || 1} className="text-center text-slate-400">Aucun module</td>}

                                                <td className="px-4 py-3 text-center border-l border-slate-200 bg-blue-50/30">
                                                    <span className={`font-bold ${item.moyenneGenerale >= 10 ? 'text-green-700' : 'text-red-700'}`}>
                                                        {item.moyenneGenerale !== null && item.moyenneGenerale !== undefined ? item.moyenneGenerale.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center bg-blue-50/30 text-slate-700 font-medium">
                                                    {item.totalCreditsValides || 0}
                                                </td>
                                                <td className="px-4 py-3 text-center bg-blue-50/30">
                                                    {item.statut === 'VALIDE' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <FontAwesomeIcon icon={faCheckCircle} /> Validé
                                                        </span>
                                                    ) : item.statut === 'AJOURNE' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <FontAwesomeIcon icon={faTimesCircle} /> Ajourné
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : selectedClasse && selectedSemestre ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium mb-2">Aucune donnée disponible pour cette classe et ce semestre</p>
                            <div className="text-sm text-slate-400 space-y-1">
                                {metaData && (
                                    <>
                                        {metaData.etudiantsCount === 0 && (
                                            <p>• Aucun étudiant inscrit dans cette classe</p>
                                        )}
                                        {metaData.modulesCount === 0 && (
                                            <p>• Aucun module trouvé pour cette filière et ce semestre</p>
                                        )}
                                        {metaData.parametresCount === 0 && metaData.modulesCount > 0 && (
                                            <p>• Aucun paramètre de notation configuré pour les modules</p>
                                        )}
                                        {metaData.notesCount === 0 && metaData.parametresCount > 0 && (
                                            <p>• Aucune note enregistrée pour ce semestre</p>
                                        )}
                                    </>
                                )}
                                {!metaData && (
                                    <p>Vérifiez que des notes ont été saisies pour ce semestre</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-slate-300 mb-3" />
                            <p className="text-slate-500">Sélectionnez une classe et un semestre pour voir le relevé</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default RelevesNotesView
