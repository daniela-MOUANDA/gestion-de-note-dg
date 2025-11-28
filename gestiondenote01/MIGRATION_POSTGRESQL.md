# Guide de Migration Prisma vers PostgreSQL

Ce guide vous explique comment configurer PostgreSQL et exécuter les migrations Prisma pour votre projet.

## 📋 Prérequis

1. **PostgreSQL installé** sur votre machine
   - Télécharger depuis : https://www.postgresql.org/download/
   - Pour Windows : https://www.postgresql.org/download/windows/
   - Notez le mot de passe du superutilisateur `postgres` lors de l'installation

2. **Node.js et npm** installés (déjà fait si vous avez le projet)

## 🔧 Étape 1 : Vérifier l'installation de PostgreSQL

Ouvrez PowerShell ou CMD et vérifiez que PostgreSQL est installé :

```powershell
psql --version
```

Si la commande ne fonctionne pas, ajoutez PostgreSQL au PATH ou utilisez pgAdmin.

## 🗄️ Étape 2 : Créer la base de données PostgreSQL

### Option A : Via psql (ligne de commande)

```powershell
# Se connecter à PostgreSQL (remplacez 'votre_mot_de_passe' par votre mot de passe)
psql -U postgres

# Dans le prompt psql, exécutez :
CREATE DATABASE gestion_notes;
CREATE USER gestion_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE gestion_notes TO gestion_user;
\q
```

### Option B : Via pgAdmin (interface graphique)

1. Ouvrez pgAdmin
2. Connectez-vous au serveur PostgreSQL
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom : `gestion_notes`
5. Owner : `postgres` (ou créez un utilisateur dédié)
6. Cliquez sur "Save"

## 🔐 Étape 3 : Configurer le fichier .env

Créez un fichier `.env` à la racine du projet `gestiondenote01` :

```powershell
cd gestiondenote01
New-Item -Path .env -ItemType File
```

Ajoutez la configuration suivante dans le fichier `.env` :

```env
# Database
DATABASE_URL="postgresql://gestion_user:votre_mot_de_passe_securise@localhost:5432/gestion_notes?schema=public"

# JWT Secret (générez une clé secrète aléatoire)
JWT_SECRET="votre_cle_secrete_jwt_tres_longue_et_aleatoire_changez_moi_en_production"
JWT_EXPIRES_IN="24h"

# API URL (pour le frontend)
VITE_API_URL="http://localhost:3000/api"
```

**Format de DATABASE_URL :**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

**Exemple avec l'utilisateur par défaut postgres :**
```env
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/gestion_notes?schema=public"
```

## 📦 Étape 4 : Installer les dépendances (si pas déjà fait)

```powershell
cd gestiondenote01
npm install
```

## 🚀 Étape 5 : Générer le client Prisma

```powershell
npm run prisma:generate
```

Ou directement :
```powershell
npx prisma generate
```

## 🔄 Étape 6 : Exécuter les migrations

### Option A : Créer une nouvelle migration (recommandé)

```powershell
npm run prisma:migrate
```

Ou directement :
```powershell
npx prisma migrate dev --name init
```

Cette commande va :
- Créer une nouvelle migration basée sur votre schéma
- Appliquer la migration à la base de données
- Générer automatiquement le client Prisma

### Option B : Appliquer les migrations existantes

Si vous avez déjà des migrations dans `prisma/migrations` :

```powershell
npx prisma migrate deploy
```

## ✅ Étape 7 : Vérifier la migration

### Option A : Via Prisma Studio (interface graphique)

```powershell
npm run prisma:studio
```

Cela ouvrira Prisma Studio dans votre navigateur (http://localhost:5555) où vous pourrez voir toutes vos tables.

### Option B : Via psql

```powershell
psql -U postgres -d gestion_notes

# Lister les tables
\dt

# Voir la structure d'une table
\d utilisateurs

# Quitter
\q
```

## 🌱 Étape 8 : Seed la base de données (optionnel)

Si vous avez un fichier `prisma/seed.js`, vous pouvez remplir la base avec des données de test :

```powershell
npm run prisma:seed
```

Ou directement :
```powershell
npx prisma db seed
```

## 📝 Commandes Prisma utiles

| Commande | Description |
|----------|-------------|
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Crée et applique une nouvelle migration |
| `npx prisma migrate dev` | Crée une migration en mode développement |
| `npx prisma migrate deploy` | Applique les migrations en production |
| `npx prisma migrate reset` | **⚠️ Supprime toutes les données** et réapplique les migrations |
| `npm run prisma:studio` | Ouvre Prisma Studio pour visualiser les données |
| `npx prisma db push` | Pousse le schéma sans créer de migration (développement uniquement) |
| `npx prisma db pull` | Récupère le schéma depuis la base de données existante |

## 🔍 Résolution de problèmes

### Erreur : "Can't reach database server"

1. Vérifiez que PostgreSQL est démarré :
   ```powershell
   # Windows (Services)
   services.msc
   # Cherchez "postgresql" et vérifiez qu'il est "Running"
   ```

2. Vérifiez la connexion :
   ```powershell
   psql -U postgres -h localhost
   ```

### Erreur : "password authentication failed"

- Vérifiez le mot de passe dans votre `.env`
- Essayez de vous connecter manuellement avec psql pour vérifier

### Erreur : "database does not exist"

- Créez la base de données (voir Étape 2)
- Vérifiez le nom de la base dans `DATABASE_URL`

### Erreur : "relation already exists"

- La table existe déjà dans la base
- Utilisez `npx prisma migrate reset` pour tout réinitialiser (⚠️ supprime les données)
- Ou modifiez le schéma et créez une nouvelle migration

## 🎯 Résumé des étapes rapides

### Méthode automatique (PowerShell)

```powershell
# Utiliser le script d'installation automatique
cd gestiondenote01
.\scripts\setup-postgres.ps1
```

Puis suivez les instructions affichées.

### Méthode manuelle

```powershell
# 1. Créer la base de données (via psql ou pgAdmin)
psql -U postgres
CREATE DATABASE gestion_notes;
\q

# 2. Créer le fichier .env avec DATABASE_URL
# Copiez le contenu suivant dans un fichier .env :
# DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/gestion_notes?schema=public"
# JWT_SECRET="votre_cle_secrete_jwt"
# JWT_EXPIRES_IN="24h"
# VITE_API_URL="http://localhost:3000/api"

# 3. Installer les dépendances
npm install

# 4. Générer le client Prisma
npm run prisma:generate

# 5. Exécuter les migrations
npm run prisma:migrate

# 6. (Optionnel) Seed la base
npm run prisma:seed

# 7. Vérifier avec Prisma Studio
npm run prisma:studio
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

