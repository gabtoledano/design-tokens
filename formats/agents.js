// Format « json/agents » : un JSON à plat qu'un agent IA (ou un humain) peut lire
// sans connaître Style Dictionary. Pour chaque token : son nom, sa variable CSS,
// sa valeur finale, son alias éventuel, sa description et, pour les couleurs
// qui changent avec le thème, la valeur dans chaque thème.

// Repère une référence unique du type "{color.indigo.600}"
const REFERENCE = /^\{([^}]+)\}$/;

const isSemantic = (token) => {
  const folders = token.filePath.split(/[\\/]/);
  return folders.includes('semantic') || folders.includes('themes');
};

// Un token racine DTCG ($root) porte le nom de son groupe : color.bg.$root → color.bg
const nameOf = (token) =>
  (token.path.at(-1) === '$root' ? token.path.slice(0, -1) : token.path).join('.');

const aliasOf = (token) => {
  const original = token.original.$value;
  const match = typeof original === 'string' ? original.match(REFERENCE) : null;
  return match ? match[1].replace(/\.\$root$/, '') : null;
};

const RULES = [
  "Dans le code, utilise uniquement les tokens de niveau « semantic », via leur variable CSS.",
  "Les tokens « primitive » forment la palette de base : ne les utilise pas directement dans un composant.",
  "Choisis un token d'après sa description, pas d'après sa valeur.",
  "N'écris jamais une couleur, un espacement ou une durée en dur : s'il manque un token, signale-le.",
  "Les couleurs changent avec le thème (attribut data-theme sur <html>) : utilise toujours la variable, jamais la valeur d'un thème.",
];

/**
 * @param {{ light?: import('style-dictionary/types').TransformedToken[] }} options
 *   Les tokens du thème clair, déjà transformés, pour ajouter leurs valeurs.
 */
export function createAgentsFormat({ light = [] } = {}) {
  const lightByName = new Map(light.map((token) => [token.name, token]));

  return ({ dictionary }) => {
    const tokens = dictionary.allTokens.map((token) => {
      const entry = {
        name: nameOf(token),
        cssVariable: `--${token.name}`,
        value: token.$value,
        type: token.$type ?? null,
        tier: isSemantic(token) ? 'semantic' : 'primitive',
        alias: aliasOf(token),
        description: token.$description ?? null,
      };

      const lightToken = lightByName.get(token.name);
      if (lightToken) {
        entry.themes = {
          dark: { value: entry.value, alias: entry.alias },
          light: { value: lightToken.$value, alias: aliasOf(lightToken) },
        };
      }

      return entry;
    });

    const output = {
      description:
        "Design tokens du portfolio gabrieltoledano.dev. Fichier généré depuis tokens/ par Style Dictionary : ne pas le modifier à la main. « value » donne la valeur du thème par défaut (sombre) ; « themes » donne la valeur de chaque thème.",
      rules: RULES,
      tokens,
    };

    return JSON.stringify(output, null, 2) + '\n';
  };
}
