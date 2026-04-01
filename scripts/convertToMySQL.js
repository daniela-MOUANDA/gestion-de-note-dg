import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const INPUT = path.join(__dirname, '..', 'supabase', 'sql', 'MyBd.sql')
const OUTPUT = path.join(__dirname, '..', 'supabase', 'sql', 'MyBd_MySQL.sql')

// ─── ENUMs trouvés dans le fichier, collectés en 1re passe ───────────────────
const enumValues = {}   // nom_enum → ['VAL1', 'VAL2', ...]

// ─── Passe 1 : collecter tous les CREATE TYPE ... AS ENUM ────────────────────
function collectEnums(sql) {
    const re = /CREATE TYPE (?:public\.)?"?(\w+)"?\s+AS ENUM\s*\(([^)]+)\)/gi
    let m
    while ((m = re.exec(sql)) !== null) {
        const name = m[1].toLowerCase()
        const vals = m[2].match(/'([^']+)'/g).map(v => v.replace(/'/g, ''))
        enumValues[name] = vals
    }
}

// ─── Résoudre le type MySQL d'un ENUM PostgreSQL ────────────────────────────
function enumToMySQL(rawName) {
    const name = rawName.replace(/public\.|"/g, '').toLowerCase()
    const vals = enumValues[name]
    if (vals) return `ENUM(${vals.map(v => `'${v}'`).join(', ')})`
    return 'VARCHAR(50)'  // fallback
}

// ─── Convertir un type PostgreSQL en type MySQL ──────────────────────────────
function pgTypeToMySQL(pgType) {
    const t = pgType.trim().toLowerCase()

    if (t === 'uuid') return 'CHAR(36)'
    if (t === 'text') return 'TEXT'
    if (t === 'boolean' || t === 'bool') return 'TINYINT(1)'
    if (t.startsWith('character varying') || t.startsWith('varchar'))
        return pgType.replace(/character varying/i, 'VARCHAR')
    if (t === 'character' || t === 'char') return 'CHAR(1)'
    if (t.startsWith('timestamp')) return 'DATETIME'
    if (t === 'date') return 'DATE'
    if (t === 'time' || t.startsWith('time ')) return 'TIME'
    if (t === 'integer' || t === 'int' || t === 'int4') return 'INT'
    if (t === 'bigint' || t === 'int8') return 'BIGINT'
    if (t === 'smallint' || t === 'int2') return 'SMALLINT'
    if (t.startsWith('numeric') || t.startsWith('decimal')) return pgType.replace(/numeric/i, 'DECIMAL').replace(/decimal/i, 'DECIMAL')
    if (t === 'real' || t === 'float4') return 'FLOAT'
    if (t === 'double precision' || t === 'float8') return 'DOUBLE'
    if (t === 'json' || t === 'jsonb') return 'JSON'
    if (t === 'bytea') return 'BLOB'
    if (t.startsWith('interval')) return 'VARCHAR(50)'
    if (t === 'serial') return 'INT AUTO_INCREMENT'
    if (t === 'bigserial') return 'BIGINT AUTO_INCREMENT'

    // Types ENUM personnalisés de l'application
    const enumLike = Object.keys(enumValues).find(k => t.includes(k))
    if (enumLike) return enumToMySQL(enumLike)

    return 'TEXT'  // type inconnu → TEXT
}

// ─── Convertir une valeur DEFAULT PostgreSQL ─────────────────────────────────
function convertDefault(val) {
    if (!val) return ''
    let v = val.trim()
    // now()  → CURRENT_TIMESTAMP
    v = v.replace(/\bnow\(\)/gi, 'CURRENT_TIMESTAMP')
    // CURRENT_TIMESTAMP reste tel quel
    // 'value'::type  → 'value'
    v = v.replace(/'([^']*)'::[\w."]+/g, "'$1'")
    // true/false
    v = v.replace(/\btrue\b/gi, '1').replace(/\bfalse\b/gi, '0')
    // Supprimer extensions.uuid_generate_v4() — pas de DEFAULT uuid en MySQL
    if (v.includes('uuid_generate_v4')) return ''
    // gen_random_uuid()
    if (v.includes('gen_random_uuid')) return ''
    return v
}

