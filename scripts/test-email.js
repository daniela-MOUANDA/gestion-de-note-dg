import dotenv from 'dotenv'
import { sendStudentCredentials } from '../src/services/emailService.js'

// Charger les variables d'environnement
dotenv.config()

async function testEmail() {
  console.log('\n🧪 Test de configuration SMTP\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Afficher la configuration (sans le mot de passe complet)
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  
  console.log('📋 Configuration SMTP:')
  console.log(`   Host: ${smtpHost}`)
  console.log(`   Port: ${smtpPort}`)
  console.log(`   User: ${smtpUser || '❌ NON DÉFINI'}`)
  console.log(`   Pass: ${smtpPass ? '✅ Défini (' + smtpPass.length + ' caractères)' : '❌ NON DÉFINI'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (!smtpUser || !smtpPass) {
    console.error('❌ Configuration SMTP incomplète!')
    console.log('\n💡 Pour configurer SMTP, ajoutez dans votre fichier .env:')
    console.log('   SMTP_HOST=smtp.gmail.com')
    console.log('   SMTP_PORT=587')
    console.log('   SMTP_USER=votre-email@gmail.com')
    console.log('   SMTP_PASS=votre-mot-de-passe-application')
    process.exit(1)
  }

  // Test avec un email fictif
  console.log('📤 Test d\'envoi d\'email...\n')
  
  const testEtudiant = {
    nom: 'TEST',
    prenom: 'Étudiant',
    email: smtpUser // Envoyer à l'adresse SMTP pour test
  }
  
  const testPassword = 'Test123!@#'
  const testMatricule = '26000'

  try {
    const result = await sendStudentCredentials(testEtudiant, testPassword, testMatricule)
    
    if (result.success) {
      console.log('\n✅ Test réussi!')
      console.log(`   Email envoyé avec succès (Message ID: ${result.messageId})`)
      console.log(`   Vérifiez votre boîte de réception: ${testEtudiant.email}`)
    } else {
      console.error('\n❌ Échec de l\'envoi:')
      console.error(`   Erreur: ${result.error}`)
      if (result.details) {
        console.error(`   Détails:`, result.details)
      }
    }
  } catch (error) {
    console.error('\n❌ Erreur lors du test:')
    console.error(`   ${error.message}`)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
  }
  
  console.log('\n')
}

testEmail()

