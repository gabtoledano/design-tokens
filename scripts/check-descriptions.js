// Deux contrôles lancés par la GitHub Action. Si l'un échoue, la CI passe au rouge.
//   1. Chaque token sémantique a une description ($description).
//   2. Le thème clair définit exactement les mêmes tokens que le thème sombre.
// Lancement : npm run check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Les descriptions vivent dans les tokens sémantiques et dans le thème de
// référence (sombre). Le thème clair ne redonne que les valeurs.
const DESCRIBED = [
  ...readdirSync('tokens/semantic', { recursive: true })
    .filter((file) => file.endsWith('.json'))
    .map((file) => join('tokens/semantic', file)),
  'tokens/themes/dark.json',
];
const REFERENCE_THEME = 'tokens/themes/dark.json';
const OTHER_THEMES = ['tokens/themes/light.json'];

// Liste les tokens d'un fichier : un objet qui contient "$value" est un token.
// "$root" (DTCG 2025.10) est un token racine, il faut donc le parcourir.
function collect(file) {
  const tokens = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if ('$value' in node) {
      tokens.push({ path: path.join('.'), node });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') && key !== '$root') continue; // $type, $description d'un groupe…
      walk(child, [...path, key]);
    }
  };
  walk(JSON.parse(readFileSync(file, 'utf8')), []);
  return tokens;
}

const errors = [];

// 1. Descriptions
let described = 0;
for (const file of DESCRIBED) {
  for (const { path, node } of collect(file)) {
    described++;
    const description = node.$description;
    if (typeof description !== 'string' || description.trim() === '') {
      errors.push(`Description manquante : ${path}  (${file})`);
    }
  }
}

// 2. Parité des thèmes
const reference = new Set(collect(REFERENCE_THEME).map((token) => token.path));
for (const file of OTHER_THEMES) {
  const theme = new Set(collect(file).map((token) => token.path));
  for (const path of reference) {
    if (!theme.has(path)) errors.push(`Token absent du thème : ${path}  (${file})`);
  }
  for (const path of theme) {
    if (!reference.has(path)) errors.push(`Token inconnu du thème de référence : ${path}  (${file})`);
  }
}

if (errors.length > 0) {
  console.error(`✗ ${errors.length} problème(s) :`);
  for (const line of errors) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(`✓ ${described} tokens sémantiques, tous décrits.`);
console.log(`✓ ${reference.size} tokens de thème, présents dans les ${OTHER_THEMES.length + 1} thèmes.`);
