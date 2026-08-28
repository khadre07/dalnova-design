"use client";

import { useAccentZone, useRecessZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

/* Who the work is for. Named sectors rather than statistics: Dalnova publishes
   no service-level figures, and the numbers that used to sit here were mine.
   A list of trades a prospect can find themselves in is worth more than a
   percentage they cannot check. */
export default function Sectors() {
  const { t } = useSite();
  const accentRef = useAccentZone("arc");
  // Full-width band: the figure withdraws as this fills the screen.
  const bandRef = useRecessZone();

  return (
    <section
      ref={(node) => {
        accentRef.current = node;
        bandRef.current = node;
      }}
      id="secteurs"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <SectionHead
        conduit={2}
        eyebrow={t.sectors.eyebrow}
        title={t.sectors.title}
        lede={t.sectors.lede}
      />

      <div className="mt-12 grid grid-cols-2 gap-px bg-[#2a3238] lg:grid-cols-4">
        {/* The opaque cell sits outside Reveal. Inside it, the hairline grid
            colour shows through while the cell is still fading in and the whole
            block reads as one grey slab. */}
        {t.sectors.items.map((sector, i) => (
          <div key={sector} className="bg-[#080d12] px-5 py-7">
            <Reveal delay={i * 45}>
              <p className="sector-index">{String(i + 1).padStart(2, "0")}</p>
              <p className="t-display t-display-sm mt-3">{sector}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
