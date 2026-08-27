"use client";

import { useEffect, useRef } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";

/* A ribbon of curved panels turning on a vertical rail.

   Adapted from the ThreeUI Gallery, with three changes that were not optional:

   - The reference is written against three r149 and uses `outputEncoding` and
     `texture.encoding` with `sRGBEncoding`. Both were removed from three; this
     project is on 0.185, where the equivalent is `outputColorSpace` and
     `texture.colorSpace`. Copied verbatim it would have rendered washed out.

   - The reference stacks sixteen panels vertically, which suits a tall hero.
     This band is wide and short, so the panels sit around the cylinder instead
     of up it — the same device, turned ninety degrees to fit the room it is in.

   - It rotates on its own, but it also answers the section's arrows. A gallery
     you cannot stop on the picture you want is a screensaver.

   The panels themselves are decoration: the real list stays in the DOM behind
   this, which is what a screen reader, a search engine, and anyone without
   WebGL actually get. */

const PANELS = 10;
/** Radians between panel centres. */
const STEP = (Math.PI * 2) / PANELS;

export type RibbonControls = { step: (direction: 1 | -1) => void } | null;

function placeholderTexture(index: number, hex: string) {
  const w = 512;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#121b24";
  ctx.fillRect(0, 0, w, h);

  // The same hatching the flat frames use: this is an empty slot, and it says so.
  ctx.strokeStyle = "rgba(94, 104, 112, 0.55)";
  ctx.lineWidth = 3;
  for (let x = -h; x < w; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + h, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = hex;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#c3d2d8";
  ctx.textAlign = "center";
  ctx.font = "700 108px ui-monospace, monospace";
  ctx.fillText(String(index + 1).padStart(2, "0"), w / 2, h / 2 + 38);

  return canvas;
}

export default function GalleryRibbon({
  sources,
  controlsRef,
}: {
  /** One entry per slot. An empty string means nothing has been dropped in. */
  sources: string[];
  controlsRef: React.RefObject<RibbonControls>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent } = useSite();

  const accentRef = useRef(ACCENT_HEX.arc);
  useEffect(() => {
    accentRef.current = ACCENT_HEX[accent];
  }, [accent]);

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
        return;
      }
      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 8.4);

      const ribbon = new THREE.Group();
      scene.add(ribbon);

      const radius = 5;
      // A gap between panels, so the ribbon reads as separate pictures rather
      // than as one wrapped image.
      const arc = STEP * 0.82;
      const geometry = new THREE.CylinderGeometry(radius, radius, 2.2, 48, 1, true, 0, arc);

      const loader = new THREE.TextureLoader();
      const textures: import("three").Texture[] = [];
      const materials: import("three").MeshBasicMaterial[] = [];

      for (let i = 0; i < PANELS; i += 1) {
        const src = sources[i % Math.max(1, sources.length)] ?? "";
        let texture: import("three").Texture;
        if (src) {
          texture = loader.load(src);
        } else {
          texture = new THREE.CanvasTexture(
            placeholderTexture(i % Math.max(1, sources.length), accentRef.current),
          );
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        textures.push(texture);

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          /* FrontSide, not BackSide. Looking at the inside of the cylinder
             showed every panel mirrored — the numbers came out backwards — and
             curved them the wrong way, away from the viewer instead of toward.
             The far half culls itself, which is also one less thing to draw. */
          side: THREE.FrontSide,
          transparent: true,
          opacity: 0.92,
          toneMapped: false,
        });
        materials.push(material);

        const panel = new THREE.Mesh(geometry, material);
        // Centre each panel's arc on its own slot around the rail.
        panel.rotation.y = i * STEP - arc / 2;
        ribbon.add(panel);
      }

      const resize = () => {
        const rect = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let angle = 0;
      let target = 0;
      let raf = 0;
      let running = false;
      let last = performance.now();
      let onScreen = false;
      let visible = !document.hidden;

      controlsRef.current = {
        step: (direction) => {
          // Snap to the next whole slot, so a press always lands on a picture.
          target = Math.round(target / STEP) * STEP + direction * STEP;
        },
      };

      const draw = () => {
        ribbon.rotation.y = angle;
        ribbon.position.y = Math.sin(angle * 0.7) * 0.12;
        renderer.render(scene, camera);
      };

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const now = performance.now();
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        // Drifts on its own, and eases onto whatever the arrows asked for.
        target += delta * 0.16;
        angle += (target - angle) * (1 - Math.exp(-4 * delta));
        draw();
      };

      const start = () => {
        if (running || reduced || !onScreen || !visible) return;
        running = true;
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        window.cancelAnimationFrame(raf);
      };

      const inView = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          if (onScreen) start();
          else stop();
        },
        { threshold: 0 },
      );
      inView.observe(host);

      const onVisibility = () => {
        visible = !document.hidden;
        if (visible) start();
        else stop();
      };
      document.addEventListener("visibilitychange", onVisibility);

      // A still frame for reduced motion: the ribbon exists, it just holds.
      draw();

      cleanup = () => {
        stop();
        controlsRef.current = null;
        inView.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        geometry.dispose();
        for (const m of materials) m.dispose();
        for (const t of textures) t.dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      console.error("[GalleryRibbon]", error);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [sources, controlsRef]);

  return (
    <div ref={hostRef} className="ribbon" aria-hidden="true">
      <canvas ref={canvasRef} className="ribbon-canvas" />
    </div>
  );
}
