"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

/* Two figures, and only ever one on screen.

   The Spline robot is the one asked for, and the reason is its pointer
   tracking. It is a scene on someone else's host, fetched at run time, so it
   is not a thing to bet the opening of the page on: the model stays mounted
   until Spline says it is up, and takes the stage back if it never does.

   The model is not merely a fallback either — it is what lights the water, and
   the water is drawn in the same scene. So its stage keeps running whichever
   figure is showing; what changes is whether its robot is drawn. */
const Model = dynamic(() => import("./RobotModelStage"), { ssr: false });
const Spline = dynamic(() => import("./SplineFigure"), { ssr: false });

/** The scene the prompt names. */
const SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export default function Stage() {
  const [showing, setShowing] = useState<"model" | "spline">("model");

  return (
    <>
      <Model hideFigure={showing === "spline"} />
      <Spline
        scene={SCENE}
        onLive={() => setShowing("spline")}
        onFailed={() => setShowing("model")}
      />
    </>
  );
}
