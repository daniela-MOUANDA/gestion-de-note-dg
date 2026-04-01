import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function exportSchema() {
    console.log('🔄 Connexion à Supabase...')
    console.log('   URL:', SUPABASE_URL)

    // Récupérer l'OpenAPI spec qui contient toutes les tables et leurs colonnes
    const specResponse = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SERVICE_KEY}`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    })

    if (!specResponse.ok) {
        throw new Error(`Erreur API: ${specResponse.status} ${specResponse.statusText}`)
    }

    const spec = await specResponse.json()
    const definitions = spec.definitions || {}
    const tableNames = Object.keys(definitions)

    console.log(`✅ ${tableNames.length} tables trouvées: ${tableNames.join(', ')}`)

    let sql = ''
    sql += `-- ============================================================\n`
    sql += `-- Schéma de la base de données - Gestion de Notes\n`
    sql += `-- Exporté le : ${new Date().toLocaleString('fr-FR')}\n`
    sql += `-- Source : ${SUPABASE_URL}\n`
    sql += `-- ============================================================\n\n`
    sql += `-- Tables : ${tableNames.join(', ')}\n\n`
    sql += `SET client_encoding = 'UTF8';\n`
    sql += `SET standard_conforming_strings = on;\n\n`

    for (const tableName of tableNames) {
        const def = definitions[tableName]
        const properties = def.properties || {}
        const required = def.required || []

        console.log(`  → ${tableName} (${Object.keys(properties).length} colonnes)`)

        sql += `-- ============================================================\n`
        sql += `-- Table: ${tableName}\n`
        sql += `-- ============================================================\n`
        sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`

        const cols = Object.entries(properties).map(([colName, colDef]) => {
            const sqlType = mapSupabaseTypeToSql(colDef)
            const notNull = required.includes(colName) ? ' NOT NULL' : ''
            return `  "${colName}" ${sqlType}${notNull}`
        })

        sql += cols.join(',\n')
        sql += `\n);\n\n`
    }

    // Créer le dossier supabase/sql
    const outputDir = path.join(__dirname, '..', 'supabase', 'sql')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
        console.log(`📁 Dossier créé : supabase/sql/`)
    }

    const outputPath = path.join(outputDir, 'MyBd.sql')
    fs.writeFileSync(outputPath, sql, 'utf-8')

    const sizeKB = (Buffer.byteLength(sql, 'utf-8') / 1024).toFixed(2)
    console.log(`\n✅ Fichier généré : supabase/sql/MyBd.sql (${sizeKB} KB)`)
    console.log(`   ${tableNames.length} tables exportées`)
}

function mapSupabaseTypeToSql(colDef) {
    const format = (colDef.format || '').toLowerCase()
    const type = (colDef.type || '').toLowerCase()

    if (format === 'uuid') return 'UUID'
    if (format === 'integer' || format === 'int4' || format === 'int8') return 'INTEGER'
    if (format === 'bigint' || format === 'int8') return 'BIGINT'
    if (format === 'smallint' || format === 'int2') return 'SMALLINT'
    if (format === 'boolean' || type === 'boolean') return 'BOOLEAN'
    if (format === 'timestamp with time zone' || format === 'timestamptz') return 'TIMESTAMPTZ'
    if (format === 'timestamp without time zone' || format === 'timestamp') return 'TIMESTAMP'
    if (format === 'date') return 'DATE'
    if (format === 'time without time zone' || format === 'time') return 'TIME'
    if (format === 'double precision' || format === 'float8') return 'DOUBLE PRECISION'
    if (format === 'real' || format === 'float4') return 'REAL'
    if (format === 'numeric' || format === 'decimal') return 'NUMERIC'
    if (format === 'json') return 'JSON'
    if (format === 'jsonb') return 'JSONB'
    if (format === 'character varying' || format === 'varchar') return 'VARCHAR'
    if (format === 'text' || type === 'string') return 'TEXT'
    if (format === 'bytea') return 'BYTEA'
    if (type === 'integer' || type === 'number') return 'NUMERIC'
    if (type === 'boolean') return 'BOOLEAN'
    if (type === 'array') return 'JSONB'
    return 'TEXT'
}

exportSchema().catch(err => {
    console.error('❌ Erreur:', err.message)
    process.exit(1)
})
