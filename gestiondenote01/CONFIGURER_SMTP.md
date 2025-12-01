# 📧 Configuration SMTP - Guide Rapide

## ⚠️ Configuration requise

Votre fichier `.env` contient déjà les variables SMTP, mais vous devez remplir `SMTP_USER` et `SMTP_PASS`.

## 🔧 Étapes de configuration

### Option 1 : Gmail (Recommandé)

1. **Activez l'authentification à deux facteurs** sur votre compte Gmail
   - Allez sur https://myaccount.google.com/security
   - Activez la "Validation en deux étapes"

2. **Créez un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Application" → "Autre (nom personnalisé)"
   - Entrez "INPTIC System" comme nom
   - Cliquez sur "Générer"
   - **Copiez le mot de passe généré** (16 caractères, format: `abcd efgh ijkl mnop`)

3. **Modifiez votre fichier `.env`** :
   ```env
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   ```
   ⚠️ **Important** : Utilisez le mot de passe d'application, PAS votre mot de passe Gmail normal !

### Option 2 : Autre serveur SMTP

Modifiez votre fichier `.env` avec les informations de votre serveur SMTP :

```env
SMTP_HOST=smtp.votre-serveur.com
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASS=votre-mot-de-passe
```

## 📝 Exemple de fichier .env complet

```env
DATABASE_URL="postgresql://postgres:0000@localhost:5433/GestionNotes?schema=public"
PORT=3000

# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mon-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
```

## ✅ Vérification

Après avoir rempli les variables, redémarrez votre serveur :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez-le
npm run server:dev
```

Lors de la finalisation d'une inscription, vous devriez voir dans les logs :
```
✅ Connexion SMTP vérifiée avec succès
✅ Email envoyé avec succès!
```

## 🧪 Test de la configuration

Vous pouvez tester votre configuration avec :

```bash
node scripts/test-email.js
```

## ❓ Problèmes courants

### "Invalid login" ou "Authentication failed"
- Vérifiez que vous utilisez un **mot de passe d'application** (pas votre mot de passe Gmail)
- Vérifiez que l'authentification à deux facteurs est activée

### "Connection timeout"
- Vérifiez votre connexion Internet
- Vérifiez que le port 587 n'est pas bloqué par votre firewall

### Variables non détectées
- Assurez-vous que le fichier `.env` est à la racine du projet (`gestiondenote01/.env`)
- Redémarrez le serveur après modification du `.env`

