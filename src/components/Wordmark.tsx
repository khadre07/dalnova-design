"use client";

import { accentHex, useSite } from "@/lib/site-state";

/* Dalnova's own mark, lifted from the company deck and cut off its navy
   backing so it sits on this page's ground rather than on a rectangle of its
   own. What used to be here was a hexagon I drew — a good mark for the page,
   and the wrong one for the company.

   The mark is not recoloured with the section accent the way the rest of the
   page is: its cyan is the brand's, and it happens to sit within a few degrees
   of the site's own. Only the halo behind it follows the accent, which leaves
   the logo itself untouched.

   Two files, because the wordmark is white type: on a pale ground half the
   name simply disappears. The daylight copy inks the grey parts and leaves the
   cyan alone — recolouring the whole mark with a filter would have taken the
   brand's own blue with it. */
export default function Wordmark({ height = 42 }: { height?: number }) {
  const { accent, sky } = useSite();
  const hex = accentHex(accent, sky);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sky === "day" ? "/brand/dalnova-day.webp" : "/brand/dalnova.webp"}
      alt="Dalnova Technologies"
      height={height}
      style={{
        height,
        width: "auto",
        transition: "filter 600ms var(--ease-out)",
        filter: `drop-shadow(0 0 10px ${hex}33)`,
      }}
    />
  );
}
