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

/** Nothing has arrived in this long: the model takes the stage back. */
const GIVE_UP = 12000;

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
    /* A remote scene that never answers is the worst case: no load, no error,
       and a hero with nothing in it. The model is given the stage back. */
    const bail = window.setTimeout(() => finish("failed"), GIVE_UP);
    return () => window.clearTimeout(bail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "failed") return null;

  return (
    <div className="spline-figure" data-live={state === "live"} aria-hidden="true">
      <SplineScene
        scene={scene}
        className="spline-canvas"
        onLoad={() => finish("live")}
        onError={() => finish("failed")}
      />
    </div>
  );
}
