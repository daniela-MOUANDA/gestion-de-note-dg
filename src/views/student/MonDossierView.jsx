import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faFileUpload,
    faCheckCircle,
    faTimesCircle,
    faClock,
    faExclamationTriangle,
    faUser,
    faEnvelope,
    faPhone,
    faBriefcase,
    faMapMarkerAlt,
    faCloudUploadAlt,
    faFileImage,
    faFilePdf
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from '../../components/common/Sidebar'
import Header from '../../components/common/Header'
import { useAuth } from '../../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const DOCUMENT_TYPES = {
    PHOTO: 'PHOTO',
    ACTE_NAISSANCE: 'ACTE_NAISSANCE',
    ATTESTATION_BAC: 'ATTESTATION_BAC',
    RELEVE_BAC: 'RELEVE_BAC',
    PIECE_IDENTITE: 'PIECE_IDENTITE',
    QUITTANCE_PAIEMENT: 'QUITTANCE_PAIEMENT'
}

const DOCUMENT_LABELS = {
    PHOTO: 'Photo d\'identité',
    ACTE_NAISSANCE: 'Acte de naissance légalisé',
    ATTESTATION_BAC: 'Attestation du BAC légalisée',
    RELEVE_BAC: 'Relevé de notes du BAC légalisé',
    PIECE_IDENTITE: 'Pièce d\'identité (CNI/Passeport)',
    QUITTANCE_PAIEMENT: 'Quittance de paiement'
}

