"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";
import {
  Conduits,
  ConduitLabels,
  EyeBeam,
  type Box,
} from "./RobotStage";

export const MODEL_URL = "/robot.glb";

/** Materials whose name looks like a light source get the accent pushed into
 *  their emissive channel, so the eyes and reactor follow the section colour
 *  the same way the flat version does. */
const EMISSIVE_NAME = /eye|iris|core|reactor|glow|emis|led|light|lamp/i;

export default function RobotModelStage({ onFailed }: { onFailed?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamL = useRef<HTMLDivElement>(null);
  const beamR = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  const { accent, progress } = useSite();
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  const target = useRef({ accent: ACCENT_HEX.arc, progress: 0 });
  useEffect(() => {
    target.current = { accent: ACCENT_HEX[accent], progress };
  }, [accent, progress]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
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
        return;
      }

      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // Chrome blows out fast under a linear response; ACES holds the highlights
      // on the shoulders and keeps the dark panels from crushing to pure black.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const scene = new THREE.Scene();

      /* A brushed-metal figure with nothing to reflect looks like grey plastic.
         RoomEnvironment builds a small studio in memory, so we get believable
         reflections without shipping an HDRI. */
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

      // Cool key from the front left, accent rim from behind right. The rim is
      // what draws his silhouette against the dark page.
      const key = new THREE.DirectionalLight(0xdff2ff, 2.1);
      key.position.set(-2.4, 2.6, 3.4);
      const rim = new THREE.DirectionalLight(ACCENT_HEX.arc, 3.4);
      rim.position.set(2.8, 1.4, -2.2);
      const fill = new THREE.DirectionalLight(0xff9a45, 0.55);
      fill.position.set(3.2, -0.6, 1.8);
      scene.add(key, rim, fill, new THREE.AmbientLight(0x2a3238, 0.7));

      const root = new THREE.Group();
      scene.add(root);

      let gltf;
      try {
        gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      } catch {
        if (!disposed) setFailed(true);
        renderer.dispose();
        pmrem.dispose();
        return;
      }
      if (disposed) {
        renderer.dispose();
        pmrem.dispose();
        return;
      }

      const model = gltf.scene;
      root.add(model);

      /* Normalise whatever we were handed. Generated models arrive at wildly
         different scales and origins, so the figure is measured, recentred on
         its own feet, and scaled to one unit tall before anything else. */
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const centre = bounds.getCenter(new THREE.Vector3());
      const unit = 1 / Math.max(size.y, 0.0001);
      model.position.set(-centre.x * unit, -centre.y * unit, -centre.z * unit);
      model.scale.setScalar(unit);

      const emissiveMeshes: import("three").Object3D[] = [];
      model.traverse((child) => {
        const mesh = child as import("three").Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const raw of materials) {
          const material = raw as import("three").MeshStandardMaterial;
          if (!material) continue;
          const named = `${material.name} ${mesh.name}`;
          if (EMISSIVE_NAME.test(named)) {
            material.emissive = new THREE.Color(ACCENT_HEX.arc);
            material.emissiveIntensity = 2.6;
            material.toneMapped = false;
            emissiveMeshes.push(mesh);
          }
        }
      });

      /* Beam anchors. Anything emissive in the top quarter of the figure is
         taken to be an eye; failing that, we aim at a point on the front of the
         head, which is right for a humanoid and harmless for anything else. */
      const localEyes: import("three").Vector3[] = [];
      const tmp = new THREE.Vector3();
      for (const mesh of emissiveMeshes) {
        const meshBounds = new THREE.Box3().setFromObject(mesh);
        meshBounds.getCenter(tmp);
        root.worldToLocal(tmp.clone());
        if (tmp.y > bounds.min.y + size.y * 0.72) {
          localEyes.push(new THREE.Vector3(tmp.x * unit, tmp.y * unit, tmp.z * unit));
        }
      }
      if (localEyes.length === 0) {
        localEyes.push(new THREE.Vector3(-0.035, 0.44, 0.09));
        localEyes.push(new THREE.Vector3(0.035, 0.44, 0.09));
      }
      if (localEyes.length === 1) {
        localEyes.push(localEyes[0].clone().setX(-localEyes[0].x));
      }

      // An idle clip, if the model brought one. Never a walk or a wave: he is
      // standing in a hero, not performing.
      const mixer = gltf.animations.length ? new THREE.AnimationMixer(model) : null;
      const idle =
        gltf.animations.find((clip) => /idle|breath|stand|loop/i.test(clip.name)) ??
        gltf.animations[0];
      if (mixer && idle && !reduced) mixer.clipAction(idle).play();

      let stage = { w: 1, h: 1 };
      let baseY = 0;
      let modelHeight = 1;

      const layout = () => {
        const rect = host.getBoundingClientRect();
        stage = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();

        const narrow = window.innerWidth < 1024;
        const fill = narrow ? 0.7 : 0.86;

        // Frame by distance rather than by scaling him: pull the camera back
        // until a unit-tall figure occupies `fill` of the viewport height.
        const vFov = (camera.fov * Math.PI) / 180;
        const distance = 1 / (2 * fill * Math.tan(vFov / 2));
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);

        baseY = narrow ? 0 : -0.03;
        modelHeight = fill;

        const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(stage.w, stage.h, false);

        const boxH = stage.h * fill;
        const boxW = boxH * Math.max(0.35, size.x / Math.max(size.y, 0.0001));
        setBox({
          left: (stage.w - boxW) / 2,
          top: (stage.h - boxH) / 2 - baseY * stage.h,
          width: boxW,
          height: boxH,
        });
      };

      layout();
      const resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(host);

      const pointer = { x: 0, y: 0 };
      const eased = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      };
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (finePointer && !reduced) {
        window.addEventListener("pointermove", onPointer, { passive: true });
      }

      const currentAccent = new THREE.Color(ACCENT_HEX.arc);
      const nextAccent = new THREE.Color();
      const eyeVec = new THREE.Vector3();
      const beamRefs = [beamL, beamR];
      let easedProgress = 0;
      let beamIntro = 0;
      let raf = 0;
      let running = true;
      let started = performance.now();
      let paused = 0;
      let last = performance.now();

      const placeOverlays = (turn: number) => {
        const facing = Math.cos(turn);
        const visible = Math.max(0, Math.min(1, (facing - 0.12) / 0.88));
        const frontOpacity = String(visible * beamIntro);
        if (frontRef.current) frontRef.current.style.opacity = frontOpacity;
        if (tagsRef.current) tagsRef.current.style.opacity = frontOpacity;

        for (const [i, local] of localEyes.slice(0, 2).entries()) {
          const node = beamRefs[i].current;
          if (!node) continue;
          if (visible <= 0.001) {
            node.style.opacity = "0";
            continue;
          }
          eyeVec.copy(local).applyMatrix4(root.matrixWorld).project(camera);
          const px = (eyeVec.x * 0.5 + 0.5) * stage.w;
          const py = (-eyeVec.y * 0.5 + 0.5) * stage.h;
          node.style.opacity = String(visible * beamIntro);
          node.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        }
      };

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const now = performance.now();
        const elapsed = (now - started) / 1000;
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        mixer?.update(delta);

        nextAccent.set(target.current.accent);
        currentAccent.lerp(nextAccent, 0.045);
        rim.color.copy(currentAccent);
        for (const mesh of emissiveMeshes) {
          const materials = Array.isArray((mesh as import("three").Mesh).material)
            ? ((mesh as import("three").Mesh).material as import("three").Material[])
            : [(mesh as import("three").Mesh).material as import("three").Material];
          for (const raw of materials) {
            const material = raw as import("three").MeshStandardMaterial;
            if (material?.emissive) material.emissive.copy(currentAccent);
          }
        }

        easedProgress += (target.current.progress - easedProgress) * 0.07;
        eased.x += (pointer.x - eased.x) * 0.05;
        eased.y += (pointer.y - eased.y) * 0.05;

        const ignite = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.4));
        renderer.toneMappingExposure = 0.45 + 0.7 * (ignite * ignite * (3 - 2 * ignite));
        beamIntro = Math.max(0, Math.min(1, (elapsed - 0.62) / 0.45));

        // A real model can turn all the way; the brief asked for a half turn
        // down the page, so that is what the scroll drives.
        const turn = easedProgress * Math.PI + Math.sin(elapsed * 0.24) * 0.08 + eased.x * 0.22;
        root.rotation.y = turn;
        root.rotation.x = eased.y * 0.04;
        root.position.y =
          baseY + Math.sin(elapsed * 0.55) * 0.008 - eased.y * 0.02 - easedProgress * 0.05;
        root.scale.setScalar(modelHeight * (1 - easedProgress * 0.09));

        root.updateMatrixWorld();
        placeOverlays(turn);
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

      if (reduced) {
        renderer.toneMappingExposure = 1.15;
        beamIntro = 1;
        root.rotation.y = 0.25;
        root.scale.setScalar(modelHeight);
        root.position.y = baseY;
        root.updateMatrixWorld();
        placeOverlays(0.25);
        renderer.render(scene, camera);
        running = false;
      } else {
        raf = window.requestAnimationFrame(frame);
      }

      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      const inView = new IntersectionObserver(
        ([entry]) => {
          if (reduced) return;
          if (entry.isIntersecting) start();
          else stop();
        },
        { threshold: 0 },
      );
      inView.observe(host);

      cleanup = () => {
        stop();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pointermove", onPointer);
        resizeObserver.disconnect();
        inView.disconnect();
        mixer?.stopAllAction();
        model.traverse((child) => {
          const mesh = child as import("three").Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) material?.dispose();
        });
        envRT.texture.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      console.error("[RobotModelStage]", error);
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced]);

  // Loading or drawing the model failed. Nothing is shown here: the parent is
  // told, and it puts the flat scene back rather than leaving a hole.
  useEffect(() => {
    if (failed) onFailed?.();
  }, [failed, onFailed]);

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

      <div
        className="pointer-events-none absolute inset-0 z-[15] hidden lg:block"
        aria-hidden="true"
      >
        <EyeBeam ref={beamL} accent={ACCENT_HEX[accent]} />
        <EyeBeam ref={beamR} accent={ACCENT_HEX[accent]} />
      </div>

      {box ? (
        <div ref={tagsRef} className="absolute inset-0 z-20" style={{ opacity: 0 }}>
          <ConduitLabels box={box} accent={ACCENT_HEX[accent]} />
        </div>
      ) : null}
    </div>
  );
}
