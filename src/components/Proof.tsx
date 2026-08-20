"use client";

import { useAccentZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

export default function Proof() {
  const { t } = useSite();
  const ref = useAccentZone("arc");

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="preuves"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <SectionHead eyebrow={t.proof.eyebrow} title={t.proof.title} />

      <div className="mt-12 grid grid-cols-2 gap-px bg-[#2a3238] lg:grid-cols-4">
        {/* The opaque cell sits outside Reveal. Inside it, the hairline grid
            colour shows through while the cell is still faded in and the whole
            block reads as one grey slab. */}
        {t.proof.stats.map((stat, i) => (
          <div key={stat.label} className="bg-[#080d12] px-5 py-8">
            <Reveal delay={i * 55}>
              <p className="flex items-baseline gap-1">
                <span className="stat-value">{stat.value}</span>
                {stat.unit ? <span className="stat-unit">{stat.unit}</span> : null}
              </p>
              <p className="t-mono mt-3 leading-relaxed" style={{ letterSpacing: "0.13em" }}>
                {stat.label}
              </p>
            </Reveal>
          </div>
        ))}
      </div>

      <Reveal delay={200}>
        <p className="t-body mt-6 max-w-[56ch] text-[0.8125rem] leading-relaxed">{t.proof.note}</p>
      </Reveal>
    </section>
  );
}
