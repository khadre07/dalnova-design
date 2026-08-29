"use client";

import { useEffect, useRef } from "react";
import { CHARGE_MS, onCharge, replay } from "@/lib/charge";

/* Where the light leaves him, as a fraction of his own box. Measured from the
   render's emissive pixels rather than eyeballed — every conduit is anchored
   to it. */
export const REACTOR = { x: 53, y: 29 };

/* One conduit per section, in SVG user units on a 0..100 box that maps onto
   the figure. Control points are ordered top to bottom, matching the order the
   sections appear down the page. */
export const CONDUITS = [
  { c1: [30, REACTOR.y - 4], c2: [10, 14], end: [-70, 9] },
  { c1: [26, REACTOR.y + 2], c2: [6, 36], end: [-70, 34] },
  { c1: [28, REACTOR.y + 8], c2: [8, 62], end: [-70, 68] },
  { c1: [34, REACTOR.y + 14], c2: [14, 88], end: [-70, 96] },
] as const;

export type Box = { left: number; top: number; width: number; height: number };

/* Light conduits leaving the reactor. This is the borrowed idea from the
   reference shot, turned to our purpose: the robot is the hub, and the four
   disciplines are what it feeds. */
export function Conduits({ box, accent, reduced }: { box: Box; accent: string; reduced: boolean }) {
  const pulses = useRef<(SVGPathElement | null)[]>([]);

  /* Quiet until a section calls. The conduits used to pulse on an endless
     five-second loop, which made the light mean nothing; now a charge only
     ever runs because a section asked for one, and the copy it is carrying
     appears when it lands. */
  useEffect(() => {
    if (reduced) return;
    return onCharge((index) => {
      replay(pulses.current[index % CONDUITS.length], `conduit-fire ${CHARGE_MS}ms linear`);
    });
  }, [reduced]);

  const paths = CONDUITS.map(
    (c) =>
      `M ${REACTOR.x} ${REACTOR.y} C ${c.c1[0]} ${c.c1[1]}, ${c.c2[0]} ${c.c2[1]}, ${c.end[0]} ${c.end[1]}`,
  );

  return (
    <svg
      className="pointer-events-none absolute z-0 overflow-visible"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="conduit-fade" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
          <stop offset="38%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {paths.map((d, i) => (
        <g key={d}>
          <path
            d={d}
            fill="none"
            stroke="url(#conduit-fade)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {!reduced ? (
            /* Two travellers on the same wire. The faint one runs forever, so
               the conduits are never dead metal; the bright one runs only when
               a section asks for it. Same path, same normalisation, different
               errand.

               pathLength normalises the curve to 200 units whatever its real
               length, so one dash offset is exactly one traversal — the same
               timing on every conduit and at every window size. */
            <>
              <path
                className="conduit-flow"
                d={d}
                pathLength={200}
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${i * 1.7}s` }}
              />
              <path
                ref={(node) => {
                  pulses.current[i] = node;
                }}
                className="conduit-pulse"
                d={d}
                pathLength={200}
                fill="none"
                stroke={accent}
                strokeWidth="2.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </g>
      ))}

      <circle
        className={reduced ? undefined : "conduit-core"}
        cx={REACTOR.x}
        cy={REACTOR.y}
        r="1.6"
        fill={accent}
        opacity="0.55"
      />
    </svg>
  );
}
