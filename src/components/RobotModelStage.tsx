"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { accentHex, useSite } from "@/lib/site-state";
import { reportProgress, reportReady, reportStage } from "@/lib/boot";
import { figureIsUp } from "@/lib/cue";
import { WATER_FRAG, WATER_VERT } from "@/lib/water";
import { presenceValue } from "@/lib/stage";
import { Conduits, type Box } from "./Conduits";

export const MODEL_URL = "/robot.glb";

/* Where the figure stands across the screen, now that the scene is full bleed.
   Centred on a phone, where he sits behind the copy; on the right on a wide
   screen, where the copy has the left half. */
/* Where the figure stands across the frame. Left on a wide screen, so the copy
   can have the right — the two used to be the other way round. */
const FIGURE_AT = { narrow: 0.5, wide: 0.26 };

/* The glow map that came with the model: black everywhere except the eyes,
   the reactor and the seams. Kept out of the .glb on purpose — held apart it
   can be multiplied by whichever accent the current section owns, which is
   what makes the figure answer the page instead of glowing one fixed colour. */
const EMISSIVE_URL = "/robot-emissive.png";

/** Materials whose name looks like a light source get the accent pushed into
 *  their emissive channel, so the eyes and reactor follow the section colour
 *  the same way the flat version does. */
const EMISSIVE_NAME = /eye|iris|core|reactor|glow|emis|led|light|lamp/i;


