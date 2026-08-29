"use client";

import { useEffect, useRef } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";
import { WATER_FRAG, WATER_VERT } from "@/lib/water";

/* A room, not a carousel.

   These are drawings, and a drawing rewards looking rather than glancing. A
   ribbon turned them away as fast as it brought them round, curved them, and
   gave the reader nothing to stop on. Hung in a line, each under its own
   light and standing over its reflection, they read as work that was made
   rather than as pictures going past.

   The camera tracks along the wall as the section is scrolled through; the
   plates themselves do not move. Clicking one opens it at a size where the
   equipment names can be read — which is the whole reason they are here. */

/** Spacing between plates, in the same units the plates are sized in. */
const PITCH = 9.2;
const PLATE_W = 7.2;

export type RoomControls = { step: (direction: 1 | -1) => void } | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** A plate with nothing hung in it yet, drawn so it says so. */
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
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#8ea0a8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 52, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

/** The soft cone of light over a plate, and the pool it throws on the water. */
function makeHalo() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.4, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export default function GalleryRoom({
  sources,
  controlsRef,
  onFailed,
  onPick,
}: {
  sources: string[];
  controlsRef: React.RefObject<RoomControls>;
  onFailed?: () => void;
  onPick?: (slot: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent } = useSite();

  const accentRef = useRef(ACCENT_HEX.arc);
  const failedRef = useRef(onFailed);
  const pickRef = useRef(onPick);
  useEffect(() => {
    accentRef.current = ACCENT_HEX[accent];
    failedRef.current = onFailed;
    pickRef.current = onPick;
  }, [accent, onFailed, onPick]);

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
        failedRef.current?.();
        return;
      }
      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
      const CAM_Z = 13;
      camera.position.set(0, 0.4, CAM_Z);

      const room = new THREE.Group();
      scene.add(room);

      /* The same water as the hero, at the same fraction of the camera's
         distance below the axis, so the two scenes are one place. */
      const waterUniforms = {
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uIgnite: { value: 1 },
        uHalf: { value: new THREE.Vector2(1, 1) },
        uUnit: { value: 6.5 },
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
      const WATER_W = 320;
      const WATER_D = 120;
      const water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), waterMaterial);
      water.scale.set(WATER_W, WATER_D, 1);
      waterUniforms.uHalf.value.set(WATER_W / 2, WATER_D / 2);
      water.rotation.x = -Math.PI / 2;
      const WATERLINE = -CAM_Z * 0.227;
      water.position.y = WATERLINE;
      water.renderOrder = -1;
      scene.add(water);

      const loader = new THREE.TextureLoader();
      const halo = new THREE.CanvasTexture(makeHalo());
      const textures: import("three").Texture[] = [];
      const materials: import("three").Material[] = [];
      const plates: import("three").Mesh[] = [];

      const slots = Math.max(1, sources.length);
      const span = (slots - 1) * PITCH;

      for (let i = 0; i < slots; i += 1) {
        const src = sources[i];
        const texture = src
          ? loader.load(src)
          : new THREE.CanvasTexture(placeholderTexture(accentRef.current));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        textures.push(texture);

        const x = i * PITCH - span / 2;

        /* The drawings are 3:2 and the odd one is squarer. Hanging them all in
           the same box would letterbox some and crop others; each keeps its
           own proportion and they hang from a common top edge, the way work is
           actually hung. */
        const plate = new THREE.Mesh(
          new THREE.PlaneGeometry(PLATE_W, PLATE_W * 0.667),
          new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
        );
        plate.position.set(x, 0.9, 0);
        plate.userData.slot = i;
        room.add(plate);
        plates.push(plate);
        materials.push(plate.material as import("three").Material);

        // Its reflection: the same picture, upside down, dim and cut short.
        const mirror = new THREE.Mesh(
          new THREE.PlaneGeometry(PLATE_W, PLATE_W * 0.667),
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        mirror.scale.y = -1;
        // Mirrored about the waterline, then pushed a little further under so
        // it reads as reflected rather than as a second plate.
        mirror.position.set(x, WATERLINE * 2 - 0.9 - 0.5, 0);
        room.add(mirror);
        materials.push(mirror.material as import("three").Material);

        // The light over it, and the pool that light throws on the water.
        const cone = new THREE.Mesh(
          new THREE.PlaneGeometry(PLATE_W * 1.5, PLATE_W * 1.5),
          new THREE.MeshBasicMaterial({
            map: halo,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
        );
        cone.position.set(x, 0.9, -0.6);
        room.add(cone);
        materials.push(cone.material as import("three").Material);
      }

      const resize = () => {
        const bounds = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(bounds.width));
        const h = Math.max(1, Math.round(bounds.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* Where along the wall the camera is standing, 0..slots-1. Driven by how
         far the section has been scrolled through, so walking the room is the
         reader's own movement rather than something played at them. */
      let at = 0;
      let target = 0;
      let nudge = 0;
      let raf = 0;
      let running = false;
      let last = performance.now();
      let time = 0;
      let onScreen = false;
      let visible = !document.hidden;

      controlsRef.current = {
        step: (direction) => {
          nudge = clamp(nudge + direction, -(slots - 1), slots - 1);
          if (!running) draw(0);
        },
      };

      const sectionProgress = () => {
        const rect = host.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 as the room reaches the middle of the screen, 1 as it leaves it.
        const travel = rect.height + vh;
        return clamp((vh - rect.top) / travel, 0, 1);
      };

      function draw(delta: number) {
        time += delta;
        target = clamp(sectionProgress() * (slots - 1) + nudge, 0, slots - 1);
        at += (target - at) * (1 - Math.exp(-4.5 * delta || 0));

        const x = at * PITCH - span / 2;
        camera.position.x = x;
        camera.lookAt(x, 0.3, 0);

        // The water is a fixed sheet; only the viewer moves over it.
        water.position.x = x;
        waterUniforms.uTime.value = time;
        waterUniforms.uAccent.value.set(accentRef.current);

        renderer.render(scene, camera);
      }

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const now = performance.now();
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;
        draw(delta);
      };

      const start = () => {
        if (running || !onScreen || !visible) return;
        if (reduced) {
          draw(0);
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
        const hit = raycaster.intersectObjects(plates, false)[0];
        if (hit) pickRef.current?.(hit.object.userData.slot as number);
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);

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

      draw(0);

      cleanup = () => {
        stop();
        controlsRef.current = null;
        resizeObserver.disconnect();
        inView.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        room.clear();
        for (const plate of plates) plate.geometry.dispose();
        for (const material of materials) material.dispose();
        for (const texture of textures) texture.dispose();
        halo.dispose();
        water.geometry.dispose();
        waterMaterial.dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      console.error("[GalleryRoom]", error);
      if (!disposed) failedRef.current?.();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [sources, controlsRef]);

  return (
    <div ref={hostRef} className="room" role="img" aria-label="Galerie">
      <canvas ref={canvasRef} className="room-canvas" aria-hidden="true" />
    </div>
  );
}
