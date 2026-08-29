"use client";

import Stage from "./Stage";

/* The fixed layers behind everything: the dot field, the figure, and the scrim
   that keeps body text readable over it.

   The figure's presence is driven by the section on screen rather than being
   constant. It was staged for the hero, and below the hero it was still
   standing there at full size behind sections that had nothing to do with it —
   the largest surface on the page doing the least work. Sections that take the
   full width push it back; sections that keep to the left column bring it
   forward again. */
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="grid-field absolute inset-0 opacity-[0.5]" aria-hidden="true" />

      <div
        className="mx-auto flex h-full max-w-[1560px] justify-end"
        style={{ paddingInline: "var(--shell-x)" }}
      >
        {/* --presence is written onto <html> by the scroll loop and inherits
            down to here, so the figure never costs a React render. */}
        <div className="stage-slot relative h-full w-full lg:w-[47%]">
          <Stage />

          {/* Scripting off: <Stage /> renders nothing at all until it has probed
              for a model, so the fallback has to be server markup that is
              already on the page. */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/robot.webp"
              alt=""
              className="absolute inset-0 z-10 m-auto h-[88%] w-auto max-w-none object-contain"
            />
          </noscript>
        </div>
      </div>

      {/* On narrow screens the figure sits behind the copy, so the left edge is
          darkened enough to keep body text at AA contrast. */}
      <div className="stage-scrim absolute inset-0" aria-hidden="true" />
    </div>
  );
}
