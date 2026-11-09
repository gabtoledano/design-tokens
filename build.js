// Génère build/tokens.css et build/tokens.agents.json à partir des fichiers de tokens.
// Lancement : npm run build
import StyleDictionary from 'style-dictionary';
import { agentsFormat } from './formats/agents.js';

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  hooks: {
    formats: {
      'json/agents': agentsFormat,
    },
  },
  platforms: {
    web: {
      transformGroup: 'css',
      buildPath: 'build/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          // Les tokens sémantiques pointent vers les primitives : var(--color-blue-500)
          options: { outputReferences: true },
        },
        {
          destination: 'tokens.agents.json',
          format: 'json/agents',
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
