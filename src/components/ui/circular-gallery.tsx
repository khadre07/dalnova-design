"use client";

import React, { useEffect, useRef, useState, type HTMLAttributes } from "react";

/* A carousel of plates turning on a vertical axis.

   Adapted from the circular gallery. What is taken is the whole of its idea:
   plates seated at equal angles round a circle, each pushed out along its own
   radius with translateZ, the ring turned by scroll progress, and the far half
   faded so the near half reads as near. All of it is CSS 3D — no canvas, no
   WebGL, which on this page matters more than usual: there is already a robot
   and a water surface holding two contexts, and a third would be the one that
   breaks the frame rate.

   Four things are not taken.

   Its scroll source. The original reads window.scrollY against the height of
   the whole document, so the ring's position depends on how long the page
   happens to be and every other section scrolls it too. Here it is driven by
   this section's own passage through the viewport, so a full turn is this band
   and nothing else.

   Its auto-rotation. It spins whether or not you are looking, on a page whose
   figure now deliberately holds still unless addressed. Motion that nobody
   asked for is what the rest of this page has been spending the day removing.

   Its `NodeJS.Timeout`. That is a Node type in a browser component; it
   typechecks only because @types/node is present, and it is wrong.

   Its keyboard story, which is that there isn't one. A ring you can only reach
   by scrolling is a ring that is not reachable at all for anyone using a
   keyboard, so each plate is a real button and the list under it stays. */

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
  w: number;
  h: number;
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** How far each plate is pushed out from the centre, in pixels. */
  radius?: number;
  /** Opened at full size. */
  onPick: (index: number) => void;
  /** What the button says it will do. */
  openLabel: string;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 420, onPick, openLabel, ...props }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const [turn, setTurn] = useState(0);

    useEffect(() => {
      const node = hostRef.current;
      if (!node) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      let queued = 0;
      const measure = () => {
        queued = 0;
        const box = node.getBoundingClientRect();
        /* This section's own passage, not the document's.

           Zero when the band's top reaches the bottom of the screen, one when
           its bottom leaves the top — so the ring makes exactly one turn while
           the section crosses, whatever else is on the page and however long
           the page grows. */
        const span = box.height + window.innerHeight;
        const travelled = window.innerHeight - box.top;
        const progress = Math.max(0, Math.min(1, travelled / span));
        setTurn(progress * 360);
      };

      const schedule = () => {
        if (!queued) queued = window.requestAnimationFrame(measure);
      };

      measure();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      return () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        if (queued) window.cancelAnimationFrame(queued);
      };
    }, []);

    const step = 360 / Math.max(1, items.length);

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("carousel", className)}
        {...props}
      >
        <div className="carousel-ring" style={{ transform: `rotateY(${turn}deg)` }}>
          {items.map((item, i) => {
            const seat = i * step;
            // How far this plate has turned away from facing us, 0 to 180.
            const away = Math.abs((((seat + turn) % 360) + 540) % 360) - 180;
            const facing = 1 - Math.abs(away) / 180;

            return (
              <div
                key={item.src}
                className="carousel-seat"
                style={{
                  transform: `rotateY(${seat}deg) translateZ(${radius}px)`,
                  // Never to nothing: a plate that vanishes at the back reads
                  // as a plate that failed to load rather than one turned away.
                  opacity: 0.28 + facing * 0.72,
                  // The far half goes behind in the stack as well as in space,
                  // so a browser that flattens the transform still gets the
                  // order right.
                  zIndex: Math.round(facing * 100),
                }}
              >
                <button
                  type="button"
                  className="carousel-plate"
                  onClick={() => onPick(i)}
                  aria-label={`${openLabel} — ${item.caption}`}
                  // Behind the ring, a button is a button you cannot see and
                  // would be clicking blind.
                  tabIndex={facing > 0.6 ? 0 : -1}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.alt}
                    width={item.w}
                    height={item.h}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                  <span className="carousel-cap">
                    <span className="carousel-cap-n t-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="carousel-cap-title">{item.caption}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
