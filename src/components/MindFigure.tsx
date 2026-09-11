"use client";

/* La figure : une vidéo, à la place de la scène Spline.

   Ce qui remplace le robot est un profil dont l'activité cérébrale s'allume —
   un motif d'intelligence artificielle, ce que la page vend maintenant sous le
   nom d'IA appliquée.

   Deux vidéos à l'écran, et une seule image : c'est le point délicat de la
   demande, et il ne se règle pas par un truquage mais par la matière. Le rush
   est une figure lumineuse sur un noir quasi pur — mesuré, deux sur deux cent
   cinquante-cinq dans les coins. En mélange par écran, le noir ne dépose rien
   du tout : il n'y a donc pas de rectangle à cacher, pas de bord à estomper,
   pas de raccord. Seuls les traits lumineux arrivent, et ils arrivent dans le
   même flux que le fond, qui est peint exactement de la même façon.

   Ce que cela remplace, en coût : une scène de 1,35 méga chargée chez un
   tiers, migrée de schéma à chaque ouverture, tenant son propre contexte
   WebGL. Ici, soixante-douze kilo-octets servis par nous et décodés par le
   lecteur vidéo du système.

   Elle ne défile pas avec la page : comme la figure qu'elle remplace, elle est
   ancrée au document et s'en va avec le héros. */

import { useEffect, useRef } from "react";
import { reportReady, reportStage } from "@/lib/boot";

export default function MindFigure() {
  const host = useRef<HTMLDivElement>(null);

  /* La page attendait la scène pour se déclarer prête. Une vidéo de fond n'a
     pas à retenir la page : elle est annoncée prête tout de suite, et le
     lecteur la remplit quand il l'a. */
  useEffect(() => {
    reportStage("scene", 1);
    reportReady();
  }, []);

  /* Le même décalage que la figure d'avant, et pour la même raison : écrit sur
     l'élément et non sur la racine, où une propriété personnalisée invalide le
     style de tout ce qui en hérite. */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let frame = 0;
    const appliquer = () => {
      frame = 0;
      el.style.top = `${-Math.round(window.scrollY)}px`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(appliquer);
    };
    appliquer();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={host} className="mind-figure" data-live="true" aria-hidden="true">
      <video
        className="mind-video"
        src="/video/esprit.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}
