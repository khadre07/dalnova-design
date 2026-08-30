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
   revolution, and painter-ordered draw.

   Not kept: the rest state. The source holds still until a pointer is over it,
   which suits a demo where the ring is the whole page and hovering it is the
   only thing to do. On a hero it is a switch nobody finds — the ring simply
   looks broken. It turns.

   Painter order across real type. The source draws far plates, then the
   headline, then near plates, so the ring passes through the sentence rather
   than around it — that crossing is the effect. Keeping the H1 in the DOM
   would normally cost it, since a canvas is one layer and text cannot be
   inside it. So there are two canvases: the far half draws on one that sits
   behind the copy, the near half on one that sits in front, and the real
   sentence is the filling. Same order as the source, same crossing, and the
   type is still type.

   The front layer is tied to the turn: at rest it is empty, so a plate can
   never be parked over a word for someone who only came to read. It arrives
   as the ring comes up to speed and leaves as it settles. */

const PLATES = 12;
/** One revolution, in seconds.

    The source turns in 15.015, and there the ring is the whole page: it fills
    the frame, its plates are opaque, and there is nothing else moving to
    measure it against. Behind a headline, at the value these plates are held
    to, that same speed reads as a still image — the ring looked broken rather
    than slow. Eleven seconds is still background and is unmistakably motion. */
const REVOLUTION = 11;
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
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const { accent, sky } = useSite();
  const hex = accentHex(accent, sky);

  useEffect(() => {
    const host = hostRef.current;
    const backCanvas = backRef.current;
    const frontCanvas = frontRef.current;
    if (!host || !backCanvas || !frontCanvas) return;

    const back = backCanvas.getContext("2d", { alpha: true });
    const front = frontCanvas.getContext("2d", { alpha: true });
    if (!back || !front) return;

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
      for (const [canvas, ctx] of [
        [backCanvas, back],
        [frontCanvas, front],
      ] as const) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      /* The host is now the whole hero rather than a box sized around the
         ring, so the ring's own size and seat are stated here. The centre sits
         above the middle, on the headline; the radius lets the far plates
         leave the measure instead of stacking against its edge. */
      radius = Math.min(width * 0.54, height * 0.38);
    };
    resize();
    /* A resize has to repaint. At rest the frame loop is not running, so the
       observer's first callback — which arrives after the opening paint —
       would otherwise resize the canvas, which clears it, and leave an empty
       ring until someone happened to point at the hero. */
    const resizeObserver = new ResizeObserver(() => {
      resize();
      repaint();
    });
    resizeObserver.observe(host);

    const project = (p: number[]) => {
      // Perspective, not a squashed circle: the far plates have to be smaller
      // as well as higher, or the ring reads as an ellipse drawn flat.
      const k = (radius * RING.dist) / (RING.dist - p[2]);
      return [width / 2 + k * p[0], height * 0.42 + k * p[1]];
    };

    let spin = 0;
    let speed = 0;
    /* Always turning. Eased up from nothing so the ring arrives with the copy
       instead of being already in motion when the page appears. */
    const target = 1;
    let raf = 0;
    let running = false;
    let last = performance.now();
    let onScreen = false;
    // Set once draw is defined; resize can fire before that.
    let repaint = () => {};

    const draw = (delta: number) => {
      // Eased rather than switched on, so the opening is a start and not a
      // jump. Frame-rate independent: the same rise at 60 Hz and at 144 Hz.
      speed += (target - speed) * (1 - Math.exp(-2.6 * delta));
      spin += (delta * speed * Math.PI * 2) / REVOLUTION;

      back.clearRect(0, 0, width, height);
      front.clearRect(0, 0, width, height);

      const order = Array.from({ length: PLATES }, (_, i) => {
        const psi = (RING.phase * Math.PI) / 180 - (i * 2 * Math.PI) / PLATES + spin;
        const c = Math.cos(psi);
        const s = Math.sin(psi);
        return { i, psi, z: c * U[2] + s * V[2] };
      });
      // Painter's order, as in the source. Here it also decides which of the
      // two canvases a plate lands on, which is what puts the sentence between
      // the halves instead of on top of both.
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
        const near = z > 0;
        const ctx = near ? front : back;
        ctx.save();
        // The far half is dimmer, which is what gives the ring its depth.
        ctx.globalAlpha = near ? 0.78 : 0.42;
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
      back.globalAlpha = 1;
      front.globalAlpha = 1;
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

    const inView = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      if (onScreen) start();
      else stop();
    });
    inView.observe(host);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    repaint = () => draw(0);
    // One frame so the ring is there before anything moves.
    draw(0);

    return () => {
      stop();
      resizeObserver.disconnect();
      inView.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hex, sky]);

  return (
    <div ref={hostRef} className="ring" aria-hidden="true">
      <canvas ref={backRef} className="ring-canvas" data-layer="back" />
      <canvas ref={frontRef} className="ring-canvas" data-layer="front" />
    </div>
  );
}
