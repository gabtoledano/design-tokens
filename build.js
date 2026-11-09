// Génère build/tokens.css (les deux thèmes) et build/tokens.agents.json.
// Lancement : npm run build
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import { createAgentsFormat } from './formats/agents.js';

const TMP = '.sd-tmp/';
const BASE_SOURCES = ['tokens/primitives/**/*.json', 'tokens/semantic/**/*.json'];

// Les tokens qui changent avec le thème vivent dans tokens/themes/
const isThemed = (token) => token.filePath.split(/[\\/]/).includes('themes');

// Le groupe « css » de Style Dictionary, sans size/rem : nos dimensions ont déjà
// leur unité, et size/rem échoue sur les valeurs fluides en clamp().
const transforms = [
  'attribute/cti',
  'name/kebab',
  'time/seconds',
  'color/css',
  'fontFamily/css',
  'cubicBezier/css',
  'shadow/css/shorthand',
];

// Les blocs de thème pointent vers les primitives, écrites dans le bloc :root.
// Style Dictionary prévient alors que des références sont « filtrées » : c'est
// voulu, on coupe donc ses avertissements. Les vrais contrôles sont dans
// scripts/check-descriptions.js.
const log = { warnings: 'disabled' };

const cssFile = (destination, selector, filter) => ({
  destination,
  format: 'css/variables',
  filter,
  // Les tokens sémantiques pointent vers les primitives : var(--color-indigo-600)
  options: { selector, outputReferences: true, showFileHeader: false },
});

// 1. Thème clair : son bloc CSS, et ses valeurs pour le JSON des agents
const light = new StyleDictionary({
  log,
  source: [...BASE_SOURCES, 'tokens/themes/light.json'],
  platforms: {
    css: {
      transforms,
      buildPath: TMP,
      files: [cssFile('theme-light.css', '[data-theme="light"]', isThemed)],
    },
  },
});
await light.buildAllPlatforms();
const lightTokens = (await light.getPlatformTokens('css')).allTokens.filter(isThemed);

// 2. Thème sombre, celui par défaut : la base commune, son bloc CSS et le JSON
const dark = new StyleDictionary({
  log,
  source: [...BASE_SOURCES, 'tokens/themes/dark.json'],
  hooks: {
    formats: { 'json/agents': createAgentsFormat({ light: lightTokens }) },
  },
  platforms: {
    css: {
      transforms,
      buildPath: TMP,
      files: [
        cssFile('base.css', ':root', (token) => !isThemed(token)),
        cssFile('theme-dark.css', ':root, [data-theme="dark"]', isThemed),
      ],
    },
    agents: {
      transforms,
      buildPath: 'build/',
      files: [{ destination: 'tokens.agents.json', format: 'json/agents' }],
    },
  },
});
await dark.buildAllPlatforms();

// 3. Un seul fichier CSS pour le site. L'ordre compte : le bloc clair vient en
// dernier pour l'emporter sur le bloc sombre quand data-theme="light".
const header = `/**
 * Design tokens de gabrieltoledano.dev, générés par Style Dictionary depuis tokens/.
 * Ne pas modifier à la main : lancer npm run build.
 * Thème sombre par défaut, thème clair avec data-theme="light" sur <html>.
 */

`;
const blocks = ['base.css', 'theme-dark.css', 'theme-light.css'].map((file) =>
  readFileSync(TMP + file, 'utf8').trim(),
);

mkdirSync('build', { recursive: true });
writeFileSync('build/tokens.css', header + blocks.join('\n\n') + '\n');
rmSync(TMP, { recursive: true, force: true });

console.log('\n✔︎ build/tokens.css (thèmes sombre et clair)');
