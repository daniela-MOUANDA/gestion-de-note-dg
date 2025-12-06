import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Charger les variables d'environnement AVANT tous les autres imports
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import scolariteRoutes from './routes/scolarite.js'
import comptesRoutes from './routes/comptes.js'
import chefsDepartementRoutes from './routes/chefsDepartement.js'
import chefDepartementRoutes from './routes/chefDepartement.js'
import departementsRoutes from './routes/departements.js'

const app = express()
const PORT = process.env.PORT || 3000

// Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
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

// Routes protégées
app.use('/api/scolarite', scolariteRoutes)
app.use('/api/comptes', comptesRoutes)
app.use('/api/chefs-departement', chefsDepartementRoutes)
app.use('/api/chef-departement', chefDepartementRoutes)
app.use('/api/departements', departementsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`)
})
