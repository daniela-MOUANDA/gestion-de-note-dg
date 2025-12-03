# 🔄 Guide de Migration vers la Table Role - Étapes Détaillées

## ⚠️ IMPORTANT : Migration en plusieurs étapes

Cette migration doit être effectuée avec précaution car elle modifie la structure de la table `utilisateurs` qui contient déjà des données.

## 📋 Prérequis

1. Sauvegarder la base de données
2. S'assurer que tous les services sont arrêtés
3. Avoir accès à PostgreSQL

## 🚀 Étapes de Migration

### Étape 1 : Créer la migration Prisma (sans l'exécuter)

```bash
cd gestiondenote01
npx prisma migrate dev --name add_role_table --create-only
```

Cela créera un fichier de migration vide que nous allons modifier.

### Étape 2 : Modifier le fichier de migration

Ouvrez le fichier de migration créé dans `prisma/migrations/[timestamp]_add_role_table/migration.sql` et remplacez son contenu par le script SQL fourni dans `prisma/migrations/add_role_table_migration.sql`.

### Étape 3 : Exécuter la migration (partie 1)

Exécutez manuellement les premières étapes du script SQL dans votre client PostgreSQL :

```sql
-- Créer la table roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "routeDashboard" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

-- Ajouter la colonne roleId (nullable)
ALTER TABLE "utilisateurs" ADD COLUMN IF NOT EXISTS "roleId" TEXT;
```

### Étape 4 : Initialiser les rôles

```bash
node scripts/init-roles.js
```

### Étape 5 : Migrer les utilisateurs existants

Exécutez cette requête SQL pour assigner les roleId :

```sql
UPDATE "utilisateurs" u
SET "roleId" = r."id"
FROM "roles" r
WHERE 
    (u."role"::text = 'AGENT_SCOLARITE' AND r."code" = 'AGENT_SCOLARITE') OR
    (u."role"::text = 'SP_SCOLARITE' AND r."code" = 'SP_SCOLARITE') OR
    (u."role"::text = 'CHEF_SERVICE_SCOLARITE' AND r."code" = 'CHEF_SERVICE_SCOLARITE') OR
    (u."role"::text = 'CHEF_DEPARTEMENT' AND r."code" = 'CHEF_DEPARTEMENT') OR
    (u."role"::text = 'DEP' AND r."code" = 'DEP') OR
    (u."role"::text = 'ETUDIANT' AND r."code" = 'ETUDIANT') OR
    (u."role"::text = 'ENSEIGNANT' AND r."code" = 'ENSEIGNANT') OR
    (u."role"::text = 'ADMIN' AND r."code" = 'ADMIN');
```

### Étape 6 : Vérifier la migration

Vérifiez que tous les utilisateurs ont un roleId :

```sql
SELECT COUNT(*) FROM "utilisateurs" WHERE "roleId" IS NULL;
-- Doit retourner 0
```

### Étape 7 : Ajouter la contrainte de clé étrangère

```sql
ALTER TABLE "utilisateurs" 
ADD CONSTRAINT "utilisateurs_roleId_fkey" 
FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Étape 8 : Rendre roleId non-nullable

```sql
ALTER TABLE "utilisateurs" ALTER COLUMN "roleId" SET NOT NULL;
```

### Étape 9 : Générer le client Prisma

```bash
npx prisma generate
```

### Étape 10 : Mettre à jour les services

Mettez à jour les services pour utiliser `user.role.code` au lieu de `user.role`.

### Étape 11 : Tester l'application

Testez la connexion et les redirections pour tous les rôles.

### Étape 12 : Supprimer l'ancienne colonne (optionnel, après vérification)

Une fois que tout fonctionne correctement :

```sql
ALTER TABLE "utilisateurs" DROP COLUMN "role";
DROP TYPE "RoleUtilisateur";
```

## ✅ Vérification finale

Vérifiez dans Prisma Studio :

```bash
npx prisma studio
```

- La table `roles` contient 8 rôles
- Tous les utilisateurs ont un `roleId` valide
- Les relations fonctionnent correctement

