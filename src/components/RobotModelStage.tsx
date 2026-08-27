"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";
import { presenceValue } from "@/lib/stage";
import { Conduits, type Box } from "./RobotStage";

export const MODEL_URL = "/robot.glb";

/** Seconds before he starts to come up, and how long the rise takes. */
const RISE_DELAY = 0.12;
const RISE_TIME = 2.6;
/** How far under he starts, in the normalised space where he is one unit tall
 *  and his feet rest at -0.5. Deep enough that the clip leaves nothing of him
 *  showing at the first frame. */
const RISE_FROM = -1.4;

/* The glow map that came with the model: black everywhere except the eyes,
   the reactor and the seams. Kept out of the .glb on purpose — held apart it
   can be multiplied by whichever accent the current section owns, which is
   what makes the figure answer the page instead of glowing one fixed colour. */
const EMISSIVE_URL = "/robot-emissive.png";

/** Materials whose name looks like a light source get the accent pushed into
 *  their emissive channel, so the eyes and reactor follow the section colour
 *  the same way the flat version does. */
const EMISSIVE_NAME = /eye|iris|core|reactor|glow|emis|led|light|lamp/i;

/* The water he is standing in.

   Dark water at night shows three things and almost nothing else: rings
   spreading from where something meets the surface, a vertical smear of
   whatever is lit above it, and the room's own pattern broken up on the
   swell. All three are drawn here in one plane rather than reflected for
   real — a true reflection means rendering the scene a second time every
   frame, and this page already runs a second WebGL context for the ribbon.

   The pattern being broken up is the page's own dot field. The grid behind
   the copy is #78a5b4 at 1px every 30px; here it is that same field, seen
   through moving water, so the flat page and the scene stay one idea. */
const WATER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WATER_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uAccent;
  uniform float uIgnite;
  /* How disturbed the surface is. Peaks as he breaks it, then settles. */
  uniform float uWake;
  /* Seconds since he broke the surface, for the ring that leaves it. */
  uniform float uWakeAge;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);

    /* Swell. Two crossing waves rather than one, so the surface never shows a
       single travelling direction — water in a still room does not. */
    float swell =
      sin(p.x * 5.0 + uTime * 0.7) * 0.5 +
      sin(p.y * 4.1 - uTime * 0.53) * 0.5;

    // Rings leaving his feet, dying out as they widen.
    float rings = sin(r * 22.0 - uTime * 1.5);
    rings = smoothstep(0.55, 1.0, rings) * exp(-r * 2.6);
    // Choppier while he is coming up through it.
    rings *= 1.0 + uWake * 2.6;

    /* The one big ring that leaves the surface when he breaks it. It travels
       outward, widens, and thins as it goes — a single event, not a loop. */
    float front = uWakeAge * 0.5;
    float wave = exp(-pow((r - front) * 4.2, 2.0));
    wave *= exp(-uWakeAge * 0.6) * smoothstep(0.0, 0.2, uWakeAge);

    /* The dot field, seen through the water. The lookup is displaced by the
       swell, which is what breaks the grid up instead of sliding it. */
    vec2 q = p;
    q.x += swell * 0.018;
    q.y += sin(p.x * 7.0 - uTime * 0.61) * 0.014;
    vec2 cell = fract(q * 13.0) - 0.5;
    float grid = smoothstep(0.16, 0.02, length(cell));
    // Perspective: the far half of the plane is nearly edge-on, so its dots
    // crowd together and read as haze rather than as points.
    grid *= smoothstep(1.0, 0.15, r) * (0.35 + 0.65 * (0.5 - p.y * 0.5));

    /* The reflection. Stretched toward the viewer and pinched away from him,
       the way a bright thing smears down the near face of a swell. */
    float away = p.y > 0.0 ? p.y * 5.0 : -p.y * 1.1;
    float smear = exp(-abs(p.x) * 5.5) * exp(-away * 1.5);
    // Broken along its length, or it reads as a painted stripe.
    smear *= 0.55 + 0.45 * sin(p.y * 26.0 - uTime * 1.9);

    // The pool of light he stands in, brightest just beyond his feet.
    float pool = exp(-r * 3.2) * (1.0 - exp(-r * 9.0));

    /* The swell over him on his way up. uWake is taken from how near his crown
       is to the surface, so this grows while he is still under it — the water
       lifts before he shows, which is the only thing standing between the
       reveal and a second of empty stage. */
    float bulge = exp(-r * 2.2) * uWake;

    float a = rings * 0.30 + grid * 0.16 + smear * 0.42 + pool * 0.40 + wave * 0.55 + bulge * 0.45;
    // Nothing survives to the edge, so the plane needs no horizon.
    a *= smoothstep(1.0, 0.22, r) * uIgnite;

    if (a <= 0.001) discard;
    gl_FragColor = vec4(uAccent * a, a);
  }
