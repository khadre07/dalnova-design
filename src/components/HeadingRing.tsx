"use client";

import { useEffect, useRef } from "react";
import { accentHex, useSite } from "@/lib/site-state";

/* A ring of plates turning behind the headline.

   Adapted from the ThreeUI gallery heading, with two changes.

   The first is that the headline stays in the DOM. The original draws its type
   into the canvas because it is a demo with nothing behind it; here the H1 is
   the sentence a search engine reads and a screen reader announces, and a
   company that sells IT services in Dakar cannot afford to have it be pixels.
   So the canvas draws the plates only, and the real type sits over them.

   The second is the palette. The original's twelve plates are twelve different
   gradients — violet, coral, chrome, silk — a sampler for a gradient shop. On
   this page they carry the accent the section owns, so the ring belongs to the
   page rather than visiting it.

   Kept from the source: the projected ellipse rather than a circle squashed by
   scale, the tilt and axis angles, twelve plates, the fifteen-second
   revolution, painter-ordered draw so the far half passes behind, and the rest
   state that only turns once a pointer is over it. */

const PLATES = 12;
/** One revolution, in seconds. From the source, and it is a good number: slow
 *  enough to be background, quick enough that a plate crosses while you read. */
const REVOLUTION = 15.015;
/** The ring's own geometry, in the source's own terms. */
const RING = {
  ratio: 0.492, // semi-minor over semi-major: a 60.5° plane tilt
  axis: 25.5, // screen angle of the major axis, degrees
  tile: 0.235, // plate side, as a fraction of the ring radius
  radius: 0.22, // corner radius, as a fraction of the plate side
  dist: 13, // camera distance, in ring radii
  phase: 93, // where plate zero starts, degrees
};

