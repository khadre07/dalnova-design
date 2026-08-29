"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccentZone, useRecessZone, useSite } from "@/lib/site-state";
import GalleryRoom, { type RoomControls } from "./GalleryRoom";
import Lightbox from "./Lightbox";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

/* Two galleries, one at a time.

   The room is the showpiece: the drawings hung in a line, each under its own
   light and over its own reflection, with the camera tracking along the wall
   as the section is scrolled through. It asks for a second WebGL context and a
   GPU, so it appears where both are a fair assumption — a wide screen. Under
   reduced motion it holds on a still frame rather than being replaced.

   On narrow screens, and for anyone without scripting, the flat strip runs
   instead: native scroll snapping, which a trackpad, a touch screen and a
   keyboard all drive for free. Neither is a degraded version of the other;
   they are two ways of showing the same pictures.

   The arrows drive whichever is on. */

type Mode = "probing" | "room" | "flat";

export default function Gallery() {
  const { t } = useSite();
  const accentRef = useAccentZone("arc");
  const bandRef = useRecessZone();
  const trackRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<RoomControls>(null);
  const [mode, setMode] = useState<Mode>("probing");
  /* Which drawing is open at full size, if any. The ribbon and the flat strip
     are two ways of getting here; this is where the work is actually read. */
  const [picked, setPicked] = useState<number | null>(null);

  /* Width decides, not motion preference. Someone who has asked for less
     movement is asking for a calmer page, not a smaller one — the ribbon holds
     on a still frame for them and the arrows still step it, which is the
     authored contract. Falling back to a different gallery entirely would have
     given them less of the site for having a preference set. */
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const sync = () => setMode(wide.matches ? "room" : "flat");
    // Async so the first paint is not a synchronous cascade out of an effect.
    const id = window.setTimeout(sync, 0);
    wide.addEventListener("change", sync);
    return () => {
      window.clearTimeout(id);
      wide.removeEventListener("change", sync);
    };
  }, []);

  const nudge = useCallback((direction: 1 | -1) => {
    if (roomRef.current) {
      roomRef.current.step(direction);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    // One slide plus its gap, measured rather than assumed.
    const slide = track.querySelector<HTMLElement>("[data-slide]");
    const stride = slide ? slide.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: stride * direction, behavior: "smooth" });
  }, []);

  const sources = t.gallery.items.map((item) => item.src);

  return (
    <section
      ref={(node) => {
        accentRef.current = node;
        bandRef.current = node;
      }}
      id="realisations"
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

      {mode === "room" ? (
        <>
          <GalleryRoom
            sources={sources}
            controlsRef={roomRef}
            onFailed={() => setMode("flat")}
            onPick={setPicked}
          />

          {/* The wall labels. Real type rather than something drawn into a
              texture: it stays selectable, it is read aloud, and it does not
              soften when the plate it belongs to is far down the room. */}
          <ol className="room-labels">
            {t.gallery.items.map((item, i) => (
              <li key={item.caption}>
                <button type="button" className="room-label" onClick={() => setPicked(i)}>
                  <span className="room-label-n t-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="room-label-title">{item.caption}</span>
                  <span className="room-label-open t-mono">{t.gallery.open}</span>
                </button>
              </li>
            ))}
          </ol>
          {/* The canvas announces nothing, so what it is showing stays in the
              page for anyone reading it aloud. */}
          <ul className="sr-only">
            {t.gallery.items.map((item) => (
              <li key={item.caption}>{item.alt || item.caption}</li>
            ))}
          </ul>
        </>
      ) : (
        <div
          ref={trackRef}
          className="gallery-track mt-12"
          tabIndex={0}
          role="region"
          aria-label={t.gallery.title}
        >
          {t.gallery.items.map((item, i) => (
            <figure key={item.caption} data-slide className="gallery-slide">
              <button
                type="button"
                className="gallery-frame"
                onClick={() => setPicked(i)}
                aria-label={`${t.gallery.open} — ${item.caption}`}
              >
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
              </button>
              <figcaption className="gallery-caption t-mono">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {picked !== null && t.gallery.items[picked] ? (
        <Lightbox
          src={t.gallery.items[picked].src}
          alt={t.gallery.items[picked].alt}
          caption={t.gallery.items[picked].caption}
          closeLabel={t.gallery.close}
          onClose={() => setPicked(null)}
        />
      ) : null}
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
