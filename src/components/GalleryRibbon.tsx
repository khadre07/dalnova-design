"use client";

import { useEffect, useRef } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";
import { WATER_FRAG, WATER_VERT } from "@/lib/water";

/* The Vantrix hero ribbon: sixteen curved panels on a vertical rail.

   The authored composition is kept exactly — sixteen panels, a 35° camera at
   z 18, the four-turn placement that makes the stack a helix rather than a
   ring, the 0.18 rotation and the ±1.5 vertical drift. Three things could not
   be carried over literally, and each is a fact about this project rather than
   a preference:

   1. Runtime. The source is written for three r149 and uses `outputEncoding`
      and `texture.encoding` with `sRGBEncoding`. Both were removed from three;
      this project is on 0.185, where the equivalents are `outputColorSpace`
      and `texture.colorSpace`. Copied verbatim the ribbon renders washed out.
      Installing r149 beside it would mean two copies of three.js in the
      bundle — and the published package carries two more of its own.

   2. Assets. The five authored WebP textures are Vantrix's own photography.
      This ribbon shows the gallery slots declared in content.ts, cycled across
      the sixteen panels the same way the source cycles its five.

   3. Pixel ratio, capped at 1.5 rather than 2. The page already runs a second
      WebGL scene for the figure, and the cap is what made that affordable.

   Everything the ribbon shows is decoration: the real list stays in the DOM
   beside it, which is what a screen reader and a search engine read. */

/* Twelve, not the authored sixteen. With three pictures instead of five, each
   one already comes round more often; sixteen panels made a wall of repeats.
   Twelve is a clean four turns of three, so the ribbon repeats on its own
   rhythm rather than drifting out of step with itself. */
const PANELS = 12;

export type RibbonControls = { step: (direction: 1 | -1) => void } | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* A slot with nothing dropped into it yet.

   Deliberately symmetrical, with no numeral. The authored ribbon is
   double-sided — the far half of the rail shows through the near half, which
   is what gives it depth — so every panel is also seen reversed. A photograph
   reads fine that way; a slot number does not, it reads as a fault. Drawing
   only marks that survive being mirrored keeps the authored material and loses
   nothing: the slots are ordered in content.ts, which is where they are
   filled in. */
