# Ajout du champ Token à la table utilisateurs

## Objectif
Ajouter une colonne `token` à la table `utilisateurs` pour que chaque utilisateur ait sa propre session de connexion stockée dans la base de données.

## Méthode 1 : Via le script SQL (Recommandé)

### Étape 1 : Exécuter le script SQL

Vous pouvez exécuter le script SQL de deux manières :

#### Option A : Via pgAdmin
1. Ouvrez pgAdmin
2. Connectez-vous à votre serveur PostgreSQL
3. Sélectionnez la base de données `GestionNotes`
4. Cliquez sur "Query Tool" (Outil de requête)
5. Ouvrez le fichier `scripts/add_token_field.sql`
6. Exécutez le script (F5 ou bouton "Execute")

#### Option B : Via PowerShell (si psql est dans votre PATH)
```powershell
cd C:\Users\HP\Documents\gestion-de-note-dg\gestiondenote01
psql -h localhost -p 5433 -U postgres -d GestionNotes -f scripts/add_token_field.sql
```

### Étape 2 : Régénérer le client Prisma
```powershell
cd C:\Users\HP\Documents\gestion-de-note-dg\gestiondenote01
npm run prisma:generate
```

## Méthode 2 : Via Prisma Migrate (si la connexion fonctionne)

```powershell
cd C:\Users\HP\Documents\gestion-de-note-dg\gestiondenote01
npx prisma migrate deploy
```

## Vérification

Pour vérifier que le champ a été ajouté, exécutez cette requête SQL :

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
AND column_name = 'token';
```

Vous devriez voir une ligne avec `token`, `text`, `YES`.

## Fonctionnement

Une fois le champ ajouté :
- Lors de la connexion, le token JWT sera stocké dans la colonne `token` de l'utilisateur
- Lors de la vérification du token, le système vérifiera que le token correspond à celui stocké en base
- Lors de la déconnexion, le token sera supprimé (mis à `NULL`)
- Chaque utilisateur aura son propre token, évitant les mélanges de sessions

## Notes importantes

- Le champ `token` est optionnel (`String?`) pour permettre les utilisateurs existants
- Les tokens existants dans le localStorage continueront de fonctionner jusqu'à la prochaine connexion
- Après l'ajout du champ, tous les nouveaux tokens seront stockés en base de données

