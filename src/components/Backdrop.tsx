"use client";

import Sky from "./Sky";
import Stage from "./Stage";
import Stars from "./Stars";

/* The fixed layers behind everything: the dot field, the figure, and the scrim
   that keeps body text readable over it.

   The figure's presence is driven by the section on screen rather than being
   constant. It was staged for the hero, and below the hero it was still
   standing there at full size behind sections that had nothing to do with it —
   the largest surface on the page doing the least work. Sections that take the
   full width push it back; sections that keep to the left column bring it
   forward again. */
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Sky />

      <Stars />

      <div className="grid-field absolute inset-0 opacity-[0.42]" aria-hidden="true" />

      {/* Full bleed, not a column. The figure keeps its place on the right —
          it is offset inside the scene rather than confined by a box — and
          what that buys is a water surface that runs the whole width of the
          screen instead of stopping at the edge of a 47% canvas. */}
      <div className="stage-slot absolute inset-0">
        <Stage />
      </div>


      {/* Le flux, devant la figure et non plus derrière.

          Derrière, il n'était qu'une texture de plus sous une pile qui en
          comptait déjà quatre. Devant, et masqué en dégradé, il fait ce qu'on
          lui demande : ses traînées passent sur le bas de la figure et
          s'effacent avant sa tête, de sorte qu'elle n'est plus posée sur le
          flux mais dedans, en train d'en sortir.

          Le masque est ce qui rend la chose possible sans couvrir la lune : au
          sommet le calque est transparent, donc le ciel, les étoiles et la
          lune restent au premier plan de leur propre moitié d'écran.

          Une seule balise video, et pas deux. Un second exemplaire au fond
          aurait doublé le décodage pour une texture que la pile fournit déjà.

          Muette, en boucle, jouée en ligne sur iOS. Sans « controls » ni piste
          audio : ce n'est pas un lecteur, c'est une matière. */}
      {/* Le champ, une seule vidéo.

          J'étais passé par trois bandes empilées pour couvrir la hauteur. Le
          remède était pire : les trois répétaient la ligne d'horizon du rush,
          et ces traits en travers se lisaient comme ce qu'ils étaient, trois
          morceaux collés. Le décor y passait tout entier — plus de lune, plus
          de ciel, un bleu uniforme.

          Ce qui me les avait fait poser n'était d'ailleurs pas la bonne cause.
          La galerie restait nue à cause du bandeau de section, opaque sur toute
          la largeur, et du canvas de l'eau qui passait au-dessus. Les deux sont
          corrigés ; une seule vidéo suffit donc, et elle est ce qu'elle doit
          être : une texture, pas un décor.

          Muette, en boucle, jouée en ligne sur iOS. Sans commandes ni piste
          audio : ce n'est pas un lecteur. */}
      <video
        className="flux-video"
        src="/video/flux.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* On narrow screens the figure sits behind the copy, so the left edge is
          darkened enough to keep body text at AA contrast. */}
      <div className="stage-scrim absolute inset-0" aria-hidden="true" />
    </div>
  );
}
