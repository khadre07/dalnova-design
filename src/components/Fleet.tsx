"use client";

/* La flotte : le robot, en petit et en nombre, qui traverse la page.

   Une image, pas des scènes. La figure du héros est une scène Spline tenant
   son propre contexte WebGL, et ce fichier même prévient qu'un troisième
   contexte serait celui qui casse la fréquence d'images — en dupliquer six
   serait en ouvrir six. Le robot a donc été rendu une fois, capturé au
   navigateur depuis la scène vivante et découpé sur son alpha ; ce qui défile
   ici sont des copies de cette image, qui ne coûtent rien.

   Le même dispositif que le registre des partenaires, et pour les mêmes
   raisons : trois exemplaires de la rangée pour que la boucle n'ait pas de
   couture, et l'arrêt au survol, parce qu'une bande qui bouge pendant qu'on
   la regarde est une bande qu'on ne regarde pas.

   Les tailles sont inégales et les hauteurs décalées. Une file de figures
   identiques et alignées se lit comme un motif de papier peint ; inégale, elle
   se lit comme une profondeur de champ. */

const FIGURES = [
  { h: 96, y: 0, o: 0.9 },
  { h: 62, y: 18, o: 0.55 },
  { h: 128, y: -12, o: 1 },
  { h: 74, y: 26, o: 0.66 },
  { h: 54, y: 6, o: 0.45 },
  { h: 108, y: -4, o: 0.82 },
  { h: 68, y: 22, o: 0.6 },
  { h: 88, y: 2, o: 0.74 },
];

function Rangee({ cache }: { cache?: boolean }) {
  return (
    <ul className="fleet-row" aria-hidden={cache ? "true" : undefined}>
      {FIGURES.map((f, i) => (
        <li key={i} style={{ transform: `translateY(${f.y}px)`, opacity: f.o }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/robot/figure.webp"
            alt=""
            height={f.h}
            style={{ height: `${f.h}px` }}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </li>
      ))}
    </ul>
  );
}

export default function Fleet() {
  return (
    <div className="fleet" aria-hidden="true">
      <Rangee />
      <Rangee cache />
      <Rangee cache />
    </div>
  );
}
