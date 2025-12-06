# Migration de Prisma vers Supabase

Ce document décrit les étapes pour finaliser la migration de Prisma vers Supabase.

## 1. Configuration de Supabase

### Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez les informations suivantes :
   - **Project URL** : `https://votre-projet.supabase.co`
   - **API Key (anon)** : Clé publique pour le frontend
   - **Service Role Key** : Clé secrète pour le backend (avec privilèges élevés)

### Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Configuration Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anonyme
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role

# Variables pour le frontend (Vite)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anonyme

# Configuration JWT
JWT_SECRET=votre-secret-jwt-tres-securise
JWT_EXPIRES_IN=24h

# Configuration du serveur
PORT=3000
NODE_ENV=development
```

## 2. Créer les tables dans Supabase

### Option A : Via l'interface SQL Editor de Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur "SQL Editor" dans le menu de gauche
3. Copiez le contenu du fichier `supabase/migrations/001_initial_schema.sql`
4. Exécutez le script

### Option B : Via la CLI Supabase

```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

## 3. Migrer les données existantes (si nécessaire)

Si vous avez des données dans PostgreSQL avec Prisma, vous pouvez les exporter et les importer dans Supabase.

### Exporter depuis PostgreSQL

```bash
# Exporter les données
pg_dump -h localhost -U postgres -d gestion_notes --data-only > data_export.sql
```

### Importer dans Supabase

1. Allez dans "SQL Editor" de Supabase
2. Exécutez le fichier SQL exporté

**Note** : Vous devrez peut-être adapter les noms de colonnes (snake_case dans Supabase vs camelCase dans Prisma).

## 4. Installer les dépendances

```bash
# Supprimer les anciennes dépendances Prisma
npm uninstall @prisma/client prisma pg

# Installer (si pas déjà fait)
npm install @supabase/supabase-js
```

## 5. Différences de syntaxe

### Prisma vs Supabase

| Opération | Prisma | Supabase |
|-----------|--------|----------|
| Select all | `prisma.table.findMany()` | `supabase.from('table').select('*')` |
| Select one | `prisma.table.findUnique({ where: { id } })` | `supabase.from('table').select('*').eq('id', id).single()` |
| Insert | `prisma.table.create({ data })` | `supabase.from('table').insert(data).select().single()` |
| Update | `prisma.table.update({ where, data })` | `supabase.from('table').update(data).eq('id', id).select().single()` |
| Delete | `prisma.table.delete({ where })` | `supabase.from('table').delete().eq('id', id)` |
| Count | `prisma.table.count({ where })` | `supabase.from('table').select('*', { count: 'exact', head: true })` |
| Relations | `include: { relation: true }` | `select('*, relation (*)')` |

### Noms de colonnes

Supabase utilise le snake_case par défaut :

| Prisma (camelCase) | Supabase (snake_case) |
|--------------------|----------------------|
| `dateCreation` | `date_creation` |
| `roleId` | `role_id` |
| `etudiantId` | `etudiant_id` |
| `anneeAcademique` | `annee_academique` |

## 6. Structure des fichiers modifiés

```
src/
├── lib/
│   ├── prisma.js      # SUPPRIMÉ
│   └── supabase.js    # NOUVEAU - Client Supabase
├── services/
│   ├── authService.js              # Migré vers Supabase
│   ├── compteService.js            # Migré vers Supabase
│   ├── departementService.js       # Migré vers Supabase
│   └── scolarite/
│       ├── inscriptionService.js   # Migré vers Supabase
│       ├── dashboardService.js     # Migré vers Supabase
│       ├── auditService.js         # Migré vers Supabase
│       └── ...                     # À migrer si nécessaire
```

## 7. Vérifier la migration

Après avoir configuré Supabase :

1. Démarrez le serveur : `npm run server:dev`
2. Démarrez le frontend : `npm run dev`
3. Testez la connexion
4. Vérifiez les fonctionnalités principales

## 8. Fichiers Prisma à supprimer (optionnel)

Une fois la migration validée, vous pouvez supprimer :

```
prisma/
├── schema.prisma
├── seed.js
└── migrations/
```

## Avantages de Supabase

- ✅ Interface d'administration intégrée
- ✅ Authentification intégrée (optionnelle)
- ✅ Stockage de fichiers (Supabase Storage)
- ✅ Realtime subscriptions
- ✅ Row Level Security (RLS)
- ✅ Edge Functions
- ✅ Pas besoin de gérer les migrations manuellement
- ✅ Hébergement gratuit pour les petits projets

## Support

En cas de problème, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Référence JavaScript](https://supabase.com/docs/reference/javascript/introduction)

