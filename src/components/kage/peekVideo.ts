"use client";

/* L'aperçu du héros, quand il y a une vidéo à montrer.

   L'élément portait déjà un triangle de lecture et ne lisait rien : c'était un
   lien vers la section Réalisations avec une promesse dessinée dessus. Ce
   module tient la promesse — ou la retire, selon qu'il y ait un fichier.

   Il se teste lui-même. Une requête HEAD sur la source, et rien d'autre ne
   change tant qu'elle n'aboutit pas : sans fichier, l'aperçu reste le lien
   qu'il a toujours été et le triangle cède la place à la flèche que les cartes
   utilisent déjà, qui dit « ouvrir » au lieu de « lire ». Avec fichier, le
   triangle revient et le clic ouvre le lecteur. Aucune ligne à changer le jour
   où la vidéo arrive : elle se dépose, elle se joue.

   Pleine trame et non sur place, parce que l'aperçu fait 262 pixels au plus
   large. Une vidéo d'intervention est une preuve, et une preuve doit se lire.
   La jouer dans la vignette, ce serait la montrer sans la donner à voir. */

/** Où déposer le fichier. Rien d'autre à faire que de le mettre là. */
export const PEEK_VIDEO_SRC = "/work/intervention-dakar.mp4";

type Cleanup = () => void;

/* Le lecteur n'est construit qu'au premier clic : la plupart des visites ne
   l'ouvrent pas, et une balise video de plus dans le document est une balise
   que le navigateur pré-charge pour rien. */
function buildPlayer(src: string, label: string) {
  const layer = document.createElement("div");
  layer.className = "vwrap";
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  layer.setAttribute("aria-label", label);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "vwrap-x";
  close.setAttribute("aria-label", "Fermer la vidéo");
  /* construite plutôt qu'écrite en innerHTML : la chaîne serait littérale et
     donc sans danger, mais le motif n'a pas à exister dans ce fichier */
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");
  const cross = document.createElementNS(NS, "path");
  cross.setAttribute("d", "M5 5l10 10M15 5L5 15");
  svg.append(cross);
  close.append(svg);

  const video = document.createElement("video");
  video.className = "vwrap-v";
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";

  layer.append(close, video);
  return { layer, close, video };
}

export function mountPeekVideo(peek: HTMLAnchorElement): Cleanup {
  const src = peek.dataset.peekVideo || PEEK_VIDEO_SRC;
  let disposed = false;
  let player: ReturnType<typeof buildPlayer> | null = null;
  let lastFocus: HTMLElement | null = null;

  /* Jusqu'à preuve du contraire, l'aperçu est un lien. C'est l'état honnête :
     tant qu'on ne sait pas si le fichier existe, rien ne doit annoncer une
     lecture. */
  peek.dataset.video = "none";

  const shut = () => {
    if (!player) return;
    player.video.pause();
    player.layer.remove();
    document.documentElement.classList.remove("video-open");
    lastFocus?.focus();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") shut();
  };

  const open = (event: MouseEvent) => {
    event.preventDefault();
    lastFocus = document.activeElement as HTMLElement | null;
    if (!player) {
      player = buildPlayer(src, peek.getAttribute("aria-label") || "Vidéo");
      player.close.addEventListener("click", shut);
      /* le fond ferme, la vidéo elle-même non : un clic sur les commandes ne
         doit pas fermer ce qu'on vient d'ouvrir */
      player.layer.addEventListener("click", (e) => {
        if (e.target === player?.layer) shut();
      });
    }
    document.body.append(player.layer);
    /* sa propre classe, et pas celle du menu : celle-là n'est déclarée que
       sous 820 et ne verrouillait donc rien sur un écran large */
    document.documentElement.classList.add("video-open");
    player.close.focus();
    void player.video.play().catch(() => {
      /* le navigateur peut refuser la lecture automatique malgré le geste ;
         les commandes sont là, il reste le bouton */
    });
  };

  /* La sonde. Une requête HEAD, pas un chargement : on demande si le fichier
     est là, pas ses octets. */
  fetch(src, { method: "HEAD" })
    .then((response) => {
      if (disposed || !response.ok) return;
      peek.dataset.video = "ready";
      peek.addEventListener("click", open);
      document.addEventListener("keydown", onKey);
    })
    .catch(() => {
      /* pas de fichier, pas de promesse : l'aperçu reste un lien */
    });

  return () => {
    disposed = true;
    shut();
    peek.removeEventListener("click", open);
    document.removeEventListener("keydown", onKey);
    delete peek.dataset.video;
  };
}
