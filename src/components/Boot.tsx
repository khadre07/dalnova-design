"use client";

import { useEffect, useRef, useState } from "react";
import { onProgress, onReady } from "@/lib/boot";

/* The boot screen, over the page until the figure is up.

   Adapted from the ThreeUI uplink sequence: the readout plate with its cut
   corners and corner brackets, the bank of skewed ticks with a heavier mark
   every eighth, the haze widening behind the lit run, the corner markers with
   their turning diamonds, and the phase line underneath.

   Two things are not adapted. The palette is the site's, not the original's
   green. And the number is real: the original runs a scripted eight-second
   timeline of invented percentages and then loops, which is a decoration in
   the shape of a progress bar. This one counts the figure's own bytes.

   It never appears for a cached load: nothing is shown for the first fifth of
   a second, so a page that is already warm goes straight to itself rather than
   flashing a loading screen at someone who is not waiting. */

const TICKS = 48;
const MARK_EVERY = 8;
/** Below this, the load was instant and the screen is never shown. */
const SHOW_AFTER = 220;

const PHASES: [number, string][] = [
  [0, "INITIALISATION"],
  [18, "LIAISON ÉTABLIE"],
  [55, "TRANSFERT DE LA SCÈNE"],
  [92, "COMPOSITION"],
  [100, "PRÊT"],
];

export default function Boot() {
  const [pct, setPct] = useState(0);
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    // Held back, so a warm cache never sees this at all.
    timer.current = window.setTimeout(() => setShow(true), SHOW_AFTER);

    const offProgress = onProgress((loaded, total) => {
      if (total > 0) setPct(Math.min(99, (loaded / total) * 100));
    });
    const offReady = onReady(() => {
      window.clearTimeout(timer.current);
      setPct(100);
      setLeaving(true);
    });

    return () => {
      window.clearTimeout(timer.current);
      offProgress();
      offReady();
    };
  }, []);

  // Never mounted at all once it has gone: it covers the page, and a covered
  // page that has finished loading is a page nobody can use.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setGone(true), 620);
    return () => window.clearTimeout(id);
  }, [leaving]);

  if (gone || (!show && !leaving)) return null;

  const lit = Math.round((pct / 100) * TICKS);
  let phase = PHASES[0][1];
  for (const [at, label] of PHASES) if (pct >= at) phase = label;

  return (
    <div className="boot" data-leaving={leaving} role="status" aria-live="polite">
      <div className="boot-rig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="boot-mark" src="/brand/dalnova.webp" alt="Dalnova Technologies" />

        <div className="boot-plate">
          <span className="boot-brk" data-at="tr" aria-hidden="true" />
          <span className="boot-brk" data-at="bl" aria-hidden="true" />
          <p className="boot-num">
            {Math.round(pct)}
            <span>%</span>
          </p>
        </div>

        <div className="boot-bar" aria-hidden="true">
          <span className="boot-haze" style={{ "--lit": `${(lit / TICKS) * 100}%` } as React.CSSProperties} />
          {Array.from({ length: TICKS }, (_, i) => (
            <i
              key={i}
              className="boot-tick"
              data-on={i < lit}
              data-mark={(i + 1) % MARK_EVERY === 0}
            />
          ))}
        </div>

        <p className="boot-phase t-mono">{phase}</p>

        {/* The four corner markers from the source, each turning on its own. */}
        {(["tl", "tr", "bl", "br"] as const).map((at, i) => (
          <span key={at} className="boot-mark-corner" data-at={at} aria-hidden="true">
            <i style={{ animationDelay: `${i * 0.5}s` }} />
          </span>
        ))}
      </div>
    </div>
  );
}
