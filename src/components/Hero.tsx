"use client";

import { useEffect, useState } from "react";
import { onFigure } from "@/lib/cue";
import { useAccentZone, useSite } from "@/lib/site-state";
import Readout from "./Readout";

export default function Hero() {
  const { t } = useSite();
  const ref = useAccentZone("arc");
  const [ready, setReady] = useState(false);

  /* One orchestrated entrance, started by the figure rather than by a timer.

     The copy used to open on a fixed delay while the figure ran on its own
     clock: on a fast machine the left column had finished writing itself
     before he was out of the water. Now the stage says when he has arrived
     and the copy follows, whichever scene is running and however long its
     own opening takes.

     The timer is a ceiling, not the schedule: it only decides how long the
     copy is willing to wait. If the cue never comes at all, a hero that waits
     for it forever is a hero with no words in it. */
  useEffect(() => {
    let done = false;
    const open = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const stop = onFigure(open);
    const timer = window.setTimeout(open, 1200);
    return () => {
      stop();
      window.clearTimeout(timer);
    };
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
        <span className="mr-3 inline-block h-px w-8 translate-y-[-4px] bg-[var(--line-2)]" />
        {t.hero.eyebrow}
      </p>

      <h1 className="t-display t-display-xl mt-6">
        {t.hero.title.map((row, i) => (
          <span key={row} className="line-clip block">
            <span className="hero-line hero-in block" style={line(i + 1)}>
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
        <a href="#services" className="btn btn-ghost">
          {t.hero.ctaSecondary}
        </a>
      </div>

      {/* The commitment read as an instrument rather than as a list: the figure
          at display size with its unit, a gauge placing it against the floor
          the contract guarantees, and the two secondary readings beside it.
          Every number here is one the page already states — the gauge measures
          something real, it is not a decoration shaped like a gauge. */}
      <div className="spec hero-in mt-12 max-w-[30rem]" style={line(6)}>
        <div className="spec-head">
          <p className="t-mono">{t.spec.label}</p>
          <a href="#services" className="spec-link">
            {t.spec.link}
          </a>
        </div>

        <p className="spec-figure">
          <Readout className="spec-value" value={t.spec.value} />
          <span className="spec-slash" aria-hidden="true">
            /
          </span>
          <span className="spec-unit">{t.spec.unit}</span>
        </p>

        <div
          className="spec-gauge"
          role="meter"
          aria-valuemin={t.spec.min}
          aria-valuemax={t.spec.max}
          aria-valuenow={t.spec.now}
          aria-label={t.spec.label}
        >
          {/* Drawn from nothing to its reading. The width lives in a custom
              property so the fill itself can stay a pure CSS transition, timed
              to land just after the block it belongs to has arrived. */}
          <span
            className="spec-gauge-fill"
            style={
              {
                "--fill": `${((t.spec.now - t.spec.min) / (t.spec.max - t.spec.min)) * 100}%`,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="spec-scale" aria-hidden="true">
          <span>{t.spec.floor}</span>
          <span>{t.spec.ceiling}</span>
        </div>

        <dl className="spec-chips">
          {t.spec.chips.map((chip) => (
            <div key={chip.label} className="spec-chip">
              <dt className="t-mono">{chip.label}</dt>
              <dd>
                <Readout className="spec-chip-value" value={chip.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

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
