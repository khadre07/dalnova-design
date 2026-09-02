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

   One thing the port does not change, because the brief forbids it: this is
   Kage. Its title is "Where stillness reveals the unseen" and its subject is a
   temple in Kyoto. Making it say Dalnova is a separate job — and now a
   possible one, which it was not while the page lived behind a frame. */

export const metadata = {
  title: "Kage — Where stillness reveals the unseen",
};

export default function Page() {
  return (
    <KagePage
      customization={{
        headingFont: "Onest",
        bodyFont: "Onest",
        headingWeight: "400",
        bodyWeight: "300",
        primaryColor: "#0056d6",
        headingSize: 46,
        bodySize: 17,
        headingLetterSpacing: 0.028,
      }}
    />
  );
}