export default function RobotModelStage({ hideFigure = false }: { hideFigure?: boolean }) {
  /* Held in a ref so changing it does not rebuild the scene — see where it is
     read, beside the model. Written in an effect rather than during render:
     a ref written while rendering is a value the next render may not agree
     with, and this one decides what is on screen. */
  const hideRef = useRef(hideFigure);
  useEffect(() => {
    hideRef.current = hideFigure;
  }, [hideFigure]);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  const { accent, sky, progressRef } = useSite();
  /* Held in a ref so the scene effect never re-runs — and written from an
     effect, because a ref write during render is unsafe under concurrent
     rendering, where a render can be thrown away. */

  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  const targetAccent = useRef(ACCENT_HEX.arc);
  useEffect(() => {
    targetAccent.current = accentHex(accent, sky);
  }, [accent, sky]);

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
        reportReady();
        return;
      }

      /* Which sky the scene is being built for. Blending, fog and the lights
         are all chosen here rather than swapped later, because a material's
         blending mode is fixed once it exists — so the effect lists `sky` as a
         dependency and the whole scene is rebuilt when it turns. */
      const day = sky === "day";

      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // Chrome blows out fast under a linear response; ACES holds the highlights
      // on the shoulders and keeps the dark panels from crushing to pure black.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = day ? 1.0 : 1.15;

      const scene = new THREE.Scene();

      /* A brushed-metal figure with nothing to reflect looks like grey plastic.
         RoomEnvironment builds a small studio in memory, so we get believable
         reflections without shipping an HDRI. */
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      /* The scene stage reports in steps rather than at the end. Building the
         environment map and parsing the model are the seconds the bar used to
         spend frozen at ninety-nine with nothing to say. */
      reportStage("scene", 0.35);
      scene.environment = envRT.texture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

      // Cool key from the front left, accent rim from behind right. The rim is
      // what draws his silhouette against the dark page.
      const key = new THREE.DirectionalLight(0xdff2ff, day ? 3.1 : 2.1);
      key.position.set(-2.4, 2.6, 3.4);
      const rim = new THREE.DirectionalLight(ACCENT_HEX.arc, 3.4);
      rim.position.set(2.8, 1.4, -2.2);
      const fill = new THREE.DirectionalLight(0xff9a45, 0.55);
      fill.position.set(3.2, -0.6, 1.8);
      // Daylight is ambient before it is directional; night is the reverse.
      scene.add(key, rim, fill, new THREE.AmbientLight(day ? 0xc8d8e4 : 0x2a3238, day ? 2.4 : 0.7));

      const root = new THREE.Group();
      scene.add(root);

      /* Depth. Everything past him falls away into the page's own colour, so
         the scene has a behind rather than ending at a hard edge. Exponential
         rather than linear: it thickens with distance the way air does. */
      scene.fog = new THREE.FogExp2(day ? 0xe9eef2 : 0x05070a, 0.34);

      const waterUniforms = {
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uIgnite: { value: 0 },
        uHalf: { value: new THREE.Vector2(1, 1) },
        // He is one unit tall; the ripples are sized against him.
        uUnit: { value: 1 },
      };
      /* Added at night, painted by day. Adding light to a pale ground does
         nothing at all — every additive effect on this page is invisible above
         a certain lightness — so under a bright sky the water is drawn over
         what is behind it instead of onto it. */
      const waterMaterial = new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        transparent: true,
        depthWrite: false,
        blending: day ? THREE.NormalBlending : THREE.AdditiveBlending,
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


      // Started together: the glow map is small and there is no reason to pay
      // for it in series behind a four-megabyte model.
      const glowPromise = new THREE.TextureLoader()
        .loadAsync(EMISSIVE_URL)
        .catch(() => null);

      let gltf;
      try {
        // The boot screen counts these bytes rather than inventing a number.
        gltf = await new GLTFLoader().loadAsync(MODEL_URL, (event) => {
          if (event.lengthComputable) reportProgress(event.loaded, event.total);
        });
        // Downloaded, decoded and turned into geometry.
        reportStage("scene", 0.7);
      } catch {
        if (!disposed) setFailed(true);
        reportReady();
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
      /* Read every frame rather than rebuilt on change.

         Whether the robot is drawn is a one-line decision; rebuilding the
         scene for it would tear down the water with it, and the water is what
         the rest of the page stands on. So the flag is a ref the loop reads,
         and the scene never notices. */
      model.visible = !hideRef.current;

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
      /* Far wider than deep. He stands in it rather than on a pool cut round
         his feet, and the surface runs out past both sides of the frame
         instead of ending inside it. Normalised space puts his feet at -0.5;
         the plane sits a hair below, or it fights the soles for the pixels. */
      const depth = Math.max(3.2, (size.x / Math.max(size.y, 0.0001)) * 5.5);
      // Wide enough that its ends are never in shot at any window shape.
      const width = depth * 6;
      water.scale.set(width, depth, 1);
      waterUniforms.uHalf.value.set(width / 2, depth / 2);

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
      // Where the surface sits, in the same space the figure is normalised to.
      let waterline = -0.502;
      // How far the figure sits from the middle of the frame, in world units.
      let figureX = 0;

      const layout = () => {
        const rect = host.getBoundingClientRect();
        stage = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();

        const narrow = window.innerWidth < 1024;
        /* He was framed at 0.86 of the height and sat low, which put his feet
           within forty pixels of the bottom edge — the water is brightest at
           his feet, so almost all of it was off the frame. Giving it room to
           run out in front of him is what makes it read as an expanse rather
           than as a rim of light under his soles. */
        // Smaller than it was: on the left it shares the frame with a ring
        // and a sentence rather than having a whole half to itself.
        const frameFill = narrow ? 0.64 : 0.62;

        // Frame by distance rather than by scaling him: pull the camera back
        // until a unit-tall figure occupies `frameFill` of the viewport height.
        // The scale stays at 1 — applying frameFill here as well would square
        // it and leave the figure a head shorter than the flat scene's.
        const vFov = (camera.fov * Math.PI) / 180;
        const distance = 1 / (2 * frameFill * Math.tan(vFov / 2));
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);

        // Lifted, not lowered: what is gained below him is water.
        baseY = narrow ? 0.03 : 0.06;
        // The surface sits just under where his feet come to rest.
        waterline = baseY - 0.502;
        water.position.y = waterline;
        baseDistance = distance;
        unitPx = stage.h * frameFill;

        /* The camera still looks at the origin; the figure is moved instead.
           The water stays centred on him so its pool of light is at his feet
           rather than in the middle of the screen, and it is wide enough that
           its ends are off the frame either way. */
        const at = narrow ? FIGURE_AT.narrow : FIGURE_AT.wide;
        const visibleWidth = (1 / frameFill) * camera.aspect;
        figureX = (at - 0.5) * visibleWidth;
        root.position.x = figureX;
        water.position.x = figureX;

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
        // The overlay rides with him: world units and screen fractions differ,
        // but the offset is the same fraction of the width either way.
        const boxShift = stage.w * ((narrow ? FIGURE_AT.narrow : FIGURE_AT.wide) - 0.5);
        const boxW = boxH * Math.max(0.35, size.x / Math.max(size.y, 0.0001));
        setBox({
          left: (stage.w - boxW) / 2 + boxShift,
          top: (stage.h - boxH) / 2 - baseY * pxPerUnit,
          width: boxW,
          height: boxH,
        });
      };

      layout();
      const resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(host);

      /* He watches the pointer.

         This is the one thing worth keeping from the Spline robot everyone
         links to: the figure looks where you are. Theirs turns a head, which
         needs a skeleton; this model came through the optimiser as a single
         merged node, so there is no head to turn and the whole figure takes
         the movement instead. Less articulate, and it still reads as
         attention, which is the point.

         A spring rather than a lag. Damped just under critical, so he arrives
         with a little settle instead of sliding to a stop — the difference
         between something watching you and something being dragged. */
      const pointer = { x: 0, y: 0 };
      const eased = { x: 0, y: 0 };
      const velocity = { x: 0, y: 0 };
      const AIM = { stiffness: 84, damping: 15 };
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

      /* null means the figure is not on stage, so neither is what sits over
         it. Passing an angle when there is nothing to sit on would leave the
         overlay lit over an empty scene. */
      const placeOverlays = (turn: number | null) => {
        if (!frontRef.current) return;
        if (turn === null) {
          frontRef.current.style.opacity = "0";
          return;
        }
        const facing = Math.cos(turn);
        const visible = Math.max(0, Math.min(1, (facing - 0.12) / 0.88));
        frontRef.current.style.opacity = String(visible * overlayIntro);
      };

      const frame = () => {
        raf = window.requestAnimationFrame(frame);

        const now = performance.now();
        const elapsed = (now - started) / 1000;
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;

        /* Withdrawn behind a full-width band there is nothing to see, and
           another WebGL scene may well be drawing further down the page. Keep
           the loop alive so the clock stays honest, skip the draw.

           The two thresholds differ on purpose: he counts as gone at 0.06 and
           as back at 0.24, and the gap between them is what stops a scroll
           resting on the boundary from restarting the rise over and over. */
        if (presenceValue() < 0.02) return;

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

        /* Stepped at a fixed rate rather than per frame. The old easing moved
           by a flat fraction each frame, which makes him twice as quick on a
           144 Hz screen as on a 60 Hz one — the same code producing two
           different characters depending on the monitor. */
        let remaining = Math.min(0.05, delta);
        while (remaining > 0) {
          const step = Math.min(1 / 240, remaining);
          remaining -= step;
          for (const axis of ["x", "y"] as const) {
            const pull = (pointer[axis] - eased[axis]) * AIM.stiffness;
            velocity[axis] += (pull - velocity[axis] * AIM.damping) * step;
            eased[axis] += velocity[axis] * step;
          }
        }

        waterUniforms.uTime.value = elapsed;

        const ignite = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.4));
        // The water lights with him: he is what is lighting it.
        waterUniforms.uIgnite.value = ignite * ignite * (3 - 2 * ignite);
        // He is simply standing there, so the cue is the water catching.
        if (ignite >= 1) {
          figureIsUp();
          reportReady();
        }
        renderer.toneMappingExposure = 0.45 + 0.7 * (ignite * ignite * (3 - 2 * ignite));
        overlayIntro = Math.max(0, Math.min(1, (elapsed - 0.62) / 0.45));

        /* He turns to face the copy as the page goes down — negative Y swings
           his front toward screen-left, which is where the words are. A real
           model holds a three-quarter view without thinning out, so he takes
           more of it than the flat cut-out does. */
        const turn =
          -easedProgress * 0.7 + Math.sin(elapsed * 0.24) * 0.05 + eased.x * 0.34;
        root.rotation.y = turn;
        root.rotation.x = eased.y * 0.1;
        /* A shoulder drops toward the side you are on. Small, and it is what
           stops the turn reading as a turntable. */
        root.rotation.z = -eased.x * 0.045;
        root.position.y = baseY + Math.sin(elapsed * 0.55) * 0.008 - eased.y * 0.03;

        /* The shot, not the subject. The camera pulls back and lifts as the
           page goes down, so we end up looking slightly down on him from
           further away — the recession that used to be done by scaling him. */
        const dolly = 1 + easedProgress * 0.22;
        camera.position.set(0, easedProgress * 0.26, baseDistance * dolly);
        camera.lookAt(0, -easedProgress * 0.06, 0);

        model.visible = !hideRef.current;
        root.updateMatrixWorld();
        placeOverlays(hideRef.current ? null : turn);
        trackDolly(dolly, easedProgress * 0.26);
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
        renderer.toneMappingExposure = day ? 1.0 : 1.15;
        overlayIntro = 1;
        root.rotation.y = 0.06;
        root.position.y = baseY;
        root.updateMatrixWorld();
        placeOverlays(0.06);
        renderer.render(scene, camera);
        // Reduced motion: he is already standing, so the cue is already due.
        figureIsUp();
        reportReady();
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
      reportReady();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced, progressRef, sky]);

  /* Nothing to show. There is no second figure to fall back to any more, and
     inventing one here would put back the confusion that removing it was
     meant to end — the sky and the water carry the frame on their own. */
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
