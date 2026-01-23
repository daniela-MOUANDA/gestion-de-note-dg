import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration de l'environnement
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Charger le .env depuis la racine du projet
const envPath = path.resolve(__dirname, '../.env')
console.log(`📂 Chargement du fichier .env depuis : ${envPath}`)
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ Erreur lors du chargement de .env:', result.error)
} else {
  console.log('✅ Fichier .env chargé avec succès')
}

// Vérification des variables
const config = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  // Masquer le mot de passe dans les logs
  pass: process.env.SMTP_PASS ? '********' : 'NON DÉFINI'
}

console.log('📝 Configuration SMTP trouvée :', config)

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ Erreur : SMTP_USER ou SMTP_PASS manquant dans le fichier .env')
  process.exit(1)
}

// Création du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT) === 465, // true pour 465, false pour les autres
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Utile pour certains serveurs mail d'entreprise mal configurés
  }
})

// Test de connexion
console.log('🔄 Tentative de connexion au serveur SMTP...')

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Échec de la connexion SMTP :')
    console.error(error)
  } else {
    console.log('✅ Connexion SMTP réussie ! Le serveur est prêt à envoyer des messages.')

    // Envoi d'un mail de test
    const mailOptions = {
      from: `"Test INPTIC" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // S'envoyer le mail à soi-même pour tester
      subject: "Test de configuration Email INPTIC",
      text: "Si vous recevez ce message, c'est que la configuration SMTP fonctionne correctement !",
      html: "<h1>Test réussi !</h1><p>Si vous recevez ce message, c'est que la configuration SMTP fonctionne correctement !</p>"
    }

    console.log(`📧 Tentative d'envoi d'un mail de test à ${process.env.SMTP_USER}...`)

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Erreur lors de l\'envoi du mail de test :', error)
      } else {
        console.log('✅ Email envoyé avec succès !')
        console.log('ID du message :', info.messageId)
        console.log('Réponse du serveur :', info.response)
      }
    })
  }
})
