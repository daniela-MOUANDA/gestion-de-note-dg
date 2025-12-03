# ✅ Suppression de la Colonne `role` (Ancien Enum)

## 🎯 Objectif

Supprimer la colonne `role` (ancien enum `RoleUtilisateur`) de la table `utilisateurs` et conserver uniquement `roleId` qui est lié à la table `roles`.

## ✅ Actions Effectuées

### 1. Migration Créée et Exécutée

**Migration** : `20250103000001_remove_old_role_column`

**Script SQL** :
```sql
-- Supprimer l'ancienne colonne role de la table utilisateurs
ALTER TABLE "utilisateurs" DROP COLUMN IF EXISTS "role";

-- Supprimer le type enum RoleUtilisateur
DROP TYPE IF EXISTS "RoleUtilisateur";
```

### 2. État Actuel de la Table `utilisateurs`

La table `utilisateurs` contient maintenant :
- ✅ `roleId` (String, NOT NULL) - Relation avec la table `roles`
- ❌ `role` (supprimé) - Ancien enum

### 3. Structure Finale

```prisma
model Utilisateur {
  id            String   @id @default(uuid())
  nom           String
  prenom        String
  email         String   @unique
  username      String   @unique
  password      String
  token         String?
  photo         String?
  telephone     String?
  adresse       String?
  roleId        String   // ✅ Seule colonne pour le rôle
  actif         Boolean  @default(true)
  dateCreation  DateTime @default(now())
  derniereConnexion DateTime?
  departementId String?
  
  // Relations
  role          Role     @relation(fields: [roleId], references: [id], onDelete: Restrict)
  departement   Departement? @relation(fields: [departementId], references: [id], onDelete: SetNull)
  ...
}
```

## 📝 Notes Importantes

### Utilisation dans le Code

Dans le code, `user.role` est toujours utilisé, mais ce n'est **PAS** l'ancien champ enum de la base de données. C'est le **code du rôle** (string) qui est retourné par le service d'authentification :

```javascript
// Dans authService.js
const roleCode = utilisateur.role?.code || 'UNKNOWN'
return {
  user: {
    id: utilisateur.id,
    role: roleCode, // ✅ Code du rôle (string), pas l'ancien enum
    roleDetails: {
      id: utilisateur.role.id,
      code: utilisateur.role.code,
      nom: utilisateur.role.nom,
      routeDashboard: utilisateur.role.routeDashboard
    }
  }
}
```

### Différence Importante

- **Avant** : `utilisateur.role` était un enum dans la base de données
- **Maintenant** : 
  - `utilisateur.roleId` est l'ID du rôle (relation avec la table `roles`)
  - `utilisateur.role` est l'objet relation Prisma (avec `code`, `nom`, etc.)
  - `user.role` dans le code frontend est le code du rôle (string) retourné par l'API

## ✅ Vérification

Pour vérifier que la colonne a bien été supprimée :

```sql
-- Vérifier que la colonne role n'existe plus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
  AND column_name = 'role';
-- Devrait retourner 0 lignes

-- Vérifier que tous les utilisateurs ont un roleId
SELECT 
    COUNT(*) as total,
    COUNT("roleId") as avec_roleId
FROM "utilisateurs";
-- Tous les utilisateurs doivent avoir un roleId
```

## 🎉 Résultat

- ✅ Colonne `role` (enum) supprimée de la table `utilisateurs`
- ✅ Type enum `RoleUtilisateur` supprimé
- ✅ Seule la colonne `roleId` existe maintenant
- ✅ Relation avec la table `roles` fonctionnelle
- ✅ Code existant compatible (utilise `user.role` qui est le code string, pas l'ancien enum)

