"use client";

import { useCallback, useRef } from "react";
import { useAccentZone, useRecessZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

/* A gallery you scroll, not one that scrolls itself.

   Native overflow with scroll snapping, so a trackpad, a touch screen, a
   keyboard and a screen reader all work without a line of code from us. The
   buttons only nudge the same scroll container. No autoplay: a carousel that
   moves on its own takes the reader's place in the queue and is the single
   most complained-about pattern on the web. */
export default function Gallery() {
  const { t } = useSite();
  const accentRef = useAccentZone("arc");
  const bandRef = useRecessZone();
  const trackRef = useRef<HTMLDivElement>(null);

  const nudge = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // One slide plus its gap, measured rather than assumed.
    const slide = track.querySelector<HTMLElement>("[data-slide]");
    const step = slide ? slide.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  return (
    <section
      ref={(node) => {
        accentRef.current = node;
        bandRef.current = node;
      }}
      id="galerie"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          conduit={4}
          eyebrow={t.gallery.eyebrow}
          title={t.gallery.title}
          lede={t.gallery.lede}
        />

        <Reveal delay={140} className="gallery-controls">
          <button type="button" className="gallery-arrow" onClick={() => nudge(-1)}>
            <span className="sr-only">{t.gallery.previous}</span>
            <Chevron direction="left" />
          </button>
          <button type="button" className="gallery-arrow" onClick={() => nudge(1)}>
            <span className="sr-only">{t.gallery.next}</span>
            <Chevron direction="right" />
          </button>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        className="gallery-track mt-12"
        tabIndex={0}
        role="region"
        aria-label={t.gallery.title}
      >
        {t.gallery.items.map((item, i) => (
          <figure key={item.caption} data-slide className="gallery-slide">
            <div className="gallery-frame">
              {item.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
              ) : (
                /* Nothing has been dropped in yet, and the frame says so
                   rather than pretending. */
                <span className="gallery-empty t-mono">
                  {t.gallery.emptyLabel}
                  <b>{String(i + 1).padStart(2, "0")}</b>
                </span>
              )}
            </div>
            <figcaption className="gallery-caption t-mono">{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden="true">
      <path
        d="M0 4.5h11M7.6 1 11.4 4.5 7.6 8"
        stroke="currentColor"
        strokeWidth="1.4"
        transform={direction === "left" ? "rotate(180 6.5 4.5)" : undefined}
      />
    </svg>
  );
}
