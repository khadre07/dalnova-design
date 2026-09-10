"use client";

/* Le contingent : la figure, en rang, qui défile.

   Une image, pas des scènes. La figure du héros est une scène Spline tenant
   son propre contexte WebGL, et ce projet prévient qu'un troisième contexte
   serait celui qui casse la fréquence d'images — en dupliquer douze serait en
   ouvrir douze. Le robot a donc été rendu une fois, capturé au navigateur
   depuis la scène vivante et découpé sur son alpha ; ce qui défile ici sont
   des copies de cette image, qui ne coûtent rien.

   En rang, et c'est tout le propos. J'avais d'abord fait varier les tailles et
   les hauteurs pour donner une profondeur de champ : ce n'était pas un
   contingent, c'était une foule. Une troupe se reconnaît à ce que rien ne la
   distingue d'une figure à l'autre — même taille, même ligne, même écart.

   Et le pas est à l'unisson. Un décalage de phase d'une figure à l'autre
   donnerait une vague, ce qui est joli et n'est pas militaire. Tous montent et
   redescendent ensemble ; c'est la cadence qui fait la troupe.

   Trois exemplaires de la rangée, comme le registre des partenaires, pour que
   la boucle n'ait pas de couture. */

/** Une rangée pleine. Assez de figures pour que la ligne dépasse l'écran le
 *  plus large, sinon la boucle montre son vide au bout du rang. */
const PAR_RANG = 12;

function Rang({ cache }: { cache?: boolean }) {
  return (
    <ul className="fleet-row" aria-hidden={cache ? "true" : undefined}>
      {Array.from({ length: PAR_RANG }, (_, i) => (
        <li key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/robot/figure.webp"
            alt=""
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
      <Rang />
      <Rang cache />
      <Rang cache />
    </div>
  );
}
