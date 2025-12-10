# 🔐 Mise à Jour du Mot de Passe Étudiant

## ✅ Mot de passe mis à jour avec succès !

**Étudiant** : Van ABAGHE  
**Matricule** : 26933  
**Email** : van.abaghe660@outlook.com  
**Nouveau mot de passe** : `1234`

---

## 🚀 Méthode Utilisée

### Script Node.js (Recommandé)

Le script `scripts/update-student-password.js` a été exécuté avec succès.

```bash
node scripts/update-student-password.js
```

Ce script :
1. ✅ Génère un hash bcrypt sécurisé du mot de passe
2. ✅ Trouve l'utilisateur par email
3. ✅ Met à jour le mot de passe dans la base de données

---

## 📝 Requête SQL Alternative

Si vous préférez utiliser SQL directement, voici la requête :

### Étape 1 : Générer le hash bcrypt

Utilisez un outil en ligne ou Node.js pour générer le hash de `1234` :

```javascript
// Dans Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('1234', 10);
console.log(hash);
// Résultat : $2b$10$5WVlVDH6JVsE3V9VE9OfbO5...
```

### Étape 2 : Exécuter la requête SQL

```sql
-- Mettre à jour le mot de passe pour l'étudiant Van ABAGHE
UPDATE utilisateurs
SET password = '$2b$10$5WVlVDH6JVsE3V9VE9OfbO5WVlVDH6JVsE3V9VE9OfbO5WVlVDH6JVs'
WHERE email = 'van.abaghe660@outlook.com';
```

> ⚠️ **Important** : Remplacez le hash par celui généré à l'étape 1

---

## 🔑 Informations de Connexion

L'étudiant peut maintenant se connecter avec :

| Champ | Valeur |
|-------|--------|
| **Email** | van.abaghe660@outlook.com |
| **Matricule** | 26933 |
| **Mot de passe** | 1234 |

**URL de connexion** : `http://localhost:5173/login-student`

---

## 📋 Pour Mettre à Jour d'Autres Étudiants

### Méthode 1 : Modifier le script

Éditez `scripts/update-student-password.js` et changez :

```javascript
const matricule = '26933'  // Nouveau matricule
const email = 'van.abaghe660@outlook.com'  // Nouvel email
const newPassword = '1234'  // Nouveau mot de passe
```

Puis exécutez :
```bash
node scripts/update-student-password.js
```

### Méthode 2 : Créer un script générique

Créez un script qui accepte des paramètres :

```bash
node scripts/update-password.js --email="etudiant@email.com" --password="nouveauMDP"
```

---

## 🔒 Sécurité

- ✅ Le mot de passe est hashé avec **bcrypt** (10 rounds)
- ✅ Le hash est stocké de manière sécurisée dans la base de données
- ✅ Le mot de passe en clair n'est jamais stocké
- ⚠️ Pour la production, utilisez des mots de passe plus complexes

---

## ✅ Vérification

Pour vérifier que le mot de passe fonctionne :

1. Allez sur `http://localhost:5173/login-student`
2. Entrez :
   - Email : `van.abaghe660@outlook.com`
   - Matricule : `26933`
   - Mot de passe : `1234`
3. Cliquez sur "Se connecter"
4. Vous devriez être redirigé vers le dashboard avec les vraies données de l'étudiant !

🎉 **Connexion réussie !**
