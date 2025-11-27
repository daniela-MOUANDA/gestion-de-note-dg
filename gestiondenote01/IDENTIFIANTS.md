# 🔐 Identifiants des Utilisateurs - Service Scolarité

## 📋 Utilisateurs créés dans la base de données

### 👔 Chef de Service Scolarité
- **Nom complet** : ABDALLAH Junior
- **Username** : `chef`
- **Mot de passe** : `chef123`
- **Email** : chef.scolarite@inptic.ga
- **Rôle** : CHEF_SERVICE_SCOLARITE
- **Page de connexion** : `http://localhost:5173/login-chef-scolarite`
- **Dashboard** : `http://localhost:5173/chef-scolarite/dashboard`

---

### 👩 SP-Scolarité (Secrétaire Particulière)
- **Nom complet** : OBIANG Jeanne
- **Username** : `sp`
- **Mot de passe** : `sp123`
- **Email** : sp.scolarite@inptic.ga
- **Rôle** : SP_SCOLARITE
- **Page de connexion** : `http://localhost:5173/login-sp`
- **Dashboard** : `http://localhost:5173/sp-scolarite/dashboard`

---

### 👤 Agent Scolarité
- **Nom complet** : NZAMBA Marie
- **Username** : `agent1`
- **Mot de passe** : `agent123`
- **Email** : marie.nzamba@inptic.ga
- **Rôle** : AGENT_SCOLARITE
- **Page de connexion** : `http://localhost:5173/login-scolarite`
- **Dashboard** : `http://localhost:5173/scolarite/dashboard`

---

## ⚠️ Important : Mise à jour des mots de passe

Les mots de passe dans la base de données sont actuellement des hashs factices. Pour que la connexion fonctionne, vous devez :

### Option 1 : Mettre à jour avec bcrypt (Recommandé)

1. Installer bcrypt :
```bash
npm install bcrypt
```

2. Exécuter le script de mise à jour :
```bash
node scripts/update-passwords.js
```

### Option 2 : Mettre à jour manuellement via Prisma Studio

1. Ouvrir Prisma Studio :
```bash
npm run prisma:studio
```

2. Aller dans la table `utilisateurs`
3. Pour chaque utilisateur, générer un hash bcrypt et le mettre à jour

### Option 3 : Modifier le seed.js et réexécuter

Modifier le fichier `prisma/seed.js` pour utiliser de vrais hashs bcrypt, puis réexécuter le seed.

---

## 🔗 Toutes les pages de connexion

| Utilisateur | Route | URL complète |
|------------|-------|--------------|
| Chef de Service Scolarité | `/login-chef-scolarite` | `http://localhost:5173/login-chef-scolarite` |
| SP-Scolarité | `/login-sp` | `http://localhost:5173/login-sp` |
| Agent Scolarité | `/login-scolarite` | `http://localhost:5173/login-scolarite` |
| Chef Département | `/login-chef` | `http://localhost:5173/login-chef` |
| Étudiant | `/login-etudiant` | `http://localhost:5173/login-etudiant` |

---

## 📝 Notes

- Tous les utilisateurs sont **actifs** par défaut
- Les mots de passe doivent être hashés avec **bcrypt** pour fonctionner
- Les identifiants sont stockés dans la table `utilisateurs` de la base de données PostgreSQL

