"use client";

import { useAccentZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

export default function Method() {
  const { t } = useSite();
  const ref = useAccentZone("arc");

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="methode"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <SectionHead conduit={1} eyebrow={t.method.eyebrow} title={t.method.title} lede={t.method.lede} />

      {/* Numbered because these steps genuinely run in order: nothing is
          deployed before it has been designed, and nothing is designed before
          the need has been understood. */}
      <ol className="mt-14 border-l border-[var(--line)]">
        {t.method.steps.map((step, i) => (
          <li key={step.n} className="relative pl-7 pb-11 last:pb-0 sm:pl-9">
            <span className="step-node" aria-hidden="true" />
            <Reveal delay={i * 70}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="t-mono" style={{ color: "var(--accent)" }}>
                  {step.n}
                </span>
                <h3 className="t-display t-display-sm">{step.title}</h3>
              </div>
              <p className="t-body mt-3 max-w-[54ch] text-[0.9375rem]">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
