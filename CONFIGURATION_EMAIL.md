# 📧 Configuration de l'envoi d'emails

## Configuration requise

Pour que l'envoi automatique d'emails fonctionne lors de la finalisation des inscriptions, vous devez configurer les variables d'environnement suivantes dans votre fichier `.env` :

### Variables d'environnement

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

# OU utilisez ces variables alternatives
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173
```

## Configuration Gmail

Si vous utilisez Gmail, vous devez :

1. **Activer l'authentification à deux facteurs** sur votre compte Gmail
2. **Créer un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Application" et "Autre (nom personnalisé)"
   - Entrez "INPTIC System" comme nom
   - Copiez le mot de passe généré (16 caractères)
   - Utilisez ce mot de passe dans `SMTP_PASS` ou `EMAIL_PASSWORD`

### Exemple de configuration Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
```

## Configuration d'autres serveurs SMTP

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

### Serveur SMTP personnalisé

```env
SMTP_HOST=votre-serveur-smtp.com
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASS=votre-mot-de-passe
```

## Test de la configuration

Si la configuration SMTP n'est pas définie, le système :
- ✅ Continuera de fonctionner normalement
- ⚠️ Affichera les identifiants dans les logs de la console
- ❌ N'enverra pas d'email

## Contenu de l'email envoyé

L'email envoyé aux étudiants contient :
- 📧 Leur adresse email
- 🆔 Leur matricule
- 🔑 Leur mot de passe généré automatiquement
- 🔗 Le lien vers la page de connexion
- ⚠️ Un avertissement pour changer le mot de passe lors de la première connexion

## Sécurité

⚠️ **Important** : 
- Ne commitez jamais votre fichier `.env` dans le dépôt Git
- Utilisez des mots de passe d'application plutôt que votre mot de passe principal
- Changez régulièrement les mots de passe d'application

