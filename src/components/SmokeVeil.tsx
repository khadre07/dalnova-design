"use client";

import { useEffect, useRef } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { accentHex, useSite } from "@/lib/site-state";
import { eachBlock, paintInk, setVeilLive } from "@/lib/veil";

/* Smoke that writes the copy.

   The technique is react-smoke's, not its package: large sprites carrying a
   *cloudy* texture, each turning slowly on its own axis. That is the whole
   difference between smoke and a row of soft dots — a radial gradient has one
   smooth edge and reads as a glow, a noise field has a thousand and reads as
   vapour. The package itself wants @react-three/fiber, which would put a
   second React renderer and a second WebGL context beside the robot's.

   The texture is generated here rather than shipped: value noise summed over
   four octaves, multiplied by a radial falloff so each puff dies at its own
   edge instead of ending on a square. */

/** Sprites alive at once. */
const MAX = 120;
/** How opaque the haze is drawn. The one number to turn if it reads too thick
 *  or too faint — it changes only how the smoke looks, never how quickly the
 *  copy is written, because the ink below is measured from the puffs' own
 *  density and not from what lands on the canvas. */
const HAZE = 0.17;
/** How quickly a block catches up to the ink laid on it, per second.
 *  Exponential, so the rise takes the same time at 60 Hz and at 144 Hz. */
const INK_RATE = 5;
/** Overlap-to-ink conversion, raised alongside every thinning of the haze so
 *  the copy still finishes being written as the smoke peaks. */
const INK_GAIN = 1.05;
/** A block waiting this long is written whether the smoke reached it or not.
 *  A page whose text depends on particles landing on it is a page that can end
 *  up with no text — this is the guarantee that it cannot. */
const GUARANTEE = 1.9;

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  life: number;
  max: number;
  size: number;
  grow: number;
  gain: number;
  density: number;
  radius: number;
};

