"use client";

import { useSite } from "@/lib/site-state";

/* The sky over the water. Three of them, one shown at a time.

   Day and night are the reader's own choice. Dusk is not: it follows the
   accent, which the page already moves from cyan to amber as it stops talking
   about machines and starts talking about people. The sky going over with it
   is that same idea said once more, in the largest thing on the screen.

   All three are mounted and crossfaded rather than swapped, because swapping a
   background image is a flash of nothing while the next one decodes. They are
   90–180 KB each; the two that are not showing cost their download once. */
export default function Sky() {
  const { sky, accent } = useSite();

  // Dusk only belongs to the night. In daylight, amber sections keep the day.
  const showing = sky === "day" ? "day" : accent === "ember" ? "dusk" : "night";

  return (
    <div className="sky" aria-hidden="true">
      <span className="sky-plate" data-plate="day" data-on={showing === "day"} />
      <span className="sky-plate" data-plate="night" data-on={showing === "night"} />
      <span className="sky-plate" data-plate="dusk" data-on={showing === "dusk"} />
    </div>
  );
}
