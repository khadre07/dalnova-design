"use client";

import dynamic from "next/dynamic";

/* One figure now, standing in water this page still draws itself.

   The .glb is gone. What is not gone is the scene it stood in: the surface
   runs the width of the page and every band below is measured against it, and
   the conduits carry the charge out to the copy. Taking the water out with the
   robot would have removed most of what the hero is.

   So the water keeps its own scene — much cheaper without a figure to light,
   since the environment map, the three lights, the loader and the glow map all
   left with the model — and the Spline robot stands in it.

   The water also keeps the cue. It is the one that cannot fail: Spline lives
   on someone else's host, and a hero whose words wait on a request to a third
   party is a hero that can stay blank. */
const Water = dynamic(() => import("./WaterStage"), { ssr: false });
const Spline = dynamic(() => import("./SplineFigure"), { ssr: false });

/** The scene the prompt names. */
const SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export default function Stage() {
  return (
    <>
      <Water />
      <Spline scene={SCENE} />
    </>
  );
}
