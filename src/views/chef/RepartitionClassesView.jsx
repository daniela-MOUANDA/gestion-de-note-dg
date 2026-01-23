import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faChalkboardTeacher, faMousePointer, faCheckSquare, faSquare, faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import {
    getFilieres,
    getRepartitionCount,
    createClassesRepartition,
    getNiveaux,
    getClassesExistantes,
    affecterEtudiantsAClasse,
    getEtudiantsTouts,
    reclasserEtudiantsManuellement
} from '../../api/chefDepartement'

const RepartitionClassesView = () => {
    const { user } = useAuth()

    // State pour la répartition
    const [filieres, setFilieres] = useState([])
    const [niveaux, setNiveaux] = useState([])
    const [repartition, setRepartition] = useState({
        formation: 'Initiale1',
        filiereId: '',
        niveauId: ''
    })
    const [repartitionResult, setRepartitionResult] = useState({
        count: null,
        loading: false,
        error: null,
        etudiants: []
    })
    const [showClassModal, setShowClassModal] = useState(false)
    const [classConfig, setClassConfig] = useState({
        method: 'number',
        value: 1,
        namingPattern: '',
        preview: []
    })
    const [creatingClasses, setCreatingClasses] = useState(false)
    const [classesExistantes, setClassesExistantes] = useState([])
    const [selectedClasseExistante, setSelectedClasseExistante] = useState('')
    const [reclasserMode, setReclasserMode] = useState('remplacer') // 'remplacer' ou 'ajouter'
    const [loadingClasses, setLoadingClasses] = useState(false)

    // Mode Manuel
    const [modeManuel, setModeManuel] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])

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
        setSelectedIds([]) // Reset selection

        try {
            let res;
            if (modeManuel) {
                res = await getEtudiantsTouts(repartition.filiereId, repartition.niveauId, repartition.formation)
            } else {
                res = await getRepartitionCount(repartition.filiereId, repartition.niveauId, repartition.formation)
            }

            if (res.success) {
                setRepartitionResult({
                    loading: false,
                    error: null,
                    count: res.count,
                    etudiants: res.etudiants || []
                })

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
                setRepartitionResult({ loading: false, error: res.error, count: null, etudiants: [] })
            }
        } catch (err) {
            setRepartitionResult({ loading: false, error: "Erreur technique", count: null, etudiants: [] })
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
                typeRepartition: classConfig.value === 1 ? 'unique' : 'multiple',
                formation: repartition.formation
            })

            if (res.success) {
                const message = `${res.classes.length} classe(s) créée(s) avec succès!\n${res.etudiantsRepartis || 0} étudiant(s) réparti(s).`
                alert(message)
                setShowClassModal(false)
                setRepartitionResult({ count: null, loading: false, error: null, etudiants: [] })
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

    const handleAffecterAClasseExistante = async () => {
        if (!selectedClasseExistante) {
            alert("Veuillez sélectionner une classe")
            return
        }

        setCreatingClasses(true)
        try {
            let res;
            if (modeManuel) {
                res = await reclasserEtudiantsManuellement({
                    filiereId: repartition.filiereId,
                    niveauId: repartition.niveauId,
                    classeId: selectedClasseExistante,
                    inscriptionIds: selectedIds,
                    mode: reclasserMode
                })
            } else {
                const inscriptionIds = repartitionResult.etudiants.map(e => e.inscriptionId).filter(Boolean)
                res = await affecterEtudiantsAClasse({
                    filiereId: repartition.filiereId,
                    niveauId: repartition.niveauId,
                    classeId: selectedClasseExistante,
                    inscriptionIds: inscriptionIds,
                    formation: repartition.formation
                })
            }

            if (res.success) {
                alert(res.message || `${res.etudiantsAffectes || 0} étudiant(s) affecté(s) avec succès!`)
                setShowClassModal(false)
                setSelectedClasseExistante('')
                setClassesExistantes([])
                setRepartitionResult({ count: null, loading: false, error: null, etudiants: [] })
                setSelectedIds([])
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

    const handleSelectEtudiant = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(repartitionResult.etudiants.map(e => e.inscriptionId))
        } else {
            setSelectedIds([])
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <AdminSidebar />
            <div className="flex flex-col lg:ml-64 min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-800">
                                Répartition des Classes
                            </h1>
                            <p className="text-slate-600">
                                {modeManuel
                                    ? 'Répartissez manuellement les étudiants sélectionnés dans les classes.'
                                    : 'Gérez la répartition automatique des étudiants et la création des classes.'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setModeManuel(!modeManuel)
                                setRepartitionResult({ count: null, loading: false, error: null, etudiants: [] })
                                setSelectedIds([])
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${modeManuel
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                        >
                            <FontAwesomeIcon icon={modeManuel ? faMousePointer : faUsers} />
                            {modeManuel ? 'Basculer en mode Automatique' : 'Passer en mode Manuel'}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={modeManuel ? faMousePointer : faUsers} className="text-blue-600" />
                            {modeManuel ? 'Constitution Manuelle de Classe' : 'Configuration de la répartition'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Formation */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Formation</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    value={repartition.formation}
                                    onChange={(e) => {
                                        setRepartition({ ...repartition, formation: e.target.value })
                                        setRepartitionResult({ count: null, loading: false, error: null, etudiants: [] })
                                    }}
                                >
                                    <option value="Initiale1">Initial 1</option>
                                    <option value="Initiale2">Initial 2</option>
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
                                    className={`w-full text-white p-2 rounded-md disabled:opacity-50 transition-colors ${modeManuel ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {repartitionResult.loading ? 'Chargement...' : modeManuel ? 'Afficher Tous les Étudiants' : 'Afficher Effectifs'}
                                </button>
                            </div>
                        </div>

                        {/* Résultat et Action */}
                        {repartitionResult.count !== null && (
                            <div className="mt-6 animate-fadeIn">
                                <div className={`p-4 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 ${modeManuel ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${modeManuel ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {modeManuel ? selectedIds.length : repartitionResult.count}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">
                                                {modeManuel
                                                    ? `${selectedIds.length} étudiant(s) sélectionné(s) sur ${repartitionResult.count} au total`
                                                    : 'Total Étudiants Inscrits (Non répartis)'}
                                            </p>
                                            <p className="text-xs text-slate-500">Pour {repartition.formation === 'Initiale1' ? 'Initial 1' : 'Initial 2'} - {filieres.find(f => f.id === repartition.filiereId)?.code} - {niveaux.find(n => n.id === repartition.niveauId)?.code}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (modeManuel && selectedIds.length === 0) {
                                                alert("Veuillez sélectionner au moins un étudiant")
                                                return
                                            }

                                            setLoadingClasses(true)
                                            try {
                                                const res = await getClassesExistantes(repartition.filiereId, repartition.niveauId, repartition.formation)
                                                if (res.success) {
                                                    setClassesExistantes(res.classes || [])
                                                    setShowClassModal(true)
                                                } else {
                                                    alert("Erreur: " + res.error)
                                                }
                                            } catch (err) {
                                                alert("Erreur technique")
                                            } finally {
                                                setLoadingClasses(false)
                                            }
                                        }}
                                        disabled={(!modeManuel && repartitionResult.count === 0) || (modeManuel && selectedIds.length === 0) || loadingClasses}
                                        className={`px-4 py-2 text-white rounded-md transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${modeManuel ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={modeManuel ? faExchangeAlt : faChalkboardTeacher} />
                                        {loadingClasses ? 'Chargement...' : modeManuel ? 'Changer de Classe' : 'Répartir en Classes'}
                                    </button>
                                </div>

                                {/* Table des étudiants */}
                                {repartitionResult.etudiants && repartitionResult.etudiants.length > 0 && (
                                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-700">Liste des étudiants</h4>
                                            {modeManuel && (
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <button
                                                        onClick={() => {
                                                            const unassignedIds = repartitionResult.etudiants
                                                                .filter(e => e.classeCode === 'Non assigné')
                                                                .map(e => e.inscriptionId)
                                                            setSelectedIds(unassignedIds)
                                                        }}
                                                        className="text-blue-600 hover:text-blue-100 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium transition-colors"
                                                    >
                                                        Sélectionner les non-assignés
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            onChange={handleSelectAll}
                                                            checked={selectedIds.length === repartitionResult.etudiants.length && repartitionResult.etudiants.length > 0}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        Sélectionner tout
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                            {modeManuel ? '' : '#'}
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Matricule</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Nom</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Prénom</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Filière/Niveau</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Classe Actuelle</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {repartitionResult.etudiants.map((etudiant, idx) => (
                                                        <tr
                                                            key={etudiant.inscriptionId}
                                                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${modeManuel && selectedIds.includes(etudiant.inscriptionId) ? 'bg-blue-50' : ''
                                                                }`}
                                                            onClick={() => modeManuel && handleSelectEtudiant(etudiant.inscriptionId)}
                                                        >
                                                            <td className="px-4 py-2 text-sm text-slate-600">
                                                                {modeManuel ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <FontAwesomeIcon
                                                                            icon={selectedIds.includes(etudiant.inscriptionId) ? faCheckSquare : faSquare}
                                                                            className={selectedIds.includes(etudiant.inscriptionId) ? 'text-blue-600' : 'text-slate-300'}
                                                                        />
                                                                    </div>
                                                                ) : idx + 1}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-slate-800">{etudiant.matricule}</td>
                                                            <td className="px-4 py-2 text-sm text-slate-800">{etudiant.nom}</td>
                                                            <td className="px-4 py-2 text-sm text-slate-800">{etudiant.prenom}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-600">
                                                                <span className="px-2 py-0.5 bg-slate-100 rounded">
                                                                    {repartition.formation} - {filieres.find(f => f.id === repartition.filiereId)?.code}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${etudiant.classeCode === 'Non assigné'
                                                                    ? 'bg-red-50 text-red-600'
                                                                    : 'bg-green-50 text-green-600'
                                                                    }`}>
                                                                    {etudiant.classeCode}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {repartitionResult.count === 0 && (
                                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md text-sm text-center">
                                        Aucun étudiant trouvé pour ces critères.
                                    </div>
                                )}
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

            {/* MODAL RÉPARTITION */}
            {showClassModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {modeManuel ? 'Reclasser les étudiants' : (repartitionResult.count < 20 ? 'Affecter à une classe existante' : 'Configuration des Classes')}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {modeManuel
                                    ? `Sélectionnez la classe cible pour les ${selectedIds.length} étudiants sélectionnés.`
                                    : (repartitionResult.count < 20
                                        ? `Affecter les ${repartitionResult.count} étudiant(s) à une classe existante`
                                        : `Définissez comment répartir les ${repartitionResult.count} étudiants`)}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {(repartitionResult.count < 20 || modeManuel) ? (
                                // Modal pour affecter à une classe existante ou Reclasser
                                <>
                                    {classesExistantes.length === 0 && repartition.formation !== 'Initiale2' ? (
                                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm text-center">
                                            Aucune classe existante trouvée pour cette filière et ce niveau.
                                            Vous devez d'abord créer des classes.
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-slate-700">
                                                        Sélectionner une classe cible
                                                    </label>
                                                    {repartition.formation === 'Initiale2' && (
                                                        <button
                                                            onClick={async () => {
                                                                setLoadingClasses(true)
                                                                try {
                                                                    // Charger les classes de l'Initiale 1
                                                                    const res = await getClassesExistantes(repartition.filiereId, repartition.niveauId, 'Initiale1')
                                                                    if (res.success) {
                                                                        setClassesExistantes(res.classes || [])
                                                                        // Reset selection
                                                                        setSelectedClasseExistante('')
                                                                        alert("Classes de l'Initial 1 chargées !")
                                                                    } else {
                                                                        alert("Aucune classe trouvée en Initial 1")
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err)
                                                                    alert("Erreur lors du chargement des classes")
                                                                } finally {
                                                                    setLoadingClasses(false)
                                                                }
                                                            }}
                                                            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon icon={faExchangeAlt} className="mr-1" />
                                                            Voir classes Initial 1
                                                        </button>
                                                    )}
                                                </div>
                                                <select
                                                    className="w-full p-2 border border-slate-300 rounded-md"
                                                    value={selectedClasseExistante}
                                                    onChange={(e) => setSelectedClasseExistante(e.target.value)}
                                                >
                                                    <option value="">Choisir une classe...</option>
                                                    {classesExistantes.map(classe => (
                                                        <option key={classe.id} value={classe.id}>
                                                            {classe.code} - {classe.nom} (Effectif actuel: {classe.effectif || 0})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedClasseExistante && (
                                                <div className="space-y-4">
                                                    {modeManuel && (
                                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Option de Reclassement</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="radio"
                                                                        name="reclasserMode"
                                                                        value="remplacer"
                                                                        checked={reclasserMode === 'remplacer'}
                                                                        onChange={(e) => setReclasserMode(e.target.value)}
                                                                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                                                                    />
                                                                    <span className={`text-sm ${reclasserMode === 'remplacer' ? 'text-amber-700 font-medium' : 'text-slate-600'}`}>
                                                                        Remplacer (Vider la classe)
                                                                    </span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="radio"
                                                                        name="reclasserMode"
                                                                        value="ajouter"
                                                                        checked={reclasserMode === 'ajouter'}
                                                                        onChange={(e) => setReclasserMode(e.target.value)}
                                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className={`text-sm ${reclasserMode === 'ajouter' ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                                                        Ajouter (Conserver les membres)
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`p-4 rounded-lg ${modeManuel ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                                        <p className="text-sm text-slate-700">
                                                            <strong>{modeManuel ? selectedIds.length : repartitionResult.count}</strong> étudiant(s) seront affecté(s) à la classe sélectionnée.
                                                        </p>
                                                        {(() => {
                                                            const classe = classesExistantes.find(c => c.id === selectedClasseExistante)
                                                            const countToMove = modeManuel ? selectedIds.length : repartitionResult.count
                                                            const isReplacing = modeManuel && reclasserMode === 'remplacer'
                                                            const nouvelEffectif = isReplacing ? countToMove : (classe?.effectif || 0) + countToMove

                                                            return (
                                                                <p className="text-xs text-slate-600 mt-1">
                                                                    {isReplacing
                                                                        ? `Cette classe sera vidée et contiendra exactement ${nouvelEffectif} étudiant(s).`
                                                                        : `Nouvel effectif prévisionnel: ${nouvelEffectif} étudiant(s)`
                                                                    }
                                                                </p>
                                                            )
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                // Modal pour créer de nouvelles classes (Automatique)
                                <>
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
                                            Nombre de classes à créer
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
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowClassModal(false)
                                    setSelectedClasseExistante('')
                                    setClassesExistantes([])
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Annuler
                            </button>
                            {(repartitionResult.count < 20 || modeManuel) ? (
                                <button
                                    onClick={handleAffecterAClasseExistante}
                                    disabled={creatingClasses || !selectedClasseExistante || classesExistantes.length === 0}
                                    className={`px-4 py-2 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 ${modeManuel ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {creatingClasses ? 'Traitement...' : 'Confirmer l\'affectation'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateClasses}
                                    disabled={creatingClasses}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {creatingClasses ? 'Création...' : 'Confirmer la création'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RepartitionClassesView
