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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin: 20px auto;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      background-color: white;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .logo img {
      max-width: 60px;
      max-height: 60px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .welcome-text {
      font-size: 16px;
      color: #374151;
      margin-bottom: 25px;
    }
    .credentials-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 20px;
      margin: 25px 0;
    }
    .credential-row {
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    }
    .credential-row:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      font-weight: 600;
      width: 120px;
      color: #64748b;
    }
    .credential-value {
      color: #1e293b;
      font-family: 'Consolas', monospace;
      font-weight: 600;
      font-size: 16px;
      background-color: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .cta-button {
      display: block;
      width: fit-content;
      margin: 30px auto;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #2563eb;
    }
    .security-notice {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      color: #92400e;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      margin-top: 25px;
      display: flex;
      align-items: start;
    }
    .security-icon {
      margin-right: 10px;
      font-size: 18px;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      border-top: 1px solid #374151;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/logo.png" alt="INPTIC Logo">
      </div>
      <h1>Bienvenue à l'INPTIC</h1>
    </div>
    
    <div class="content">
      <p class="welcome-text">Bonjour <strong>${etudiant.prenom} ${etudiant.nom}</strong>,</p>
      
      <p class="welcome-text">
        Nous sommes ravis de vous confirmer votre inscription. Votre compte étudiant a été créé avec succès.
        Vous pouvez dès à présent accéder à votre espace numérique pour consulter vos notes, emplois du temps et documents.
      </p>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #1e3a8a; font-size: 18px;">🔐 Vos identifiants de connexion</h3>
        
        <div class="credential-row">
          <span class="credential-label">Email :</span>
          <span class="credential-value" style="background: none; padding-left: 0;">${etudiant.email}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Matricule :</span>
          <span class="credential-value">${matricule}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Mot de passe :</span>
          <span class="credential-value">${password}</span>
        </div>
      </div>
      
      <div class="security-notice">
        <span class="security-icon">⚠️</span>
        <div>
          <strong>Sécurité :</strong> Ce mot de passe est temporaire. Nous vous recommandons vivement de le modifier dès votre première connexion via les paramètres de votre profil.
        </div>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-etudiant" class="cta-button">Accéder à mon Espace Étudiant</a>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
        Si vous rencontrez des difficultés pour vous connecter, n'hésitez pas à contacter le service informatique ou la scolarité.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>INPTIC</strong> - Institut National de la Poste, des Technologies de l'Information et de la Communication</p>
      <p>Ceci est un message automatique, merci de ne pas y répondre directement.</p>
    </div>
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

