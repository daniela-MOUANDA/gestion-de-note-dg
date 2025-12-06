
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../src');

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            // Simple replace of the string "2024-2025" to "2025-2026"
            if (content.includes('2024-2025')) {
                content = content.replace(/2024-2025/g, '2025-2026');
            }

            // Also check for "Année 2024" -> "Année 2025" if distinct?
            // User query was specific about the range.

            // Check for specific previous year references in dropdowns that might be '2023-2024' -> '2024-2025'
            // If we blindly move 24-25 to 25-26, what happens to 23-24? 
            // Usually we want to shift the window. 
            // But let's stick to the user request: "en cours ... c'est 2025-2026".

            // If I see a list like: '2024-2025', '2023-2024'
            // Updating 24-25 -> 25-26 makes it: '2025-2026', '2023-2024'.
            // The gap (2024-2025) is missing in the list.

            // Smart update: 
            // 2023-2024 -> 2024-2025
            // 2024-2025 -> 2025-2026

            // I should replace 2023-2024 FIRST, then 2024-2025 to avoid collisions?
            // No, replace 2024-2025 -> 2025-2026 first?
            // If I replace 2024-2025 -> 2025-2026
            // List becomes: '25-26', '23-24'.
            // Then replace 2023-2024 -> 2024-2025.
            // List becomes: '25-26', '24-25'.
            // This preserves the sequence.

            if (content.includes('2023-2024')) {
                // content = content.replace(/2023-2024/g, '2024-2025'); 
                // Wait, user didn't ask to shift history. Just "l'annee en cours".
                // But usually for Dropdowns it makes sense.
                // Let's stick to just the requested "2024-2025" -> "2025-2026" explicitly requested.
                // If I see mock data objects, shifting only the current year might look weird but satisfies the "current year" request.
            }

            if (content !== originalContent) {
                console.log(`Updating year in ${file}...`);
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}

console.log('Starting academic year update in source code...');
walkDir(targetDir);
console.log('Source code update complete!');
