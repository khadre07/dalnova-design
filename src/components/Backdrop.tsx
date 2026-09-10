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
      {/* Le flux, sous tout le reste.

          Une boucle de quatre secondes : des particules qui filent et une ligne
          d'horizon lumineuse. Le sujet tombe juste — c'est du trafic, et la
          page parle de réseau — et la palette est déjà celle de la maison.

          Hébergée ici plutôt qu'appelée chez le CDN d'origine : un fond de page
          qui dépend d'un domaine tiers est un fond qui disparaît le jour où ce
          domaine change d'avis. Ré-encodée en 1280 par 720 à un débit de fond,
          610 kilo-octets au lieu de 2,8 méga — 5,8 mégabits par seconde pour
          une toile de fond, c'était dix fois ce qu'il faut.

          Muette, en boucle, et jouée en ligne sur iOS. Sans « controls » ni
          piste audio : ce n'est pas un lecteur, c'est une texture. */}
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

      {/* On narrow screens the figure sits behind the copy, so the left edge is
          darkened enough to keep body text at AA contrast. */}
      <div className="stage-scrim absolute inset-0" aria-hidden="true" />
    </div>
  );
}
