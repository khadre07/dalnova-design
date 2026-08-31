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

   So four stages, each weighted by roughly how long it actually takes, and a
   hundred that means the page is ready rather than that the download finished.
   Whatever has not reported by the time everything else has is what the bar is
   waiting on, and it says so. */

export type Stage = "fonts" | "media" | "model" | "scene";

/** Share of the bar each stage owns. They sum to one. */
const WEIGHT: Record<Stage, number> = {
  fonts: 0.1,
  media: 0.18,
  model: 0.55,
  scene: 0.17,
};

const STAGES = Object.keys(WEIGHT) as Stage[];

type Listener = (fraction: number) => void;

const progress: Record<Stage, number> = { fonts: 0, media: 0, model: 0, scene: 0 };
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

/** Bytes off the wire, for the one stage that can be measured that way. */
export function reportProgress(loaded: number, sizeInBytes: number) {
  if (sizeInBytes > 0) reportStage("model", loaded / sizeInBytes);
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