/** A plate's face: a grainy field in the accent, no two alike. */
function makePlate(index: number, hex: string, dark: boolean) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Deterministic, so the ring is the same ring on every render and machine.
  let s = (index * 2654435761) >>> 0;
  const rand = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };

  const angle = rand() * Math.PI * 2;
  const g = ctx.createLinearGradient(
    size * (0.5 + Math.cos(angle) * 0.5),
    size * (0.5 + Math.sin(angle) * 0.5),
    size * (0.5 - Math.cos(angle) * 0.5),
    size * (0.5 - Math.sin(angle) * 0.5),
  );
  /* The plate has to read against the page it is on. Built at the ground's own
     value it was invisible except at its edges — a ring of nothing with a few
     hairlines in it. These sit a clear step above it. */
  const deep = dark ? "#0d1922" : "#dfe6ec";
  const mid = dark ? "#1d3442" : "#f7fafb";
  g.addColorStop(0, deep);
  g.addColorStop(0.45 + rand() * 0.2, mid);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // One band of accent per plate, at its own angle and depth.
  const glow = ctx.createRadialGradient(
    size * (0.2 + rand() * 0.6),
    size * (0.2 + rand() * 0.6),
    0,
    size * 0.5,
    size * 0.5,
    size * (0.5 + rand() * 0.4),
  );
  glow.addColorStop(0, `${hex}${dark ? "99" : "66"}`);
  glow.addColorStop(1, `${hex}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  /* Film grain. The source's plates are grainy on purpose — a flat gradient at
     this size reads as a UI panel, and the grain is what makes it a surface. */
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (rand() - 0.5) * 26;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);

  // A hairline round the plate, so it reads as an object with an edge rather
  // than as a patch of lighter ground.
  ctx.strokeStyle = `${hex}55`;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
  return canvas;
}

export default function HeadingRing() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent, sky } = useSite();
  const hex = accentHex(accent, sky);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dark = sky !== "day";
    const plates = Array.from({ length: PLATES }, (_, i) => makePlate(i, hex, dark));

    // The ring plane: u and v span it, z points at the viewer.
    const ax = (RING.axis * Math.PI) / 180;
    const cf = RING.ratio;
    const sf = Math.sqrt(1 - cf * cf);
    const U = [Math.cos(ax), Math.sin(ax), 0];
    const V = [-Math.sin(ax) * cf, Math.cos(ax) * cf, sf];
    // The ring's own axis, for the plate's second edge.
    const AXIS = [
      U[1] * V[2] - U[2] * V[1],
      U[2] * V[0] - U[0] * V[2],
      U[0] * V[1] - U[1] * V[0],
    ];

    let width = 0;
    let height = 0;
    let radius = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(width, height) * 0.52;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const project = (p: number[]) => {
      // Perspective, not a squashed circle: the far plates have to be smaller
      // as well as higher, or the ring reads as an ellipse drawn flat.
      const k = (radius * RING.dist) / (RING.dist - p[2]);
      return [width / 2 + k * p[0], height / 2 + k * p[1]];
    };

    let spin = 0;
    let speed = 0;
    let target = 0;
    let raf = 0;
    let running = false;
    let last = performance.now();
    let onScreen = false;

    const draw = (delta: number) => {
      // Comes up to speed when pointed at and settles back when left, rather
      // than snapping between still and turning.
      speed += (target - speed) * (1 - Math.exp(-2.2 * delta));
      spin += (delta * speed * Math.PI * 2) / REVOLUTION;

      ctx.clearRect(0, 0, width, height);

      const order = Array.from({ length: PLATES }, (_, i) => {
        const psi = (RING.phase * Math.PI) / 180 - (i * 2 * Math.PI) / PLATES + spin;
        const c = Math.cos(psi);
        const s = Math.sin(psi);
        return { i, psi, z: c * U[2] + s * V[2] };
      });
      // Painter's order: the far half is drawn first and passes behind.
      order.sort((a, b) => a.z - b.z);

      const half = RING.tile / 2;
      for (const { i, psi, z } of order) {
        const c = Math.cos(psi);
        const s = Math.sin(psi);
        const C = [c * U[0] + s * V[0], c * U[1] + s * V[1], c * U[2] + s * V[2]];
        const T = [-s * U[0] + c * V[0], -s * U[1] + c * V[1], -s * U[2] + c * V[2]];
        const p0 = project(C);
        const pT = project([C[0] + T[0] * half, C[1] + T[1] * half, C[2] + T[2] * half]);
        const pA = project([
          C[0] + AXIS[0] * half,
          C[1] + AXIS[1] * half,
          C[2] + AXIS[2] * half,
        ]);
        const ex = pT[0] - p0[0];
        const ey = pT[1] - p0[1];
        const fx = pA[0] - p0[0];
        const fy = pA[1] - p0[1];
        // Edge on: nothing to draw, and the transform would be singular.
        if (Math.abs(ex * fy - ey * fx) < 0.4) continue;

        const img = plates[i];
        const n = img.width;
        ctx.save();
        // The far half is dimmer, which is what gives the ring its depth.
        ctx.globalAlpha = z > 0 ? 0.72 : 0.3;
        ctx.setTransform(
          (ex * 2) / n,
          (ey * 2) / n,
          (fx * 2) / n,
          (fy * 2) / n,
          p0[0],
          p0[1],
        );
        const r = n * RING.radius;
        ctx.beginPath();
        ctx.roundRect(-n / 2, -n / 2, n, n, r);
        ctx.clip();
        ctx.drawImage(img, -n / 2, -n / 2);
        ctx.restore();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      raf = window.requestAnimationFrame(frame);
      const now = performance.now();
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(delta);
    };

    const start = () => {
      if (running || !onScreen || still) return;
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
    };

    const wake = () => {
      target = 1;
      start();
    };
    const rest = () => {
      target = 0;
    };
    host.addEventListener("pointerenter", wake);
    host.addEventListener("pointerleave", rest);

    const inView = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      if (onScreen) start();
      else stop();
    });
    inView.observe(host);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // One frame so the ring is there before anything moves.
    draw(0);

    return () => {
      stop();
      resizeObserver.disconnect();
      inView.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointerenter", wake);
      host.removeEventListener("pointerleave", rest);
    };
  }, [hex, sky]);

  return (
    <div ref={hostRef} className="ring" aria-hidden="true">
      <canvas ref={canvasRef} className="ring-canvas" />
    </div>
  );
}
