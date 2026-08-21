"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import RobotStage from "./RobotStage";
import { MODEL_URL } from "./RobotModelStage";

/* The model path pulls in GLTFLoader and the environment generator. Loading it
   lazily keeps that weight out of the bundle for anyone who never gets a
   model. */
const RobotModelStage = dynamic(() => import("./RobotModelStage"), { ssr: false });

type Mode = "probing" | "model" | "flat";

/**
 * Picks the scene. Drop a `robot.glb` into `public/` and the 3D figure takes
 * over; with no model, or if it fails to load, the flat cut-out scene runs.
 * Nothing to configure — the file's presence is the switch.
 */
export default function Stage() {
  const [mode, setMode] = useState<Mode>("probing");

  useEffect(() => {
    let cancelled = false;

    fetch(MODEL_URL, { method: "HEAD" })
      .then((response) => {
        if (cancelled) return;
        // A dev server can answer 200 with an HTML error page; check the type.
        const type = response.headers.get("content-type") ?? "";
        const looksLikeModel = !type.startsWith("text/");
        setMode(response.ok && looksLikeModel ? "model" : "flat");
      })
      .catch(() => {
        if (!cancelled) setMode("flat");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Held blank for one probe rather than starting the flat scene and tearing a
  // whole WebGL context down a moment later.
  if (mode === "probing") return null;

  if (mode === "model") {
    return <RobotModelStage onFailed={() => setMode("flat")} />;
  }

  return <RobotStage />;
}
