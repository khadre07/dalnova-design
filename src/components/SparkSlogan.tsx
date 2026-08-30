"use client";

import { useEffect, useRef } from "react";
import { accentHex, useSite } from "@/lib/site-state";

/* The slogan, drawn in embers, in rain.

   Adapted from the ThreeUI spark badge, cut down hard. The original builds a
   lanyard, a credential card and everything printed on it — a wordmark plate,
   an edition code, a portrait window, a name plate, a QR block — then carves
   all of it out so the edges emit. Every one of those is scaffolding for a
   badge this page does not have.

   What is kept is the engine: a curl field, embers born on the edges of a
   silhouette and pushed outward along it, and rain falling across the frame at
   a fixed angle. What is replaced is the silhouette. It is the sentence, so
   the thing rebuilding itself out of sparks is the thing the company says.

   The sentence is also in the DOM behind this, because a canvas says nothing
   to a search engine or a screen reader. */

/** Emitters, embers and rain. Scaled by stage size in the layout below. */
const EDGE_STEP = 3;
const EMBERS = 2600;
const DROPS = 90;

type Field = { cx: Float32Array; cy: Float32Array; n: number };

/** A tileable smooth field, and its curl. Built once. */
function makeCurl(seed: number, n = 128): Field {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const m = n - 1;
  const a = new Float32Array(n * n);
  const b = new Float32Array(n * n);
  for (let i = 0; i < n * n; i += 1) a[i] = rand();
  // Box-blurred both ways, twice: cheap, and smooth enough that the curl below
  // has no steps in it.
  const R = 4;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < n; y += 1) {
      const o = y * n;
      for (let x = 0; x < n; x += 1) {
        let sum = 0;
        for (let k = -R; k <= R; k += 1) sum += a[o + ((x + k) & m)];
        b[o + x] = sum / (2 * R + 1);
      }
    }
    for (let x = 0; x < n; x += 1) {
      for (let y = 0; y < n; y += 1) {
        let sum = 0;
        for (let k = -R; k <= R; k += 1) sum += b[(((y + k) & m) * n) + x];
        a[y * n + x] = sum / (2 * R + 1);
      }
    }
  }
  const cx = new Float32Array(n * n);
  const cy = new Float32Array(n * n);
  let peak = 0;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      // Curl of a scalar potential: (dP/dy, -dP/dx). Divergence-free, which is
      // what keeps embers swirling instead of piling up.
      const dy = a[(((y + 2) & m) * n) + x] - a[(((y - 2 + n) & m) * n) + x];
      const dx = a[y * n + ((x + 2) & m)] - a[y * n + ((x - 2 + n) & m)];
      cx[y * n + x] = dy;
      cy[y * n + x] = -dx;
      peak = Math.max(peak, Math.abs(dy) + Math.abs(dx));
    }
  }
  const k = 1.9 / (peak || 1);
  for (let i = 0; i < n * n; i += 1) {
    cx[i] *= k;
    cy[i] *= k;
  }
  return { cx, cy, n };
}

