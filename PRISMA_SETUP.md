# Configuration Prisma et Base de Données

## 📋 Prérequis

1. **PostgreSQL** installé et en cours d'exécution
2. **Node.js** version 20.19+ (ou 22.12+, 24.0+)
3. Base de données **GestionNotes** créée dans PostgreSQL

## 🔧 Configuration

### 1. Créer la base de données PostgreSQL

```sql
CREATE DATABASE "GestionNotes";
```

### 2. Configurer la connexion

Créez un fichier `.env` à la racine du projet avec :

```env
DATABASE_URL="postgresql://postgres:0000@localhost:5432/GestionNotes?schema=public"
```

### 3. Installer Prisma

```bash
npm install prisma @prisma/client
```

**Note:** Si vous avez une version de Node.js inférieure à 20.19, vous devrez mettre à jour Node.js ou utiliser une version antérieure de Prisma.

### 4. Générer le client Prisma

```bash
npm run prisma:generate
```

### 5. Créer les migrations

```bash
npm run prisma:migrate
```

Cela créera toutes les tables dans la base de données.

### 6. Remplir la base de données avec des données initiales

```bash
npm run prisma:seed
```

## 📊 Structure de la Base de Données

Le schéma Prisma contient tous les modèles nécessaires pour l'application :

- **Utilisateurs** : Agents, SP-Scolarité, Chef de Service
- **Formations** : Initial 1, Initial 2
- **Filières** : RT, GI, MTIC, AV
- **Niveaux** : L1, L2, L3
- **Classes** : RT-1A, GI-2B, etc.
- **Promotions** : 2024-2025, 2023-2024, etc.
- **Étudiants** : Informations des étudiants
- **Inscriptions** : Gestion des inscriptions et réinscriptions
- **Attestations** : Attestations de scolarité avec numéros uniques
- **Bulletins** : Bulletins semestriels
- **Diplômes** : DTS et Licence
- **Procès-Verbaux** : PV des résultats
- **Abandons** : Étudiants ayant abandonné
- **Messages** : Messagerie interne
- **Audit** : Journal des actions

## 🚀 Utilisation

Une fois la base de données configurée, les services dans `src/services/scolarite/` utiliseront automatiquement les données réelles au lieu des données mockées.

## 🔍 Prisma Studio

Pour visualiser et gérer les données :

```bash
npm run prisma:studio
```

Cela ouvrira une interface web sur `http://localhost:5555`

