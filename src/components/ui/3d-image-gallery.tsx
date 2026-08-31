"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sphere } from "@react-three/drei";
import type * as THREE from "three";

/* A sphere of plates you can turn, for the work.

   Adapted from the stellar card gallery. What is taken is its geometry and its
   handling: the Fibonacci sphere, which spaces plates evenly on a ball instead
   of ringing them round an equator; plates that turn to face the camera
   wherever they end up; orbit controls with a bounded zoom; and a plate that
   grows a little under the pointer so it is clear it can be opened.

   Four things are deliberately not taken.

   Its starfield. The original mounts a second WebGL renderer, fixed over the
   whole viewport, painted solid black. On this page that would black out the
   sky and the water and put a third GL context on the machine — and this site
   already has stars, drawn as DOM over the sky it has.

   Its twenty pictures. They are stock invitations on a third-party image host.
   The four here are the drawings Dalnova actually hands to clients, which is
   what this section is for.

   Its colours. #31b8c6 and #1F2121 are that component's, not this site's.
   Everything here reads the tokens the rest of the page is built from, so the
   plates follow the light and dark grounds like anything else.

   Its download and favourite buttons. Dalnova does not offer these drawings as
   downloads and has no favourites to keep. A control that does nothing is
   worse than no control. Opening a plate hands it to the page's own lightbox,
   which is where a drawing is read. */

export type GalleryWork = {
  src: string;
  alt: string;
  caption: string;
  w: number;
  h: number;
};

type Seat = { x: number; y: number; z: number };

/** Where the ball sits relative to the camera, and how far you may travel. */
const ORBIT = { distance: 15, min: 7, max: 26 };

/** Evenly spaced seats on a sphere.
 *
 *  The golden angle is what makes this even. Stepping by a rational fraction
 *  of a turn lines the plates up into visible spokes; stepping by the golden
 *  ratio never repeats, so no two plates ever share a meridian. */
function fibonacciSphere(count: number, radius: number): Seat[] {
  const golden = (1 + Math.sqrt(5)) / 2;
  return Array.from({ length: count }, (_, i) => {
    // Guard the single-item case: the original divides by (count - 1).
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = (2 * Math.PI * i) / golden;
    return {
      x: Math.cos(theta) * ring * radius,
      y: y * radius * 0.72,
      z: Math.sin(theta) * ring * radius,
    };
  });
}

function Plate({
  work,
  seat,
  index,
  onPick,
}: {
  work: GalleryWork;
  seat: Seat;
  index: number;
  onPick: (index: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Turned to the camera every frame: a plate seen edge-on is a plate you
  // cannot read, and on a sphere most of them would be.
  useFrame(({ camera }) => {
    group.current?.lookAt(camera.position);
  });

  return (
    <group ref={group} position={[seat.x, seat.y, seat.z]}>
      {/* The picture is real DOM in 3D rather than a texture, so its caption
          is text and the drawing keeps its own resolution when you come
          close. */}
      <Html
        transform
        distanceFactor={9}
        style={{ pointerEvents: "auto" }}
        zIndexRange={[10, 0]}
      >
        <button
          type="button"
          className="orb-plate"
          data-hot={hovered}
          onClick={() => onPick(index)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={work.src}
            alt={work.alt}
            width={work.w}
            height={work.h}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <span className="orb-plate-cap t-mono">{work.caption}</span>
        </button>
      </Html>
    </group>
  );
}

export default function ImageGallery3D({
  works,
  onPick,
  accent,
}: {
  works: GalleryWork[];
  onPick: (index: number) => void;
  /** The section's accent, so the shells belong to the band they sit in. */
  accent: string;
}) {
  const seats = useMemo(() => fibonacciSphere(works.length, 9.5), [works.length]);

  return (
    <Canvas
      camera={{ position: [0, 0, ORBIT.distance], fov: 55 }}
      className="orb-canvas"
      // Transparent, so the sky and the water stay the ground here as they
      // are everywhere else on this page.
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />

        {/* Two shells, faint, to give the ball an inside and an outside. The
            original stacks four; at this size the outer two landed on top of
            each other and only cost frames. */}
        <Sphere args={[2.4, 24, 24]}>
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.06} />
        </Sphere>
        <Sphere args={[13, 28, 28]}>
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.03} />
        </Sphere>

        {works.map((work, i) => (
          <Plate key={work.src} work={work} seat={seats[i]} index={i} onPick={onPick} />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom
          enableRotate
          minDistance={ORBIT.min}
          maxDistance={ORBIT.max}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          // The ball is the subject; letting it be flipped past the poles
          // turns the whole section upside down for no gain.
          minPolarAngle={0.5}
          maxPolarAngle={Math.PI - 0.5}
        />
      </Suspense>
    </Canvas>
  );
}
