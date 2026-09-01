"use client";

import { useEffect, useRef, useState } from "react";
import { reportReady, reportStage } from "@/lib/boot";
import { figureIsUp } from "@/lib/cue";
import { useSite } from "@/lib/site-state";
import { SplineScene } from "./ui/splite";

/* The Spline robot, standing in for the model.

   It is a scene held on prod.spline.design and fetched at run time — 1.35 MB,
   measured, and about the same weight as the model it stands with. That it
   lives on someone else's host is the part to keep in mind, and the reason
   nothing on the page waits for it: the model is there either way.

   It comes with its own pointer tracking, which is the whole reason for it.

   When it fails it removes itself rather than leaving an empty layer over the
   scene — a transparent sheet that takes the pointer in front of a figure that
   is tracking the pointer is a figure that stops responding. */

/** Nothing has arrived in this long: the model takes the stage back.
 *
 *  Generous, and it has to be. The scene is stored at schema 114 and the
 *  runtime migrates it to 130 on every load — the console says so — on top of
 *  fetching 1.35 MB. Twelve seconds cut that short on a real machine and the
 *  model kept a stage it was supposed to hand over. */
const GIVE_UP = 30000;

/** How often the canvas is looked at while waiting for it to have a size. */
const POLL = 120;

/** Below this the canvas is not showing anything, whatever it reported. */
const MIN_SIZE = 40;

/** The sliver of the runtime's Application this needs. */
type SplineApp = { play?: () => void; stop?: () => void };

/* How far each accent's hue sits from sepia's own.

   sepia() is what gives a dark, all-but-colourless robot something to rotate:
   it maps grey onto a warm axis at roughly 35 degrees. These are the section
   accents measured against that — cyan at 195, amber at 25 — so the figure
   ends up wearing the colour the band it stands in already owns. */
const TINT: Record<"arc" | "ember", string> = {
  arc: "160deg",
  ember: "350deg",
};

