#!/usr/bin/env node

/**
 * Script de migration automatique des composants Header/Sidebar vers les composants unifiés
 * 
 * Ce script remplace automatiquement :
 * - SidebarChef, SidebarDEP, SidebarScolarite, SidebarChefDepartement → AdminSidebar
 * - HeaderChef, HeaderDEP, HeaderScolarite, HeaderChefDepartement → AdminHeader
 * 
 * Les composants étudiants (Sidebar, Header) restent inchangés
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mapping des anciens composants vers les nouveaux
const SIDEBAR_REPLACEMENTS = {
    "import SidebarChef from '../../components/common/SidebarChef'": "import AdminSidebar from '../../components/common/AdminSidebar'",
    "import SidebarDEP from '../../components/common/SidebarDEP'": "import AdminSidebar from '../../components/common/AdminSidebar'",
    "import SidebarScolarite from '../../components/common/SidebarScolarite'": "import AdminSidebar from '../../components/common/AdminSidebar'",
    "import SidebarChefDepartement from '../../components/common/SidebarChefDepartement'": "import AdminSidebar from '../../components/common/AdminSidebar'",
    '<SidebarChef />': '<AdminSidebar />',
    '<SidebarDEP />': '<AdminSidebar />',
    '<SidebarScolarite />': '<AdminSidebar />',
    '<SidebarChefDepartement />': '<AdminSidebar />'
}

const HEADER_REPLACEMENTS = {
    "import HeaderChef from '../../components/common/HeaderChef'": "import AdminHeader from '../../components/common/AdminHeader'",
    "import HeaderDEP from '../../components/common/HeaderDEP'": "import AdminHeader from '../../components/common/AdminHeader'",
    "import HeaderScolarite from '../../components/common/HeaderScolarite'": "import AdminHeader from '../../components/common/AdminHeader'",
    "import HeaderChefDepartement from '../../components/common/HeaderChefDepartement'": "import AdminHeader from '../../components/common/AdminHeader'",
}

// Patterns pour les utilisations de Header avec props
const HEADER_USAGE_PATTERNS = [
    { pattern: /<HeaderChef\s+[^>]*\/>/g, replacement: '<AdminHeader />' },
    { pattern: /<HeaderDEP\s+[^>]*\/>/g, replacement: '<AdminHeader />' },
    { pattern: /<HeaderScolarite\s+[^>]*\/>/g, replacement: '<AdminHeader />' },
    { pattern: /<HeaderChefDepartement\s+[^>]*\/>/g, replacement: '<AdminHeader />' }
]

// Répertoires à traiter (exclure student)
const DIRECTORIES_TO_PROCESS = [
    path.join(__dirname, '..', 'src', 'views', 'chef'),
    path.join(__dirname, '..', 'src', 'views', 'chef-departement'),
    path.join(__dirname, '..', 'src', 'views', 'chef-scolarite'),
    path.join(__dirname, '..', 'src', 'views', 'dep'),
    path.join(__dirname, '..', 'src', 'views', 'dg'),
    path.join(__dirname, '..', 'src', 'views', 'scolarite'),
    path.join(__dirname, '..', 'src', 'views', 'admin')
]

let filesProcessed = 0
let filesModified = 0

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8')
        let modified = false
        const originalContent = content

        // Remplacer les imports Sidebar
        for (const [oldImport, newImport] of Object.entries(SIDEBAR_REPLACEMENTS)) {
            if (content.includes(oldImport)) {
                content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport)
                modified = true
            }
        }

        // Remplacer les imports Header
        for (const [oldImport, newImport] of Object.entries(HEADER_REPLACEMENTS)) {
            if (content.includes(oldImport)) {
                content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport)
                modified = true
            }
        }

        // Remplacer les utilisations de Header avec props
        for (const { pattern, replacement } of HEADER_USAGE_PATTERNS) {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement)
                modified = true
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8')
            filesModified++
            console.log(`✅ Modifié: ${path.relative(process.cwd(), filePath)}`)
        }

        filesProcessed++
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message)
    }
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  Répertoire non trouvé: ${dirPath}`)
        return
    }

    const files = fs.readdirSync(dirPath)

    for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            processDirectory(filePath)
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            processFile(filePath)
        }
    }
}

console.log('🚀 Début de la migration des composants Header/Sidebar...\n')

for (const dir of DIRECTORIES_TO_PROCESS) {
    console.log(`📁 Traitement du répertoire: ${path.relative(process.cwd(), dir)}`)
    processDirectory(dir)
}

console.log(`\n✨ Migration terminée!`)
console.log(`📊 Statistiques:`)
console.log(`   - Fichiers traités: ${filesProcessed}`)
console.log(`   - Fichiers modifiés: ${filesModified}`)
console.log(`   - Fichiers inchangés: ${filesProcessed - filesModified}`)
