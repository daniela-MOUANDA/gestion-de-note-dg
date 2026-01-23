import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Charger les variables d'environnement AVANT tous les autres imports
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Debug: vérifier si les variables sont chargées
console.log('📍 Chemin du fichier .env:', path.join(__dirname, '..', '.env'))
console.log('✅ SUPABASE_URL chargé:', process.env.SUPABASE_URL ? 'OUI' : 'NON')
console.log('✅ SUPABASE_ANON_KEY chargé:', process.env.SUPABASE_ANON_KEY ? 'OUI' : 'NON')

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import scolariteRoutes from './routes/scolarite.js'
import comptesRoutes from './routes/comptes.js'
import chefsDepartementRoutes from './routes/chefsDepartement.js'
import departementsRoutes from './routes/departements.js'
import studentRoutes from './routes/student.js'
import depRoutes from './routes/depRoutes.js'
import adminSystemeRoutes from './routes/adminSysteme.js'
import notificationsRoutes from './routes/notifications.js'


const app = express()
const PORT = process.env.PORT || 3000

// Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL // URL de votre site sur Hostinger
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())

// Servir les fichiers statiques (photos de profil et documents d'inscription)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Routes publiques
app.use('/api/auth', authRoutes)

// Routes alias pour compatibilité (rediriger vers scolarite)
app.get('/api/promotions', (req, res, next) => {
  req.url = '/api/scolarite/promotions'
  scolariteRoutes(req, res, next)
})

app.get('/api/formations', (req, res, next) => {
  req.url = '/api/scolarite/formations'
  scolariteRoutes(req, res, next)
})

app.get('/api/filieres', (req, res, next) => {
  req.url = '/api/scolarite/filieres'
  scolariteRoutes(req, res, next)
})

app.get('/api/niveaux', (req, res, next) => {
  req.url = '/api/scolarite/niveaux' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.get('/api/etudiants', (req, res, next) => {
  req.url = '/api/scolarite/etudiants' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.post('/api/etudiants', (req, res, next) => {
  req.url = '/api/scolarite/etudiants'
  scolariteRoutes(req, res, next)
})

app.delete('/api/etudiants/:id', (req, res, next) => {
  req.url = `/api/scolarite/etudiants/${req.params.id}`
  scolariteRoutes(req, res, next)
})

app.get('/api/etudiants-inscrits', (req, res, next) => {
  req.url = '/api/scolarite/etudiants-inscrits' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.get('/api/attestations', (req, res, next) => {
  req.url = '/api/scolarite/attestations' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.post('/api/attestations', (req, res, next) => {
  req.url = '/api/scolarite/attestations'
  scolariteRoutes(req, res, next)
})

app.post('/api/attestations/:id/archiver', (req, res, next) => {
  req.url = `/api/scolarite/attestations/${req.params.id}/archiver`
  scolariteRoutes(req, res, next)
})

app.get('/api/attestations/archives', (req, res, next) => {
  req.url = '/api/scolarite/attestations/archives' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.get('/api/dossiers/:etudiantId/:inscriptionId', (req, res, next) => {
  req.url = `/api/scolarite/dossiers/${req.params.etudiantId}/${req.params.inscriptionId}`
  scolariteRoutes(req, res, next)
})

app.get('/api/etudiant/mon-profil', (req, res, next) => {
  req.url = '/api/scolarite/etudiant/mon-profil' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

app.get('/api/etudiant/mes-notes', (req, res, next) => {
  req.url = '/api/scolarite/etudiant/mes-notes' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  scolariteRoutes(req, res, next)
})

// Routes alias pour les uploads et mises à jour (POST, PUT, DELETE)
app.post('/api/etudiants/:id/photo', (req, res, next) => {
  req.url = `/api/scolarite/etudiants/${req.params.id}/photo`
  scolariteRoutes(req, res, next)
})

app.put('/api/etudiants/:id', (req, res, next) => {
  req.url = `/api/scolarite/etudiants/${req.params.id}`
  scolariteRoutes(req, res, next)
})

app.post('/api/etudiants/:id/parents', (req, res, next) => {
  req.url = `/api/scolarite/etudiants/${req.params.id}/parents`
  scolariteRoutes(req, res, next)
})

app.get('/api/etudiants/:id/parents', (req, res, next) => {
  req.url = `/api/scolarite/etudiants/${req.params.id}/parents`
  scolariteRoutes(req, res, next)
})

app.post('/api/inscriptions/:id/documents/:type', (req, res, next) => {
  req.url = `/api/scolarite/inscriptions/${req.params.id}/documents/${req.params.type}`
  scolariteRoutes(req, res, next)
})

app.delete('/api/inscriptions/:id/documents/:type', (req, res, next) => {
  req.url = `/api/scolarite/inscriptions/${req.params.id}/documents/${req.params.type}`
  scolariteRoutes(req, res, next)
})

app.post('/api/inscriptions/:id/valider', (req, res, next) => {
  req.url = `/api/scolarite/inscriptions/${req.params.id}/valider`
  scolariteRoutes(req, res, next)
})

app.post('/api/inscriptions/:id/finaliser', (req, res, next) => {
  req.url = `/api/scolarite/inscriptions/${req.params.id}/finaliser`
  scolariteRoutes(req, res, next)
})

// Routes alias pour les dashboards
app.get('/api/dashboard/sp', (req, res, next) => {
  req.url = '/api/scolarite/dashboard/sp'
  scolariteRoutes(req, res, next)
})

app.get('/api/dashboard/agent', (req, res, next) => {
  req.url = '/api/scolarite/dashboard/agent'
  scolariteRoutes(req, res, next)
})

app.get('/api/dashboard/chef', (req, res, next) => {
  req.url = '/api/scolarite/dashboard/chef'
  scolariteRoutes(req, res, next)
})

app.get('/api/statistiques/chef', (req, res, next) => {
  req.url = '/api/scolarite/statistiques/chef'
  scolariteRoutes(req, res, next)
})

// Routes alias pour l'audit
app.get('/api/audit/actions', (req, res, next) => {
  req.url = '/api/scolarite/audit/actions'
  scolariteRoutes(req, res, next)
})

app.get('/api/audit/agents', (req, res, next) => {
  req.url = '/api/scolarite/audit/agents'
  scolariteRoutes(req, res, next)
})

// Routes protégées
app.use('/api/scolarite', scolariteRoutes)
app.use('/api/comptes', comptesRoutes)
app.use('/api/chef-departement', chefsDepartementRoutes)
app.use('/api/departements', departementsRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/dep', depRoutes)
app.use('/api/admin-systeme', adminSystemeRoutes)
app.use('/api/notifications', notificationsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`)
})