export default function SplineFigure({ scene }: { scene: string }) {
  const { accent, sky } = useSite();
  const [state, setState] = useState<"waiting" | "live" | "failed">("waiting");
  const settled = useRef(false);
  const host = useRef<HTMLDivElement>(null);
  const app = useRef<SplineApp | null>(null);
  const running = useRef(true);

  /* Loaded is not the same as showing.

     This is not a hypothetical: the container lost its stylesheet rule, the
     canvas came out nought by nought, Spline reported a clean load anyway, the
     model stood down on the strength of it, and the page had no robot in it at
     all. A load event says a scene was parsed. It says nothing about whether
     there is anything on screen, and standing the working figure down is too
     expensive to do on that word alone. */
  const showing = () => {
    const canvas = host.current?.querySelector("canvas");
    if (!canvas) return false;
    const box = canvas.getBoundingClientRect();
    return box.width >= MIN_SIZE && box.height >= MIN_SIZE;
  };

  const finish = (next: "live" | "failed") => {
    if (settled.current) return;
    settled.current = true;
    setState(next);
    if (next === "live") {
      /* It gives the same cues the model gives. Both are guarded against
         being given twice, so whichever figure is up first releases the copy
         and closes the loading screen, and the other says nothing. */
      figureIsUp();
      reportStage("scene", 1);
      reportReady();
    }
  };

  useEffect(() => {
    /* Watched rather than checked once.

       The first version asked whether the canvas had a size one frame after
       the load event, and one frame is not enough: the element is sized when
       the runtime is ready to draw into it, which is after a migration and a
       fetch, not after a parse. So it is looked at until it is there.

       A remote scene that never answers at all is the worst case — no load, no
       error, and a hero with nothing in it — so the watch has an end, and the
       model is given the stage back. */
    const poll = window.setInterval(() => {
      if (showing()) finish("live");
    }, POLL);
    const bail = window.setTimeout(() => finish("failed"), GIVE_UP);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(bail);
    };
  }, []);

  /* The pointer has to be carried to it.

     The scene tracks the pointer natively — that is the whole reason for
     choosing it — but on this page it would never see one. Two things are in
     the way, and each alone is enough.

     `main` is z-10 and this layer is z-0, and an element with no background
     still takes hit tests across its whole box. So `main` swallows every
     pointer event over the entire page before it can reach the canvas
     underneath. And even without that, the layer only covers the right half,
     so the robot would go still whenever you moved over the words.

     So the events are forwarded: window is listened to, and each move is
     dispatched again onto the canvas. `bubbles: false` keeps the copy from
     climbing back to window and starting a loop, and the layer stays
     pointer-events: none — nothing needs to be hit-testable when nothing is
     being hit.

     Coarse pointers are left out. There is no hovering on a touch screen, and
     forwarding every touch would make the robot lurch at each tap. */
  useEffect(() => {
    if (state !== "live") return;
    const canvas = host.current?.querySelector("canvas");
    if (!canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Where the pointer last was. Only a real move is answered.

       I had this backwards a moment ago: a scroll was replayed at the last
       position so the figure kept turning as the page slid past. It should
       hold. Scrolling is not the reader addressing the robot, it is the reader
       going somewhere, and a figure that swings through it is a figure moving
       for no reason — the page already recedes on scroll, and that is the
       movement scrolling is entitled to. It answers the pointer moving, and
       nothing else. */
    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.5;
    let queued = 0;

    const send = () => {
      queued = 0;
      const box = canvas.getBoundingClientRect();
      if (box.width === 0) return;

      /* Left, right and down. Above the eyeline it holds.

         Its own tracking is two-axis and not ours to constrain, so the
         constraint goes on what is handed to it. Clamping the vertical to the
         eyeline was the first thing I tried, and it is not the same: clamped,
         the robot still swings left and right along the top of the screen
         while looking level. Gated, it holds the pose it had. Above its own
         eyeline nothing is sent at all, so the nav and the top of the copy are
         somewhere the reader can go without the figure answering. */
      const eyeline = box.top + box.height * 0.34;
      if (y < eyeline) return;

      const init: PointerEventInit = {
        clientX: x,
        clientY: y,
        pointerType: "mouse",
        bubbles: false,
        cancelable: true,
      };
      canvas.dispatchEvent(new PointerEvent("pointermove", init));
      // Older listeners watch mousemove rather than pointermove; sending both
      // costs nothing and means not having to guess which this runtime uses.
      canvas.dispatchEvent(new MouseEvent("mousemove", init));
    };

    // Coalesced to one send per frame: a fine pointer reports far more often
    // than the scene can draw, and every extra event is work thrown away.
    const schedule = () => {
      if (!queued) queued = window.requestAnimationFrame(send);
    };

    const onPointer = (event: PointerEvent) => {
      // Ours would have isTrusted false; belt to the bubbles: false braces.
      if (!event.isTrusted) return;
      x = event.clientX;
      y = event.clientY;
      schedule();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      if (queued) window.cancelAnimationFrame(queued);
    };
  }, [state]);

  /* Frames are the whole of fluidity here.

     The scene is somebody else's and its own smoothing is not ours to tune, so
     the only thing that can be given to it is room to draw. It shares a GPU
     with the water scene, and it was drawing at full rate whether or not it
     was on screen — a full-screen scene painting behind the services section,
     for nobody, taking frames from the one place it is actually seen.

     So it runs while the hero is in view and stops otherwise, and stops with
     the tab.

     It also stops while the page is being scrolled, and that is not about
     frames — it is the only way to hold the figure still.

     The scroll movement was never mine to stop by not sending events. The
     scene has a scroll event and a look-at behaviour built into it — both are
     in the file, and the runtime registers its own listener on `document` —
     so it answers a scroll whatever this component forwards or withholds.
     Blocking the event before it reaches `document` would mean stopping its
     propagation at window capture, which would take every other scroll
     listener on the page down with it, this section's own carousel included.

     Halting the scene is the honest lever: the last frame stays on the canvas,
     the figure holds exactly the pose it had, and it picks up again once the
     page settles. */
  useEffect(() => {
    const node = host.current;
    if (!node) return;

    let onScreen = true;
    let scrolling = false;
    let settle = 0;

    const sync = () => {
      const wanted = onScreen && !document.hidden && !scrolling;
      // Guarded: play() on an already-running scene restarts its clock.
      if (wanted === running.current) return;
      running.current = wanted;
      if (wanted) app.current?.play?.();
      else app.current?.stop?.();
    };

    const watch = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        sync();
      },
      // A margin, so it is running before it is looked at rather than starting
      // as it comes into frame.
      { rootMargin: "25% 0px" },
    );
    watch.observe(node);
    document.addEventListener("visibilitychange", sync);

    /* Held for a moment after the last scroll event rather than resumed on it.
       Scroll arrives in bursts with gaps inside them, and resuming in a gap
       would let the figure twitch through what should be one still passage. */
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        sync();
      }
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        scrolling = false;
        sync();
      }, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      watch.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
    };
  }, [state]);

  if (state === "failed") return null;

  return (
    <div
      ref={host}
      className="spline-figure"
      data-live={state === "live"}
      data-sky={sky}
      style={{ "--robot-hue": TINT[accent] } as React.CSSProperties}
      aria-hidden="true"
    >
      <SplineScene
        scene={scene}
        className="spline-canvas"
          /* The load event is a hint, not the answer. The watch above decides,
           and it decides on whether there is a canvas with a size in it. */
        onLoad={(instance) => {
          app.current = instance as SplineApp;
          requestAnimationFrame(() => {
            if (showing()) finish("live");
          });
        }}
        onError={() => finish("failed")}
      />
    </div>
  );
}