// ─── Convertir une ligne de colonne dans CREATE TABLE ────────────────────────
function convertColumnLine(line) {
    // Retirer les guillemets doubles autour des identifiants → backtick
    line = line.replace(/"([^"]+)"/g, (_, name) => {
        // Si le contenu ressemble à un mot SQL → backtick
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return `\`${name}\``
        return `"${name}"`
    })

    // Remplacer schema prefix public.xxx  par xxx
    line = line.replace(/\bpublic\.\`?(\w+)\`?/g, '$1')

    // Extensions uuid
    line = line.replace(/extensions\.uuid_generate_v4\(\)/gi, "'00000000-0000-0000-0000-000000000000'")

    return line
}

// ─── Convertir la ligne de type d'une colonne ─────────────────────────────────
function processColumnTypeLine(raw) {
    // Reconstituer ligne sans numéro
    let line = raw

    // Détecter nom_colonne TYPE ...
    const colMatch = line.match(/^(\s+`?[\w]+`?\s+)([\w\s".'(,)]+?)((?:\s+DEFAULT\s+.+?)?\s*)?(NOT NULL|NULL)?(\s*,)?\s*$/)
    if (!colMatch) return line

    const indent = colMatch[1]
    let pgType = colMatch[2].trim()
    let defPart = colMatch[3] || ''
    const nullPart = colMatch[4] || ''
    const comma = colMatch[5] || ''

    // Extraire DEFAULT value
    const defMatch = defPart.match(/DEFAULT\s+(.+)/i)
    let defVal = defMatch ? convertDefault(defMatch[1].trim()) : ''

    // Convertir le type
    const myType = pgTypeToMySQL(pgType)

    let result = `${indent}${myType}`
    if (defVal) result += ` DEFAULT ${defVal}`
    if (nullPart) result += ` ${nullPart}`
    result += comma

    return result
}

// ─── Traitement principal ────────────────────────────────────────────────────
function convert(pgSQL) {
    collectEnums(pgSQL)

    const header = `-- ============================================================
-- Schéma MySQL converti depuis PostgreSQL
-- Compatible MySQL 5.7+ / MariaDB 10.3+ (Hostinger)
-- Généré le : ${new Date().toLocaleString('fr-FR')}
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

`

    const lines = pgSQL.split('\n')
    const out = []
    let inFunction = false
    let inCreateTable = false
    let skipBlock = false
    let tableLines = []
    let currentTableName = ''

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // ── Ignorer les blocs à sauter ─────────────────────────────────────────
        if (skipBlock) {
            if (trimmed === '$$;' || trimmed === '$$') { skipBlock = false }
            continue
        }

        // ── Supprimer les commandes psql (\xxx) ───────────────────────────────
        if (trimmed.startsWith('\\')) continue

        // ── Supprimer les commandes PG-spécifiques ────────────────────────────
        if (/^SET\s+(statement_timeout|lock_timeout|idle_in|transaction_timeout|client_encoding|standard_conforming|check_function|xmloption|client_min|row_security|default_tablespace|default_table_access)/i.test(trimmed)) continue
        if (/^SELECT pg_catalog\.set_config/i.test(trimmed)) continue
        if (/^ALTER\s+(TABLE|TYPE|FUNCTION|SCHEMA)\s+.*\s+OWNER\s+TO/i.test(trimmed)) continue
        if (/^COMMENT\s+ON\s+/i.test(trimmed)) continue
        if (/^CREATE (SCHEMA|EXTENSION)/i.test(trimmed)) continue
        if (/^ALTER SCHEMA/i.test(trimmed)) continue
        if (/^REVOKE|^GRANT/i.test(trimmed)) continue
        if (/^CREATE SEQUENCE/i.test(trimmed)) { skipBlock = false; continue }
        if (/^ALTER SEQUENCE/i.test(trimmed)) continue
        if (/^SELECT setval/i.test(trimmed)) continue

        // ── CREATE TYPE ... AS ENUM → MySQL ENUM sera inline dans les tables ──
        if (/^CREATE TYPE .+ AS ENUM/i.test(trimmed)) {
            // Sauter jusqu'à la fin du bloc
            while (i < lines.length && !lines[i].trim().endsWith(';')) i++
            continue
        }

        // ── CREATE TYPE autres (compound types) → ignorer ─────────────────────
        if (/^CREATE TYPE/i.test(trimmed)) {
            while (i < lines.length && !lines[i].trim().endsWith(';')) i++
            continue
        }

        // ── CREATE FUNCTION / CREATE TRIGGER FUNCTION → ignorer (plpgsql) ────
        if (/^CREATE (OR REPLACE )?FUNCTION/i.test(trimmed)) {
            skipBlock = true
            continue
        }

        // ── CREATE TRIGGER → ignorer ──────────────────────────────────────────
        if (/^CREATE TRIGGER/i.test(trimmed)) {
            while (i < lines.length && !lines[i].trim().endsWith(';')) i++
            continue
        }

        // ── ALTER TABLE ... ADD CONSTRAINT → adapter ou supprimer ─────────────
        if (/^ALTER TABLE .+ ADD CONSTRAINT/i.test(trimmed)) {
            // Garder uniquement PRIMARY KEY et FOREIGN KEY
            if (/PRIMARY KEY|FOREIGN KEY/i.test(trimmed)) {
                let t = trimmed
                t = t.replace(/public\./g, '')
                t = t.replace(/"([^"]+)"/g, '`$1`')
                // DEFERRABLE etc. → supprimer
                t = t.replace(/\s+(DEFERRABLE|INITIALLY DEFERRED|INITIALLY IMMEDIATE)/gi, '')
                out.push(t)
            }
            // CHECK, UNIQUE → ignorer pour compatibilité
            continue
        }

        // ── ALTER TABLE ... ENABLE TRIGGER / DISABLE TRIGGER → ignorer ────────
        if (/^ALTER TABLE .+ (ENABLE|DISABLE) (TRIGGER|ROW)/i.test(trimmed)) continue

        // ── CREATE INDEX ──────────────────────────────────────────────────────
        if (/^CREATE (UNIQUE )?INDEX/i.test(trimmed)) {
            let t = trimmed
                .replace(/public\./g, '')
                .replace(/"([^"]+)"/g, '`$1`')
                .replace(/\s+WHERE\s+.+;$/, ';')   // Supprimer WHERE partiel
            // MySQL n'accepte pas d'index avec expressions complexes
            if (!t.includes('(') || t.includes('gin') || t.includes('gist') || t.includes('USING gin') || t.includes('USING gist')) continue
            out.push(t)
            continue
        }

        // ── CREATE TABLE ──────────────────────────────────────────────────────
        if (/^CREATE TABLE/i.test(trimmed)) {
            inCreateTable = true
            tableLines = [line]
            const m = trimmed.match(/CREATE TABLE (?:public\.)?["`]?(\w+)["`]?/)
            currentTableName = m ? m[1] : 'unknown'
            continue
        }

        if (inCreateTable) {
            tableLines.push(line)
            if (trimmed === ');') {
                inCreateTable = false
                out.push(convertCreateTable(tableLines, currentTableName))
                tableLines = []
            }
            continue
        }

        // ── Lignes vides et commentaires ──────────────────────────────────────
        if (trimmed === '' || trimmed.startsWith('--')) {
            out.push(line)
            continue
        }

        // ── Autres lignes → passer traitements basiques ───────────────────────
        // Supprimer les lignes restantes non reconnues qui commencent par des mots-clés PG
        if (/^(ALTER TABLE|ALTER TYPE|ALTER FUNCTION|ALTER INDEX|ALTER SEQUENCE)/i.test(trimmed) &&
            !/ADD CONSTRAINT|ADD COLUMN|MODIFY|CHANGE/i.test(trimmed)) continue
    }

    return header + out.join('\n') + '\n\nSET FOREIGN_KEY_CHECKS = 1;\n'
}

