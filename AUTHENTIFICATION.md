# 🔐 Système d'Authentification

## 📋 Vue d'ensemble

Le système d'authentification est maintenant complètement intégré avec :
- **Backend** : Service d'authentification avec JWT
- **Frontend** : Contexte React pour gérer l'état d'authentification
- **Sécurité** : Mots de passe hashés avec bcrypt, tokens JWT

## 🏗️ Architecture

### Backend

1. **Service d'authentification** (`src/services/authService.js`)
   - `authenticateUser()` - Authentifier un utilisateur
   - `verifyToken()` - Vérifier un token JWT
   - `logoutUser()` - Déconnexion
   - `getUserById()` - Obtenir les infos d'un utilisateur

2. **Routes API** (`server/routes/auth.js`)
   - `POST /api/auth/login` - Connexion
   - `GET /api/auth/verify` - Vérifier le token
   - `POST /api/auth/logout` - Déconnexion
   - `GET /api/auth/me` - Obtenir l'utilisateur connecté

3. **Middleware** (`server/middleware/auth.js`)
   - `authenticate` - Vérifier l'authentification
   - `requireRole` - Vérifier le rôle

### Frontend

1. **Client API** (`src/api/auth.js`)
   - Fonctions pour appeler les routes d'authentification
   - Gestion du localStorage pour le token

2. **Contexte React** (`src/contexts/AuthContext.jsx`)
   - `useAuth()` - Hook pour accéder à l'authentification
   - Gestion de l'état utilisateur
   - Fonctions `login()` et `logout()`

## 🚀 Utilisation

### Dans un composant React

```jsx
import { useAuth } from '../contexts/AuthContext'

const MyComponent = () => {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth()

  // Vérifier si connecté
  if (!isAuthenticated) {
    return <div>Veuillez vous connecter</div>
  }

  // Vérifier le rôle
  if (hasRole('AGENT_SCOLARITE')) {
    // Code pour les agents
  }

  return (
    <div>
      <p>Bonjour {user.nom} {user.prenom}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  )
}
```

### Dans une vue de connexion

```jsx
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const LoginView = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }

  // ...
}
```

## 🔑 Identifiants par défaut

| Utilisateur | Email | Mot de passe | Rôle | Page de connexion |
|------------|-------|--------------|------|-------------------|
| Chef de Service | chef.scolarite@inptic.ga | chef123 | CHEF_SERVICE_SCOLARITE | `/login-chef-scolarite` |
| SP-Scolarité | sp.scolarite@inptic.ga | sp123 | SP_SCOLARITE | `/login-sp` |
| Agent Scolarité | marie.nzamba@inptic.ga | agent123 | AGENT_SCOLARITE | `/login-scolarite` |

## ⚙️ Configuration

### Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
JWT_SECRET=votre-secret-jwt-tres-securise-changez-moi-en-production
JWT_EXPIRES_IN=24h
```

### Mettre à jour les mots de passe

Pour mettre à jour les mots de passe avec de vrais hashs bcrypt :

```bash
# 1. Installer bcrypt si pas déjà fait
npm install bcrypt

# 2. Exécuter le script
node scripts/update-passwords.js
```

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Tokens JWT avec expiration
- ✅ Vérification du token à chaque requête
- ✅ Vérification que le compte est actif
- ✅ Audit des connexions/déconnexions
- ✅ Protection des routes avec middleware

## 📝 Rôles disponibles

- `AGENT_SCOLARITE` - Agent du service scolarité
- `SP_SCOLARITE` - Secrétaire Particulière
- `CHEF_SERVICE_SCOLARITE` - Chef de Service Scolarité
- `CHEF_DEPARTEMENT` - Chef de Département
- `ETUDIANT` - Étudiant
- `ENSEIGNANT` - Enseignant
- `ADMIN` - Administrateur

## 🛡️ Protection des routes

Pour protéger une route backend :

```javascript
import { authenticate, requireRole } from '../middleware/auth.js'

router.get('/protected', authenticate, requireRole('AGENT_SCOLARITE'), async (req, res) => {
  // req.user contient les infos de l'utilisateur
  res.json({ message: 'Route protégée', user: req.user })
})
```

## 🔄 Flux d'authentification

1. **Connexion** :
   - L'utilisateur entre email et mot de passe
   - Le frontend appelle `POST /api/auth/login`
   - Le backend vérifie les identifiants
   - Si valide, un token JWT est généré
   - Le token est stocké dans localStorage
   - L'utilisateur est redirigé vers son dashboard

2. **Vérification** :
   - À chaque chargement de page, le token est vérifié
   - Si valide, l'utilisateur reste connecté
   - Si invalide, l'utilisateur est déconnecté

3. **Déconnexion** :
   - L'utilisateur clique sur déconnexion
   - Le token est supprimé du localStorage
   - L'action est enregistrée dans l'audit

## 📊 Audit

Toutes les actions d'authentification sont enregistrées dans la table `actions_audit` :
- Connexions réussies
- Déconnexions
- Tentatives de connexion échouées (via les logs)