`;

export default function RobotModelStage({
  onFailed,
  onReady,
}: {
  onFailed?: () => void;
  /** Fired once the first frame is on screen, so the poster can step aside. */
  onReady?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  const { accent, progressRef } = useSite();
  /* Held in a ref so the scene effect never re-runs — and written from an
     effect, because a ref write during render is unsafe under concurrent
     rendering, where a render can be thrown away. */
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  const targetAccent = useRef(ACCENT_HEX.arc);
  useEffect(() => {
    targetAccent.current = ACCENT_HEX[accent];
  }, [accent]);

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

      /* Depth. Everything past him falls away into the page's own colour, so
         the scene has a behind rather than ending at a hard edge. Exponential
         rather than linear: it thickens with distance the way air does. */
      scene.fog = new THREE.FogExp2(0x05070a, 0.34);

      const waterUniforms = {
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uIgnite: { value: 0 },
        uWake: { value: 0 },
        uWakeAge: { value: 0 },
      };
      const waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        transparent: true,
        depthWrite: false,
        // Added rather than painted on: there is nothing underneath to cover.
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      // Segmented enough that nothing bands across it; it is one flat quad, so
      // the segments cost nothing worth measuring.
      const water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), waterMaterial);
      water.rotation.x = -Math.PI / 2;
      water.renderOrder = -1;
      /* In the scene, not in `root`. As his child the surface would rise with
         him, so he could never come out of it — and it would turn when he
         turns, which water does not. */
      scene.add(water);

      /* Everything below the surface is cut away. Without this a submerged
         figure still draws over the water — the plane is additive and writes
         no depth — so he would look like he was standing on it rather than in
         it. The plane's height is kept level with the surface every layout. */
      renderer.localClippingEnabled = true;
      const surface = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.502);

      // Started together: the glow map is small and there is no reason to pay
      // for it in series behind a four-megabyte model.
      const glowPromise = new THREE.TextureLoader()
        .loadAsync(EMISSIVE_URL)
        .catch(() => null);

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

      const glow = await glowPromise;
      if (glow) {
        glow.colorSpace = THREE.SRGBColorSpace;
        // glTF UVs count down from the top; three's loader default does not.
        glow.flipY = false;
        glow.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
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

      /* Normalised space puts his feet at -0.5. A hair below, or the plane
         fights the soles for the same pixels. */
      /* Wider than he is, so the water runs past him on every side rather than
         ending where he does. Normalised space puts his feet at -0.5; a hair
         below, or the surface fights the soles for the same pixels. */
      const spread = Math.max(3.2, (size.x / Math.max(size.y, 0.0001)) * 5.5);
      water.scale.set(spread, spread, 1);

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
          material.clippingPlanes = [surface];
          /* Two ways in. If a glow map came with the model it is the mask and
             every material takes it — this one arrives as a single mesh called
             "model", so a name-matching pass would have found nothing. Failing
             that, fall back to materials whose name reads like a light. */
          const named = `${material.name} ${mesh.name}`;
          if (glow) {
            material.emissiveMap = glow;
            material.emissive = new THREE.Color(ACCENT_HEX.arc);
            material.emissiveIntensity = 2.4;
            material.needsUpdate = true;
            emissiveMeshes.push(mesh);
          } else if (EMISSIVE_NAME.test(named)) {
            material.emissive = new THREE.Color(ACCENT_HEX.arc);
            material.emissiveIntensity = 2.6;
            material.toneMapped = false;
            emissiveMeshes.push(mesh);
          }
        }
      });

      // An idle clip, if the model brought one. Never a walk or a wave: he is
      // standing in a hero, not performing.
      const mixer = gltf.animations.length ? new THREE.AnimationMixer(model) : null;
      const idle =
        gltf.animations.find((clip) => /idle|breath|stand|loop/i.test(clip.name)) ??
        gltf.animations[0];
      if (mixer && idle && !reduced) mixer.clipAction(idle).play();

      let stage = { w: 1, h: 1 };
      let baseY = 0;
      /* Where the camera sits with the page at the top. The scroll dollies out
         from here rather than shrinking him: a camera pulling back reads as a
         shot, an object scaling down reads as a product configurator. */
      let baseDistance = 2;
      let unitPx = 1;
      /* Where the surface sits, and when he first came through it. Negative
         until he has. */
      let waterline = -0.502;
      let brokeAt = -1;

      const layout = () => {
        const rect = host.getBoundingClientRect();
        stage = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();

        const narrow = window.innerWidth < 1024;
        const frameFill = narrow ? 0.7 : 0.86;

        // Frame by distance rather than by scaling him: pull the camera back
        // until a unit-tall figure occupies `frameFill` of the viewport height.
        // The scale stays at 1 — applying frameFill here as well would square
        // it and leave the figure a head shorter than the flat scene's.
        const vFov = (camera.fov * Math.PI) / 180;
        const distance = 1 / (2 * frameFill * Math.tan(vFov / 2));
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);

        baseY = narrow ? 0 : -0.03;
        // The surface sits just under where his feet come to rest.
        waterline = baseY - 0.502;
        water.position.y = waterline;
        surface.constant = -waterline;
        baseDistance = distance;
        unitPx = stage.h * frameFill;

        /* Capped at 1.5 rather than 2. A PBR figure lit by an environment map
           costs fragments, and ratio 2 is four times the pixels of ratio 1 for
           a difference nobody can see on a figure this size. */
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        renderer.setPixelRatio(dpr);
        renderer.setSize(stage.w, stage.h, false);

        // baseY is in world units; the overlay is in pixels. The visible height
        // at this distance is 1 / frameFill, so this is the conversion.
        const pxPerUnit = stage.h * frameFill;
        const boxH = stage.h * frameFill;
        const boxW = boxH * Math.max(0.35, size.x / Math.max(size.y, 0.0001));
        setBox({
          left: (stage.w - boxW) / 2,
          top: (stage.h - boxH) / 2 - baseY * pxPerUnit,
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
      let easedProgress = 0;
      let overlayIntro = 0;
      /* Announced after a real render, not after the load resolves: the model
         is only genuinely there once a frame carrying it has been painted. */
      let announced = false;
      const announce = () => {
        if (announced) return;
        announced = true;
        readyRef.current?.();
      };

      let raf = 0;
      let running = true;
      let started = performance.now();
      let paused = 0;
      let last = performance.now();

      /* The conduits are positioned from a box measured once per layout. The
         camera dolly changes the figure's projected size after that, so the
         overlay is corrected by the same factor rather than being re-measured
         every frame — re-measuring would mean a React state write per frame. */
      const trackDolly = (dolly: number, lift: number) => {
        const correction = `scale(${(1 / dolly).toFixed(4)}) translateY(${(lift * unitPx).toFixed(1)}px)`;
        if (frontRef.current) frontRef.current.style.transform = correction;
      };

      const placeOverlays = (turn: number) => {
        const facing = Math.cos(turn);
        const visible = Math.max(0, Math.min(1, (facing - 0.12) / 0.88));
        if (frontRef.current) {
          frontRef.current.style.opacity = String(visible * overlayIntro);
        }

      };

      const frame = () => {
        raf = window.requestAnimationFrame(frame);

        /* Withdrawn behind a full-width band, there is nothing to see and
           another WebGL scene may well be drawing further down the page. Keep
           the loop alive so the clock stays honest, skip the draw. */
        if (presenceValue() < 0.02) return;
        const now = performance.now();
        const elapsed = (now - started) / 1000;
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        mixer?.update(delta);

        nextAccent.set(targetAccent.current);
        currentAccent.lerp(nextAccent, 0.045);
        rim.color.copy(currentAccent);
        waterUniforms.uAccent.value.copy(currentAccent);
        for (const mesh of emissiveMeshes) {
          const materials = Array.isArray((mesh as import("three").Mesh).material)
            ? ((mesh as import("three").Mesh).material as import("three").Material[])
            : [(mesh as import("three").Mesh).material as import("three").Material];
          for (const raw of materials) {
            const material = raw as import("three").MeshStandardMaterial;
            if (material?.emissive) material.emissive.copy(currentAccent);
          }
        }

        easedProgress += (progressRef.current - easedProgress) * 0.07;
        eased.x += (pointer.x - eased.x) * 0.05;
        eased.y += (pointer.y - eased.y) * 0.05;

        waterUniforms.uTime.value = elapsed;

        /* He comes up out of the water. Eased at both ends rather than out of
           the start: something heavy leaving water is slow to move, quickest as
           it breaks the surface, and slow again as it clears. Eased purely out,
           the fast part is spent before he is anywhere near the surface and he
           is through it in the first few frames.

           Slow on purpose. He is under for the best part of a second before
           anything of him shows, which is why the surface is made to swell
           over him first — an empty stage that long reads as a page that has
           not finished loading. */
        const rise = Math.max(0, Math.min(1, (elapsed - RISE_DELAY) / RISE_TIME));
        /* Quintic rather than cubic. Both start and end at rest, but the cubic
           still has acceleration left at each end and you can see it change;
           this one has none, so there is no moment where the movement is
           handed over. It is what makes a slow rise read as gliding rather
           than as being drawn upward. */
        const risen = rise * rise * rise * (rise * (rise * 6 - 15) + 10);

        const ignite = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.4));
        // The water comes up with him: he is what is lighting it.
        waterUniforms.uIgnite.value = ignite * ignite * (3 - 2 * ignite);
        renderer.toneMappingExposure = 0.45 + 0.7 * (ignite * ignite * (3 - 2 * ignite));
        overlayIntro = Math.max(0, Math.min(1, (elapsed - 0.62) / 0.45));

        /* He turns to face the copy as the page goes down — negative Y swings
           his front toward screen-left, which is where the words are. A real
           model holds a three-quarter view without thinning out, so he takes
           more of it than the flat cut-out does. */
        const turn = -easedProgress * 0.7 + Math.sin(elapsed * 0.24) * 0.05 + eased.x * 0.1;
        root.rotation.y = turn;
        root.rotation.x = eased.y * 0.025;
        root.position.y =
          baseY + RISE_FROM * (1 - risen) + Math.sin(elapsed * 0.55) * 0.008 - eased.y * 0.02;

        /* What the surface answers, taken from where his crown actually is
           rather than from a moment worked out in advance: the crown sits half
           a unit above his origin, and the disturbance peaks as it passes the
           waterline. Derived this way it stays right if the timing, the depth
           or the easing ever change. */
        const crown = root.position.y + 0.5 - waterline;
        waterUniforms.uWake.value = Math.exp(-Math.pow(crown / 0.34, 2));
        if (crown > 0 && brokeAt < 0) brokeAt = elapsed;
        waterUniforms.uWakeAge.value = brokeAt < 0 ? 0 : elapsed - brokeAt;

        /* The shot, not the subject. The camera pulls back and lifts as the
           page goes down, so we end up looking slightly down on him from
           further away — the recession that used to be done by scaling him. */
        const dolly = 1 + easedProgress * 0.22;
        camera.position.set(0, easedProgress * 0.26, baseDistance * dolly);
        camera.lookAt(0, -easedProgress * 0.06, 0);

        root.updateMatrixWorld();
        placeOverlays(turn);
        trackDolly(dolly, easedProgress * 0.26);
        renderer.render(scene, camera);
        announce();
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
        overlayIntro = 1;
        root.rotation.y = 0.06;
        root.position.y = baseY;
        root.updateMatrixWorld();
        placeOverlays(0.06);
        renderer.render(scene, camera);
        announce();
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
        glow?.dispose();
        waterMaterial.dispose();
        water.geometry.dispose();
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
  }, [reduced, progressRef]);

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

    </div>
  );
}