/* ---------- procedural cloud texture ---------- */

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** One octave of value noise, sampled bilinearly with a smooth curve. */
function octave(size: number, cells: number, seed: number[]) {
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

function makeSmokeSprite(hex: string) {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Four octaves, each finer and quieter than the last.
  const field = new Float32Array(size * size);
  let amplitude = 1;
  let total = 0;
  for (const cells of [4, 8, 16, 32]) {
    const seed = Array.from({ length: cells * cells }, () => Math.random());
    const layer = octave(size, cells, seed);
    for (let i = 0; i < field.length; i += 1) field[i] += layer[i] * amplitude;
    total += amplitude;
    amplitude *= 0.55;
  }

  const image = ctx.createImageData(size, size);
  const half = size / 2;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      // Radial falloff, squared so the edge is soft rather than a disc.
      const fade = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const n = field[i] / total;
      const alpha = Math.pow(fade, 1.6) * Math.pow(n, 1.35);
      image.data[i * 4] = r;
      image.data[i * 4 + 1] = g;
      image.data[i * 4 + 2] = b;
      image.data[i * 4 + 3] = Math.min(255, alpha * 340);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export default function SmokeVeil() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent, sky } = useSite();

  const accentRef = useRef(ACCENT_HEX.arc);
  useEffect(() => {
    accentRef.current = accentHex(accent, sky);
  }, [accent, sky]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Desktop, moving-pictures-allowed only. On a phone the figure already
       sits behind the copy at a fifth of its opacity, and there is no band
       between them for smoke to cross. */
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let teardown: (() => void) | null = null;

    const run = () => {
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      document.documentElement.dataset.veil = "on";
      setVeilLive(true);

      let width = 0;
      let height = 0;
      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      let sprite = makeSmokeSprite(accentRef.current);
      let spriteHex = accentRef.current;

      const pool: Puff[] = [];

      /* Smoke simply present over the block, not fired at it from anywhere.
         Nothing travels in from the figure: the puffs are already there, they
         thin out, and the copy is what is left behind.

         Spread across the block's own area with a small margin, so the haze
         covers the text evenly instead of arriving as a front. */
      const bloom = (rect: DOMRect) => {
        const count = Math.min(18, Math.max(9, Math.round(rect.width / 44)));
        const padX = 70;
        const padY = 40;
        for (let i = 0; i < count; i += 1) {
          pool.push({
            x: rect.left - padX + Math.random() * (rect.width + padX * 2),
            y: rect.top - padY + Math.random() * (rect.height + padY * 2),
            // Barely moving. Ambient drift, the way smoke sits in still air —
            // any real speed would read as a direction, and there is none.
            vx: (Math.random() - 0.5) * 26,
            vy: -(6 + Math.random() * 18),
            angle: Math.random() * Math.PI * 2,
            // Slow turn, react-smoke's telltale: a puff that does not rotate
            // reads as a decal, however good its texture is.
            spin: (Math.random() - 0.5) * 0.34,
            life: 0,
            max: 2.4 + Math.random() * 1.5,
            // Wide and thin rather than small and dense: overlapping haze, not
            // a handful of clumps.
            size: 170 + Math.random() * 130,
            grow: 70 + Math.random() * 70,
            gain: 1,
            density: 0,
            radius: 0,
          });
        }
        while (pool.length > MAX) pool.shift();
      };

      const ink = (delta: number) => {
        const catchUp = 1 - Math.exp(-INK_RATE * delta);

        eachBlock((el, state) => {
          if (!state.active) {
            // Off screen: let it ebb back to nothing at the same rate it rose.
            if (state.ink <= 0.001) return;
            state.ink += (0 - state.ink) * catchUp;
            if (state.ink < 0.004) state.ink = 0;
            paintInk(el, state);
            return;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width === 0) return;

          if (!state.bloomed) {
            state.bloomed = true;
            bloom(rect);
          }

          if (state.ink >= 0.995) return;

          let cover = 0;
          for (let i = 0; i < pool.length; i += 1) {
            const p = pool[i];
            if (p.density <= 0.01) continue;
            const dx = Math.max(rect.left - p.x, 0, p.x - rect.right);
            const dy = Math.max(rect.top - p.y, 0, p.y - rect.bottom);
            if (dx >= p.radius || dy >= p.radius) continue;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d >= p.radius) continue;
            cover += p.density * (1 - d / p.radius);
          }

          state.waited += delta;
          const guaranteed = Math.min(1, Math.max(0, (state.waited - GUARANTEE) / 0.7));
          const target = Math.max(state.ink, Math.min(1, cover * INK_GAIN), guaranteed);
          state.ink += (target - state.ink) * catchUp;
          if (state.ink > 0.99) state.ink = 1;
          paintInk(el, state);
        });
      };

      let raf = 0;
      let running = false;
      let last = performance.now();

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const now = performance.now();
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (spriteHex !== accentRef.current) {
          sprite = makeSmokeSprite(accentRef.current);
          spriteHex = accentRef.current;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";

        for (let i = pool.length - 1; i >= 0; i -= 1) {
          const p = pool[i];
          p.life += delta;
          if (p.life >= p.max) {
            pool.splice(i, 1);
            continue;
          }

          const u = p.life / p.max;
          p.vx *= 1 - 0.25 * delta;
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.angle += p.spin * delta;

          p.radius = (p.size + p.grow * u) / 2;
          p.density = Math.sin(Math.PI * u) * p.gain;

          const alpha = p.density * HAZE;
          if (alpha <= 0.003) continue;

          ctx.globalAlpha = alpha;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.drawImage(sprite, -p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        ink(delta);
      };

      const start = () => {
        if (running) return;
        running = true;
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        window.cancelAnimationFrame(raf);
      };

      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);
      start();

      teardown = () => {
        stop();
        setVeilLive(false);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        delete document.documentElement.dataset.veil;
        ctx.clearRect(0, 0, width, height);
      };
    };

    const sync = () => {
      /* Not in daylight. The smoke is drawn in added light and the copy it
         writes is dark on a pale ground: adding light there both fails to show
         and works against the text it is meant to bring in. Under a bright sky
         the blocks simply fade in, which is what the plain reveal does. */
      const wanted = wide.matches && !still.matches && sky !== "day";
      if (wanted && !teardown) run();
      else if (!wanted && teardown) {
        teardown();
        teardown = null;
      }
    };

    sync();
    wide.addEventListener("change", sync);
    still.addEventListener("change", sync);

    return () => {
      wide.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
      teardown?.();
    };
  }, [sky]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="veil-canvas pointer-events-none fixed inset-0 z-20"
    />
  );
}
