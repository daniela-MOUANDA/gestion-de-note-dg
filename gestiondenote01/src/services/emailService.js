import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Charger .env depuis la racine du projet (2 niveaux au-dessus de src/services)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Configuration du transporteur email
const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const isSecure = smtpPort === 465

  if (!smtpUser || !smtpPass) {
    throw new Error('Configuration SMTP incomplète: SMTP_USER et SMTP_PASS sont requis')
  }

  // Configuration du transporteur
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure, // true pour 465, false pour les autres ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV === 'development', // Activer le debug en développement
    logger: process.env.NODE_ENV === 'development' // Logger les actions en développement
  })
}

// Envoyer un email avec les identifiants de connexion à un étudiant
export const sendStudentCredentials = async (etudiant, password, matricule) => {
  try {
    // Vérifier que l'étudiant a un email
    if (!etudiant.email) {
      throw new Error('L\'étudiant n\'a pas d\'adresse email')
    }

    // Vérifier que l'email est configuré
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')

    console.log('📧 Configuration SMTP détectée:')
    console.log(`   Host: ${smtpHost}`)
    console.log(`   Port: ${smtpPort}`)
    console.log(`   User: ${smtpUser ? smtpUser.substring(0, 5) + '...' : 'NON DÉFINI'}`)
    console.log(`   Pass: ${smtpPass ? '***' : 'NON DÉFINI'}`)

    if (!smtpUser || !smtpPass) {
      console.warn('⚠️ SMTP non configuré. L\'email ne sera pas envoyé.')
      console.log('📧 Email qui aurait été envoyé:')
      console.log(`   Destinataire: ${etudiant.email}`)
      console.log(`   Matricule: ${matricule}`)
      console.log(`   Mot de passe: ${password}`)
      return { success: false, error: 'SMTP non configuré' }
    }

    let transporter
    try {
      transporter = createTransporter()
    } catch (transporterError) {
      console.error('❌ Erreur lors de la création du transporteur SMTP:', transporterError.message)
      return { success: false, error: transporterError.message }
    }

    // Tester la connexion SMTP
    try {
      console.log('🔍 Vérification de la connexion SMTP...')
      await transporter.verify()
      console.log('✅ Connexion SMTP vérifiée avec succès')
    } catch (verifyError) {
      console.error('❌ Erreur de vérification SMTP:', verifyError.message)
      console.error('   Code:', verifyError.code)
      console.error('   Command:', verifyError.command)
      if (verifyError.response) {
        console.error('   Response:', verifyError.response)
      }
      // Ne pas bloquer si la vérification échoue, on essaie quand même d'envoyer
      console.warn('⚠️ Vérification échouée, mais tentative d\'envoi quand même...')
    }

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .credentials-box {
      background: white;
      border: 2px solid #3B82F6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin: 15px 0;
      padding: 10px;
      background: #f3f4f6;
      border-radius: 5px;
    }
    .credential-label {
      font-weight: bold;
      color: #1f2937;
      display: inline-block;
      min-width: 120px;
    }
    .credential-value {
      color: #3B82F6;
      font-weight: bold;
      font-family: monospace;
    }
    .footer {
      background: #1f2937;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 10px 10px;
      font-size: 12px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background: #3B82F6;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 Bienvenue à l'INPTIC</h1>
    <p>Votre inscription a été finalisée avec succès</p>
  </div>
  
  <div class="content">
    <p>Bonjour <strong>${etudiant.prenom} ${etudiant.nom}</strong>,</p>
    
    <p>Votre inscription à l'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC) a été finalisée avec succès.</p>
    
    <p>Vous pouvez maintenant accéder à votre espace étudiant en utilisant les identifiants suivants :</p>
    
    <div class="credentials-box">
      <h3 style="margin-top: 0; color: #3B82F6;">🔐 Vos identifiants de connexion</h3>
      
      <div class="credential-item">
        <span class="credential-label">📧 Email :</span>
        <span class="credential-value">${etudiant.email}</span>
      </div>
      
      <div class="credential-item">
        <span class="credential-label">🆔 Matricule :</span>
        <span class="credential-value">${matricule}</span>
      </div>
      
      <div class="credential-item">
        <span class="credential-label">🔑 Mot de passe :</span>
        <span class="credential-value">${password}</span>
      </div>
    </div>
    
    <div class="warning">
      <strong>⚠️ Important :</strong> Pour des raisons de sécurité, nous vous recommandons fortement de changer ce mot de passe lors de votre première connexion.
    </div>
    
    <p>Pour accéder à votre espace étudiant :</p>
    <ol>
      <li>Rendez-vous sur la page de connexion : <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-etudiant">${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-etudiant</a></li>
      <li>Entrez votre email, votre matricule et votre mot de passe</li>
      <li>Une fois connecté, vous pourrez accéder à toutes les fonctionnalités de votre espace étudiant</li>
    </ol>
    
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-etudiant" class="button">Accéder à mon espace étudiant</a>
    </div>
    
    <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter le service de scolarité.</p>
    
    <p>Cordialement,<br>
    <strong>Service de Scolarité - INPTIC</strong></p>
  </div>
  
  <div class="footer">
    <p>Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC)</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: `"INPTIC - Service de Scolarité" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: etudiant.email,
      subject: '🎓 INPTIC - Vos identifiants de connexion',
      html: emailContent,
      text: `
Bonjour ${etudiant.prenom} ${etudiant.nom},

Votre inscription à l'INPTIC a été finalisée avec succès.

Vos identifiants de connexion :
- Email : ${etudiant.email}
- Matricule : ${matricule}
- Mot de passe : ${password}

⚠️ Important : Pour des raisons de sécurité, nous vous recommandons fortement de changer ce mot de passe lors de votre première connexion.

Pour accéder à votre espace étudiant :
${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-etudiant

Cordialement,
Service de Scolarité - INPTIC
      `.trim()
    }

    console.log(`📤 Envoi de l'email à ${etudiant.email}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email envoyé avec succès!')
    console.log(`   Message ID: ${info.messageId}`)
    console.log(`   Destinataire: ${etudiant.email}`)
    console.log(`   Matricule: ${matricule}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    console.error('   Détails:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    })
    // Ne pas faire échouer la finalisation si l'email échoue
    // Mais retourner l'erreur pour information
    return { 
      success: false, 
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    }
  }
}

