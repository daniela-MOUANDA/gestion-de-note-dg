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
            const content = fs.readFileSync(filePath, 'utf8');
            // Remplace pt-24 par pt-32, pt-28 par pt-32
            // Cas simple: className="... pt-24 ..."
            // Nous utilisons une regex pour capturer le contexte global de className si possible, ou juste le remplacement simple qui est plus sûr si le texte est unique
            // Mais className peut être multiline.

            // Approche simple: remplacer ' pt-24"' par ' pt-32"' et ' pt-24 ' par ' pt-32 '
            let newContent = content;

            // Remplacement des classes spécifiques
            // On vise les variantes courantes
            newContent = newContent.replace(/pt-24/g, 'pt-32'); // Remplacement global un peu bourrin mais efficace pour ce projet, attention aux conflits potentiels? Non, pt-24 est une classe Tailwind très spécifique.
            newContent = newContent.replace(/pt-28/g, 'pt-32');

            // Nettoyage des doublons/inutiles si on a créé "pt-32 lg:pt-32" (anciennement pt-28 lg:pt-28 à pt-32 lg:pt-28 qui devient pt-32)
            newContent = newContent.replace(/lg:pt-28/g, ''); // On supprime la variante responsive si elle existait, car pt-32 est assez grand pour desktop aussi.

            if (content !== newContent) {
                console.log(`Updating ${file}...`);
                fs.writeFileSync(filePath, newContent, 'utf8');
            }
        }
    });
}

console.log('Starting padding fix...');
walkDir(targetDir);
console.log('Padding fixes applied!');
