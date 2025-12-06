import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { getFilieres, getRepartitionCount, createClassesRepartition, getNiveaux } from '../../api/chefDepartement'

const RepartitionClassesView = () => {
    const { user } = useAuth()

    // State pour la répartition
    const [filieres, setFilieres] = useState([])
    const [niveaux, setNiveaux] = useState([])
    const [repartition, setRepartition] = useState({
        formation: 'Initiale',
        filiereId: '',
        niveauId: ''
    })
    const [repartitionResult, setRepartitionResult] = useState({
        count: null,
        loading: false,
        error: null
    })
    const [showClassModal, setShowClassModal] = useState(false)
    const [classConfig, setClassConfig] = useState({
        method: 'number',
        value: 1,
        namingPattern: '',
        preview: []
    })
    const [creatingClasses, setCreatingClasses] = useState(false)

    // Charger les données initiales
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [filieresRes, niveauxRes] = await Promise.all([
                getFilieres(),
                getNiveaux()
            ])

            if (filieresRes.success) {
                setFilieres(filieresRes.filieres || [])
            }
            if (niveauxRes.success) {
                setNiveaux(niveauxRes.niveaux || [])
                // Set default niveau if available
                if (niveauxRes.niveaux && niveauxRes.niveaux.length > 0) {
                    setRepartition(prev => ({ ...prev, niveauId: niveauxRes.niveaux[0].id }))
                }
            }
        } catch (error) {
            console.error("Erreur chargement données:", error)
        }
    }

    const handleCheckRepartition = async () => {
        if (!repartition.filiereId || !repartition.niveauId) return

        setRepartitionResult({ ...repartitionResult, loading: true, error: null, count: null })
        try {
            const res = await getRepartitionCount(repartition.filiereId, repartition.niveauId)
            if (res.success) {
                setRepartitionResult({ loading: false, error: null, count: res.count })

                // Préparer pattern
                const filiere = filieres.find(f => f.id === repartition.filiereId)
                const codeFiliere = filiere ? filiere.code : 'CL'

                const niveau = niveaux.find(n => n.id === repartition.niveauId)
                const codeNiveau = niveau ? niveau.code : 'Niv'

                setClassConfig(prev => ({
                    ...prev,
                    namingPattern: `${codeFiliere}-${codeNiveau}`,
                    value: 1,
                    preview: calculatePreview(1, `${codeFiliere}-${codeNiveau}`, 'unique')
                }))
            } else {
                setRepartitionResult({ loading: false, error: res.error, count: null })
            }
        } catch (err) {
            setRepartitionResult({ loading: false, error: "Erreur technique", count: null })
        }
    }

    const calculatePreview = (count, pattern, type) => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F']
        let previews = []
        for (let i = 0; i < count; i++) {
            const suffix = count > 1 ? ` ${letters[i]}` : (type === 'unique' ? '' : ` ${letters[i]}`)
            previews.push(`${pattern}${suffix}`)
        }
        return previews
    }

    const handleUpdateConfig = (key, value) => {
        setClassConfig(prev => {
            const newConfig = { ...prev, [key]: value }
            if (key === 'value' || key === 'method') {
                newConfig.preview = calculatePreview(value, newConfig.namingPattern, value === 1 ? 'unique' : 'multiple')
            }
            return newConfig
        })
    }

    const handleCreateClasses = async () => {
        setCreatingClasses(true)
        try {
            const res = await createClassesRepartition({
                filiereId: repartition.filiereId,
                niveauId: repartition.niveauId,
                nombreClasses: classConfig.value,
                namingPattern: classConfig.namingPattern,
                typeRepartition: classConfig.value === 1 ? 'unique' : 'multiple'
            })

            if (res.success) {
                alert("Classes créées avec succès !")
                setShowClassModal(false)
                setRepartitionResult({ ...repartitionResult, count: null })
            } else {
                alert("Erreur: " + res.error)
            }
        } catch (err) {
            console.error(err)
            alert("Erreur technique")
        } finally {
            setCreatingClasses(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-800">
                            Répartition des Classes
                        </h1>
                        <p className="text-slate-600">
                            Gérez la répartition des étudiants et la création des classes.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                            Configuration de la répartition
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Formation */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Formation</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={repartition.formation}
                                    onChange={(e) => setRepartition({ ...repartition, formation: e.target.value })}
                                >
                                    <option value="Initiale">Formation Initiale</option>
                                    <option value="Continue">Formation Continue</option>
                                </select>
                            </div>

                            {/* Filière */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Filière</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={repartition.filiereId}
                                    onChange={(e) => setRepartition({ ...repartition, filiereId: e.target.value })}
                                >
                                    <option value="">Sélectionner...</option>
                                    {filieres.map(f => (
                                        <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Niveau */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={repartition.niveauId}
                                    onChange={(e) => setRepartition({ ...repartition, niveauId: e.target.value })}
                                >
                                    <option value="">Sélectionner...</option>
                                    {niveaux.map(n => (
                                        <option key={n.id} value={n.id}>{n.nom} ({n.code})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Bouton Rechercher */}
                            <div>
                                <button
                                    onClick={handleCheckRepartition}
                                    disabled={repartitionResult.loading || !repartition.filiereId || !repartition.niveauId}
                                    className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {repartitionResult.loading ? 'Chargement...' : 'Afficher Effectifs'}
                                </button>
                            </div>
                        </div>

                        {/* Résultat et Action */}
                        {repartitionResult.count !== null && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {repartitionResult.count}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">Total Étudiants Inscrits (Non répartis)</p>
                                        <p className="text-xs text-slate-500">Pour {repartition.formation} - {filieres.find(f => f.id === repartition.filiereId)?.code}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowClassModal(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faChalkboardTeacher} />
                                    Répartir en Classes
                                </button>
                            </div>
                        )}

                        {repartitionResult.error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                {repartitionResult.error}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL CRÉATION CLASSES */}
            {showClassModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">Configuration des Classes</h3>
                            <p className="text-sm text-slate-500 mt-1">Définissez comment répartir les {repartitionResult.count} étudiants</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Méthode de répartition</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className={`p-3 border rounded-lg text-sm font-medium transition-all ${classConfig.method === 'number' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        onClick={() => handleUpdateConfig('method', 'number')}
                                    >
                                        Par Nombre de Classes
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {classConfig.method === 'number' ? 'Nombre de classes à créer' : 'Nombre max d\'étudiants par classe'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={classConfig.value}
                                    onChange={(e) => handleUpdateConfig('value', parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Aperçu</p>
                                <div className="flex flex-wrap gap-2">
                                    {classConfig.preview.map((name, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Soit environ ~{Math.ceil(repartitionResult.count / classConfig.value)} étudiants par classe
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowClassModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateClasses}
                                disabled={creatingClasses}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {creatingClasses ? 'Création...' : 'Confirmer la création'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RepartitionClassesView
