"use client";

import { useEffect, useRef, useState } from "react";
import { CHARGE_MS, onCharge, replay } from "@/lib/charge";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";
import { figureIsUp } from "@/lib/cue";
import { presenceValue } from "@/lib/stage";

const TEXTURE = "/robot.webp";

/* The arc reactor sits at 53% / 29% of the cut-out. Measured from the render's
   own emissive pixels, not eyeballed — every conduit is anchored to it. */
export const REACTOR = { x: 53, y: 29 };

/* Eye centres, also measured: the brightest cyan cluster in the top 16% of the
   texture, split at its widest horizontal gap. Both land on the same scanline,
   which is how we know the detection caught eyes and not helmet highlights.
   Y is flipped here because texture space counts up from the bottom. */
const EYE_L = { x: 0.498, y: 1 - 0.0958 };
const EYE_R = { x: 0.599, y: 1 - 0.0927 };
const EYE_RADIUS = 0.032;

/* One conduit per section, in SVG user units on a 0..100 box that maps onto
   the figure. Control points are ordered top to bottom, matching the order the
   sections appear down the page. */
export const CONDUITS = [
  { c1: [30, REACTOR.y - 4], c2: [10, 14], end: [-70, 9] },
  { c1: [26, REACTOR.y + 2], c2: [6, 36], end: [-70, 34] },
  { c1: [28, REACTOR.y + 8], c2: [8, 62], end: [-70, 68] },
  { c1: [34, REACTOR.y + 14], c2: [14, 88], end: [-70, 96] },
] as const;