// ─── Convertir un bloc CREATE TABLE complet ──────────────────────────────────
function convertCreateTable(tableLines, tableName) {
    const result = []
    result.push(`-- Table: ${tableName}`)
    result.push(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (`)

    const colLines = tableLines.slice(1, -1) // Retirer CREATE TABLE et );

    const converted = []
    let primaryKeyCols = []

    for (const rawLine of colLines) {
        const t = rawLine.trim()
        if (!t) continue

        // ── CONSTRAINT ... PRIMARY KEY ────────────────────────────────────────
        const pkMatch = t.match(/CONSTRAINT\s+\S+\s+PRIMARY KEY\s*\(([^)]+)\)/)
        if (pkMatch) {
            primaryKeyCols = pkMatch[1].split(',').map(c => `\`${c.trim().replace(/"/g, '')}\``)
            continue
        }

        // ── CONSTRAINT ... CHECK → ignorer ───────────────────────────────────
        if (/^CONSTRAINT\s+\S+\s+CHECK/i.test(t)) continue

        // ── CONSTRAINT ... UNIQUE ─────────────────────────────────────────────
        const uqMatch = t.match(/CONSTRAINT\s+(\S+)\s+UNIQUE\s*\(([^)]+)\)/)
        if (uqMatch) {
            const cols = uqMatch[2].split(',').map(c => `\`${c.trim().replace(/"/g, '')}\``)
            converted.push(`  UNIQUE KEY \`${uqMatch[1]}\` (${cols.join(', ')})`)
            continue
        }

        // ── Ligne de colonne normale ──────────────────────────────────────────
        const colConverted = convertColumnDefinition(rawLine)
        if (colConverted) converted.push(colConverted)
    }

    // Ajouter la PRIMARY KEY
    if (primaryKeyCols.length) {
        converted.push(`  PRIMARY KEY (${primaryKeyCols.join(', ')})`)
    }

    // Assembler proprement (virgules)
    const rows = converted.map((l, idx) => {
        const isLast = idx === converted.length - 1
        const clean = l.trimEnd().replace(/,\s*$/, '')
        return clean + (isLast ? '' : ',')
    })

    result.push(...rows)
    result.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`)
    return result.join('\n')
}

// ─── Convertir une définition de colonne ─────────────────────────────────────
function convertColumnDefinition(rawLine) {
    let line = rawLine.trim()
    if (!line || line.startsWith('--')) return null
    // Supprimer la virgule finale pour traitement, on la remettra plus tard
    const trailingComma = line.endsWith(',')
    if (trailingComma) line = line.slice(0, -1).trim()

    // Extraire le nom de la colonne (entre guillemets ou non)
    const nameMatch = line.match(/^"?([^"\s]+)"?\s+(.+)$/)
    if (!nameMatch) return null

    const colName = nameMatch[1]
    let rest = nameMatch[2].trim()

    // Extraire NOT NULL
    const notNull = /\bNOT NULL\b/i.test(rest)
    rest = rest.replace(/\bNOT NULL\b/i, '').trim()

    // Extraire DEFAULT
    let defaultVal = ''
    const defMatch = rest.match(/\bDEFAULT\s+(.+)$/i)
    if (defMatch) {
        defaultVal = convertDefault(defMatch[1].trim())
        rest = rest.replace(/\bDEFAULT\s+.+$/i, '').trim()
    }

    // Le type restant
    let pgType = rest.trim()

    // Ignorer les uuid par défaut (MySQL ne génère pas d'UUID natif)
    const mysqlType = resolveType(pgType)

    let col = `  \`${colName}\` ${mysqlType}`
    if (defaultVal) col += ` DEFAULT ${defaultVal}`
    if (notNull) col += ' NOT NULL'

    return col
}

