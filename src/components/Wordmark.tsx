"use client";

import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";

/* Dalnova's own mark, lifted from the company deck and cut off its navy
   backing so it sits on this page's ground rather than on a rectangle of its
   own. What used to be here was a hexagon I drew — a good mark for the page,
   and the wrong one for the company.

   The mark is not recoloured with the section accent the way the rest of the
   page is: its cyan is the brand's, and it happens to sit within a few degrees
   of the site's own. Only the halo behind it follows the accent, which leaves
   the logo itself untouched. */
export default function Wordmark({ height = 42 }: { height?: number }) {
  const { accent } = useSite();
  const hex = ACCENT_HEX[accent];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/dalnova.webp"
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
