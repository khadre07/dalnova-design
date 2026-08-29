"use client";

import { useEffect, useRef } from "react";
import { useSite } from "@/lib/site-state";

/* Below the surface.

   He stands in water at the top of the page. Scroll past him and the page goes
   under: caustics crawl over everything, shafts come down from where the
   surface was, and motes drift up past the reader. Nothing here is a picture of
   water — it is the three things you actually see under it, and they are drawn
   over the figure rather than behind him, because from down here he is on the
   far side of it.

   One 2D canvas, no second WebGL context, and the whole thing is weighted by
   how deep the scroll has gone: at the top of the page it costs a comparison
   and returns. */

/** Scroll fraction at which the surface is broken, and where full depth is. */
const SURFACE = 0.08;
const DEEP = 0.42;
/** Drifting motes. */
const MOTES = 46;

type Mote = { x: number; y: number; r: number; speed: number; sway: number; seed: number };

/** A tile of caustic filaments, generated once. Summed sines sharpened by a
 *  power — the cheapest thing that reads as light bent through moving water. */
function makeCaustic(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(size, size);
  const k = (Math.PI * 2) / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Whole numbers of cycles across the tile, or the edges do not meet.
      const v =
        Math.sin(x * k * 7) +
        Math.sin(y * k * 9) +
        Math.sin((x + y) * k * 6) +
        Math.sin((x - y) * k * 5);
      // Sharper, and at higher frequency: caustics are filaments, and a gentle
      // power over low frequencies gives soft blobs instead.
      const c = Math.pow(Math.max(0, v / 4 + 0.34), 8);
      const i = (y * size + x) * 4;
      image.data[i] = 190;
      image.data[i + 1] = 240;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.min(255, c * 900);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export default function Depths() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { progressRef } = useSite();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Desktop, moving-pictures-allowed only — the same bargain the rest of the
       scene makes. On a phone the figure is already behind the copy at a fifth
       of its opacity, and there is no surface to have gone under. */
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let teardown: (() => void) | null = null;

    const run = () => {
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

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

      const caustic = makeCaustic(256);

      const motes: Mote[] = Array.from({ length: MOTES }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.7 + Math.random() * 2.1,
        speed: 0.012 + Math.random() * 0.03,
        sway: 6 + Math.random() * 22,
        seed: Math.random() * 100,
      }));

      let raf = 0;
      let running = false;
      let last = performance.now();
      let time = 0;

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const now = performance.now();
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        /* How far under we are. Nothing is drawn above the surface, which is
           most of the hero — the loop stays alive for the clock and returns. */
        const depth = Math.max(
          0,
          Math.min(1, (progressRef.current - SURFACE) / (DEEP - SURFACE)),
        );
        if (depth <= 0.002) {
          ctx.clearRect(0, 0, width, height);
          return;
        }
        time += delta;

        ctx.clearRect(0, 0, width, height);

        /* Light only. The layer sits over the copy — the sections below the
           hero carry opaque grounds, and behind them the water would have been
           hidden for most of the descent — so it may add and never darken.
           Which is also what being under water looks like: everything you can
           see down there is light arriving, not shade being cast. */
        ctx.globalCompositeOperation = "lighter";

        /* A cast of colour over everything, deepening with the descent. */
        const column = ctx.createLinearGradient(0, 0, 0, height);
        column.addColorStop(0, `rgba(20, 74, 96, ${0.13 * depth})`);
        column.addColorStop(1, `rgba(6, 30, 46, ${0.05 * depth})`);
        ctx.fillStyle = column;
        ctx.fillRect(0, 0, width, height);

        /* Shafts from where the surface was. They lean, and they lean back:
           light coming through a moving ceiling does not hold still. */
        for (let i = 0; i < 4; i += 1) {
          const at = ((i + 0.5) / 4) * width;
          const lean = Math.sin(time * 0.28 + i * 1.7) * 90;
          const wide2 = 90 + Math.sin(time * 0.21 + i) * 26;
          const shaft = ctx.createLinearGradient(0, 0, 0, height);
          shaft.addColorStop(0, `rgba(150, 226, 255, ${0.075 * depth})`);
          shaft.addColorStop(1, "rgba(150, 226, 255, 0)");
          ctx.fillStyle = shaft;
          ctx.beginPath();
          ctx.moveTo(at - wide2 * 0.35, -20);
          ctx.lineTo(at + wide2 * 0.35, -20);
          ctx.lineTo(at + wide2 + lean, height);
          ctx.lineTo(at - wide2 + lean, height);
          ctx.closePath();
          ctx.fill();
        }

        /* Caustics. Two passes of the same tile at different scales and speeds:
           one alone slides, two crossing shimmer. */
        for (const [i, s] of [0.85, 0.5].entries()) {
          const size = 256 * s;
          const dx = (time * (14 + i * 21)) % size;
          const dy = (time * (9 - i * 5)) % size;
          ctx.globalAlpha = (i === 0 ? 0.115 : 0.075) * depth;
          for (let y = -size + dy; y < height; y += size) {
            for (let x = -size + dx; x < width; x += size) {
              ctx.drawImage(caustic, x, y, size, size);
            }
          }
        }

        // Motes, going up. Everything that is not us goes up down here.
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(198, 234, 250, ${0.34 * depth})`;
        for (const mote of motes) {
          mote.y -= mote.speed * delta;
          if (mote.y < -0.03) {
            mote.y = 1.03;
            mote.x = Math.random();
          }
          const x = mote.x * width + Math.sin(time * 0.5 + mote.seed) * mote.sway;
          ctx.beginPath();
          ctx.arc(x, mote.y * height, mote.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
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
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        ctx.clearRect(0, 0, width, height);
      };
    };

    const sync = () => {
      const wanted = wide.matches && !still.matches;
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
  }, [progressRef]);

  return <canvas ref={canvasRef} className="depths" aria-hidden="true" />;
}
