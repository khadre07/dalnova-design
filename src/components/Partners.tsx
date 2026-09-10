"use client";

import { useSite } from "@/lib/site-state";
import { CircularGallery } from "./ui/circular-gallery";

/* Les partenaires, sur l'anneau.

   Ils défilaient en boucle sur un rail. L'anneau est le même dispositif que
   les réalisations emploient déjà — des plaques assises à angles égaux,
   poussées sur leur rayon, la moitié lointaine estompée pour que la proche se
   lise comme proche — et c'est du 3D en CSS, pas un troisième contexte WebGL.
   Le commentaire de ce composant le dit mieux que moi : il y a déjà un robot
   et une surface d'eau, et un troisième contexte serait celui qui casse la
   fréquence d'images.

   Il tourne au passage de la section et non tout seul, donc le mouvement
   répond au lecteur au lieu de s'imposer à lui.

   Ce qui reste de l'ancien rail : la plaque claire derrière chaque marque.
   Vérifié à l'écran plutôt que supposé — sur fond sombre, E4Impact perd la
   moitié de son mot, qui est dessiné en presque noir, et ISRA — BAME arrive
   avec un fond blanc opaque qui se lirait comme un rectangle.

   Et la liste sous l'anneau, qui n'est pas une redite. Un anneau cache la
   moitié de ce qu'il porte : la liste est par où l'on atteint un partenaire
   au clavier, et par où on l'entend quand la page est lue à voix haute. */
export default function Partners() {
  const { t } = useSite();

  const ouvrir = (index: number) => {
    const partenaire = t.partners.items[index];
    if (partenaire) window.open(partenaire.href, "_blank", "noreferrer,noopener");
  };

  return (
    <section className="partners" aria-labelledby="partners-label">
      <p className="t-mono partners-label" id="partners-label">
        {t.partners.label}
      </p>

      <CircularGallery
        className="carousel--partners"
        items={t.partners.items.map((partenaire) => ({
          src: partenaire.logo,
          alt: partenaire.name,
          caption: partenaire.place,
          w: partenaire.w,
          h: partenaire.h,
        }))}
        radius={360}
        onPick={ouvrir}
        openLabel={t.partners.label}
      />

      <ul className="partner-list">
        {t.partners.items.map((partenaire) => (
          <li key={partenaire.name}>
            <a
              className="partner-list-link"
              href={partenaire.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="partner-list-name">{partenaire.name}</span>
              <span className="partner-list-place t-mono">{partenaire.place}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
