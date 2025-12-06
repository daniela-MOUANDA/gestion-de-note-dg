#!/usr/bin/env node

/**
 * Script pour corriger les fichiers qui ont encore la logique conditionnelle Sidebar/Header
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FILES_TO_FIX = [
    'src/views/scolarite/ProcesVerbauxView.jsx',
    'src/views/scolarite/ImporterCandidatsView.jsx',
    'src/views/scolarite/GererInscriptionsView.jsx',
    'src/views/scolarite/DiplomesView.jsx',
    'src/views/scolarite/BulletinsView.jsx',
    'src/views/scolarite/ArchivesAttestationsScolariteView.jsx',
    'src/views/scolarite/ArchivageView.jsx'
]

let filesFixed = 0

function fixFile(filePath) {
    const fullPath = path.join(__dirname, '..', filePath)

    try {
        let content = fs.readFileSync(fullPath, 'utf8')
        let modified = false

        // Supprimer les imports dupliqués
        const duplicateImportPattern = /import AdminSidebar from '\.\.\/\.\.\/components\/common\/AdminSidebar'\s*\nimport AdminHeader from '\.\.\/\.\.\/components\/common\/AdminHeader'\s*\nimport AdminSidebar from '\.\.\/\.\.\/components\/common\/AdminSidebar'\s*\nimport AdminHeader from '\.\.\/\.\.\/components\/common\/AdminHeader'/g
        if (duplicateImportPattern.test(content)) {
            content = content.replace(duplicateImportPattern, "import AdminSidebar from '../../components/common/AdminSidebar'\nimport AdminHeader from '../../components/common/AdminHeader'")
            modified = true
        }

        // Supprimer la logique conditionnelle
        const conditionalLogicPattern = /const isChefView = location\.pathname\.startsWith\('\/chef-scolarite'\)\s*\n\s*const Sidebar = isChefView \? SidebarChef : SidebarScolarite\s*\n\s*const Header = isChefView \? HeaderChef : HeaderScolarite/g
        if (conditionalLogicPattern.test(content)) {
            content = content.replace(conditionalLogicPattern, '')
            modified = true
        }

        // Remplacer <Sidebar /> par <AdminSidebar />
        if (content.includes('<Sidebar />')) {
            content = content.replace(/<Sidebar \/>/g, '<AdminSidebar />')
            modified = true
        }

        // Remplacer <Header /> par <AdminHeader />
        if (content.includes('<Header />')) {
            content = content.replace(/<Header \/>/g, '<AdminHeader />')
            modified = true
        }

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8')
            filesFixed++
            console.log(`✅ Corrigé: ${filePath}`)
        } else {
            console.log(`⚠️  Aucune modification nécessaire: ${filePath}`)
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message)
    }
}

console.log('🔧 Correction des fichiers avec logique conditionnelle...\n')

for (const file of FILES_TO_FIX) {
    fixFile(file)
}

console.log(`\n✨ Correction terminée! ${filesFixed} fichiers corrigés.`)
