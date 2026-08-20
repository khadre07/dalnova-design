"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX } from "@/lib/content";
import { useSite } from "@/lib/site-state";

const TEXTURE = "/robot.webp";

/* The arc reactor sits at 53% / 29% of the cut-out. Measured from the render's
   own emissive pixels, not eyeballed — every conduit is anchored to it. */
const REACTOR = { x: 53, y: 29 };

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
  varying vec2 vUv;

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

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

    // A single scan travels bottom to top, slow enough to feel like a system
    // sweeping itself rather than a screensaver.
    float sweepPos = fract(uv.y * 0.55 - uTime * 0.055);
    float sweep = smoothstep(0.055, 0.0, abs(sweepPos - 0.5));

    // Emissive parts (eyes, reactor) already glow in the render; push them
    // toward whichever accent the current section owns.
    float hot = smoothstep(0.52, 0.94, luma(g.rgb));

    vec3 col = base.rgb;
    col *= 0.88 + 0.12 * uProgress;                       // page darkens as you descend
    col += uAccent * rim * (0.30 + 0.50 * sweep) * uIntensity;
    col += uAccent * sweep * g.a * 0.09 * uIntensity;
    col += uAccent * hot * (0.55 + 0.35 * uPulse) * uIntensity;

    // Interlace, barely there. Removing it makes the figure look pasted on.
    float scan = 0.5 + 0.5 * sin(uv.y / uTexel.y * 0.9);
    col *= 0.975 + 0.025 * scan;

    gl_FragColor = vec4(col, base.a);
  }
