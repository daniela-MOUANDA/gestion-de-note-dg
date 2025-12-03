# 🚀 Configuration Complète - Base de Données Prisma

## 📋 Étape 1 : Mettre à jour Node.js (si nécessaire)

Prisma 7 nécessite Node.js 20.19+, 22.12+ ou 24.0+.

Vérifiez votre version :
```bash
node --version
```

Si votre version est inférieure, mettez à jour Node.js depuis [nodejs.org](https://nodejs.org/)

## 📋 Étape 2 : Installer les dépendances

```bash
npm install prisma @prisma/client express cors dotenv
npm install -D nodemon
```

## 📋 Étape 3 : Configurer la base de données

### 3.1 Créer la base de données PostgreSQL

Ouvrez PostgreSQL et exécutez :
```sql
CREATE DATABASE "GestionNotes";
```

### 3.2 Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet :
```env
DATABASE_URL="postgresql://postgres:0000@localhost:5432/GestionNotes?schema=public"
PORT=3000
```

## 📋 Étape 4 : Générer le client Prisma et créer les tables

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les migrations et les tables
npm run prisma:migrate
# Nommez la migration : "init"

# Remplir avec des données initiales
npm run prisma:seed
```

## 📋 Étape 5 : Démarrer le serveur API

Dans un terminal séparé :
```bash
# Démarrer le serveur Express
node server/index.js
# ou avec nodemon pour le développement
npx nodemon server/index.js
```

Le serveur API sera disponible sur `http://localhost:3000`

## 📋 Étape 6 : Démarrer le frontend

Dans un autre terminal :
```bash
npm run dev
```

## 📊 Structure créée

### Fichiers Prisma
- ✅ `prisma/schema.prisma` - Schéma complet avec tous les modèles
- ✅ `prisma/seed.js` - Script de seeding pour données initiales

### Services Backend
- ✅ `src/services/scolarite/inscriptionService.js` - Gestion des inscriptions
- ✅ `src/services/scolarite/attestationService.js` - Gestion des attestations
- ✅ `src/services/scolarite/bulletinService.js` - Gestion des bulletins
- ✅ `src/services/scolarite/diplomeService.js` - Gestion des diplômes

### API Routes
- ✅ `server/index.js` - Serveur Express
- ✅ `server/routes/scolarite.js` - Routes API pour le service scolarité

### Client API Frontend
- ✅ `src/api/scolarite.js` - Client API pour appeler le backend

### Vues modifiées
- ✅ `src/views/scolarite/GererInscriptionsView.jsx` - Utilise maintenant les API

## 🔍 Vérification

1. **Vérifier la connexion à la base de données** :
   ```bash
   npm run prisma:studio
   ```
   Cela ouvrira Prisma Studio sur `http://localhost:5555`

2. **Tester l'API** :
   ```bash
   curl http://localhost:3000/api/health
   ```
   Devrait retourner : `{"status":"OK","message":"API is running"}`

3. **Tester les formations** :
   ```bash
   curl http://localhost:3000/api/scolarite/formations
   ```

## 📝 Notes importantes

- **Les données mockées sont remplacées** : La vue `GererInscriptionsView` utilise maintenant les données réelles de la base de données
- **Le serveur API doit être démarré** : Le frontend ne peut pas fonctionner sans le backend
- **Les autres vues** : Les autres vues (Bulletins, Diplômes, Attestations) doivent être modifiées de la même manière pour utiliser les API

## 🐛 Dépannage

### Erreur "Prisma Client not found"
```bash
npm run prisma:generate
```

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez le fichier `.env` et la DATABASE_URL
- Vérifiez que la base de données "GestionNotes" existe

### Erreur "Cannot find module"
```bash
npm install
```

### Le serveur API ne démarre pas
- Vérifiez que le port 3000 n'est pas utilisé
- Vérifiez les logs d'erreur dans la console