// ─── Résoudre le type MySQL final ────────────────────────────────────────────
function resolveType(pgType) {
    const t = pgType
        .replace(/public\./g, '')
        .replace(/::[\w."]+/g, '')   // cast résidu
        .trim()
        .toLowerCase()

    if (t === 'uuid') return 'CHAR(36)'
    if (t === 'text') return 'LONGTEXT'
    if (t === 'boolean' || t === 'bool') return 'TINYINT(1)'
    if (t.startsWith('character varying')) return pgType.replace(/character varying/i, 'VARCHAR').replace(/public\./g, '')
    if (t.startsWith('varchar')) return pgType.replace(/public\./g, '')
    if (t.startsWith('char(')) return pgType.replace(/public\./g, '')
    if (t.startsWith('timestamp')) return 'DATETIME'
    if (t === 'date') return 'DATE'
    if (t.startsWith('time')) return 'TIME'
    if (t === 'integer' || t === 'int4' || t === 'int') return 'INT'
    if (t === 'bigint' || t === 'int8') return 'BIGINT'
    if (t === 'smallint' || t === 'int2') return 'SMALLINT'
    if (t.startsWith('numeric') || t.startsWith('decimal')) {
        return pgType.replace(/numeric/i, 'DECIMAL').replace(/decimal/i, 'DECIMAL').replace(/public\./g, '')
    }
    if (t === 'real' || t === 'float4') return 'FLOAT'
    if (t === 'double precision' || t === 'float8') return 'DOUBLE'
    if (t === 'json' || t === 'jsonb') return 'JSON'
    if (t === 'bytea') return 'BLOB'
    if (t === 'serial') return 'INT'
    if (t === 'bigserial') return 'BIGINT'

    // ENUM personnalisé
    const enumKey = Object.keys(enumValues).find(k => t.includes(k))
    if (enumKey) return enumToMySQL(enumKey)

    return 'TEXT'
}

// ─── Exécution ────────────────────────────────────────────────────────────────
const pgSQL = fs.readFileSync(INPUT, 'utf-8')
const mysqlSQL = convert(pgSQL)
fs.writeFileSync(OUTPUT, mysqlSQL, 'utf-8')

const sizeKB = (Buffer.byteLength(mysqlSQL, 'utf-8') / 1024).toFixed(2)
console.log(`✅ Conversion terminée !`)
console.log(`   Entrée  : supabase/sql/MyBd.sql`)
console.log(`   Sortie  : supabase/sql/MyBd_MySQL.sql (${sizeKB} KB)`)
console.log(`   ENUMs trouvés : ${Object.keys(enumValues).length}`)
