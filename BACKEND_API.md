# Backend API - Guide de création

## 📋 Note importante

Prisma ne peut pas être utilisé directement dans une application React côté client. Il faut créer un backend API (Express, Fastify, etc.) qui servira d'intermédiaire entre le frontend et la base de données.

## 🚀 Options de backend

### Option 1 : Express.js (Recommandé)

1. **Installer les dépendances** :
```bash
npm install express cors dotenv
npm install -D nodemon
```

2. **Créer un serveur Express** dans `server/index.js`

3. **Créer les routes API** dans `server/routes/scolarite.js`

### Option 2 : Vite Plugin API (Pour développement)

Utiliser un plugin Vite pour créer des routes API directement dans le projet.

## 📁 Structure recommandée

```
gestiondenote01/
├── server/
│   ├── index.js          # Serveur Express
│   ├── routes/
│   │   └── scolarite.js  # Routes API scolarité
│   └── middleware/
│       └── auth.js       # Middleware d'authentification
├── src/
│   ├── services/         # Services (utilisés par le backend)
│   └── api/              # Clients API (appels HTTP)
└── prisma/
    └── schema.prisma
```

## 🔌 Exemple de route API

```javascript
// server/routes/scolarite.js
import express from 'express'
import { getFormations, getFilieres } from '../../src/services/scolarite/inscriptionService.js'

const router = express.Router()

router.get('/formations', async (req, res) => {
  try {
    const formations = await getFormations()
    res.json(formations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/filieres', async (req, res) => {
  try {
    const filieres = await getFilieres()
    res.json(filieres)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

## 📡 Client API côté frontend

```javascript
// src/api/scolarite.js
const API_URL = 'http://localhost:3000/api'

export const getFormations = async () => {
  const response = await fetch(`${API_URL}/scolarite/formations`)
  return response.json()
}

export const getFilieres = async () => {
  const response = await fetch(`${API_URL}/scolarite/filieres`)
  return response.json()
}
```

## ⚠️ Important

Les services dans `src/services/scolarite/` sont prêts à être utilisés par le backend. Le frontend doit appeler les routes API, pas directement les services Prisma.

