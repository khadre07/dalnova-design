"use client";

import dynamic from "next/dynamic";

/* Two figures, on purpose.

   They were meant to take turns: the Spline robot was to replace the model,
   and the model was to stand down the moment Spline said it was up. For a
   while the handover was broken and both were drawn at once — the model
   standing in the water, the Spline robot over it, sharing a centre — and that
   accident was better than either of them alone. So it stays, and it is
   arranged rather than tolerated.

   Both are seated three quarters across, so they occupy one another rather
   than sitting side by side, and both are cut at the same waterline. Both
   follow the pointer, which is what makes the pair read as one figure instead
   of two: they turn together, at slightly different rates, because the model
   is also turning to face the copy as the page goes down.

   The model remains the one that matters if the other never comes. Spline is a
   scene on someone else's host, fetched at run time; nothing about the page
   now waits on it arriving, and nothing breaks if it does not. */
const Model = dynamic(() => import("./RobotModelStage"), { ssr: false });
const Spline = dynamic(() => import("./SplineFigure"), { ssr: false });

/** The scene the prompt names. */
const SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export default function Stage() {
  return (
    <>
      {/* Never stood down. The cues the figure gives — the copy's start, the
          loading screen's last stage — are each guarded against being given
          twice, so whichever arrives first gives them and the other is
          silent. */}
      <Model />
      <Spline scene={SCENE} />
    </>
  );
}
