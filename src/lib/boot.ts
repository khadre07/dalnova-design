"use client";

/* What the boot screen is counting.

   The uplink sequence it is drawn from runs a scripted timeline: eight and a
   half seconds of invented percentages, held, then looped. That is a
   decoration in the shape of a progress bar, and a progress bar is the one
   thing on a page a visitor is entitled to believe.

   Counting the model's bytes alone was honest but not the whole truth. Bytes
   off the wire are a fraction of what has to happen before the page can be
   used, so the bar would race to ninety-nine and sit there through the parse,
   the environment build and the first frame — the longest part of the wait
   spent on a number that had stopped moving. Worse, it could reach a hundred
   while the page behind it was still unusable, which is the same lie the
   source tells, arrived at honestly.

   So the bar counts stages, each weighted by roughly how long it actually
   takes, and a hundred means the page is ready rather than that a download
   finished.

   There were four. The model was much the heaviest at 0.55, because it was
   1.7 MB off the wire; the .glb is gone and the figure is a Spline scene that
   does not report its progress at all. Leaving that stage in place would have
   pinned the bar at forty-five for the whole of the wait and then jumped it to
   a hundred — worse than the invented number this replaced, because it would
   look like a stall. So there are three, and they sum to one again. */

export type Stage = "fonts" | "media" | "scene";

/** Share of the bar each stage owns. They sum to one. */
const WEIGHT: Record<Stage, number> = {
  fonts: 0.18,
  media: 0.34,
  scene: 0.48,
};

const STAGES = Object.keys(WEIGHT) as Stage[];

type Listener = (fraction: number) => void;

const progress: Record<Stage, number> = { fonts: 0, media: 0, scene: 0 };
const listeners = new Set<Listener>();
const doneListeners = new Set<() => void>();
let done = false;

function total() {
  let sum = 0;
  for (const stage of STAGES) sum += WEIGHT[stage] * progress[stage];
  return sum;
}

/** Move one stage along. Values are clamped, and a stage never goes backwards:
 *  a bar that retreats is worse than one that is wrong. */
export function reportStage(stage: Stage, value: number) {
  const next = Math.min(1, Math.max(0, value));
  if (next <= progress[stage]) return;
  progress[stage] = next;
  const fraction = total();
  for (const listener of listeners) listener(fraction);
}

export function onProgress(listener: Listener) {
  listeners.add(listener);
  listener(total());
  return () => {
    listeners.delete(listener);
  };
}

/** Everything that had to happen has happened. Every stage is filled first, so
 *  the bar arrives at a hundred by counting rather than by jumping there. */
export function reportReady() {
  if (done) return;
  done = true;
  for (const stage of STAGES) progress[stage] = 1;
  for (const listener of listeners) listener(1);
  for (const listener of doneListeners) listener();
}

export function onReady(listener: () => void) {
  if (done) {
    listener();
    return () => {};
  }
  doneListeners.add(listener);
  return () => {
    doneListeners.delete(listener);
  };
}