const VERT = /* glsl */ `
  uniform float uBend;
  varying vec2 vUv;
  varying float vBulge;

  void main() {
    vUv = uv;

    // The plane is bent into a shallow cylinder. Combined with a perspective
    // camera this is what lets a flat cut-out read as a body with a front and
    // two flanks when it turns — position.x runs -0.5..0.5, so the cosine
    // peaks at the centre line and falls to zero at both silhouette edges.
    vec3 p = position;
    float bulge = cos(position.x * 3.14159265);
    p.z += bulge * uBend;
    vBulge = bulge;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2  uTexel;
  uniform vec3  uAccent;
  uniform float uTime;
  uniform float uProgress;
  uniform float uIntensity;
  uniform float uPulse;
  uniform float uAspect;
  uniform float uTurn;
  uniform vec2  uEyeL;
  uniform vec2  uEyeR;
  uniform float uEyeRadius;
  uniform float uIgnite;
  uniform float uFlash;
  varying vec2 vUv;
  varying float vBulge;

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  /* Value noise over time. Stepped-and-smoothed rather than a sine, because a
     sine reads as a machine breathing and we want an arc that is not quite
     stable. */
  float flicker(float t) {
    float i = floor(t);
    float f = fract(t);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
  }

  void main() {
    vec2 uv = vUv;
    vec2 fromCentre = uv - 0.5;
    float radius = length(fromCentre);

    // Chromatic split widens toward the silhouette's edges, the way a long
    // lens fringes. Kept under a pixel at the centre so the face stays clean.
    float split = 0.0026 * (0.25 + radius) * uIntensity;
    float r = texture2D(uMap, uv + fromCentre * split).r;
    vec4  g = texture2D(uMap, uv);
    float b = texture2D(uMap, uv - fromCentre * split).b;
    vec4 base = vec4(r, g.g, b, g.a);

    // Rim light is derived from the alpha gradient: wherever the cut-out turns
    // from body to background, the accent catches. This is what makes a flat
    // PNG read as a lit object rather than a sticker.
    float ax =
      texture2D(uMap, uv + vec2(uTexel.x * 2.0, 0.0)).a -
      texture2D(uMap, uv - vec2(uTexel.x * 2.0, 0.0)).a;
    float ay =
      texture2D(uMap, uv + vec2(0.0, uTexel.y * 2.0)).a -
      texture2D(uMap, uv - vec2(0.0, uTexel.y * 2.0)).a;
    float rim = clamp(length(vec2(ax, ay)) * 1.7, 0.0, 1.0);
    rim = pow(rim, 0.85);

    /* Past 90 degrees we are looking at the far side of the plane, where the
       texture would otherwise show his face mirrored onto his back. Instead the
       reverse is drawn as an unlit silhouette: rim light along the edge, and
       just enough of the reactor bleeding through to say the chest is still
       lit, only facing away. */
    if (!gl_FrontFacing) {
      float hotBack = smoothstep(0.52, 0.94, luma(g.rgb));
      vec3 backCol = vec3(0.018, 0.026, 0.034);
      backCol += uAccent * rim * (0.75 + 0.35 * uPulse) * uIntensity;
      backCol += uAccent * hotBack * 0.16 * uIntensity;
      gl_FragColor = vec4(backCol, base.a);
      return;
    }

    // A single scan travels bottom to top, slow enough to feel like a system
    // sweeping itself rather than a screensaver.
    float sweepPos = fract(uv.y * 0.55 - uTime * 0.055);
    float sweep = smoothstep(0.055, 0.0, abs(sweepPos - 0.5));

    // Emissive parts already glow in the render; push them toward whichever
    // accent the current section owns.
    float hot = smoothstep(0.52, 0.94, luma(g.rgb));

    vec3 col = base.rgb;
    col *= 0.88 + 0.12 * uProgress;
    // He is powered down until the eyes catch, so the ignition reads as the
    // whole figure waking rather than two lamps switching on.
    col *= mix(0.42, 1.0, uIgnite);

    // Cylinder shading: the flanks fall away from the light as he turns, which
    // is most of what sells the rotation.
    col *= 0.80 + 0.20 * vBulge;

    // The edge he is turning toward catches more of the accent.
    float lead = clamp((uv.x - 0.5) * uTurn * 4.0, 0.0, 1.0);
    col += uAccent * rim * (0.30 + 0.50 * sweep + 0.35 * lead) * uIntensity;
    col += uAccent * sweep * g.a * 0.09 * uIntensity;
    col += uAccent * hot * (0.55 + 0.35 * uPulse) * uIntensity;

    /* Eyes. Distances are corrected for the texture's aspect so the halo is a
       circle in pixels rather than an ellipse in UV. Two rates are mixed: a
       fast unsteady shimmer, and a rare hard spark. */
    vec2 fix = vec2(1.0, 1.0 / uAspect);
    float dEye = min(length((uv - uEyeL) * fix), length((uv - uEyeR) * fix));
    float eyeMask = smoothstep(uEyeRadius, 0.0, dEye);
    float shimmer = flicker(uTime * 9.0);
    float spark = smoothstep(0.90, 1.0, flicker(uTime * 2.6));
    float eyeGain = (0.45 + 0.85 * shimmer + 1.7 * spark) * uIntensity * uIgnite;
    eyeGain += uFlash;
    col += uAccent * eyeMask * eyeGain * max(base.a, 0.35);

    // Interlace, barely there. Removing it makes the figure look pasted on.
    float scan = 0.5 + 0.5 * sin(uv.y / uTexel.y * 0.9);
    col *= 0.975 + 0.025 * scan;

    gl_FragColor = vec4(col, base.a);
  }
`;

export type Box = { left: number; top: number; width: number; height: number };

