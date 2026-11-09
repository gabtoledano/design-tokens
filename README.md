# Design tokens lisibles par les humains et par l'IA

Un seul fichier source de tokens au format [DTCG](https://www.designtokens.org/), deux sorties générées par [Style Dictionary](https://styledictionary.com/) 5.8 :

- `build/tokens.css` : les variables CSS pour le code ;
- `build/tokens.agents.json` : un JSON à plat qu'un agent IA peut lire pour choisir le bon token (nom, variable CSS, valeur, alias, description, plus des règles d'usage).

Une GitHub Action bloque toute modification où un token sémantique n'a pas de description. Sans description, un agent ne sait pas quand utiliser un token.

## Structure

```
tokens/
  primitives/   palette de base (couleurs, espacements bruts)
  semantic/     tokens d'usage, qui pointent vers les primitives et ont tous une description
formats/
  agents.js     format personnalisé « json/agents »
scripts/
  check-descriptions.js   contrôle lancé par la CI
build.js        configuration Style Dictionary
build/          fichiers générés (commités pour être visibles sur GitHub)
```

## Commandes

```bash
npm install      # installe Style Dictionary (version fixée à 5.8.0)
npm run check    # vérifie que chaque token sémantique a une description
npm run build    # génère build/tokens.css et build/tokens.agents.json
```

## Exemple

Source (`tokens/semantic/color.json`) :

```json
"primary": {
  "$value": "{color.blue.500}",
  "$description": "Fond des boutons principaux et couleur des liens. Une seule action principale par écran."
}
```

Sortie CSS :

```css
--color-action-primary: var(--color-blue-500);
```

Sortie pour les agents :

```json
{
  "name": "color.action.primary",
  "cssVariable": "--color-action-primary",
  "value": "#2563eb",
  "type": "color",
  "tier": "semantic",
  "alias": "color.blue.500",
  "description": "Fond des boutons principaux et couleur des liens. Une seule action principale par écran."
}
```

## Ajouter un token

1. Ajoute la couleur ou l'espacement brut dans `tokens/primitives/` si elle n'existe pas encore.
2. Ajoute le token d'usage dans `tokens/semantic/`, avec une référence `{…}` et une `$description`.
3. Lance `npm run check` puis `npm run build`, et commite aussi le dossier `build/`.

La CI vérifie que `build/` correspond bien aux sources : si tu oublies de relancer le build, elle passe au rouge.

## Contrôles qualité

- Contraste : `color.text.on-action` sur `color.action.primary` = 5,17:1 (WCAG AA ≥ 4,5:1).
- `npm audit` signale des alertes dans des dépendances internes de Style Dictionary. Elles ne concernent que l'outil de build lancé en local sur nos propres fichiers. La seule « correction » proposée revient à Style Dictionary 3, donc on reste en 5.8.0.
