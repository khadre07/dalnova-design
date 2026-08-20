# Dalnova Technologies

Site vitrine one-page, bilingue FR/EN, avec une scène WebGL persistante à droite.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Le principe

Une seule page, un seul robot. La figure est montée une fois dans un canvas fixe
et ne se démonte jamais : elle traverse le hero, les capacités, la méthode, les
preuves et le contact sans jamais réapparaître. C'est ce qui donne la sensation
de plan-séquence plutôt que de sections empilées.

Sa lumière de contour appartient à la section qui occupe l'écran, via
`useAccentZone` : **cyan pour ce que fait une machine** (infogérance, IA,
blockchain), **ambre pour ce que fait une personne** (support, contact). La
couleur porte du sens, elle ne décore pas. Le logo et les conduits suivent.

## Direction artistique

La palette est **échantillonnée dans le rendu du robot**, pas choisie à côté :
`#05070A` `#0B1117` `#40454B` `#B2C4C3` sont ses propres valeurs, `#35D2FF` son
réacteur et `#FF9A45` son rim-light de flanc. Voir `src/app/globals.css`.

Typographie : **Archivo** sur son axe de largeur (`wdth` 104–118), en capitales,
pour un registre de signalétique industrielle ; **Geist** en texte ; **Geist Mono**
pour toute donnée, tout libellé et toute unité.

Rien n'a de rayon de bordure au-dessus de 2 px. Ce sont des panneaux usinés.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/components/RobotStage.tsx` | Scène WebGL, shader de rim-light, conduits, replis |
| `src/lib/site-state.tsx` | Langue, progression de scroll, accent actif |
| `src/lib/content.ts` | Tout le texte FR et EN |
| `src/app/globals.css` | Jetons, rôles typographiques, composants |

## Contraintes tenues

- **Le contenu est visible sans JavaScript.** Les animations d'apparition ne se
  déclenchent qu'après qu'un script inline a posé `data-js="on"` sur `<html>`.
  Sans cela, un bundle qui échoue laisse une page noire définitive.
- **`prefers-reduced-motion`** sert une composition fixe, correctement éclairée —
  pas une version cassée.
- **Sans WebGL**, la figure retombe sur le PNG avec un glow CSS.
- Le rendu s'arrête quand l'onglet passe en arrière-plan ou que la scène sort du
  viewport.
- Sous 1024 px, la figure est réduite, voilée, et la nav passe en menu.
- Le CSS personnalisé vit dans `@layer base` / `@layer components`. **Ne l'écrivez
  pas hors couche** : les règles non superposées battent tous les utilitaires
  Tailwind, et `hidden lg:inline-flex` devient silencieusement inopérant.

## À remplacer avant mise en ligne

Les valeurs suivantes sont des **exemples**, pas des engagements de Dalnova :

- Indicateurs de `CONTENT.*.proof.stats` et `CONTENT.*.telemetry` (99,95 %,
  15 min, 24/7, préavis 30 j)
- `contact@dalnova.tech` et `+33 1 84 80 00 00`
- Durées des étapes dans `CONTENT.*.method.steps`
- `metadataBase` dans `src/app/layout.tsx`

Aucun visuel de partage (`og:image`) n'est encore fourni.
