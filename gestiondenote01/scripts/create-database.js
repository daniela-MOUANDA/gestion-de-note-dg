import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const { Client } = pg

// Connexion à PostgreSQL sans spécifier de base de données
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '0000',
  database: 'postgres' // Connexion à la base par défaut
})

async function createDatabase() {
  try {
    await client.connect()
    console.log('✅ Connexion à PostgreSQL réussie')
    
    // Vérifier si la base de données existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'GestionNotes'"
    )
    
    if (result.rows.length === 0) {
      // Créer la base de données
      await client.query('CREATE DATABASE "GestionNotes"')
      console.log('✅ Base de données "GestionNotes" créée avec succès')
    } else {
      console.log('ℹ️  La base de données "GestionNotes" existe déjà')
    }
    
    await client.end()
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Vérifiez que :')
      console.error('   1. PostgreSQL est démarré')
      console.error('   2. Le mot de passe est correct (actuellement: 0000)')
      console.error('   3. L\'utilisateur "postgres" existe')
    }
    process.exit(1)
  }
}

createDatabase()

