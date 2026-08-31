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
  tile: 0.3, // plate side, as a fraction of the ring radius
  radius: 0.22, // corner radius, as a fraction of the plate side
  dist: 13, // camera distance, in ring radii
  phase: 93, // where plate zero starts, degrees
};

/* Twelve plates, twelve colours.

   The source gives each of its twelve a field of its own — violet, white silk,
   deep blue, coral horizon, red chrome, pale plate — and that variety is the
   reason the ring reads as twelve objects turning rather than as one texture
   repeated. A single hue applied to all of them is a ring of identical tiles,
   which is a pattern, not a set.

   What is not taken is the source's own palette. Its twelve are a sampler for
   a gradient shop: beige, terracotta, chrome, magenta silk. These twelve are
   this site's — the voids and steels it is built on, its cyan through three
   values, its amber through three, and two pale plates for the punch the
   source gets from its white silk. Varied, and still from here.

   Two sets, because a plate has to be seen against the ground it is on: the
   dark ones would vanish into a bright sky and the pale ones into a dark one. */
const PALETTE = {
  night: [
    "#12202b",
    "#1b3040",
    "#0e5f7d",
    "#1789ad",
    "#35d2ff",
    "#24323d",
    "#7a4520",
    "#b3621f",
    "#ff9a45",
    "#b7c6cc",
    "#e8eef0",
    "#33454f",
  ],
  day: [
    "#dde7ec",
    "#b9c8d0",
    "#0a7ea8",
    "#0d9dcc",
    "#6fc8e4",
    "#93a6b1",
    "#a85200",
    "#d97a12",
    "#f0a862",
    "#2b3a44",
    "#16222b",
    "#eef3f6",
  ],
} as const;

/** Deterministic, so the ring is the same ring on every render and machine. */
function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** One octave of value noise, sampled with a smooth curve between cells. */
function octave(size: number, cells: number, rand: () => number) {
  const seed = Array.from({ length: cells * cells }, rand);
  const out = new Float32Array(size * size);
  const step = size / cells;
  for (let y = 0; y < size; y += 1) {
    const gy = y / step;
    const y0 = Math.floor(gy) % cells;
    const y1 = (y0 + 1) % cells;
    const fy = smoothstep(gy - Math.floor(gy));
    for (let x = 0; x < size; x += 1) {
      const gx = x / step;
      const x0 = Math.floor(gx) % cells;
      const x1 = (x0 + 1) % cells;
      const fx = smoothstep(gx - Math.floor(gx));
      const a = seed[y0 * cells + x0];
      const b = seed[y0 * cells + x1];
      const c = seed[y1 * cells + x0];
      const d = seed[y1 * cells + x1];
      out[y * size + x] = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    }
  }
  return out;
}

/** A plate's face: one flat colour, shaded by a noise field.
 *
 *  Shaded, not graded. A linear gradient has one direction and one smooth
 *  sweep, which at this size reads as a UI panel; a noise field has a
 *  thousand, which is what makes it a surface. It is also what the source
 *  does. */
function makePlate(index: number, hex: string, dark: boolean) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const rand = seeded(index + 1);
  const base = PALETTE[dark ? "night" : "day"][index % 12];
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);

  // Three octaves, each finer and quieter, summed into one field.
  const field = new Float32Array(size * size);
  let amplitude = 1;
  let sum = 0;
  for (const cells of [3, 7, 15]) {
    const layer = octave(size, cells, rand);
    for (let i = 0; i < field.length; i += 1) field[i] += layer[i] * amplitude;
    sum += amplitude;
    amplitude *= 0.5;
  }

  const image = ctx.createImageData(size, size);
  for (let i = 0; i < field.length; i += 1) {
    /* The field lifts and drops the plate around its own colour rather than
       toward black: a plate shaded into black stops being its colour, and the
       whole point of twelve of them is that they are twelve colours. */
    const n = field[i] / sum;
    const lift = 0.72 + n * 0.62;
    image.data[i * 4] = Math.min(255, r * lift);
    image.data[i * 4 + 1] = Math.min(255, g * lift);
    image.data[i * 4 + 2] = Math.min(255, b * lift);
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  // Film grain, over the shading rather than in it.
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 22;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  /* One thread back to the page: the edge carries the accent the section owns,
     so twelve different plates still read as belonging to this band. */
  ctx.strokeStyle = `${hex}44`;
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
    let cx = 0;
    let cy = 0;
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
      /* Seated on the headline, and sized from it.

         In the source the sentence sits inside the ring — that is the
         composition, not a ring parked next to some words. So the centre is
         the headline's own centre and the radius is derived from its box: wide
         enough that the ring clears the longest line, and tall enough that
         half the minor axis clears half the block. Measured rather than
         guessed, because the sentence is four lines in French and three in
         English, and it re-wraps at every width. */
      /* The sentence's own extents, not the element's — and not its lines'.

         An h1 is a block: its box is the full width of the column whatever the
         words do inside it. The copy is set flush left and runs to about two
         thirds, so a ring sized on the box is half again too wide and hangs
         off the screen.

         A range over the element's contents does not fix that, which cost me
         two passes to see: for block content getClientRects reports the *line
         boxes*, and a line box is as wide as the block regardless of how much
         ink is on it. Ranging each text node instead gives the glyphs
         themselves, which is what the ring has to be sized on. */
      const h1 = host.parentElement?.querySelector("h1");
      let box: DOMRect | undefined;
      if (h1) {
        const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        const rects: DOMRect[] = [];
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          range.selectNodeContents(node);
          for (const rect of Array.from(range.getClientRects())) {
            if (rect.width > 0 && rect.height > 0) rects.push(rect);
          }
        }
        if (rects.length > 0) {
          const left = Math.min(...rects.map((r) => r.left));
          const right = Math.max(...rects.map((r) => r.right));
          const top = Math.min(...rects.map((r) => r.top));
          const bottom = Math.max(...rects.map((r) => r.bottom));
          box = new DOMRect(left, top, right - left, bottom - top);
        } else {
          box = h1.getBoundingClientRect();
        }
      }
      if (box && box.width > 0) {
        cx = box.left - rect.left + box.width / 2;
        cy = box.top - rect.top + box.height / 2;
        /* Clearance, not containment. Sized to the sentence exactly, the ring
           ran along the block's own edge and the plates grazed the letters —
           a collision, not a ring holding a headline. These factors are the
           room around it, and they are what makes the sentence read as being
           inside something. */
        radius = Math.max(box.width * 0.74, (box.height / 2 / RING.ratio) * 1.24);
      } else {
        cx = width / 2;
        cy = height * 0.42;
        radius = Math.min(width * 0.54, height * 0.38);
      }
      // Never so large that the ring leaves the hero altogether.
      radius = Math.min(radius, width * 0.72, height * 0.42);
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
      return [cx + k * p[0], cy + k * p[1]];
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
    <div ref={hostRef} className="orbit" aria-hidden="true">
      <canvas ref={backRef} className="orbit-canvas" data-layer="back" />
      <canvas ref={frontRef} className="orbit-canvas" data-layer="front" />
    </div>
  );
}