const MonDossierView = () => {
    const { user } = useAuth()
    const [documents, setDocuments] = useState(null)
    const [progression, setProgression] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploadingDoc, setUploadingDoc] = useState(null)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [etudiantId, setEtudiantId] = useState(null)
    const [inscription, setInscription] = useState(null)

    // Tuteur info
    const [tuteurInfo, setTuteurInfo] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        profession: '',
        adresse: ''
    })

    useEffect(() => {
        fetchStudentProfile()
        fetchDocuments()
    }, [])

    const fetchStudentProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/scolarite/etudiant/mon-profil`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success && data.etudiant) {
                setEtudiantId(data.etudiant.id)
                fetchTuteurInfo(data.etudiant.id)
            }
        } catch (err) {
            console.error('Erreur chargement profil étudiant:', err)
        }
    }

    const fetchTuteurInfo = async (id) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/scolarite/etudiants/${id}/parents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success && data.parents && data.parents.length > 0) {
                // Trouver le parent de type TUTEUR ou le premier
                const tuteur = data.parents.find(p => p.type === 'TUTEUR') || data.parents[0]
                setTuteurInfo({
                    nom: tuteur.nom || '',
                    prenom: tuteur.prenom || '',
                    telephone: tuteur.telephone || '',
                    email: tuteur.email || '',
                    profession: tuteur.profession || '',
                    adresse: tuteur.adresse || ''
                })
            }
        } catch (err) {
            console.error('Erreur chargement tuteur:', err)
        }
    }

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')

            const response = await fetch(`${API_URL}/scolarite/student/documents/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()

            if (data.success) {
                setDocuments(data.documents)
                setProgression(data.progression)
                setInscription(data.inscription)
                if (data.inscription && data.inscription.etudiant_id) {
                    setEtudiantId(data.inscription.etudiant_id)
                    fetchTuteurInfo(data.inscription.etudiant_id)
                }
            } else {
                // Si pas encore de documents, initialiser avec une structure vide
                const emptyDocuments = {
                    photo: { type: DOCUMENT_TYPES.PHOTO, label: DOCUMENT_LABELS.PHOTO, url: null, statut: null },
                    acteNaissance: { type: DOCUMENT_TYPES.ACTE_NAISSANCE, label: DOCUMENT_LABELS.ACTE_NAISSANCE, url: null, statut: null },
                    attestationBac: { type: DOCUMENT_TYPES.ATTESTATION_BAC, label: DOCUMENT_LABELS.ATTESTATION_BAC, url: null, statut: null },
                    releveBac: { type: DOCUMENT_TYPES.RELEVE_BAC, label: DOCUMENT_LABELS.RELEVE_BAC, url: null, statut: null },
                    pieceIdentite: { type: DOCUMENT_TYPES.PIECE_IDENTITE, label: DOCUMENT_LABELS.PIECE_IDENTITE, url: null, statut: null },
                    quittancePaiement: { type: DOCUMENT_TYPES.QUITTANCE_PAIEMENT, label: DOCUMENT_LABELS.QUITTANCE_PAIEMENT, url: null, statut: null }
                }
                setDocuments(emptyDocuments)
                setProgression({
                    total: 6,
                    uploaded: 0,
                    valides: 0,
                    rejetes: 0
                })
            }
        } catch (err) {
            console.error('Erreur chargement documents:', err)
            // Même en cas d'erreur, afficher les champs vides
            const emptyDocuments = {
                photo: { type: DOCUMENT_TYPES.PHOTO, label: DOCUMENT_LABELS.PHOTO, url: null, statut: null },
                acteNaissance: { type: DOCUMENT_TYPES.ACTE_NAISSANCE, label: DOCUMENT_LABELS.ACTE_NAISSANCE, url: null, statut: null },
                attestationBac: { type: DOCUMENT_TYPES.ATTESTATION_BAC, label: DOCUMENT_LABELS.ATTESTATION_BAC, url: null, statut: null },
                releveBac: { type: DOCUMENT_TYPES.RELEVE_BAC, label: DOCUMENT_LABELS.RELEVE_BAC, url: null, statut: null },
                pieceIdentite: { type: DOCUMENT_TYPES.PIECE_IDENTITE, label: DOCUMENT_LABELS.PIECE_IDENTITE, url: null, statut: null },
                quittancePaiement: { type: DOCUMENT_TYPES.QUITTANCE_PAIEMENT, label: DOCUMENT_LABELS.QUITTANCE_PAIEMENT, url: null, statut: null }
            }
            setDocuments(emptyDocuments)
            setProgression({
                total: 6,
                uploaded: 0,
                valides: 0,
                rejetes: 0
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (documentType, file) => {
        if (!file) return

        // Vérifier le type de fichier
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            setError('Type de fichier non autorisé. Seulement JPG, PNG et PDF sont acceptés.')
            return
        }

        // Vérifier la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Fichier trop volumineux. Taille maximale: 5 MB')
            return
        }

        try {
            setUploadingDoc(documentType)
            setError(null)
            setSuccess(null)

            const token = localStorage.getItem('token')
            const formData = new FormData()
            formData.append('file', file)
            formData.append('documentType', documentType)

            const response = await fetch(
                `${API_URL}/scolarite/student/documents/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            )

            const data = await response.json()

            if (data.success) {
                setSuccess(`${DOCUMENT_LABELS[documentType]} téléversé avec succès`)
                await fetchDocuments()
            } else {
                setError(data.error || 'Erreur lors du téléversement')
            }
        } catch (err) {
            console.error('Erreur upload:', err)
            setError(err.message || 'Erreur lors du téléversement')
        } finally {
            setUploadingDoc(null)
        }
    }

    const getStatusBadge = (document) => {
        // Si l'inscription est finalisée (INSCRIT), tous les documents téléversés sont considérés comme validés visuellement
        if (inscription?.statut === 'INSCRIT' && document.url) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Validé
                </span>
            )
        }

        if (!document.url && document.statut !== 'REJETE') {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <FontAwesomeIcon icon={faClock} className="mr-1" /> Non téléversé
                </span>
            )
        }

        switch (document.statut) {
            case 'VALIDE':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Validé
                    </span>
                )
            case 'REJETE':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> Rejeté
                    </span>
                )
            case 'EN_ATTENTE':
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <FontAwesomeIcon icon={faClock} className="mr-1" /> En attente
                    </span>
                )
        }
    }

    const getFileIcon = (url) => {
        if (!url) return faFileUpload
        return url.toLowerCase().endsWith('.pdf') ? faFilePdf : faFileImage
    }

    const handleTuteurSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!etudiantId) {
            setError("Impossible d'enregistrer : ID étudiant manquant")
            return
        }

        try {
            setLoading(true)
            setError(null)
            setSuccess(null)

            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/scolarite/etudiants/${etudiantId}/parents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...tuteurInfo,
                    type: 'TUTEUR'
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess('Informations du tuteur enregistrées avec succès')
            } else {
                setError(data.error || "Erreur lors de l'enregistrement")
            }
        } catch (err) {
            console.error('Erreur sauvegarde tuteur:', err)
            setError("Une erreur est survenue lors de l'enregistrement")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <div className="lg:ml-64 min-h-screen">
                    <Header studentName={user?.nom || 'Étudiant'} />
                    <main className="p-6 pt-24">
                        <div className="text-center py-20">
                            <p className="text-slate-600">Chargement de votre dossier...</p>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:ml-64 min-h-screen">
                <Header studentName={user?.nom || 'Étudiant'} />

                <main className="p-6 pt-24">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Mon Dossier d'Inscription</h1>
                        <p className="text-slate-600">Téléversez vos documents et complétez les informations de votre tuteur</p>

                        {inscription?.statut === 'INSCRIT' && (
                            <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl mr-3" />
                                    <div>
                                        <p className="text-green-800 font-semibold">Votre inscription est officiellement finalisée !</p>
                                        <p className="text-green-700 text-sm mt-1">Vos documents ont été validés. Les modifications sont verrouillées sauf si un document est rejeté.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progression retirée selon demande utilisateur */}

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                                <p className="text-sm text-green-700">{success}</p>
                            </div>
                        </div>
                    )}

                    {/* Documents Grid */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Documents requis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents && Object.entries(documents).map(([key, doc]) => (
                                <div key={key} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <FontAwesomeIcon icon={getFileIcon(doc.url)} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">{doc.label}</h4>
                                                <div className="mt-1">{getStatusBadge(doc)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {doc.statut === 'REJETE' && doc.commentaire && (
                                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                                            <p className="text-xs font-semibold text-red-800 mb-1">Raison du rejet:</p>
                                            <p className="text-xs text-red-700">{doc.commentaire}</p>
                                        </div>
                                    )}

                                    {doc.url && (
                                        <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Voir le document
                                            </a>
                                            {doc.date_validation && (
                                                <span>Vérifié le {new Date(doc.date_validation).toLocaleDateString('fr-FR')}</span>
                                            )}
                                        </div>
                                    )}

                                    {uploadingDoc === doc.type ? (
                                        <div className="flex items-center justify-center py-2 text-sm text-slate-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                            Téléversement en cours...
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                id={`upload-${doc.type}`}
                                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                                onChange={(e) => handleFileUpload(doc.type, e.target.files[0])}
                                                className="hidden"
                                                disabled={doc.statut === 'VALIDE' || (inscription?.statut === 'INSCRIT' && doc.statut !== 'REJETE')}
                                            />
                                            <label
                                                htmlFor={`upload-${doc.type}`}
                                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded text-sm font-medium transition-colors ${doc.statut === 'VALIDE' || (inscription?.statut === 'INSCRIT' && doc.statut !== 'REJETE')
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={faCloudUploadAlt} />
                                                {doc.url ? 'Remplacer' : 'Téléverser'}
                                            </label>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Informations Tuteur */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Informations du Tuteur</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faUser} className="mr-2 text-slate-400" />
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={tuteurInfo.nom}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, nom: e.target.value })}
                                    placeholder="Nom du tuteur"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faUser} className="mr-2 text-slate-400" />
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    value={tuteurInfo.prenom}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, prenom: e.target.value })}
                                    placeholder="Prénom du tuteur"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faPhone} className="mr-2 text-slate-400" />
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={tuteurInfo.telephone}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, telephone: e.target.value })}
                                    placeholder="+241 XX XX XX XX"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-slate-400" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={tuteurInfo.email}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, email: e.target.value })}
                                    placeholder="email@exemple.com"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-slate-400" />
                                    Profession
                                </label>
                                <input
                                    type="text"
                                    value={tuteurInfo.profession}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, profession: e.target.value })}
                                    placeholder="Profession du tuteur"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-slate-400" />
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={tuteurInfo.adresse}
                                    onChange={(e) => setTuteurInfo({ ...tuteurInfo, adresse: e.target.value })}
                                    placeholder="Adresse complète"
                                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                            onClick={handleTuteurSubmit}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Enregistrer les informations du tuteur
                        </button>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MonDossierView
