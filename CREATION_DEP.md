# 🔧 Création du DEP et des Départements

Ce guide explique comment créer le DEP (Directeur des Études et de la Pédagogie) et les départements dans la base de données.

## 📋 Prérequis

1. PostgreSQL installé et en cours d'exécution
2. Base de données `GestionNotes` créée
3. Variables d'environnement configurées dans `.env`

## 🚀 Étapes

### 1. Créer la migration Prisma

Le schéma Prisma a été mis à jour avec :
- Le modèle `Departement`
- Le rôle `DEP` dans l'enum `RoleUtilisateur`
- La relation entre `Utilisateur` et `Departement`

Exécutez la migration :

```bash
cd gestiondenote01
npx prisma migrate dev --name add_departement_and_dep_role
```

### 2. Générer le client Prisma

```bash
npx prisma generate
```

### 3. Exécuter le script de création

Le script `scripts/create-dep.js` va :
- Créer les 2 départements (RSN et MTIC)
- Créer le compte DEP (MOUKAGNI Gildas)

```bash
node scripts/create-dep.js
```

## 👤 Compte DEP créé

- **Nom** : MOUKAGNI Gildas
- **Email** : gildas@gmail.com
- **Username** : gildas
- **Mot de passe** : gildas
- **Rôle** : DEP

## 📁 Départements créés

1. **Réseaux et Système Numérique (RSN)**
   - Code : RSN
   - Description : Contient les filières GI et RT

2. **Management des Techniques de l'Information et de la Communication (MTIC)**
   - Code : MTIC
   - Description : Contient la filière MTIC

## ✅ Vérification

Après l'exécution du script, vous pouvez vérifier dans Prisma Studio :

```bash
npx prisma studio
```

Vérifiez :
- La table `departements` contient 2 départements
- La table `utilisateurs` contient le DEP avec le rôle `DEP`

## 🔐 Connexion

Le DEP peut maintenant se connecter avec :
- Email : `gildas@gmail.com`
- Mot de passe : `gildas`

Une fois connecté, le DEP peut :
- Gérer les départements
- Créer, modifier et supprimer les chefs de département
- Assigner un département à chaque chef de département

