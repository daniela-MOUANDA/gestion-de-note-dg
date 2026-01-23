import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCheckCircle,
    faTimesCircle,
    faEye,
    faUser,
    faGraduationCap,
    faFileAlt,
    faSearch,
    faFilter,
    faTimes,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import './ValiderDocumentsView.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const DOCUMENT_LABELS = {
    PHOTO: 'Photo d\'identité',
    ACTE_NAISSANCE: 'Acte de naissance',
    ATTESTATION_BAC: 'Attestation BAC',
    PIECE_IDENTITE: 'Pièce d\'identité',
    QUITTANCE_PAIEMENT: 'Quittance paiement'
}

const ValiderDocumentsView = () => {
    const [dossiers, setDossiers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFiliere, setSelectedFiliere] = useState('all')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [currentDocument, setCurrentDocument] = useState(null)
    const [currentInscription, setCurrentInscription] = useState(null)
    const [rejectionComment, setRejectionComment] = useState('')
    const [processing, setProcessing] = useState(false)

    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        fetchPendingDocuments()
    }, [])

    const fetchPendingDocuments = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')

            const response = await axios.get(`${API_URL}/scolarite/agent/documents/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                setDossiers(response.data.data || [])
            }
        } catch (err) {
            console.error('Erreur chargement documents:', err)
            setError('Erreur lors du chargement des documents en attente')
        } finally {
            setLoading(false)
        }
    }

    const openDocumentModal = (inscription, document) => {
        setCurrentInscription(inscription)
        setCurrentDocument(document)
        setRejectionComment('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setCurrentDocument(null)
        setCurrentInscription(null)
        setRejectionComment('')
    }

    const handleValidate = async () => {
        if (!currentDocument || !currentInscription) return

        try {
            setProcessing(true)
            setError(null)
            const token = localStorage.getItem('token')

            const response = await axios.post(
                `${API_URL}/scolarite/agent/documents/validate`,
                {
                    inscriptionId: currentInscription.inscriptionId,
                    documentType: currentDocument.type,
                    statut: 'VALIDE',
                    commentaire: null
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            if (response.data.success) {
                setSuccess(`${currentDocument.label} validé avec succès`)
                closeModal()
                await fetchPendingDocuments()
            }
        } catch (err) {
            console.error('Erreur validation:', err)
            setError(err.response?.data?.error || 'Erreur lors de la validation')
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!currentDocument || !currentInscription) return

        if (!rejectionComment.trim()) {
            setError('Veuillez saisir un commentaire expliquant le rejet')
            return
        }

        try {
            setProcessing(true)
            setError(null)
            const token = localStorage.getItem('token')

            const response = await axios.post(
                `${API_URL}/scolarite/agent/documents/validate`,
                {
                    inscriptionId: currentInscription.inscriptionId,
                    documentType: currentDocument.type,
                    statut: 'REJETE',
                    commentaire: rejectionComment
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            if (response.data.success) {
                setSuccess(`${currentDocument.label} rejeté. L'étudiant a été notifié par email.`)
                closeModal()
                await fetchPendingDocuments()
            }
        } catch (err) {
            console.error('Erreur rejet:', err)
            setError(err.response?.data?.error || 'Erreur lors du rejet')
        } finally {
            setProcessing(false)
        }
    }

    const filteredDossiers = dossiers.filter(dossier => {
        const matchesSearch =
            dossier.etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dossier.etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dossier.etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFiliere = selectedFiliere === 'all' || dossier.filiere?.code === selectedFiliere

        return matchesSearch && matchesFiliere
    })

    const filieres = [...new Set(dossiers.map(d => d.filiere?.code).filter(Boolean))]

    if (loading) {
        return (
            <div className="valider-documents-container">
                <div className="loading">
                    <FontAwesomeIcon icon={faSpinner} spin /> Chargement des documents...
                </div>
            </div>
        )
    }

    return (
        <div className="valider-documents-container">
            <div className="header">
                <div>
                    <h1>📋 Validation des Documents</h1>
                    <p className="subtitle">
                        {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''} en attente de validation
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error}
                    <button onClick={() => setError(null)} className="alert-close">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    {success}
                    <button onClick={() => setSuccess(null)} className="alert-close">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}

            {/* Filtres */}
            <div className="filters">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou matricule..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FontAwesomeIcon icon={faFilter} />
                    <select value={selectedFiliere} onChange={(e) => setSelectedFiliere(e.target.value)}>
                        <option value="all">Toutes les filières</option>
                        {filieres.map(code => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Liste des dossiers */}
            {filteredDossiers.length === 0 ? (
                <div className="empty-state">
                    <FontAwesomeIcon icon={faCheckCircle} size="3x" />
                    <h3>Aucun document en attente</h3>
                    <p>Tous les documents ont été validés !</p>
                </div>
            ) : (
                <div className="dossiers-grid">
                    {filteredDossiers.map((dossier) => (
                        <div key={dossier.inscriptionId} className="dossier-card">
                            <div className="dossier-header">
                                <div className="student-info">
                                    <FontAwesomeIcon icon={faUser} className="student-icon" />
                                    <div>
                                        <h3>{dossier.etudiant.prenom} {dossier.etudiant.nom}</h3>
                                        <p className="matricule">{dossier.etudiant.matricule}</p>
                                    </div>
                                </div>
                                <div className="formation-badge">
                                    <FontAwesomeIcon icon={faGraduationCap} />
                                    {dossier.filiere?.code} - {dossier.niveau?.nom}
                                </div>
                            </div>

                            <div className="documents-list">
                                <h4>
                                    <FontAwesomeIcon icon={faFileAlt} />
                                    Documents en attente ({dossier.nombreDocumentsEnAttente})
                                </h4>
                                {dossier.documentsEnAttente.map((doc, idx) => (
                                    <div key={idx} className="document-item">
                                        <span className="doc-label">{doc.label}</span>
                                        <button
                                            className="view-btn"
                                            onClick={() => openDocumentModal(dossier, doc)}
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                            Voir & Valider
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de visualisation */}
            {showModal && currentDocument && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{currentDocument.label}</h2>
                            <button className="close-btn" onClick={closeModal}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="student-details">
                                <strong>{currentInscription.etudiant.prenom} {currentInscription.etudiant.nom}</strong>
                                <span>({currentInscription.etudiant.matricule})</span>
                            </div>

                            <div className="document-viewer">
                                {currentDocument.url.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={currentDocument.url}
                                        title="Document PDF"
                                        className="pdf-viewer"
                                    />
                                ) : (
                                    <img
                                        src={currentDocument.url}
                                        alt={currentDocument.label}
                                        className="image-viewer"
                                    />
                                )}
                            </div>

                            <div className="rejection-section">
                                <label>Commentaire de rejet (optionnel pour validation, obligatoire pour rejet):</label>
                                <textarea
                                    value={rejectionComment}
                                    onChange={(e) => setRejectionComment(e.target.value)}
                                    placeholder="Expliquez pourquoi ce document est rejeté (ex: photo floue, document non légalisé, etc.)"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-reject"
                                onClick={handleReject}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        Rejeter
                                    </>
                                )}
                            </button>
                            <button
                                className="btn-validate"
                                onClick={handleValidate}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Valider
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ValiderDocumentsView
