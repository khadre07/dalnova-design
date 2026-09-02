"use client";

/* The world the camera travels through.

   Kage walks you through a temple: a gate, pathways, a hall, a horizon. Its
   fourteen WebP layers are photographs of Kyoto, and they are the one part of
   it that cannot come here — a maple branch and a stone lantern say nothing
   about managed IT in Dakar.

   So the chapters are Dalnova's own, and they are built rather than
   photographed: a line of masts receding into the water with cable strung
   between them, and equipment cabinets standing at intervals along it. That is
   the sentence the page already opens with — from the cable to the code — said
   in geometry.

   Built and not shot, for three reasons that all matter here. Nothing is
   downloaded, so a chapter costs a few hundred vertices instead of three
   megabytes of stock. Nothing is licensed. And it takes the section's own
   accent, so the world turns from cyan to amber with the page rather than
   sitting at whatever colour a photograph happened to be.

   Deliberately silhouettes. There are no lights in this scene — they left with
   the model — so everything is unlit material against the sky, dark shapes on
   a lit ground, thinning into the fog. That is cheap, and it is also the right
   look: this is the horizon the page stands on, not its subject. */

type THREEModule = typeof import("three");

/** Where the line of masts runs, in world units. Spaced so the camera passes
 *  one every chapter or so rather than threading a picket fence. */
const SPACING = 6.2;
const COUNT = 9;

export type World = {
  group: import("three").Group;
  /** Called each frame with the accent in force. */
  tint: (colour: import("three").Color) => void;
  dispose: () => void;
};

export function buildWorld(THREE: THREEModule, waterline: number): World {
  const group = new THREE.Group();
  const perishable: { dispose: () => void }[] = [];

  /* One material for every silhouette. Unlit, fogged, and slightly
     transparent so the far end of the line dissolves rather than stopping. */
  const shape = new THREE.MeshBasicMaterial({
    color: 0x0a1218,
    transparent: true,
    opacity: 0.82,
    fog: true,
  });
  const line = new THREE.LineBasicMaterial({
    color: 0x35d2ff,
    transparent: true,
    opacity: 0.34,
    fog: true,
  });
  perishable.push(shape, line);

  // Two shared geometries for every mast and cabinet: nine of each, and there
  // is no reason for eighteen copies of the same box.
  const mastGeo = new THREE.BoxGeometry(0.055, 1, 0.055);
  const cabGeo = new THREE.BoxGeometry(0.42, 0.62, 0.3);
  perishable.push(mastGeo, cabGeo);

  /** Deterministic, so the horizon is the same horizon on every load. */
  let seed = 0x5eed;
  const rand = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 4294967296;
  };

  const tops: import("three").Vector3[] = [];

  for (let i = 0; i < COUNT; i += 1) {
    const z = -i * SPACING;
    // The line drifts rather than ruling straight: a perfectly straight run of
    // masts reads as a fence, and a slight wander reads as ground.
    const x = 3.1 + Math.sin(i * 0.7) * 0.5 + (rand() - 0.5) * 0.35;
    const height = 1.5 + rand() * 0.85;

    const mast = new THREE.Mesh(mastGeo, shape);
    mast.scale.y = height;
    mast.position.set(x, waterline + height / 2, z);
    group.add(mast);

    tops.push(new THREE.Vector3(x, waterline + height, z));

    // A cabinet every few masts, standing in the water at its foot.
    if (i % 3 === 1) {
      const cab = new THREE.Mesh(cabGeo, shape);
      cab.position.set(x - 0.75 - rand() * 0.4, waterline + 0.31, z + 0.6);
      cab.rotation.y = (rand() - 0.5) * 0.5;
      group.add(cab);
    }
  }

  /* The cable between them, hanging rather than ruled.

     A catenary is what a cable actually does between two poles, and drawing it
     straight is the single thing that would make this read as a diagram
     instead of as a place. Sampled coarsely — twelve points is past what the
     eye separates at this distance. */
  for (let i = 0; i < tops.length - 1; i += 1) {
    const a = tops[i];
    const b = tops[i + 1];
    const sag = 0.26 + rand() * 0.1;
    const points: import("three").Vector3[] = [];
    for (let s = 0; s <= 12; s += 1) {
      const u = s / 12;
      const p = a.clone().lerp(b, u);
      // 4u(1-u) is zero at both poles and one in the middle: the hang.
      p.y -= sag * 4 * u * (1 - u);
      points.push(p);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    perishable.push(geo);
    group.add(new THREE.Line(geo, line));
  }

  return {
    group,
    tint: (colour) => {
      line.color.copy(colour);
    },
    dispose: () => {
      for (const item of perishable) item.dispose();
    },
  };
}
