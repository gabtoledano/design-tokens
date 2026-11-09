// Format « json/agents » : un JSON à plat qu'un agent IA (ou un humain) peut lire
// sans connaître Style Dictionary. Pour chaque token : son nom, sa variable CSS,
// sa valeur finale, son alias éventuel et sa description.

// Repère une référence du type "{color.blue.500}"
const REFERENCE = /^\{([^}]+)\}$/;

export function agentsFormat({ dictionary }) {
  const tokens = dictionary.allTokens.map((token) => {
    const original = token.original.$value;
    const match = typeof original === 'string' ? original.match(REFERENCE) : null;

    return {
      name: token.path.join('.'),
      cssVariable: `--${token.name}`,
      value: token.$value,
      type: token.$type,
      tier: token.filePath.split(/[\\/]/).includes('semantic') ? 'semantic' : 'primitive',
      alias: match ? match[1] : null,
      description: token.$description ?? null,
    };
  });

  const output = {
    description:
      "Design tokens de Gabriel Toledano. Fichier généré depuis tokens/ par Style Dictionary : ne pas le modifier à la main.",
    rules: [
      "Dans le code, utilise uniquement les tokens de niveau « semantic », via leur variable CSS.",
      "Les tokens « primitive » forment la palette de base : ne les utilise pas directement dans un composant.",
      'Choisis un token d\'après sa description, pas d\'après sa valeur.',
      "N'écris jamais une couleur ou un espacement en dur : s'il manque un token, signale-le.",
    ],
    tokens,
  };

  return JSON.stringify(output, null, 2) + '\n';
}
