"use client";

import { useEffect, useState } from "react";
import { useAccentZone, useSite } from "@/lib/site-state";

export default function Hero() {
  const { t } = useSite();
  const ref = useAccentZone("arc");
  const [ready, setReady] = useState(false);

  // One orchestrated entrance on load. Scroll reveals take over below the fold.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Stagger index only. Whether the line is hidden at all is decided in CSS,
  // gated on scripting being available.
  const line = (i: number) => ({ "--i": i }) as React.CSSProperties;

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="top"
      data-ready={ready}
      className="hero relative flex min-h-[100svh] flex-col justify-center pt-28 pb-16 lg:min-h-screen lg:pb-24"
    >
      <p className="t-mono hero-in" style={line(0)}>
        <span className="mr-3 inline-block h-px w-8 translate-y-[-4px] bg-[#40454b]" />
        {t.hero.eyebrow}
      </p>

      <h1 className="t-display t-display-xl mt-6">
        {t.hero.title.map((row, i) => (
          <span key={row} className="block overflow-hidden">
            <span className="block hero-in" style={line(i + 1)}>
              {row}
            </span>
          </span>
        ))}
      </h1>

      <p className="t-lede hero-in mt-7 max-w-[46ch]" style={line(4)}>
        {t.hero.lede}
      </p>

      <div className="hero-in mt-10 flex flex-wrap items-center gap-3" style={line(5)}>
        <a href="#contact" className="btn btn-primary">
          {t.hero.ctaPrimary}
          <Arrow />
        </a>
        <a href="#preuves" className="btn btn-ghost">
          {t.hero.ctaSecondary}
        </a>
      </div>

      {/* The readings are the same ones the contract commits to, so the HUD is
          reporting something true rather than decorating the hero. */}
      <dl
        className="hairline ticks hero-in relative mt-14 max-w-[27rem] px-5 py-2"
        style={{ ...line(6), borderRadius: 2, background: "rgba(11, 17, 23, 0.72)" }}
      >
        {t.telemetry.map((row) => (
          <div key={row.label} className="hud-row">
            <dt className="t-mono">{row.label}</dt>
            <dd className="font-mono text-[0.8125rem] tracking-tight text-[#dcebee]">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="t-mono hero-in mt-12 hidden items-center gap-3 lg:flex" style={line(7)}>
        <span className="scroll-tick" aria-hidden="true" />
        {t.hero.scrollHint}
      </p>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden="true">
      <path d="M0 4.5h11M7.6 1 11.4 4.5 7.6 8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
