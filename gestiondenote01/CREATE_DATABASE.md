# 🔧 Créer la base de données PostgreSQL

## Option 1 : Via psql (ligne de commande)

1. Ouvrez un terminal PowerShell ou CMD
2. Connectez-vous à PostgreSQL :
```bash
psql -U postgres
```
3. Entrez votre mot de passe PostgreSQL (peut être différent de "0000")
4. Créez la base de données :
```sql
CREATE DATABASE "GestionNotes";
```
5. Vérifiez qu'elle existe :
```sql
\l
```
6. Quittez :
```sql
\q
```

## Option 2 : Via pgAdmin

1. Ouvrez pgAdmin
2. Connectez-vous au serveur PostgreSQL
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom : `GestionNotes`
5. Cliquez sur "Save"

## Option 3 : Vérifier/modifier le mot de passe

Si le mot de passe n'est pas "0000", modifiez le fichier `.env` :

```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/GestionNotes?schema=public"
```

## Option 4 : Créer un utilisateur avec mot de passe "0000"

Si vous voulez utiliser le mot de passe "0000", connectez-vous à PostgreSQL et exécutez :

```sql
ALTER USER postgres WITH PASSWORD '0000';
```

Ou créez un nouvel utilisateur :

```sql
CREATE USER postgres WITH PASSWORD '0000';
ALTER USER postgres CREATEDB;
```

## ✅ Vérification

Une fois la base de données créée, testez la connexion :

```bash
npm run prisma:migrate
```

Si cela fonctionne, vous verrez :
```
✔ Migration created and applied successfully.
```