export default function SparkSlogan({ lines }: { lines: string[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent, sky } = useSite();

  const hexRef = useRef("#35d2ff");
  useEffect(() => {
    hexRef.current = accentHex(accent, sky);
  }, [accent, sky]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const field = makeCurl(0x1234);

    let width = 0;
    let height = 0;
    let dpr = 1;

    /* Edge points of the sentence, with the outward normal at each. Built by
       rasterising the type once and reading the alpha gradient — the same way
       the original finds the outline of its badge. */
    let ex = new Float32Array(0);
    let ey = new Float32Array(0);
    let enx = new Float32Array(0);
    let eny = new Float32Array(0);
    let edges = 0;

    const buildEdges = () => {
      const off = document.createElement("canvas");
      off.width = Math.max(2, Math.round(width));
      off.height = Math.max(2, Math.round(height));
      const g = off.getContext("2d");
      if (!g) return;

      const size = Math.min(width / 13, height / (lines.length * 1.5));
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `700 ${size}px "Archivo", system-ui, sans-serif`;
      const lead = size * 1.02;
      const top = height / 2 - ((lines.length - 1) * lead) / 2;
      lines.forEach((line, i) => g.fillText(line.toUpperCase(), width / 2, top + i * lead));

      const data = g.getImageData(0, 0, off.width, off.height).data;
      const w = off.width;
      const h = off.height;
      const xs: number[] = [];
      const ys: number[] = [];
      const nxs: number[] = [];
      const nys: number[] = [];
      for (let y = 2; y < h - 2; y += EDGE_STEP) {
        for (let x = 2; x < w - 2; x += EDGE_STEP) {
          const i = (y * w + x) * 4 + 3;
          const gx = data[i + 4 * 2] - data[i - 4 * 2];
          const gy = data[i + w * 4 * 2] - data[i - w * 4 * 2];
          const m = Math.hypot(gx, gy);
          if (m < 60) continue;
          xs.push(x);
          ys.push(y);
          // Outward, away from the glyph.
          nxs.push(-gx / m);
          nys.push(-gy / m);
        }
      }
      ex = Float32Array.from(xs);
      ey = Float32Array.from(ys);
      enx = Float32Array.from(nxs);
      eny = Float32Array.from(nys);
      edges = xs.length;
    };

    const embers = {
      x: new Float32Array(EMBERS),
      y: new Float32Array(EMBERS),
      dx: new Float32Array(EMBERS),
      dy: new Float32Array(EMBERS),
      life: new Float32Array(EMBERS),
      max: new Float32Array(EMBERS),
      speed: new Float32Array(EMBERS),
    };
    const drops = {
      x: new Float32Array(DROPS),
      y: new Float32Array(DROPS),
      len: new Float32Array(DROPS),
      speed: new Float32Array(DROPS),
    };

    // The rain leans, and the embers drift with it. One angle for both, or the
    // two read as two weathers in one frame.
    const WIND = { x: Math.cos(1.05), y: Math.sin(1.05) };

    const seedEmber = (i: number, mid: boolean) => {
      if (edges === 0) return;
      const e = (Math.random() * edges) | 0;
      embers.x[i] = ex[e];
      embers.y[i] = ey[e];
      const spin = (Math.random() - 0.5) * 1.4;
      embers.dx[i] = enx[e] * Math.cos(spin) - eny[e] * Math.sin(spin);
      embers.dy[i] = enx[e] * Math.sin(spin) + eny[e] * Math.cos(spin);
      embers.speed[i] = 6 + Math.pow(Math.random(), 2) * 46;
      embers.max[i] = 0.5 + Math.random() * 1.5;
      embers.life[i] = mid ? Math.random() * embers.max[i] : embers.max[i];
    };
    const seedDrop = (i: number, mid: boolean) => {
      drops.len[i] = height * (0.05 + Math.random() * 0.16);
      drops.speed[i] = height * (0.5 + Math.random() * 0.7);
      drops.x[i] = Math.random() * (width + height) - height * 0.5;
      drops.y[i] = mid ? Math.random() * height : -drops.len[i];
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildEdges();
      for (let i = 0; i < EMBERS; i += 1) seedEmber(i, true);
      for (let i = 0; i < DROPS; i += 1) seedDrop(i, true);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const curl = (x: number, y: number, out: [number, number], t: number) => {
      const n = field.n;
      const m = n - 1;
      const fx = ((x / width) * 2.2 + t * 0.02) * n;
      const fy = ((y / height) * 2.2 - t * 0.03) * n;
      const i = ((Math.floor(fy) & m) * n + (Math.floor(fx) & m)) | 0;
      out[0] = field.cx[i];
      out[1] = field.cy[i];
    };

    let raf = 0;
    let running = false;
    let last = performance.now();
    let time = 0;
    let onScreen = false;
    const v: [number, number] = [0, 0];

    const draw = (delta: number) => {
      time += delta;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = hexRef.current;
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";

      // The rain first, behind the sentence it is falling through.
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      for (let i = 0; i < DROPS; i += 1) {
        drops.x[i] += WIND.x * drops.speed[i] * delta;
        drops.y[i] += WIND.y * drops.speed[i] * delta;
        if (drops.y[i] - drops.len[i] > height) seedDrop(i, false);
        ctx.moveTo(drops.x[i], drops.y[i]);
        ctx.lineTo(drops.x[i] - WIND.x * drops.len[i], drops.y[i] - WIND.y * drops.len[i]);
      }
      ctx.stroke();

      /* The embers. Each is drawn as its own motion blur — a short tick along
         where it is going — rather than as a dot, which is what makes a still
         frame read as movement instead of as confetti. */
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      for (let i = 0; i < EMBERS; i += 1) {
        embers.life[i] -= delta;
        if (embers.life[i] <= 0) {
          seedEmber(i, false);
          continue;
        }
        const age = 1 - embers.life[i] / embers.max[i];
        curl(embers.x[i], embers.y[i], v, time);
        const bend = 0.3 + age * 1.2;
        let dx = embers.dx[i] * (1 - age * 0.5) + WIND.x * 0.4 + v[0] * bend;
        let dy = embers.dy[i] * (1 - age * 0.5) + WIND.y * 0.4 + v[1] * bend;
        const m = Math.hypot(dx, dy) || 1;
        dx /= m;
        dy /= m;
        const step = embers.speed[i] * delta;
        const nx = embers.x[i] + dx * step;
        const ny = embers.y[i] + dy * step;
        // Brightest as it leaves the letter, gone by the time it is far from it.
        const tick = 1.6 + (1 - age) * 4.5;
        ctx.moveTo(embers.x[i], embers.y[i]);
        ctx.lineTo(embers.x[i] + dx * tick, embers.y[i] + dy * tick);
        embers.x[i] = nx;
        embers.y[i] = ny;
        embers.dx[i] = dx;
        embers.dy[i] = dy;
      }
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = () => {
      raf = window.requestAnimationFrame(frame);
      const now = performance.now();
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(delta);
    };

    const start = () => {
      if (running || !onScreen) return;
      if (still) {
        draw(0.016);
        return;
      }
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

    /* Freshly seeded embers all sit exactly on the outline, so an unwarmed
       first frame is a bare word. Run it forward before anything is shown. */
    for (let n = 0; n < 24; n += 1) draw(1 / 30);

    return () => {
      stop();
      resizeObserver.disconnect();
      inView.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lines]);

  return (
    <div ref={hostRef} className="spark">
      <canvas ref={canvasRef} className="spark-canvas" aria-hidden="true" />
      {/* The sentence itself, for everything that cannot read a canvas. */}
      <p className="sr-only">{lines.join(" ")}</p>
    </div>
  );
}
