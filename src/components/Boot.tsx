"use client";

import { useEffect, useRef, useState } from "react";
import { onProgress, onReady, reportStage } from "@/lib/boot";

/* The boot screen, over the page until the figure is up.

   Adapted from the ThreeUI uplink sequence: the readout plate with its cut
   corners and corner brackets, the bank of skewed ticks with a heavier mark
   every eighth, the haze widening behind the lit run, the corner markers with
   their turning diamonds, and the phase line underneath.

   Two things are not adapted. The palette is the site's, not the original's
   green. And the number is real: the original runs a scripted eight-second
   timeline of invented percentages and then loops, which is a decoration in
   the shape of a progress bar. This one counts four things that actually have
   to finish — the typefaces, the pictures, the model off the wire, and the
   first frame of the scene — so that a hundred means the page is ready and not
   merely that a download ended.

   The figure shown is eased toward the real one rather than snapped to it.
   Loading is lumpy: a stage completes and the truth jumps eleven points. A bar
   that teleports reads as broken even when it is right, and the whole reason
   this one exists is to be believed.

   It never appears for a cached load: nothing is shown for the first fifth of
   a second, so a page that is already warm goes straight to itself rather than
   flashing a loading screen at someone who is not waiting. */

const TICKS = 48;
const MARK_EVERY = 8;
/** Below this, the load was instant and the screen is never shown. */
const SHOW_AFTER = 220;
/** How long the full bar is held before the page is uncovered. Without it the
 *  bar reaches a hundred and vanishes in the same frame, so the one thing the
 *  screen exists to say — that it is finished — is the one thing never seen. */
const HOLD_AT_FULL = 520;
/** How fast the shown figure catches the real one, per second. Exponential, so
 *  the same rise at 60 Hz and at 144 Hz. */
const CATCH_UP = 3.2;
/** The shown figure is held this far below the truth until everything is in.
 *  It is what keeps the bar from resting on a hundred while the page behind it
 *  is not yet usable. */
const CEILING = 99;
/** Nothing has reported in this long: uncover the page anyway. A loading
 *  screen that can strand the site is worse than one that leaves too early. */
const GIVE_UP = 14000;

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

    /* The two stages this screen can see for itself. The model and the scene
       report from the stage that owns them. */
    document.fonts?.ready.then(() => reportStage("fonts", 1)).catch(() => {
      // No font loading API, or it rejected. Not a reason to hold the page.
      reportStage("fonts", 1);
    });

    const images = Array.from(document.images);
    if (images.length === 0) reportStage("media", 1);
    else {
      let settled = 0;
      const step = () => {
        settled += 1;
        reportStage("media", settled / images.length);
      };
      for (const image of images) {
        if (image.complete) step();
        else {
          image.addEventListener("load", step, { once: true });
          // A picture that failed is a picture that has stopped being waited
          // on. It must still advance the bar, or one bad URL holds the page.
          image.addEventListener("error", step, { once: true });
        }
      }
    }

    let truth = 0;
    let ready = false;
    let hold = 0;
    let raf = 0;
    let last = performance.now();
    let shown = 0;

    const offProgress = onProgress((fraction) => {
      truth = fraction;
    });

    const tick = () => {
      raf = window.requestAnimationFrame(tick);
      const now = performance.now();
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Held under the ceiling until everything is in, so the bar cannot rest
      // on a hundred while the page behind it is still not usable.
      const goal = ready ? 100 : Math.min(CEILING, truth * 100);
      shown += (goal - shown) * (1 - Math.exp(-CATCH_UP * delta));
      if (goal - shown < 0.4) shown = goal;
      setPct(shown);

      if (ready && shown >= 100 && !hold) {
        window.cancelAnimationFrame(raf);
        // Let the last ticks light and the number land before the page appears.
        hold = window.setTimeout(() => setLeaving(true), HOLD_AT_FULL);
      }
    };
    raf = window.requestAnimationFrame(tick);

    const finish = () => {
      window.clearTimeout(timer.current);
      ready = true;
    };

    const offReady = onReady(finish);
    const bail = window.setTimeout(finish, GIVE_UP);

    return () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(hold);
      window.clearTimeout(bail);
      window.cancelAnimationFrame(raf);
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
  const shownPct = Math.floor(pct);
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
            {shownPct}
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
