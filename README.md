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

## Passer au modèle 3D

Déposez un fichier nommé **`public/robot.glb`**. C'est tout : `Stage.tsx` teste
sa présence au chargement et bascule sur la scène 3D. Sans fichier, ou si le
chargement échoue, la scène plate reprend la main — le site ne casse jamais.

Ce que la scène fait automatiquement avec le modèle :

- **Cadrage** : mesure de la boîte englobante, recentrage, mise à l'échelle à
  une unité de haut, puis recul de la caméra jusqu'au remplissage voulu. Peu
  importe l'échelle et l'origine d'origine du fichier.
- **Matériaux** : reflets calculés depuis un studio généré en mémoire
  (`RoomEnvironment`), sans HDRI à télécharger. Sans ça, du métal n'a rien à
  refléter et ressemble à du plastique gris.
- **Émissif** : tout matériau ou maille dont le nom contient `eye`, `iris`,
  `core`, `reactor`, `glow`, `led`… reçoit la couleur de la section active.
  **Nommez vos yeux et votre réacteur en conséquence dans le modèle**, sinon
  ils resteront éteints.
- **Faisceaux** : ancrés sur les émissifs situés dans le quart supérieur. À
  défaut, sur un point par défaut à l'avant de la tête.
- **Animation** : si le fichier contient un clip nommé `idle`, `breath`,
  `stand` ou `loop`, il est joué en boucle.

Contraintes pratiques : format `.glb` (binaire, textures incluses), moins de
~8 Mo, orienté Y vers le haut et **face tournée vers +Z**. Un modèle qui
regarde ailleurs apparaîtra de profil au chargement.

Un passage de réglage sera nécessaire une fois le vrai modèle en place :
position des ancres de faisceaux, intensité des lumières et cadrage vertical
dépendent de sa morphologie.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/components/Stage.tsx` | Choisit la scène selon la présence de `robot.glb` |
| `src/components/RobotStage.tsx` | Scène plate : shader de rim-light, conduits, faisceaux |
| `src/components/RobotModelStage.tsx` | Scène 3D : chargement `.glb`, cadrage, éclairage |
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
