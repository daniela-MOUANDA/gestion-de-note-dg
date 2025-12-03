# Ajout des champs photo, telephone et adresse à la table utilisateurs

## Problème
L'erreur `JSON.parse: unexpected character` lors de l'upload de photo indique que le champ `photo` (et possiblement `telephone` et `adresse`) n'existe pas encore dans la table `utilisateurs` de la base de données.

## Solution 1 : Script PowerShell automatique (Recommandé)

Exécutez le script PowerShell qui va automatiquement ajouter les champs :

```powershell
cd gestiondenote01
.\scripts\add-user-fields.ps1
```

Le script vous demandera vos identifiants PostgreSQL et exécutera automatiquement le SQL.

## Solution 2 : Migration Prisma

Si la base de données est accessible et qu'aucune connexion ne bloque, exécutez :

```bash
cd gestiondenote01
npm run prisma:migrate dev --name add_user_profile_fields
```

**Note:** Si vous obtenez une erreur de timeout (P1002), cela signifie qu'une autre connexion bloque. Fermez Prisma Studio, les autres sessions, et réessayez.

## Solution 3 : Script SQL manuel

Si la migration Prisma échoue (timeout, etc.), vous pouvez exécuter le script SQL directement dans votre base de données PostgreSQL :

1. Connectez-vous à votre base de données PostgreSQL :
   - Ouvrez pgAdmin ou un autre client PostgreSQL
   - Connectez-vous à la base `GestionNotes` sur le port `5433`

2. Exécutez le script SQL suivant :

```sql
-- Ajouter le champ photo si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'photo'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN photo VARCHAR(255);
    END IF;
END $$;

-- Ajouter le champ telephone si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'telephone'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN telephone VARCHAR(50);
    END IF;
END $$;

-- Ajouter le champ adresse si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'adresse'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN adresse VARCHAR(255);
    END IF;
END $$;
```

3. Vérifiez que les champs ont été ajoutés :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
AND column_name IN ('photo', 'telephone', 'adresse');
```

## Solution 4 : Via Prisma Studio

1. Ouvrez Prisma Studio :
```bash
cd gestiondenote01
npm run prisma:studio
```

2. Allez dans la table `utilisateurs`
3. Les champs devraient apparaître automatiquement après la migration

## Vérification

Après avoir ajouté les champs, redémarrez le serveur backend et réessayez d'uploader une photo. L'erreur devrait être résolue.

