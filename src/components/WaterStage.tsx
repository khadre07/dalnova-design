"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { accentHex, useSite } from "@/lib/site-state";
import { reportReady, reportStage } from "@/lib/boot";
import { figureIsUp } from "@/lib/cue";
import { WATER_FRAG, WATER_VERT } from "@/lib/water";
import { presenceValue } from "@/lib/stage";
import { Conduits, type Box } from "./Conduits";

/* What is left when the model is taken out: the water, and the light on it.

   The robot that used to stand here is gone — the Spline figure is the figure
   now. Everything else in this scene stayed, because the model was never the
   only thing in it: the surface it stood in runs the width of the page and
   every band below is measured against it, and the conduits carry the charge
   out to the copy.

   What goes with the model is everything that existed to light a figure: the
   environment map built from RoomEnvironment, the three directional lights,
   the loader, the glow map, the animation mixer. Water is a shader; it needs
   none of them. */

/** Where the figure stands across the frame — the water is centred on it. */
const FIGURE_AT = { narrow: 0.5, wide: 0.74 };

export default function WaterStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [failed, setFailed] = useState(false);
  const { accent, sky, progressRef } = useSite();

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        setFailed(true);
        reportReady();
        return;
      }

      /* Which sky this is built for. Blending is fixed once a material exists,
         so the effect lists `sky` as a dependency and the scene is rebuilt
         when it turns rather than being adjusted in place. */
      const day = sky === "day";

      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = day ? 1.0 : 1.15;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

      /* Depth. Everything past the surface falls away into the page's own
         colour, so the scene has a behind rather than ending at a hard edge.
         Exponential rather than linear: it thickens the way air does. */
      scene.fog = new THREE.FogExp2(day ? 0xe9eef2 : 0x05070a, 0.34);

      const waterUniforms = {
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uIgnite: { value: 0 },
        uHalf: { value: new THREE.Vector2(1, 1) },
        // The figure is one unit tall; the ripples are sized against it.
        uUnit: { value: 1 },
      };
      /* Added at night, painted by day. Adding light to a pale ground does
         nothing at all, so under a bright sky the water is drawn over what is
         behind it instead of onto it. */
      const waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        transparent: true,
        depthWrite: false,
        blending: day ? THREE.NormalBlending : THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), waterMaterial);
      water.rotation.x = -Math.PI / 2;
      water.renderOrder = -1;
      scene.add(water);

      // Nothing to fetch and nothing to build: the surface is a shader, and it
      // is ready the moment the context is.
      reportStage("scene", 0.8);

      let baseDistance = 1;
      let unitPx = 1;

      const layout = () => {
        const stage = { w: host.clientWidth, h: host.clientHeight };
        if (!stage.w || !stage.h) return;

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();

        const narrow = stage.w < 1024;
        const frameFill = narrow ? 0.64 : 0.78;
        const vFov = (camera.fov * Math.PI) / 180;
        const distance = 1 / (2 * frameFill * Math.tan(vFov / 2));
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);

        // Where the feet would have come to rest. The Spline figure is cut at
        // the matching fraction in CSS, so the two agree on where the water is.
        const baseY = narrow ? 0.03 : 0.06;
        water.position.y = baseY - 0.502;
        baseDistance = distance;
        unitPx = stage.h * frameFill;

        /* The pool of light sits under the figure rather than in the middle of
           the screen, and the surface is wide enough that its ends are off the
           frame either way. */
        const at = narrow ? FIGURE_AT.narrow : FIGURE_AT.wide;
        const visibleWidth = (1 / frameFill) * camera.aspect;
        water.position.x = (at - 0.5) * visibleWidth;

        const width = visibleWidth * 15;
        const depth = width;
        water.scale.set(width, depth, 1);
        waterUniforms.uHalf.value.set(width / 2, depth / 2);

        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        renderer.setPixelRatio(dpr);
        renderer.setSize(stage.w, stage.h, false);

        const boxH = stage.h * frameFill;
        const boxShift = stage.w * (at - 0.5);
        const boxW = boxH * 0.62;
        setBox({
          left: (stage.w - boxW) / 2 + boxShift,
          top: (stage.h - boxH) / 2 - baseY * unitPx,
          width: boxW,
          height: boxH,
        });
      };

      layout();
      const resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(host);

      /* The section's accent, read per frame. Held beside the loop rather
         than closed over directly so a colour change never rebuilds a scene
         whose materials are the expensive part. */
      const accentRef = { current: accent };
      const skyRef = { current: sky };

      const currentAccent = new THREE.Color(ACCENT_HEX.arc);
      const nextAccent = new THREE.Color();
      let easedProgress = 0;
      let overlayIntro = 0;
      let raf = 0;
      let running = true;
      let started = performance.now();
      let paused = 0;
      let last = performance.now();
      let cued = false;

      const trackDolly = (dolly: number, lift: number) => {
        const correction = `scale(${(1 / dolly).toFixed(4)}) translateY(${(lift * unitPx).toFixed(1)}px)`;
        if (frontRef.current) frontRef.current.style.transform = correction;
      };

      const frame = () => {
        raf = window.requestAnimationFrame(frame);

        const now = performance.now();
        const elapsed = (now - started) / 1000;
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        nextAccent.set(accentHex(accentRef.current, skyRef.current));
        currentAccent.lerp(nextAccent, 1 - Math.exp(-3 * delta));
        waterUniforms.uAccent.value.copy(currentAccent);
        waterUniforms.uTime.value = elapsed;

        /* The surface catches at the opening, as it did when the figure lit
           it. Smoothstepped, so it comes up rather than switching on. */
        const ignite = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.4));
        waterUniforms.uIgnite.value = ignite * ignite * (3 - 2 * ignite);

        /* The cue the model used to give.

           Both signals are guarded against a second call, so whichever figure
           is up first releases the copy and closes the loading screen. This one
           matters because it is the one that cannot fail: the Spline scene
           lives on someone else's host, and a hero whose words wait on a
           request to a third party is a hero that can stay blank. */
        if (ignite >= 1 && !cued) {
          cued = true;
          reportStage("scene", 1);
          figureIsUp();
          reportReady();
        }

        overlayIntro = Math.max(0, Math.min(1, (elapsed - 0.62) / 0.45));
        if (frontRef.current) frontRef.current.style.opacity = String(overlayIntro);

        easedProgress += (progressRef.current - easedProgress) * 0.07;

        /* The shot, not the subject. The camera pulls back and lifts as the
           page goes down, so the surface recedes rather than being scaled. */
        const dolly = 1 + easedProgress * 0.22;
        camera.position.set(0, easedProgress * 0.26, baseDistance * dolly);
        camera.lookAt(0, -easedProgress * 0.06, 0);

        trackDolly(dolly, easedProgress * 0.26);
        renderer.render(scene, camera);
      };

      const start = () => {
        if (running || reduced) return;
        running = true;
        started += performance.now() - paused;
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        paused = performance.now();
        window.cancelAnimationFrame(raf);
      };

      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      /* Off screen, nothing is drawn. The surface is behind the whole page, so
         without this it would keep painting under the sections below it. */
      const inView = new IntersectionObserver(
        ([entry]) => ((entry?.isIntersecting ?? true) ? start() : stop()),
        { rootMargin: "20% 0px" },
      );
      inView.observe(host);

      if (reduced) {
        // One frame, held. Someone who has asked for less movement gets the
        // surface, not the animation of it.
        waterUniforms.uIgnite.value = 1;
        renderer.render(scene, camera);
        presenceValue();
        figureIsUp();
        reportReady();
      } else {
        raf = window.requestAnimationFrame(frame);
      }

      cleanup = () => {
        stop();
        document.removeEventListener("visibilitychange", onVisibility);
        resizeObserver.disconnect();
        inView.disconnect();
        waterMaterial.dispose();
        water.geometry.dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      console.error("[WaterStage]", error);
      if (!disposed) setFailed(true);
      reportReady();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced, progressRef, sky, accent]);

  if (failed) return null;

  return (
    <div ref={hostRef} className="relative h-full w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-[1200ms]"
        style={{
          background: `radial-gradient(58% 46% at 52% 62%, ${ACCENT_HEX[accent]}1f 0%, transparent 72%)`,
        }}
      />

      {box ? (
        <div ref={frontRef} className="absolute inset-0 z-0" style={{ opacity: 0 }}>
          <Conduits box={box} accent={ACCENT_HEX[accent]} reduced={reduced} />
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 z-10 block h-full w-full"
      />
    </div>
  );
}
