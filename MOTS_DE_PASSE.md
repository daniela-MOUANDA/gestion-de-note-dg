# 🔐 Mots de passe et Pages de Connexion

## 👔 Chef de Service Scolarité
- **Username** : `chef`
- **Mot de passe** : `chef123`
- **Page de connexion** : `http://localhost:5173/login-chef-scolarite`

## 👩 SP-Scolarité
- **Username** : `sp`
- **Mot de passe** : `sp123`
- **Page de connexion** : `http://localhost:5173/login-sp`

## 👤 Agent Scolarité
- **Username** : `agent1`
- **Mot de passe** : `agent123`
- **Page de connexion** : `http://localhost:5173/login-scolarite`

---

## ⚠️ IMPORTANT : Mettre à jour les mots de passe dans la base

Les mots de passe actuels dans la base sont des hashs factices. Pour que la connexion fonctionne :

### Étape 1 : Installer bcrypt
```bash
npm install bcrypt
```

### Étape 2 : Exécuter le script de mise à jour
```bash
node scripts/update-passwords.js
```

Ce script va :
- Hasher correctement les mots de passe avec bcrypt
- Mettre à jour la base de données
- Afficher un récapitulatif complet

---

## 🔗 URLs complètes

| Utilisateur | URL de connexion |
|------------|------------------|
| Chef de Service | http://localhost:5173/login-chef-scolarite |
| SP-Scolarité | http://localhost:5173/login-sp |
| Agent Scolarité | http://localhost:5173/login-scolarite |

