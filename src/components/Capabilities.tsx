"use client";

import { ACCENT_HEX, type Capability } from "@/lib/content";
import { useAccentZone, useRecessZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

export default function Capabilities() {
  const { t } = useSite();
  // Full-width band: the figure withdraws as this fills the screen.
  const band = useRecessZone();

  return (
    <section
      ref={band as React.RefObject<HTMLElement>}
      id="services"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <SectionHead
        conduit={0}
        eyebrow={t.capabilities.eyebrow}
        title={t.capabilities.title}
        lede={t.capabilities.lede}
      />

      <div
        className="mt-14 grid gap-px lg:grid-cols-2"
        style={{ background: "rgba(42, 50, 56, 0.55)" }}
      >
        {t.capabilities.items.map((item, i) => (
          <Module key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Apart from the grid, and marked differently: the rail is hatched
          rather than solid, and it carries a word instead of a service code.
          A prospect has to be able to tell at a glance what can be bought
          today from what is still being worked on. */}
      <Reveal delay={120}>
        <article className="research mt-px">
          <span className="research-rail" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="t-mono research-label">{t.capabilities.research.label}</span>
            <h3 className="t-display t-display-sm">{t.capabilities.research.title}</h3>
          </div>
          <p className="t-body mt-4 max-w-[62ch] text-[0.9375rem]">
            {t.capabilities.research.body}
          </p>
        </article>
      </Reveal>
    </section>
  );
}

function Module({ item, index }: { item: Capability; index: number }) {
  // Each module claims the robot's rim light while it holds the viewport, so
  // the figure turns amber exactly when the page starts talking about people.
  const ref = useAccentZone(item.accent);
  const hex = ACCENT_HEX[item.accent];

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      id={item.id}
      className="module group relative scroll-mt-24 bg-[var(--panel)] px-6 py-9 sm:px-8 lg:py-11"
    >
      <span
        className="module-rail"
        style={{ background: `linear-gradient(180deg, ${hex}, transparent)` }}
        aria-hidden="true"
      />

      <Reveal delay={index * 40}>
        <div className="flex items-baseline gap-4">
          <span className="t-mono" style={{ color: hex, letterSpacing: "0.2em" }}>
            {item.code}
          </span>
          <h3 className="t-display t-display-sm">{item.title}</h3>
        </div>

        <p className="t-body mt-4 max-w-[52ch] text-[0.9375rem]">{item.lede}</p>

        <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {item.points.map((point) => (
            <li key={point} className="flex gap-3 text-[0.8125rem] leading-relaxed text-[var(--ink-dim)]">
              <span
                className="mt-[0.55em] h-px w-3 shrink-0"
                style={{ background: hex, opacity: 0.7 }}
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
    </article>
  );
}