function placeholderTexture(hex: string) {
  const w = 512;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#121b24";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(94, 104, 112, 0.5)";
  ctx.lineWidth = 3;
  for (let x = -h; x < w; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + h, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.globalAlpha = 1;

  // A centred aperture: a ring and a cross, both unchanged by mirroring.
  ctx.strokeStyle = "#8ea0a8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w / 2 - 26, h / 2);
  ctx.lineTo(w / 2 + 26, h / 2);
  ctx.moveTo(w / 2, h / 2 - 26);
  ctx.lineTo(w / 2, h / 2 + 26);
  ctx.stroke();

  return canvas;
}

export default function GalleryRibbon({
  sources,
  controlsRef,
  onFailed,
  onPick,
  speed = 1,
  scale = 1,
}: {
  /** One entry per slot. An empty string means nothing has been dropped in. */
  sources: string[];
  controlsRef: React.RefObject<RibbonControls>;
  /** No WebGL, or the scene threw: the section falls back to the flat strip. */
  onFailed?: () => void;
  /** A panel was clicked. Its slot index, so the caller can open the drawing
   *  at a size where the equipment labels can actually be read. */
  onPick?: (slot: number) => void;
  speed?: number;
  scale?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent } = useSite();

  /* Held in a ref so the scene effect never re-runs, and written from an
     effect, because a ref write during render is unsafe under concurrent
     rendering. */
  const failedRef = useRef(onFailed);
  const pickRef = useRef(onPick);
  useEffect(() => {
    failedRef.current = onFailed;
    pickRef.current = onPick;
  }, [onFailed, onPick]);

  const accentRef = useRef(ACCENT_HEX.arc);
  const settingsRef = useRef({ speed, scale });
  useEffect(() => {
    accentRef.current = ACCENT_HEX[accent];
    settingsRef.current = { speed, scale };
  }, [accent, speed, scale]);

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
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch {
        /* No context. Said out loud rather than swallowed: the section has a
           flat strip that works without one, and a gallery that silently shows
           nothing is worse than no gallery at all. */
        failedRef.current?.();
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      /* Closer than the authored 18, and the panels below are taller: three
         pictures should each be worth looking at, not five glimpsed. */
      camera.position.z = 15;

      const ribbon = new THREE.Group();
      scene.add(ribbon);

      /* The same water the figure stands in, so the two scenes are one place
         rather than two. Its height below the axis is the same fraction of the
         camera's distance as in the hero — that ratio is what decides how much
         of the surface is in shot, and matching it is what makes the two read
         as the same body of water seen from different points.

         uUnit says how big this scene is: the panels are several units where
         the figure was one, so without it the ripples would be a fine rash
         instead of swell. */
      const waterUniforms = {
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uIgnite: { value: 1 },
        uHalf: { value: new THREE.Vector2(1, 1) },
        uUnit: { value: 7.5 },
      };
      const waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const WATER_W = 260;
      const WATER_D = 110;
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 24, 24),
        waterMaterial,
      );
      water.scale.set(WATER_W, WATER_D, 1);
      waterUniforms.uHalf.value.set(WATER_W / 2, WATER_D / 2);
      water.rotation.x = -Math.PI / 2;
      water.position.y = -camera.position.z * 0.227;
      water.renderOrder = -1;
      scene.add(water);

      const geometry = new THREE.CylinderGeometry(5, 5, 2.8, 64, 1, true, 0, Math.PI * 0.4);
      const loader = new THREE.TextureLoader();
      const textures: import("three").Texture[] = [];
      const materials: import("three").MeshBasicMaterial[] = [];

      const slots = Math.max(1, sources.length);
      for (let i = 0; i < slots; i += 1) {
        const src = sources[i];
        const texture = src
          ? loader.load(src)
          : new THREE.CanvasTexture(placeholderTexture(accentRef.current));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        textures.push(texture);
      }

      for (let i = 0; i < PANELS; i += 1) {
        const material = new THREE.MeshBasicMaterial({
          map: textures[i % slots],
          opacity: 0.85,
          side: THREE.DoubleSide,
          toneMapped: false,
          transparent: true,
        });
        materials.push(material);

        const panel = new THREE.Mesh(geometry, material);
        // Spacing follows the panel height, or taller panels would overlap.
        panel.position.y = (i - PANELS / 2) * 3.4;
        // Four turns across sixteen panels: the stack is a helix, not a ring.
        panel.rotation.y = (i / PANELS) * Math.PI * 4;
        ribbon.add(panel);
      }

      let elapsed = 0;
      let nudged = 0;
      let raf = 0;
      let running = false;
      let previous = 0;
      let onScreen = false;
      let visible = !document.hidden;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const render = (time = performance.now()) => {
        const safeSpeed = clamp(settingsRef.current.speed, 0, 3);
        const safeScale = clamp(settingsRef.current.scale, 0.7, 1.35);
        if (previous) elapsed += Math.min((time - previous) / 1000, 0.05) * safeSpeed;
        previous = time;
        // The arrows ease onto the drift rather than replacing it.
        nudged += (0 - nudged) * 0.06;
        ribbon.rotation.y = elapsed * 0.18 + nudged;
        ribbon.position.y = Math.sin(elapsed) * 1.5;
        ribbon.scale.setScalar(safeScale);

        waterUniforms.uTime.value = elapsed;
        waterUniforms.uAccent.value.set(accentRef.current);

        renderer.render(scene, camera);
      };

      const tick = (time: number) => {
        if (disposed || !onScreen || !visible) {
          raf = 0;
          previous = 0;
          return;
        }
        render(time);
        raf = window.requestAnimationFrame(tick);
      };

      const start = () => {
        if (reduced) {
          render(0);
          return;
        }
        if (!raf && onScreen && visible) {
          running = true;
          raf = window.requestAnimationFrame(tick);
        }
      };
      const stop = () => {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
        running = false;
        previous = 0;
      };

      controlsRef.current = {
        // A quarter of the ring per press: enough to move the composition on,
        // short of throwing it somewhere the reader did not ask for.
        step: (direction) => {
          nudged += direction * Math.PI * 0.25;
          if (!running) render();
        },
      };

      /* Clicking a panel opens its drawing. Without this the ribbon is the
         only way a wide screen ever sees the work, and a technical drawing
         wrapped round a cylinder is a drawing you cannot read — which is most
         of what these are for. */
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let downAt = { x: 0, y: 0 };

      const onDown = (event: PointerEvent) => {
        downAt = { x: event.clientX, y: event.clientY };
      };
      const onUp = (event: PointerEvent) => {
        // A drag over the canvas is a scroll, not a click.
        if (Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 6) return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(ribbon.children, false)[0];
        if (hit) pickRef.current?.(hit.object.userData.slot as number);
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);

      const resize = () => {
        const bounds = host.getBoundingClientRect();
        const width = Math.max(1, Math.round(bounds.width));
        const height = Math.max(1, Math.round(bounds.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      };
      resize();

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const inView = new IntersectionObserver(([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        if (onScreen) start();
        else stop();
      });
      inView.observe(host);

      const onVisibility = () => {
        visible = !document.hidden;
        if (visible) start();
        else stop();
      };
      document.addEventListener("visibilitychange", onVisibility);

      /* A context loss is not an error to log and walk away from: the ribbon is
         decoration, and losing it must not take the section with it. */
      const onLost = (event: Event) => {
        event.preventDefault();
        stop();
      };
      const onRestored = () => {
        resize();
        start();
      };
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);

      start();

      cleanup = () => {
        stop();
        controlsRef.current = null;
        resizeObserver.disconnect();
        inView.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        ribbon.clear();
        geometry.dispose();
        water.geometry.dispose();
        waterMaterial.dispose();
        for (const material of materials) material.dispose();
        for (const texture of textures) texture.dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      console.error("[GalleryRibbon]", error);
      if (!disposed) failedRef.current?.();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [sources, controlsRef]);

  return (
    <div ref={hostRef} className="ribbon" role="img" aria-label="Galerie">
      <canvas ref={canvasRef} className="ribbon-canvas" aria-hidden="true" />
    </div>
  );
}
