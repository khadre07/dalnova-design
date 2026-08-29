"use client";

import { useEffect, useRef, useState } from "react";

/* The gauge, as a bank of ticks that light one after another.

   Adapted from the ThreeUI uplink loader: skewed ticks, a heavier mark every
   few, a lit head that flares as it arrives, and a haze that widens behind the
   lit run. What is not adapted is its purpose. That one loops for ever as a
   loading state; this counts a real thing — the eight fields Dalnova covers —
   arrives at eight, and stops. A bar that keeps filling and emptying beside a
   figure that never changes would say the figure was not to be trusted.

   Ticks rather than a solid fill because the quantity is discrete: eight
   fields is eight things, and a continuous bar draws a fraction of a service.

   Runs once when the block arrives, at the same moment the copy does. */

/** Ticks per field, so the run reads as a scale rather than as eight blocks. */
const PER_UNIT = 7;
/** How long the whole run takes, and the head's dwell on each tick. */
const RUN_MS = 1150;

export default function Uplink({
  value,
  max,
  label,
  ready,
}: {
  /** How many units are lit. */
  value: number;
  max: number;
  /** Read out to assistive technology, which gets no ticks. */
  label: string;
  /** The block has arrived; start the run. */
  ready: boolean;
}) {
  const total = Math.max(1, Math.round(max * PER_UNIT));
  const target = Math.round((value / max) * total);
  const [lit, setLit] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!ready) return;

    /* One frame either way. Under reduced motion the first frame is also the
       last, which lands the scale on its reading without the run — and without
       a setState in the effect body, which would cascade a render. */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const step = (now: number) => {
      const t = still ? 1 : Math.min(1, (now - started) / RUN_MS);
      /* Eased out, and stepped: the head slows as it arrives rather than
         stopping dead, but it still lands on whole ticks — a scale that
         animates through fractions of its own divisions is not a scale. */
      const eased = 1 - Math.pow(1 - t, 2.1);
      setLit(Math.round(eased * target));
      if (t < 1) raf.current = window.requestAnimationFrame(step);
    };
    raf.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf.current);
  }, [ready, target]);

  return (
    <div
      className="uplink"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      {/* The haze behind the lit run, widening with it. */}
      <span
        className="uplink-haze"
        aria-hidden="true"
        style={{ "--lit": `${(lit / total) * 100}%` } as React.CSSProperties}
      />

      <span className="uplink-ticks" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i
            key={i}
            className="uplink-tick"
            data-on={i < lit}
            // Heavier every seventh, which is one per field.
            data-mark={(i + 1) % PER_UNIT === 0}
            // The one that has just landed carries the flare.
            data-head={i === lit - 1}
          />
        ))}
      </span>
    </div>
  );
}
