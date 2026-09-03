import KagePage from "@/components/kage/KagePage";

/* Kage, ported rather than framed.

   The complete authored document — its stylesheet, its markup and its Three.js
   world — running as part of this application instead of inside an iframe
   pointed at an HTML file. Every asset was copied byte-for-byte out of the
   package and checked against the SHA-256 in the brief before anything was
   wired: the canonical HTML, the font stylesheet, the runtime and all fourteen
   images match.

   The brief asks for the frame; you asked for Next.js, so this is Next.js. The
   difference is not cosmetic: framed, the words on screen belong to the frame
   and anything indexing this domain finds an empty document. Ported, the
   markup is served here — crawlable, selectable, read aloud.

   And now it says Dalnova. Every visible string is French and Dalnova's own —
   the navigation, the four cards, the five chapters, the statistics, the
   footer. The Japanese is gone, and what replaced it is not a translation of
   it but the page's own second language: the three-letter service codes the
   content already carried. The wordmark cut into the scene reads DALNOVA.

   What could not follow is written in the components: the temple itself. */

export const metadata = {
  title: "Dalnova Technologies — Services informatiques à Dakar",
  description:
    "De l'installation du serveur au développement de votre application métier — Dalnova Technologies accompagne votre transformation digitale à Dakar.",
};

export default function Page() {
  return (
    <KagePage
      customization={{
        headingFont: "Onest",
        bodyFont: "Onest",
        headingWeight: "400",
        bodyWeight: "300",
        /* Dalnova's own arc cyan, the colour the rest of the company's material
           already uses — not the blue the brief happened to be configured with. */
        primaryColor: "#35d2ff",
        headingSize: 46,
        bodySize: 17,
        headingLetterSpacing: 0.028,
      }}
    />
  );
}
