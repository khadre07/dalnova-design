"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import RobotStage from "./RobotStage";
import { MODEL_URL } from "./RobotModelStage";

/* The model path pulls in GLTFLoader and the environment generator. Loading it
   lazily keeps that weight out of the bundle for anyone who never gets a
   model. */
const RobotModelStage = dynamic(() => import("./RobotModelStage"), { ssr: false });

/* A reduced copy of the cut-out, not the full one. It is on screen for about a
   second, behind a scrim, at roughly 800px tall — paying full resolution for
   that would give back a good part of what the slimmer model just saved. */
const POSTER_URL = "/robot-poster.webp";

type Mode = "probing" | "model" | "flat";

/**
 * Picks the scene. Drop a `robot.glb` into `public/` and the 3D figure takes
 * over; with no model, or if it fails to load, the flat cut-out scene runs.
 * Nothing to configure — the file's presence is the switch.
 */
export default function Stage() {
  const [mode, setMode] = useState<Mode>("probing");
  const [modelDrawn, setModelDrawn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /* Phones get the flat scene whatever is in public/, and are never asked to
       download the model to find that out. There the figure sits *behind* the
       copy at a fifth of its opacity — four megabytes, over mobile data, for
       something nobody can make out. The 270 KB cut-out looks the same at that
       opacity.

       Resolved through a promise even when the answer is already known, so the
       decision always arrives as an update from outside React rather than as a
       setState in the effect body, which would cascade a second render. */
    const probe: Promise<Mode> = window.matchMedia("(min-width: 1024px)").matches
      ? fetch(MODEL_URL, { method: "HEAD" }).then((response) => {
          // A dev server can answer 200 with an HTML error page; check the type.
          const type = response.headers.get("content-type") ?? "";
          const looksLikeModel = !type.startsWith("text/");
          return response.ok && looksLikeModel ? "model" : "flat";
        })
      : Promise.resolve("flat");

    probe
      .then((next) => {
        if (!cancelled) setMode(next);
      })
      .catch(() => {
        if (!cancelled) setMode("flat");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "flat") return <RobotStage />;

  /* While the model is on its way, the cut-out stands in for it. The hero used
     to be an empty right half until several megabytes had arrived, which is
     most of what made the page feel slow — the figure is the page's whole
     first impression. A plain <img>, not the flat WebGL scene: standing a
     second context up and tearing it down again a moment later costs more than
     it saves. */
  return (
    <>
      {mode === "model" ? (
        <RobotModelStage
          onFailed={() => setMode("flat")}
          onReady={() => setModelDrawn(true)}
        />
      ) : null}

      {/* Kept mounted at zero opacity rather than unmounted, so the hand-off
          is a fade and not a cut. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_URL}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="stage-poster"
        data-gone={modelDrawn}
      />
    </>
  );
}
