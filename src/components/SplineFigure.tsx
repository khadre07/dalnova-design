"use client";

import { useEffect, useRef, useState } from "react";
import { reportReady, reportStage } from "@/lib/boot";
import { figureIsUp } from "@/lib/cue";
import { SplineScene } from "./ui/splite";

/* The Spline robot, standing in for the model.

   It is a scene held on prod.spline.design and fetched at run time — 1.35 MB,
   measured, and about the same weight as the model it replaces. That it lives
   on someone else's host is the part to keep in mind: if it is unreachable
   there is nothing to fall back on but our own figure, which is why the model
   is still in the page and why this reports failure rather than staying
   silent.

   It comes with its own pointer tracking, which is the whole reason for it. */

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

export default function SplineFigure({
  scene,
  onLive,
  onFailed,
}: {
  scene: string;
  /** Called once the robot is on screen, so the model can stand down. */
  onLive: () => void;
  /** Called if it cannot be shown at all, so the model keeps the stage. */
  onFailed: () => void;
}) {
  const [state, setState] = useState<"waiting" | "live" | "failed">("waiting");
  const settled = useRef(false);
  const host = useRef<HTMLDivElement>(null);

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
      onLive();
      // It is the figure now, so it owns the two cues the model used to give.
      figureIsUp();
      reportStage("scene", 1);
      reportReady();
    } else {
      onFailed();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "failed") return null;

  return (
    <div ref={host} className="spline-figure" data-live={state === "live"} aria-hidden="true">
      <SplineScene
        scene={scene}
        className="spline-canvas"
          /* The load event is a hint, not the answer. The watch above decides,
           and it decides on whether there is a canvas with a size in it. */
        onLoad={() => {
          requestAnimationFrame(() => {
            if (showing()) finish("live");
          });
        }}
        onError={() => finish("failed")}
      />
    </div>
  );
}
