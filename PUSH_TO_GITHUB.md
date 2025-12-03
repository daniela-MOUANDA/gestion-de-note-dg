# Instructions pour pousser vers GitHub

## Étape 1 : Créer le dépôt sur GitHub

1. Allez sur https://github.com et connectez-vous
2. Cliquez sur le "+" en haut à droite → "New repository"
3. Nom du dépôt : `gestiondenote01`
4. Choisissez Public ou Private
5. **NE COCHEZ PAS** "Add a README file"
6. Cliquez sur "Create repository"

## Étape 2 : Configurer le remote et pousser

Une fois le dépôt créé, exécutez ces commandes dans PowerShell :

```powershell
# Ajouter le dépôt distant
git remote add origin https://github.com/daniela-MOUANDA/gestiondenote01.git

# Pousser la branche main (frontend)
git push -u origin main

# Pousser la branche server (backend)
git push -u origin server
```

## Vérification

Après avoir poussé, vous pouvez voir vos branches sur :
- https://github.com/daniela-MOUANDA/gestiondenote01

**Note :** 
- La branche `main` contient tout le code frontend (sans le dossier server)
- La branche `server` contient uniquement le dossier server (backend)

