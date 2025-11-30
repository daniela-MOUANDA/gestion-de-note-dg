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
  const { user, logout, isAuthenticated } = useAuth()
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
      'CHEF_DEPARTEMENT': 'Chef de Département'
    }
    return labels[role] || (typeof role === 'string' ? role.replace(/_/g, ' ') : 'Utilisateur')
  }

  const getServiceLabel = (role) => {
    if (!role) return 'Administration'
    const labels = {
      'SP_SCOLARITE': 'Direction de la Scolarité',
      'AGENT_SCOLARITE': 'Service Scolarité',
      'CHEF_SERVICE_SCOLARITE': 'Service Scolarité',
      'CHEF_DEPARTEMENT': 'Département'
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
        // MAIS seulement si l'email correspond à celui de l'utilisateur connecté
        try {
          const currentUser = await getCurrentUser()
          // Vérifier que les données de l'API correspondent bien à l'utilisateur connecté
          if (currentUser && currentUser.email === userEmail) {
            const role = currentUser.role || ''
            setUserData({
              nom: currentUser.nom || '',
              prenom: currentUser.prenom || '',
              email: currentUser.email || '',
              role: role,
              telephone: currentUser.telephone || 'N/A',
              adresse: currentUser.adresse || 'N/A',
              dateCreation: currentUser.dateCreation ? new Date(currentUser.dateCreation).toLocaleDateString('fr-FR') : 'N/A',
              derniereConnexion: currentUser.derniereConnexion ? new Date(currentUser.derniereConnexion).toLocaleString('fr-FR') : 'N/A',
              photo: currentUser.photo || null,
              service: getServiceLabel(role),
              poste: getRoleLabel(role)
            })
          } else if (currentUser && currentUser.email !== userEmail) {
            // Si l'API retourne un autre utilisateur, ne pas mettre à jour
            console.warn('Les données de l\'API ne correspondent pas à l\'utilisateur connecté. Conservation des données du contexte.')
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
          setUserData({
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
          })
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
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 w-80 h-80 flex flex-col items-center justify-center">
          <div className="relative group mb-3">
            <div 
              className="w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden relative border-4 border-white"
              onClick={handlePhotoClick}
              title="Cliquer pour changer la photo"
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
              ) : null}
              {!photoUrl && (
                <FontAwesomeIcon icon={faUser} className="text-4xl" />
              )}
              {/* Overlay avec icône caméra au survol */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                {isUploading ? (
                  <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCamera} className="text-white text-2xl" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          {(uploadError || uploadSuccess) && (
            <div className={`text-xs mb-2 ${uploadError ? 'text-red-600' : 'text-green-600'}`}>
              {uploadError || uploadSuccess}
            </div>
          )}
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              {nomComplet}
            </h2>
            <p className="text-xs text-slate-600 mb-2">
              {userData.poste} - {userData.service}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-xs" />
                Utilisateur actif
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
                {userData.role ? userData.role.replace(/_/g, ' ') : 'Utilisateur'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs text-slate-600">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 text-blue-600 text-xs" />
                <span className="truncate max-w-[200px]">{userData.email}</span>
              </div>
              {userData.telephone && userData.telephone !== 'N/A' && (
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPhone} className="mr-1.5 text-blue-600 text-xs" />
                  {userData.telephone}
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