export default function RobotStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent, progressRef } = useSite();

  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  // The reactor is on his front, so the conduits leaving it have to go with
  // him when he turns away.
  const frontRef = useRef<HTMLDivElement>(null);

  // The accent the loop is easing toward, kept in a ref so the WebGL scene is
  // never torn down when a section hands the rim light over. Written in an
  // effect, not during render: a render-phase ref write is unsafe under
  // concurrent rendering, where a render can be thrown away. Scroll progress
  // needs no equivalent — the provider writes it straight into a ref.
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
        /* No context: the still image takes over, and the copy is released at
           once rather than sitting out a cue that is never coming. */
        setFailed(true);
        figureIsUp();
        return;
      }

      renderer.setClearAlpha(0);

      const scene = new THREE.Scene();

      // Perspective, not orthographic: without foreshortening a rotating plane
      // just gets narrower, and the turn reads as a closing door.
      const FOV = 32;
      const CAM_Z = 6;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      camera.position.z = CAM_Z;
      const visibleHeight = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));

      const texture = await new THREE.TextureLoader()
        .loadAsync(TEXTURE)
        .catch(() => null);

      if (disposed || !texture) {
        renderer.dispose();
        if (!disposed) {
          setFailed(true);
          figureIsUp();
        }
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const texW = texture.image.width as number;
      const texH = texture.image.height as number;
      const texAspect = texW / texH;

      const uniforms = {
        uMap: { value: texture },
        uTexel: { value: new THREE.Vector2(1 / texW, 1 / texH) },
        uAccent: { value: new THREE.Color(ACCENT_HEX.arc) },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uIntensity: { value: reduced ? 0.55 : 1 },
        uPulse: { value: 0 },
        uAspect: { value: texAspect },
        uTurn: { value: 0 },
        uBend: { value: 0 },
        uEyeL: { value: new THREE.Vector2(EYE_L.x, EYE_L.y) },
        uEyeR: { value: new THREE.Vector2(EYE_R.x, EYE_R.y) },
        uEyeRadius: { value: EYE_RADIUS },
        uIgnite: { value: 0 },
        uFlash: { value: 0 },
      };

      // Segmented across x so the cylindrical bend is smooth; one segment down
      // y, because nothing displaces vertically.
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 96, 1),
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      scene.add(mesh);

      let stage = { w: 1, h: 1 };
      const baseScale = { x: 1, y: 1 };
      let baseY = 0;

      const layout = () => {
        const rect = host.getBoundingClientRect();
        stage = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();
        const visibleWidth = visibleHeight * camera.aspect;

        // Narrow *viewports* stack the figure behind the copy, so it sits
        // smaller there. Measuring the stage instead of the window shrank the
        // figure on desktop too, because the column is only ~47vw wide.
        const narrow = window.innerWidth < 1024;
        // The turn swings him sideways, so he needs a little more clearance
        // under the 68px header than a static figure would.
        const fill = narrow ? 0.68 : 0.86;

        let worldH = visibleHeight * fill;
        let worldW = worldH * texAspect;
        if (worldW > visibleWidth * 0.94) {
          worldW = visibleWidth * 0.94;
          worldH = worldW / texAspect;
        }

        baseScale.x = worldW;
        baseScale.y = worldH;
        baseY = narrow ? 0 : -visibleHeight * 0.035;
        mesh.scale.set(worldW, worldH, 1);

        // Bend depth is tied to his width, so the curvature looks the same
        // whatever size he is drawn at.
        // Deeper than a subtle curve: at 90 degrees the bulge is all that is
        // left of him, so it has to carry the silhouette on its own.
        uniforms.uBend.value = narrow ? worldW * 0.12 : worldW * 0.24;

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        renderer.setPixelRatio(dpr);
        renderer.setSize(stage.w, stage.h, false);

        // The conduit overlay tracks the figure's projected box. It is taken
        // from the unrotated bounds on purpose: the conduits start hidden
        // behind his body, so a few pixels of swing never show.
        const pxPerUnit = stage.h / visibleHeight;
        const boxW = worldW * pxPerUnit;
        const boxH = worldH * pxPerUnit;
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

      /* Pointer parallax. The raw pointer value is eased toward rather than
         applied, so the figure has weight instead of tracking the cursor
         like a cheap tilt card. */
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
      let raf = 0;
      let running = true;
      let started = performance.now();
      let paused = 0;

      const frame = () => {
        raf = window.requestAnimationFrame(frame);

        /* Withdrawn behind a full-width band, there is nothing to see and
           another WebGL scene may well be drawing further down the page. Keep
           the loop alive so the clock stays honest, skip the draw. */
        if (presenceValue() < 0.02) return;
        const elapsed = (performance.now() - started) / 1000;

        nextAccent.set(targetAccent.current);
        currentAccent.lerp(nextAccent, 0.045);
        uniforms.uAccent.value.copy(currentAccent);

        easedProgress += (progressRef.current - easedProgress) * 0.07;
        uniforms.uProgress.value = easedProgress;
        uniforms.uTime.value = elapsed;
        uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(elapsed * 1.15);

        /* Ignition. The eyes come up at 0.25s and overshoot at 0.5s; the beams
           follow, then the copy. The whole opening reads as the figure powering
           on and writing the page, rather than a page that happens to contain a
           figure. Timings are duplicated in globals.css for the text. */
        const ignite = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.4));
        uniforms.uIgnite.value = ignite * ignite * (3 - 2 * ignite);
        // No water here, so the cue is the eyes catching.
        if (ignite >= 1) figureIsUp();
        uniforms.uFlash.value = 2.4 * Math.exp(-Math.pow((elapsed - 0.52) / 0.17, 2));
        overlayIntro = Math.max(0, Math.min(1, (elapsed - 0.62) / 0.45));

        eased.x += (pointer.x - eased.x) * 0.05;
        eased.y += (pointer.y - eased.y) * 0.05;

        /* He turns to face the copy as the page goes down — negative Y swings
           his front toward screen-left, which is where the words are. A third
           of a right angle by the bottom: enough to read as addressing them,
           short of the profile where a flat cut-out goes thin. */
        const turn = -easedProgress * 0.55 + Math.sin(elapsed * 0.24) * 0.05 + eased.x * 0.1;
        mesh.rotation.y = turn;
        mesh.rotation.x = eased.y * 0.03;
        mesh.rotation.z = -eased.x * 0.015;
        uniforms.uTurn.value = turn;

        const breathe = Math.sin(elapsed * 0.55) * 0.03;
        mesh.position.x = eased.x * 0.1;
        mesh.position.y = baseY + breathe - eased.y * 0.07 - easedProgress * 0.16;

        // Recession is applied from the stored base each frame. Multiplying the
        // live scale would compound it and walk the figure off screen.
        const recede = 1 - easedProgress * 0.09;
        mesh.scale.set(baseScale.x * recede, baseScale.y * recede, 1);

        mesh.updateMatrixWorld();
        placeOverlays(turn);

        renderer.render(scene, camera);
      };

      /* The conduits are on his front, so they go with him when he turns. */
      let overlayIntro = 0;
      const placeOverlays = (turn: number) => {
        // cos of the turn is how much of his front we still see.
        const facing = Math.cos(turn);
        const visible = Math.max(0, Math.min(1, (facing - 0.12) / 0.88));

        if (frontRef.current) {
          frontRef.current.style.opacity = String(visible * overlayIntro);
        }
      };

      const start = () => {
        if (running || reduced) return;
        running = true;
        started += performance.now() - paused;
        raf = window.requestAnimationFrame(frame);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        paused = performance.now();
        window.cancelAnimationFrame(raf);
      };

      if (reduced) {
        // One frame is enough: a still, correctly lit composition, turned very
        // slightly off-axis so he still reads as a volume rather than a decal.
        uniforms.uTime.value = 2.4;
        uniforms.uPulse.value = 0.5;
        uniforms.uTurn.value = 0.1;
        uniforms.uIgnite.value = 1;
        overlayIntro = 1;
        mesh.rotation.y = 0.1;
        mesh.position.y = baseY;
        mesh.updateMatrixWorld();
        placeOverlays(0.1);
        renderer.render(scene, camera);
        running = false;
      } else {
        raf = window.requestAnimationFrame(frame);
      }

      // Nothing renders while the tab is in the background or the stage has
      // scrolled away — the laptop fan is part of the user experience.
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
        texture.dispose();
        mesh.geometry.dispose();
        (mesh.material as import("three").ShaderMaterial).dispose();
        renderer.dispose();
      };
    })().catch((error) => {
      // Without this the IIFE's rejection is an unhandled promise and the stage
      // just silently stays blank, which is exactly how it failed once.
      console.error("[RobotStage]", error);
      if (!disposed) {
        setFailed(true);
        figureIsUp();
      }
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced, progressRef]);

  return (
    /* The host is not aria-hidden: the project tags inside it are real
       information. Each purely decorative child opts out individually. */
    <div ref={hostRef} className="relative h-full w-full">
      {/* Ground glow: the figure needs something to stand in, or it floats in a void */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-[1200ms]"
        style={{
          background: `radial-gradient(58% 46% at 52% 62%, ${ACCENT_HEX[accent]}1f 0%, transparent 72%)`,
        }}
      />

      {/* Conduits sit *under* the figure. Drawn on top they read as scratches
          across his chest; drawn behind, the light appears to leave the reactor
          and pass around the body, which is the whole point of the device. */}
      {box && !failed ? (
        <div ref={frontRef} className="absolute inset-0 z-0" style={{ opacity: 0 }}>
          <Conduits box={box} accent={ACCENT_HEX[accent]} reduced={reduced} />
        </div>
      ) : null}

      {failed ? (
        // No WebGL: still a lit, composed figure. The site does not lose its hero.
        // Raw <img> on purpose: next/image cannot serve this fallback, which has
        // to render from markup already on the page when WebGL init has failed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={TEXTURE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-10 m-auto h-full w-auto max-w-none object-contain"
          style={{ filter: `drop-shadow(0 0 60px ${ACCENT_HEX[accent]}55)` }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 z-10 block h-full w-full"
        />
      )}

    </div>
  );
}

/* Light conduits leaving the reactor. This is the borrowed idea from the
   reference shot, turned to our purpose: the robot is the hub, and the four
   disciplines are what it feeds. */
export function Conduits({ box, accent, reduced }: { box: Box; accent: string; reduced: boolean }) {
  const pulses = useRef<(SVGPathElement | null)[]>([]);

  /* Quiet until a section calls. The conduits used to pulse on an endless
     five-second loop, which made the light mean nothing; now a charge only
     ever runs because a section asked for one, and the copy it is carrying
     appears when it lands. */
  useEffect(() => {
    if (reduced) return;
    return onCharge((index) => {
      replay(pulses.current[index % CONDUITS.length], `conduit-fire ${CHARGE_MS}ms linear`);
    });
  }, [reduced]);

  const paths = CONDUITS.map(
    (c) =>
      `M ${REACTOR.x} ${REACTOR.y} C ${c.c1[0]} ${c.c1[1]}, ${c.c2[0]} ${c.c2[1]}, ${c.end[0]} ${c.end[1]}`,
  );

  return (
    <svg
      className="pointer-events-none absolute z-0 overflow-visible"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="conduit-fade" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
          <stop offset="38%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {paths.map((d, i) => (
        <g key={d}>
          <path
            d={d}
            fill="none"
            stroke="url(#conduit-fade)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {!reduced ? (
            /* Two travellers on the same wire. The faint one runs forever, so
               the conduits are never dead metal; the bright one runs only when
               a section asks for it. Same path, same normalisation, different
               errand.

               pathLength normalises the curve to 200 units whatever its real
               length, so one dash offset is exactly one traversal — the same
               timing on every conduit and at every window size. */
            <>
              <path
                className="conduit-flow"
                d={d}
                pathLength={200}
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${i * 1.7}s` }}
              />
              <path
                ref={(node) => {
                  pulses.current[i] = node;
                }}
                className="conduit-pulse"
                d={d}
                pathLength={200}
                fill="none"
                stroke={accent}
                strokeWidth="2.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </g>
      ))}

      <circle
        className={reduced ? undefined : "conduit-core"}
        cx={REACTOR.x}
        cy={REACTOR.y}
        r="1.6"
        fill={accent}
        opacity="0.55"
      />
    </svg>
  );
}
