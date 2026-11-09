// Vérifie que chaque token sémantique a une description ($description).
// La GitHub Action lance ce script : s'il manque une description, il échoue
// et la CI passe au rouge.
// Lancement : npm run check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SEMANTIC_DIR = 'tokens/semantic';
const missing = [];
let count = 0;

// Parcourt l'arbre JSON : un objet qui contient "$value" est un token.
function walk(node, path, file) {
  if (!node || typeof node !== 'object') return;

  if ('$value' in node) {
    count++;
    const description = node.$description;
    if (typeof description !== 'string' || description.trim() === '') {
      missing.push(`${path.join('.')}  (${file})`);
    }
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue; // $type, $description d'un groupe…
    walk(child, [...path, key], file);
  }
}

const files = readdirSync(SEMANTIC_DIR, { recursive: true }).filter((f) => f.endsWith('.json'));

for (const file of files) {
  const fullPath = join(SEMANTIC_DIR, file);
  walk(JSON.parse(readFileSync(fullPath, 'utf8')), [], fullPath);
}

if (missing.length > 0) {
  console.error(`✗ ${missing.length} token(s) sémantique(s) sans description :`);
  for (const line of missing) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(`✓ ${count} tokens sémantiques, tous ont une description.`);
