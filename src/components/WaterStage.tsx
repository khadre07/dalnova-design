"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { accentHex, useSite } from "@/lib/site-state";
import { reportReady, reportStage } from "@/lib/boot";
import { figureIsUp } from "@/lib/cue";
import { WATER_FRAG, WATER_VERT } from "@/lib/water";
import { measure, progressAt, type Anchors } from "@/lib/rig";
import { buildWorld, type World } from "@/lib/world";
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

/* The camera stops, one per chapter, in the order the sections carry.

   Kage's rig, with its own numbers. Each stop is where the camera stands, what
   it looks at, and how long a lens it wears; a Catmull-Rom curve is laid
   through the stops and sampled at the fractional chapter index, so the travel
   is continuous while the stops stay nameable.

   The shape of the journey: it walks down the line.

   The first version of these stops barely moved — two units of travel over
   seven chapters, which is a camera shifting its weight, not a walk. The masts
   stand every six units down the water, so the camera now runs the length of
   them: it opens level and looking ahead, swings out beside the line as the
   page says what Dalnova installs, rides along it, lifts to look down the run
   for the work, and settles low again for the contact. Forty units of travel
   past nine masts, so a chapter is a stretch of road rather than a nudge.

   The aim leads the position down the line rather than pointing across it,
   which is what makes it read as going somewhere: you look where you are
   walking. */
const STOPS = [
  { p: [0.0, 0.0, 3.05], t: [0.6, -0.02, -2.0], fov: 32 },
  { p: [0.9, 0.22, -1.4], t: [2.2, -0.08, -6.0], fov: 35 },
  { p: [1.9, 0.44, -7.0], t: [3.0, -0.12, -12.4], fov: 38 },
  { p: [2.6, 0.34, -13.6], t: [3.4, -0.1, -19.0], fov: 36 },
  { p: [3.2, 0.66, -20.4], t: [3.0, -0.16, -26.5], fov: 40 },
  { p: [2.4, 0.5, -27.2], t: [2.2, -0.12, -33.0], fov: 37 },
  { p: [1.6, 0.28, -33.8], t: [1.2, -0.08, -39.5], fov: 34 },
] as const;

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
      /* Thinned for the walk. At 0.34 everything past about five units was
         solid fog — fine when the camera stood still beside one figure, and
         the reason the masts at the far end would have been invisible. This
         still closes the run off, just at forty units instead of five. */
      scene.fog = new THREE.FogExp2(day ? 0xe9eef2 : 0x05070a, 0.028);

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

      /* The horizon the camera walks past. Built, not photographed — see the
         module for why that is not only a cost decision. */
      const world: World = buildWorld(THREE, -0.502);
      scene.add(world.group);

      /* The rig. A curve through the stops for the position and a second for
         what the camera is looking at, so the aim travels as smoothly as the
         camera does — panning to a fixed point while moving is what makes a
         dolly feel like a machine. */
      const curveP = new THREE.CatmullRomCurve3(
        STOPS.map((c) => new THREE.Vector3(c.p[0], c.p[1], c.p[2])),
        false,
        "catmullrom",
        0.42,
      );
      const curveT = new THREE.CatmullRomCurve3(
        STOPS.map((c) => new THREE.Vector3(c.t[0], c.t[1], c.t[2])),
        false,
        "catmullrom",
        0.42,
      );
      const rigP = new THREE.Vector3();
      const rigT = new THREE.Vector3();

      /* Which sections are chapters, and where they sit on the scrollbar.

         Measured from the markup rather than from a list kept here: the
         sections carry data-cam, so adding or moving a band cannot put the rig
         out of step with the page. */
      let anchors: Anchors = { at: [], max: 1 };
      const chapters = () =>
        Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"));
      const remeasure = () => {
        anchors = measure(chapters());
      };

      // Nothing to fetch and nothing to build: the surface is a shader, and it
      // is ready the moment the context is.
      reportStage("scene", 0.8);

      let unitPx = 1;

      const layout = () => {
        const stage = { w: host.clientWidth, h: host.clientHeight };
        if (!stage.w || !stage.h) return;

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();

        const narrow = stage.w < 1024;
        const frameFill = narrow ? 0.64 : 0.78;

        // Where the feet would have come to rest. The Spline figure is cut at
        // the matching fraction in CSS, so the two agree on where the water is.
        const baseY = narrow ? 0.03 : 0.06;
        water.position.y = baseY - 0.502;
        unitPx = stage.h * frameFill;

        /* The pool of light sits under the figure rather than in the middle of
           the screen, and the surface is wide enough that its ends are off the
           frame either way. */
        const at = narrow ? FIGURE_AT.narrow : FIGURE_AT.wide;
        const visibleWidth = (1 / frameFill) * camera.aspect;
        water.position.x = (at - 0.5) * visibleWidth;

        /* Big enough for the whole walk, and seated over it.

           Sized to the frame it was 15 times the visible width, which reached
           about fourteen units either side of the origin. The camera now runs
           to minus thirty-four, so it would have walked off the end of its own
           water. It is one quad; the size costs nothing. */
        const width = Math.max(visibleWidth * 15, 90);
        const depth = 110;
        water.scale.set(width, depth, 1);
        waterUniforms.uHalf.value.set(width / 2, depth / 2);
        // Centred on the middle of the journey rather than on the first stop.
        water.position.z = -18;

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
      remeasure();
      const resizeObserver = new ResizeObserver(() => {
        layout();
        remeasure();
      });
      resizeObserver.observe(host);
      /* The bands grow when their pictures land, which moves every anchor
         below them. Watching the document catches that; watching only the
         window would leave the rig aimed at where the page used to be. */
      const bodyObserver = new ResizeObserver(remeasure);
      bodyObserver.observe(document.body);

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

        /* Along the curve, at the chapter the page is on.

           Smoothed before it is applied rather than after: the scroll position
           is a step function on a trackpad, and sampling a spline at a
           stepping value gives a stepping camera however smooth the spline
           is. */
        const wanted = progressAt(window.scrollY, anchors);
        easedProgress += (wanted - easedProgress) * (1 - Math.exp(-3.4 * delta));

        const finalStop = STOPS.length - 1;
        const u = Math.min(1, Math.max(0, easedProgress / finalStop));
        curveP.getPoint(u, rigP);
        curveT.getPoint(u, rigT);

        // The lens is stepped between the two stops it lies between, not
        // splined: a field of view that overshoots reads as a lurch.
        const i = Math.min(finalStop - 1, Math.max(0, Math.floor(easedProgress)));
        const f = Math.min(1, Math.max(0, easedProgress - i));
        camera.fov = STOPS[i].fov + (STOPS[i + 1].fov - STOPS[i].fov) * f;
        camera.position.copy(rigP);
        camera.lookAt(rigT);
        camera.updateProjectionMatrix();

        world.tint(currentAccent);

        // The conduits ride the figure, and the figure's apparent size now
        // comes from the lens rather than from a dolly number.
        trackDolly(STOPS[0].fov / camera.fov, rigP.y);
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
        bodyObserver.disconnect();
        world.dispose();
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
