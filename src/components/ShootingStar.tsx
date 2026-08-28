"use client";

import { useEffect, useRef, useState } from "react";
import { onArrival } from "@/lib/cue";

/* The mark, drawn in the air behind him.

   Dalnova's own logo is an arc that sweeps up and finishes on a four-point
   star. This is that shape put in motion: the arc is drawn, and the star
   catches at the end of it. A generic meteor would have been decoration; this
   is the company's own mark, arriving.

   It follows him rather than running on its own clock — one comes over every
   time he comes up out of the water. */

/** How long after he arrives the arc begins. Long enough that the two read as
 *  one thing following another rather than as two things at once. */
const AFTER = 620;

export default function ShootingStar() {
  const [run, setRun] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stop = onArrival(() => {
      window.clearTimeout(timer.current);
      // A new key restarts the animation; re-running keyframes on the same
      // element needs the node replaced or the animation removed and re-added.
      timer.current = window.setTimeout(() => setRun((n) => n + 1), AFTER);
    });

    return () => {
      stop();
      window.clearTimeout(timer.current);
    };
  }, []);

  if (run === 0) return null;

  return (
    <svg
      key={run}
      className="star"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* pathLength normalises the curve to 100 whatever its real length, so
          the dash below travels it once regardless of the stage's shape. */}
      <path
        className="star-trail"
        d="M -14 44 C 14 20, 50 9, 104 19"
        pathLength={100}
        fill="none"
        stroke="#35d2ff"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* The four-point star the arc ends on, in the logo's own proportion:
          long on the horizontal, short on the vertical. */}
      <g className="star-spark" transform="translate(78 14)">
        <path
          d="M0 -7 L1.5 -1.5 L8 0 L1.5 1.5 L0 7 L-1.5 1.5 L-8 0 L-1.5 -1.5 Z"
          fill="#dff4ff"
        />
      </g>
    </svg>
  );
}
