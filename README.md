# Design tokens de gabrieltoledano.dev

La charte de mon portfolio, écrite une seule fois au format [DTCG](https://www.designtokens.org/), puis générée par [Style Dictionary](https://styledictionary.com/) 5.8 en deux fichiers :

- `build/tokens.css` : toutes les variables CSS du site [gabrieltoledano.dev](https://www.gabrieltoledano.dev/), avec un thème sombre et un thème clair ;
- `build/tokens.agents.json` : un JSON à plat qu'un agent IA peut lire pour choisir le bon token. Il contient le nom, la variable CSS, la valeur dans chaque thème, l'alias et la description, plus des règles d'usage.

Une GitHub Action bloque toute modification où un token sémantique n'a pas de description, ou où un thème oublie un token.

## Structure

```
tokens/
  primitives/   palette de base (indigo, cyan, navy…), à ne pas utiliser directement
  semantic/     typographie, mise en page, espacements, arrondis, mouvement : tous décrits
  themes/
    dark.json   thème de référence (par défaut) : couleurs et ombres, avec leurs descriptions
    light.json  thème clair : les mêmes tokens, seulement avec leurs valeurs
formats/
  agents.js     format personnalisé « json/agents »
scripts/
  check-descriptions.js   contrôles lancés par la CI
build.js        configuration Style Dictionary (deux thèmes, un seul fichier CSS)
build/          fichiers générés, commités pour être visibles sur GitHub
```

Les noms suivent la convention DTCG 2025.10, y compris les tokens racines `$root`. Par exemple, `color.text` et `color.text.muted` donnent `--color-text` et `--color-text-muted`.

## Commandes

```bash
npm install      # installe Style Dictionary (version fixée à 5.8.0)
npm run check    # descriptions présentes, thèmes complets
npm run build    # génère build/tokens.css et build/tokens.agents.json
```

## Exemple

Source :

```jsonc
// tokens/themes/dark.json
"bg": { "$root": { "$value": "{color.navy.950}", "$description": "Fond de la page." } }
// tokens/themes/light.json
"bg": { "$root": { "$value": "{color.mist.50}" } }
```

Sortie CSS :

```css
:root, [data-theme="dark"] { --color-bg: var(--color-navy-950); }
[data-theme="light"]       { --color-bg: var(--color-mist-50); }
```

Sortie pour les agents :

```json
{
  "name": "color.bg",
  "cssVariable": "--color-bg",
  "value": "#0a0a14",
  "type": "color",
  "tier": "semantic",
  "alias": "color.navy.950",
  "description": "Fond de la page.",
  "themes": {
    "dark": { "value": "#0a0a14", "alias": "color.navy.950" },
    "light": { "value": "#f5f6fb", "alias": "color.mist.50" }
  }
}
```

## Ajouter ou modifier un token

1. Si la couleur brute n'existe pas encore, ajoute-la dans `tokens/primitives/`.
2. Ajoute le token d'usage avec une référence `{…}` et une `$description` :
   - dans `tokens/semantic/` s'il ne dépend pas du thème ;
   - sinon dans `tokens/themes/dark.json`, puis sa valeur claire au même endroit dans `tokens/themes/light.json`.
3. Lance `npm run check` puis `npm run build`, et commite aussi le dossier `build/`.

## Utilisation dans un projet

Le dépôt s'installe comme un paquet npm, directement depuis GitHub. C'est ce que fait le [portfolio](https://github.com/gabtoledano/portfolio) :

```bash
npm install github:gabtoledano/design-tokens
```

```css
/* Toutes les variables, dans les deux thèmes */
@import "design-tokens/build/tokens.css";
```

```ts
// Le JSON pour les agents, par exemple pour documenter les tokens
import agents from "design-tokens/build/tokens.agents.json";
```

Le paquet ne contient que `build/` et ce README. C'est pour cela que `build/` est commité, et que la CI vérifie qu'il est à jour.

Pour faire passer un changement de token dans le portfolio :

1. Modifier le token ici, lancer `npm run check` puis `npm run build`, et pousser sur `main`.
2. Dans le portfolio, lancer `npm update design-tokens`, puis commiter le `package-lock.json`. C'est lui qui fixe la version exacte utilisée.

Le thème est piloté par l'attribut `data-theme` sur `<html>`. Les composants n'utilisent que des tokens sémantiques, jamais la palette.

## Contrôles qualité

- **CI** : une description manquante, un token absent d'un thème ou un `build/` pas à jour font échouer la GitHub Action.
- **Contrastes (WCAG 2)** :
  - texte sur bouton principal (`color.on-primary` sur `color.primary`) : 6,29:1 dans les deux thèmes ;
  - texte principal sur fond : 19,69:1 en sombre, 17,50:1 en clair ;
  - texte tertiaire (`color.text.subtle`) : 5,03:1 en sombre, 4,57:1 en clair. Il est réservé aux petits textes peu importants.
- **`npm audit`** signale des alertes dans des dépendances internes de Style Dictionary. Elles ne concernent que l'outil de build lancé en local sur nos propres fichiers. La seule « correction » proposée revient à Style Dictionary 3, donc on reste en 5.8.0.
