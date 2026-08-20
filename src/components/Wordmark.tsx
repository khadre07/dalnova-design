"use client";

import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";

/* The mark is the robot's arc reactor reduced to its geometry: a hexagonal
   aperture with one segment open. It picks up whichever accent the current
   section owns, so the logo is part of the same instrument as everything else. */
export default function Wordmark({ size = 26 }: { size?: number }) {
  const { accent } = useSite();
  const hex = ACCENT_HEX[accent];

  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ transition: "filter 600ms var(--ease-out)", filter: `drop-shadow(0 0 7px ${hex}66)` }}
      >
        <path
          d="M16 2.6 27.6 9.3v13.4L16 29.4 4.4 22.7V9.3Z"
          stroke="#3c454c"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M27.6 9.3v13.4L16 29.4 4.4 22.7"
          stroke={hex}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: "stroke 600ms var(--ease-out)" }}
        />
        <circle cx="16" cy="16" r="3.7" fill={hex} opacity="0.9" style={{ transition: "fill 600ms var(--ease-out)" }} />
        <circle cx="16" cy="16" r="6.6" stroke={hex} strokeWidth="1" opacity="0.4" />
      </svg>

      <span className="flex flex-col leading-none">
        <span
          className="t-display"
          style={{ fontSize: "0.95rem", fontVariationSettings: '"wdth" 118', letterSpacing: "0.03em" }}
        >
          Dalnova
        </span>
        <span className="t-mono" style={{ fontSize: "0.5rem", letterSpacing: "0.26em", marginTop: 2 }}>
          Technologies
        </span>
      </span>
    </span>
  );
}
