"use client";

import dynamic from "next/dynamic";

/* One figure, one scene.

   There used to be two — a 3D model and a flat cut-out that stood in for it on
   phones and wherever WebGL would not start. They were different robots: one
   silver, one lit amber, and which you saw depended on your hardware. That is
   a thing to explain rather than a thing to see, so the cut-out is gone and
   the model is the robot everywhere.

   Loaded lazily all the same: the loader and the environment generator are
   weight that only matters once the page is on screen. */
const Model = dynamic(() => import("./RobotModelStage"), { ssr: false });

export default function Stage() {
  return <Model />;
}
