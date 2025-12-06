import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../src/views');

function walkDir(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            // Regex to find the main tag and its className
            // We are looking for <main className="..."> where it likely contains some padding
            // We want to replace any existing top padding (pt-24, pt-28, pt-40, etc) with pt-32 lg:pt-32

            // This regex looks for pt- followed by digits, optionally followed by lg:pt-digits
            // It tries to catch standard patterns found in these files

            // Strategy:
            // 1. Check if file contains <main className=...
            // 2. If so, replace the padding classes

            // Replacement for pt-40 lg:pt-40 (what I just added)
            content = content.replace(/pt-40 lg:pt-40/g, 'pt-32 lg:pt-32');

            // Replacement for generic pt-XX (if not followed by lg:pt-XX to avoid double replace issues in first pass)
            // But checking previous files, they often had "pt-24" or "pt-28 lg:pt-28"

            // Let's rely on a more robust regex replacement for the specific part of the string
            // We'll replace "pt-24", "pt-28", "pt-32", "pt-36", "pt-40" 
            // AND any "lg:pt-XX" associated with them

            // We replace "pt-[0-9]+" with "pt-32" (temporarily) then handle lg separately?
            // No, user wants "pt-32 lg:pt-32".

            // Let's do explicit replacements for known variants to be safe and clean
            const variantsToReplace = [
                'pt-20', 'pt-24', 'pt-28', 'pt-36', 'pt-40',
                'lg:pt-20', 'lg:pt-24', 'lg:pt-28', 'lg:pt-36', 'lg:pt-40'
            ];

            // First, remove any existing lg:pt-XX that are NOT lg:pt-32
            // We will add lg:pt-32 back in where needed
            content = content.replace(/lg:pt-(20|24|28|36|40)/g, '');

            // Now replace the base pt-XX with pt-32 lg:pt-32
            // We also need to handle the case where we just created double spaces or weirdness
            content = content.replace(/pt-(20|24|28|36|40)/g, 'pt-32 lg:pt-32');

            // Special cleanup: if we have "pt-32 lg:pt-32 lg:pt-32", fix it
            content = content.replace(/(lg:pt-32\s*)+/g, 'lg:pt-32 ');

            // If the file already had pt-32 but NOT lg:pt-32, we should add it
            // Regex match "pt-32" not followed by "lg:pt-32"
            // This is getting complex.

            // Simpler approach:
            // Find the className string of main
            // Replace the whole padding section if possible? No, too risky.

            // Let's stick to replacing the ONES WE KNOW ARE WRONG.
            // I created pt-40 lg:pt-40.
            // Previous script created pt-32 (but maybe missed lg:pt-32).

            // Identify files with `pt-32` that lack `lg:pt-32`
            if (content.includes('pt-32') && !content.includes('lg:pt-32')) {
                content = content.replace('pt-32', 'pt-32 lg:pt-32');
            }

            // Clean up possible double spaces
            content = content.replace(/\s+/g, ' ');
            // Wait, replacing all whitespace with single space destroys indentation! BAD IDEA.
            // Do NOT do that.

            // Re-read content to reset damage from bad whitespace thought
            content = originalContent;

            // Revised safe strategy:
            // 1. Fix the one I broke (pt-40)
            content = content.replace(/pt-40 lg:pt-40/g, 'pt-32 lg:pt-32');
            content = content.replace(/pt-40/g, 'pt-32 lg:pt-32'); // Catch stragglers

            // 2. Fix old ones (pt-24, pt-28)
            // Note: My previous script turned pt-24/28 into pt-32 (without lg:pt-32).
            // So now we mostly have pt-32.
            // We need to upgrade pt-32 to pt-32 lg:pt-32 wherever it appears in <main> tags.

            // We can target specific string context: className="flex-1 ... pt-32"
            // But the classes might be in different order.

            // Let's verify commonly used bad patterns
            content = content.replace(/pt-24/g, 'pt-32 lg:pt-32');
            content = content.replace(/pt-28/g, 'pt-32 lg:pt-32');
            content = content.replace(/lg:pt-28/g, ''); // Remove old responsive if lingering

            // Now, for the ones currently `pt-32` (from previous script or naturally), make sure they have `lg:pt-32`
            // Only target the one inside main className to avoid affecting other elements?
            // Usually pt-32 is big enough it's likely the main container.

            // Find `pt-32` that is NOT followed by `lg:pt-32`
            // Uses a negative lookahead, but JS replace with regex is tricky with lookaheads depending on engine (Node 14+ is fine).
            // Instead, simpler: Replace `pt-32` with `pt-32 lg:pt-32` everywhere, 
            // THEN replace `pt-32 lg:pt-32 lg:pt-32` back to `pt-32 lg:pt-32` to fix duplicates.

            content = content.replace(/pt-32/g, 'pt-32 lg:pt-32');

            // Fix triplicates/duplicates
            content = content.replace(/lg:pt-32 lg:pt-32/g, 'lg:pt-32');
            // Do it twice just in case
            content = content.replace(/lg:pt-32 lg:pt-32/g, 'lg:pt-32');

            // Remove any `lg:lg:` artifacts if I made a typo (just sanity check)


            if (content !== originalContent) {
                console.log(`Aligning layout in ${file}...`);
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}

console.log('Starting global layout alignment...');
walkDir(targetDir);
console.log('Layout alignment complete!');