`;

type Box = { left: number; top: number; width: number; height: number };

export default function RobotStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accent, progress } = useSite();

  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  // Live values the render loop reads, so the loop never re-subscribes and the
  // WebGL scene is never torn down when the accent or scroll position changes.
  // Written in an effect, not during render: a render-phase ref write is unsafe
  // under concurrent rendering, where a render can be thrown away.
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
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
      } catch {
        setFailed(true);
        return;
      }

      renderer.setClearAlpha(0);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
      camera.position.z = 1;

      const texture = await new THREE.TextureLoader()
        .loadAsync(TEXTURE)
        .catch(() => null);

      if (disposed || !texture) {
        renderer.dispose();
        if (!disposed) setFailed(true);
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

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
      };

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
        }),
      );
      scene.add(mesh);

      /* Fit the figure to the stage and publish its pixel box, so the conduit
         overlay can anchor to the reactor instead of guessing at it. */
      let stage = { w: 1, h: 1 };
      const baseScale = { x: 1, y: 1 };
      let baseY = 0;
      const layout = () => {
        const rect = host.getBoundingClientRect();
        stage = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

        // Narrow *viewports* stack the figure behind the copy, so it sits
        // smaller there. Measuring the stage instead of the window shrank the
        // figure on desktop too, because the column is only ~47vw wide.
        const narrow = window.innerWidth < 1024;
        // 0.88 plus the downward offset below keeps his head clear of the
        // 68px header, so the language toggle stays readable over him.
        const fill = narrow ? 0.7 : 0.88;
        baseY = narrow ? 0 : -0.06;
        let sy = fill;
        let sx = (sy * stage.h * texAspect) / stage.w;
        if (sx > 0.98) {
          sx = 0.98;
          sy = (sx * stage.w) / (texAspect * stage.h);
        }
        baseScale.x = sx;
        baseScale.y = sy;
        mesh.scale.set(sx, sy, 1);

        const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(stage.w, stage.h, false);

        // The conduit overlay tracks the figure's real pixel box, including the
        // vertical offset, so the reactor anchor never drifts off his chest.
        setBox({
          left: (stage.w * (1 - sx)) / 2,
          top: (stage.h * (1 - sy)) / 2 - (baseY * stage.h) / 2,
          width: stage.w * sx,
          height: stage.h * sy,
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
      // THREE.Clock is deprecated; performance.now() is all this needs and it
      // survives a pause without accumulating the time the tab spent hidden.
      let started = performance.now();
      let paused = 0;

      const frame = () => {
        raf = window.requestAnimationFrame(frame);
        const elapsed = (performance.now() - started) / 1000;

        nextAccent.set(target.current.accent);
        currentAccent.lerp(nextAccent, 0.045);
        uniforms.uAccent.value.copy(currentAccent);

        easedProgress += (target.current.progress - easedProgress) * 0.07;
        uniforms.uProgress.value = easedProgress;
        uniforms.uTime.value = elapsed;
        uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(elapsed * 1.15);

        eased.x += (pointer.x - eased.x) * 0.055;
        eased.y += (pointer.y - eased.y) * 0.055;

        // Levitation, pointer drift, and a slow recession as the page scrolls.
        const breathe = Math.sin(elapsed * 0.55) * 0.012;
        mesh.position.x = eased.x * 0.045;
        mesh.position.y = baseY + breathe - eased.y * 0.03 - easedProgress * 0.05;
        mesh.rotation.z = -eased.x * 0.018;
        mesh.rotation.y = eased.x * 0.06;
        // Recession is applied from the stored base each frame. Multiplying the
        // live scale would compound it and walk the figure off screen.
        const recede = 1 - easedProgress * 0.09;
        mesh.scale.set(baseScale.x * recede, baseScale.y * recede, 1);

        renderer.render(scene, camera);
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
        // One frame is enough: a still, correctly lit composition.
        uniforms.uTime.value = 2.4;
        uniforms.uPulse.value = 0.5;
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
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced]);

  return (
    <div ref={hostRef} className="relative h-full w-full" aria-hidden="true">
      {/* Ground glow: the figure needs something to stand in, or it floats in a void */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-[1200ms]"
        style={{
          background: `radial-gradient(58% 46% at 52% 62%, ${ACCENT_HEX[accent]}1f 0%, transparent 72%)`,
        }}
      />

      {/* Conduits sit *under* the figure. Drawn on top they read as scratches
          across his chest; drawn behind, the light appears to leave the reactor
          and pass around the body, which is the whole point of the device. */}
      {box && !failed ? <Conduits box={box} accent={ACCENT_HEX[accent]} reduced={reduced} /> : null}

      {failed ? (
        // No WebGL: still a lit, composed figure. The site does not lose its hero.
        // Raw <img> on purpose: next/image cannot serve this fallback, which has
        // to render from markup already on the page when WebGL init has failed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={TEXTURE}
          alt=""
          className="absolute inset-0 z-10 m-auto h-full w-auto max-w-none object-contain"
          style={{ filter: `drop-shadow(0 0 60px ${ACCENT_HEX[accent]}55)` }}
        />
      ) : (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 z-10 block h-full w-full" />
          {/* Scripting off: the canvas would stay an empty rectangle and the
              right half of the page would look broken rather than quiet. */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TEXTURE}
              alt=""
              className="absolute inset-0 z-10 m-auto h-[88%] w-auto max-w-none object-contain"
            />
          </noscript>
        </>
      )}
    </div>
  );
}

/* Light conduits leaving the reactor. This is the borrowed idea from the
   reference shot, turned to our purpose: the robot is the hub, and the four
   disciplines are what it feeds. */
function Conduits({ box, accent, reduced }: { box: Box; accent: string; reduced: boolean }) {
  // One conduit per discipline. They leave the reactor, curve out of frame to
  // the left, and terminate off-canvas behind the copy.
  const paths = [
    `M ${REACTOR.x} ${REACTOR.y} C 30 ${REACTOR.y - 4}, 10 14, -70 9`,
    `M ${REACTOR.x} ${REACTOR.y} C 26 ${REACTOR.y + 2}, 6 36, -70 34`,
    `M ${REACTOR.x} ${REACTOR.y} C 28 ${REACTOR.y + 8}, 8 62, -70 68`,
    `M ${REACTOR.x} ${REACTOR.y} C 34 ${REACTOR.y + 14}, 14 88, -70 96`,
  ];

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
            <path
              className="conduit-pulse"
              d={d}
              fill="none"
              stroke={accent}
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${i * 1.35}s` }}
            />
          ) : null}
        </g>
      ))}

      <circle cx={REACTOR.x} cy={REACTOR.y} r="1.6" fill={accent} opacity="0.55" />
    </svg>
  );
}
