import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSearch, faKey, faUserCircle, faCheckCircle,
    faExclamationCircle, faLock, faEye, faEyeSlash,
    faHistory, faUserShield, faUserPlus
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { searchStudents, updatePassword, createAccount } from '../../api/adminSysteme'
import { useAlert } from '../../contexts/AlertContext'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const StudentCredentialsView = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const { showAlert } = useAlert()

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [showAccountModal, setShowAccountModal] = useState(false)
    const [modalMode, setModalMode] = useState('reset') // 'reset' or 'create'
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [updating, setUpdating] = useState(false)

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        if (!searchTerm.trim()) return

        setSearching(true)
        try {
            const data = await searchStudents(searchTerm)
            setStudents(data)
            if (data.length === 0) {
                showAlert('Aucun étudiant trouvé', 'info')
            }
        } catch (error) {
            showAlert(error.message, 'error')
        } finally {
            setSearching(false)
        }
    }

    const handleOpenModal = (student, mode) => {
        setSelectedStudent(student)
        setModalMode(mode)
        setNewPassword('')
        setConfirmPassword('')
        setShowAccountModal(true)
    }

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            showAlert('Les mots de passe ne correspondent pas', 'error')
            return
        }

        if (newPassword.length < 4) {
            showAlert('Le mot de passe doit contenir au moins 4 caractères', 'error')
            return
        }

        setUpdating(true)
        try {
            if (modalMode === 'create') {
                await createAccount(selectedStudent.id, newPassword)
                showAlert('Compte créé avec succès', 'success')
            } else {
                if (!selectedStudent?.userId) {
                    throw new Error("Cet étudiant n'a pas encore de compte système actif.")
                }
                await updatePassword(selectedStudent.userId, newPassword)
                showAlert('Mot de passe mis à jour avec succès', 'success')
            }
            setShowAccountModal(false)
            // Rafraîchir la recherche pour voir le changement de statut
            handleSearch()
        } catch (error) {
            showAlert(error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="lg:ml-64 min-h-screen">
                <AdminHeader />

                <main className="p-4 sm:p-6 lg:p-8 pt-36 lg:pt-40">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faKey} />
                                </div>
                                Identifiants Étudiants
                            </h1>
                            <p className="text-slate-500 mt-1">Recherchez des étudiants et gérez leurs accès au système.</p>
                        </div>

                        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Matricule, nom, prénom ou email..."
                                className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <FontAwesomeIcon icon={faSearch} />
                            </div>
                            <button
                                type="submit"
                                disabled={searching}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {searching ? '...' : 'Chercher'}
                            </button>
                        </form>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Étudiant</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Matricule</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Compte Système</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.length > 0 ? (
                                        students.map((student) => (
                                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                            <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800">{student.nom} {student.prenom}</div>
                                                            <div className="text-xs text-slate-500">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-semibold">
                                                    {student.matricule}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-700">{student.username}</div>
                                                    {student.derniereConnexion && (
                                                        <div className="text-[10px] text-slate-400 italic">
                                                            <FontAwesomeIcon icon={faHistory} className="mr-1" />
                                                            Dernière connexion: {new Date(student.derniereConnexion).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!student.userId ? (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                            Pas de compte
                                                        </span>
                                                    ) : student.actif ? (
                                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                                            Actif
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200">
                                                            Inactif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!student.userId ? (
                                                        <button
                                                            onClick={() => handleOpenModal(student, 'create')}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Créer le compte système"
                                                        >
                                                            <FontAwesomeIcon icon={faUserPlus} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenModal(student, 'reset')}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Réinitialiser le mot de passe"
                                                        >
                                                            <FontAwesomeIcon icon={faLock} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="text-slate-400 mb-2">
                                                    <FontAwesomeIcon icon={faSearch} className="text-3xl" />
                                                </div>
                                                <p className="text-slate-500">Aucun étudiant affiché. Utilisez la recherche ci-dessus.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Password / Account Modal */}
                <Modal
                    isOpen={showAccountModal}
                    onClose={() => setShowAccountModal(false)}
                    title={modalMode === 'create' ? "Création de compte système" : "Réinitialisation du mot de passe"}
                    icon={modalMode === 'create' ? faUserPlus : faLock}
                >
                    {selectedStudent && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-xl border flex items-start gap-4 ${modalMode === 'create' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <FontAwesomeIcon
                                    icon={modalMode === 'create' ? faCheckCircle : faExclamationCircle}
                                    className={`mt-1 ${modalMode === 'create' ? 'text-emerald-500' : 'text-amber-500'}`}
                                />
                                <div>
                                    <h4 className={`font-bold text-sm ${modalMode === 'create' ? 'text-emerald-800' : 'text-amber-800'}`}>
                                        {modalMode === 'create' ? 'Nouvel accès système' : 'Action de sécurité'}
                                    </h4>
                                    <p className={`text-xs mt-1 ${modalMode === 'create' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {modalMode === 'create'
                                            ? `Vous allez créer un compte pour ${selectedStudent.nom} ${selectedStudent.prenom}. Le matricule servira d'identifiant.`
                                            : `Vous allez modifier le mot de passe de ${selectedStudent.nom} ${selectedStudent.prenom}.`
                                        }
                                        Cette action sera enregistrée dans le journal d'audit.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {modalMode === 'create' ? 'Mot de passe initial' : 'Nouveau mot de passe'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPass ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Minimum 4 caractères"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                                        >
                                            <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmer le mot de passe</label>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    onClick={() => setShowAccountModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={updating || !newPassword}
                                    className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 ${modalMode === 'create' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {updating ? 'Traitement...' : (modalMode === 'create' ? 'Créer le compte' : 'Mettre à jour')}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    )
}

export default StudentCredentialsView
