import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faCamera,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import AdminLayout from '../../components/layouts/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { uploadProfilePhoto, getCurrentUser } from '../../api/auth'

const ProfilAdminView = () => {
  const { user, logout, isAuthenticated, updateUser } = useAuth()
  const navigate = useNavigate()

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login')
    }
  }, [isAuthenticated, user, navigate])
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  const getRoleLabel = (role) => {
    if (!role) return 'Utilisateur'
    const labels = {
      'SP_SCOLARITE': 'Secrétaire Particulière',
      'AGENT_SCOLARITE': 'Agent Scolarité',
      'CHEF_SERVICE_SCOLARITE': 'Chef de Service Scolarité',
      'CHEF_DEPARTEMENT': 'Chef de Département',
      'COORD_PEDAGOGIQUE': 'Coordinateur pédagogique',
      'DEP': 'Directeur des Études Pédagogiques'
    }
    return labels[role] || (typeof role === 'string' ? role.replace(/_/g, ' ') : 'Utilisateur')
  }

  const getServiceLabel = (role) => {
    if (!role) return 'Administration'
    const labels = {
      'SP_SCOLARITE': 'Direction de la Scolarité',
      'AGENT_SCOLARITE': 'Service Scolarité',
      'CHEF_SERVICE_SCOLARITE': 'Service Scolarité',
      'CHEF_DEPARTEMENT': 'Département',
      'COORD_PEDAGOGIQUE': 'Département',
      'DEP': 'Administration'
    }
    return labels[role] || 'Administration'
  }

  // Charger les données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Utiliser d'abord les données du contexte (toujours disponibles)
        const role = user.role || ''
        const userEmail = user.email || ''
        const initialData = {
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: userEmail,
          role: role,
          telephone: user.telephone || 'N/A',
          adresse: user.adresse || 'N/A',
          dateCreation: user.dateCreation ? new Date(user.dateCreation).toLocaleDateString('fr-FR') : 'N/A',
          derniereConnexion: user.derniereConnexion ? new Date(user.derniereConnexion).toLocaleString('fr-FR') : 'N/A',
          photo: user.photo || null,
          service: getServiceLabel(role),
          poste: getRoleLabel(role)
        }

        // Afficher immédiatement les données du contexte
        setUserData(initialData)
        setLoading(false)

        // Ensuite, essayer de récupérer les données complètes depuis l'API en arrière-plan
        // MAIS seulement si l'ID et l'email correspondent exactement à celui de l'utilisateur connecté
        try {
          const currentUser = await getCurrentUser()
          // Vérifier que les données de l'API correspondent EXACTEMENT à l'utilisateur connecté
          // Vérifier à la fois l'ID, l'email et le rôle pour être sûr
          const userRole = user.role || ''
          if (currentUser && currentUser.id === user.id && currentUser.email === userEmail && currentUser.role === userRole) {
            const updatedRole = currentUser.role || ''
            setUserData({
              nom: currentUser.nom || '',
              prenom: currentUser.prenom || '',
              email: currentUser.email || '',
              role: updatedRole,
              telephone: currentUser.telephone || 'N/A',
              adresse: currentUser.adresse || 'N/A',
              dateCreation: currentUser.dateCreation ? new Date(currentUser.dateCreation).toLocaleDateString('fr-FR') : 'N/A',
              derniereConnexion: currentUser.derniereConnexion ? new Date(currentUser.derniereConnexion).toLocaleString('fr-FR') : 'N/A',
              photo: currentUser.photo || null,
              service: getServiceLabel(updatedRole),
              poste: getRoleLabel(updatedRole)
            })
          } else if (currentUser) {
            // Si l'API retourne un autre utilisateur (ID, email ou rôle différent), ne pas mettre à jour
            console.warn('Les données de l\'API ne correspondent pas à l\'utilisateur connecté. Conservation des données du contexte.', {
              apiUser: { id: currentUser.id, email: currentUser.email, role: currentUser.role },
              contextUser: { id: user.id, email: userEmail, role: userRole }
            })
          }
        } catch (apiError) {
          console.warn('Impossible de récupérer les données depuis l\'API, utilisation des données du contexte:', apiError)
          // Les données du contexte sont déjà affichées
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error)
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Vérifier que l'utilisateur est connecté et que le token existe
    const token = localStorage.getItem('token')
    if (!token) {
      // Si l'utilisateur est dans le contexte mais pas de token, c'est un problème de session
      if (user && isAuthenticated) {
        setUploadError('Votre session a expiré. Veuillez vous reconnecter.')
      } else {
        setUploadError('Vous devez être connecté pour uploader une photo. Veuillez vous reconnecter.')
      }
      // Ne pas déconnecter immédiatement, laisser l'utilisateur voir le message
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 3000)
      setIsUploading(false)
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const result = await uploadProfilePhoto(file)
      if (result.success) {
        setUploadSuccess('Photo de profil mise à jour avec succès')
        // Recharger les données utilisateur depuis l'API
        const updatedUser = await getCurrentUser()
        if (updatedUser) {
          const role = updatedUser.role || ''
          const newUserData = {
            nom: updatedUser.nom || '',
            prenom: updatedUser.prenom || '',
            email: updatedUser.email || '',
            role: role,
            telephone: updatedUser.telephone || '',
            adresse: updatedUser.adresse || '',
            dateCreation: updatedUser.dateCreation || new Date().toISOString(),
            derniereConnexion: updatedUser.derniereConnexion || new Date().toISOString(),
            photo: updatedUser.photo || null,
            service: getServiceLabel(role),
            poste: getRoleLabel(role)
          }
          setUserData(newUserData)

          // Mettre à jour le contexte AuthContext pour que le header se mette à jour
          if (updateUser && updatedUser.photo) {
            updateUser({ photo: updatedUser.photo })
          }
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de l\'upload de la photo'
      setUploadError(errorMessage)

      // Ne déconnecter que si c'est vraiment une erreur de session expirée (pas juste "Token invalide")
      // Attendre un peu pour voir si c'est une erreur temporaire
      if (errorMessage.includes('session a expiré') && !errorMessage.includes('Token invalide')) {
        // Attendre 3 secondes avant de déconnecter pour que l'utilisateur voie le message
        setTimeout(() => {
          logout()
          navigate('/login')
        }, 3000)
      }
    } finally {
      setIsUploading(false)
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const photoUrl = userData?.photo
    ? (userData.photo.startsWith('http') ? userData.photo : `http://localhost:3000${userData.photo}`)
    : null

  if (loading || !userData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  const nomComplet = userData.prenom && userData.nom
    ? `${userData.prenom} ${userData.nom}`
    : userData.email || 'Utilisateur'

  return (
    <AdminLayout>
      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
          Mon profil
        </h1>
      </div>

      {/* Carte de la photo de profil */}
      {/* En-tête du profil avec Layout Pro */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Colonne Gauche: Photo (Carré) */}
          <div className="relative group shrink-0 mx-auto md:mx-0">
            <div
              className="w-48 h-48 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-50 border-4 border-white shadow-lg overflow-hidden relative cursor-pointer group-hover:shadow-xl transition-all duration-300"
              onClick={handlePhotoClick}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={nomComplet}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <FontAwesomeIcon icon={faUser} className="text-6xl" />
                </div>
              )}

              {/* Overlay Upload */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <div className="flex flex-col items-center text-white">
                  {isUploading ? (
                    <FontAwesomeIcon icon={faSpinner} className="text-3xl animate-spin mb-2" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCamera} className="text-3xl mb-2" />
                      <span className="text-xs font-medium">Modifier la photo</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {(uploadError || uploadSuccess) && (
              <div className={`mt-2 text-xs text-center md:text-left ${uploadError ? 'text-red-600' : 'text-green-600'}`}>
                {uploadError || uploadSuccess}
              </div>
            )}
          </div>

          {/* Colonne Droite: Informations */}
          <div className="flex-1 text-center md:text-left space-y-4 pt-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                {userData.prenom} {userData.nom}
              </h2>
              <p className="text-lg text-blue-600 font-medium mt-1">
                {userData.poste}
              </p>
              <div className="h-1 w-20 bg-blue-600 rounded-full mt-3 mx-auto md:mx-0 opacity-20"></div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                {userData.service}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" />
                Compte Actif
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                {userData.role ? userData.role.replace(/_/g, ' ') : 'Utilisateur'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center md:justify-start group transition-colors duration-200">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-slate-700">{userData.email}</span>
                </div>
              </div>

              {userData.telephone && userData.telephone !== 'N/A' && (
                <div className="flex items-center justify-center md:justify-start group transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Téléphone</span>
                    <span className="text-sm font-medium text-slate-700">{userData.telephone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grille des informations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 flex flex-col">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
            Informations personnelles
          </h3>
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
              <input
                type="text"
                value={userData.nom}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
              <input
                type="text"
                value={userData.prenom}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={userData.email}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
              <input
                type="text"
                value={userData.telephone || ''}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Adresse</label>
              <input
                type="text"
                value={userData.adresse || ''}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Colonne de droite - Informations professionnelles */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Informations professionnelles */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              Informations professionnelles
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Poste</label>
                <input
                  type="text"
                  value={userData.poste}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Service</label>
                <input
                  type="text"
                  value={userData.service}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
                <input
                  type="text"
                  value={userData.role ? userData.role.replace(/_/g, ' ') : 'Utilisateur'}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date de création du compte</label>
                <input
                  type="text"
                  value={userData.dateCreation || 'N/A'}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dernière connexion</label>
                <input
                  type="text"
                  value={userData.derniereConnexion || 'N/A'}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ProfilAdminView

