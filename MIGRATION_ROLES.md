# 🔄 Migration vers la table Role

Ce guide explique comment migrer de l'enum `RoleUtilisateur` vers la table `Role` pour une meilleure gestion des rôles et des redirections.

## 📋 Changements apportés

### 1. Nouvelle table `Role`
- Stocke tous les rôles avec leurs informations
- Contient la route du dashboard pour chaque rôle
- Permet une gestion dynamique des rôles

### 2. Modification de la table `Utilisateur`
- Remplacement de `role RoleUtilisateur` par `roleId String`
- Relation avec la table `Role`

### 3. Table `Departement`
- Déjà existante, aucune modification nécessaire

## 🚀 Étapes de migration

### Étape 1 : Créer la migration Prisma

```bash
cd gestiondenote01
npx prisma migrate dev --name add_role_table
```

⚠️ **ATTENTION** : Cette migration va :
- Créer la table `roles`
- Modifier la table `utilisateurs` pour remplacer l'enum par une relation
- Vous devrez migrer les données existantes

### Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

### Étape 3 : Initialiser les rôles

```bash
node scripts/init-roles.js
```

Ce script va créer tous les rôles dans la table `roles` :
- AGENT_SCOLARITE
- SP_SCOLARITE
- CHEF_SERVICE_SCOLARITE
- CHEF_DEPARTEMENT
- DEP
- ETUDIANT
- ENSEIGNANT
- ADMIN

### Étape 4 : Migrer les utilisateurs existants

⚠️ **IMPORTANT** : Après la migration du schéma, vous devrez mettre à jour tous les utilisateurs existants pour leur assigner un `roleId` au lieu de l'ancien enum.

Vous pouvez utiliser Prisma Studio pour vérifier et mettre à jour manuellement, ou créer un script de migration personnalisé.

## 📝 Structure de la table Role

```prisma
model Role {
  id            String   @id @default(uuid())
  code          String   @unique // Code unique (ex: AGENT_SCOLARITE)
  nom           String   // Nom affiché (ex: "Agent Scolarité")
  description   String?  // Description du rôle
  routeDashboard String? // Route du dashboard (ex: /scolarite/dashboard)
  actif         Boolean  @default(true)
  dateCreation  DateTime @default(now())
}
```

## 🔧 Mise à jour des services

Après la migration, vous devrez mettre à jour :
- `src/services/authService.js` : Utiliser `user.role.code` au lieu de `user.role`
- `src/views/LoginView.jsx` : Utiliser `getDashboardRouteByRoleCode()` pour la redirection
- Tous les autres services qui utilisent les rôles

## ✅ Vérification

Après la migration, vérifiez dans Prisma Studio :

```bash
npx prisma studio
```

Vérifiez :
- La table `roles` contient tous les rôles
- La table `utilisateurs` a un champ `roleId` (pas `role`)
- Tous les utilisateurs ont un `roleId` valide

