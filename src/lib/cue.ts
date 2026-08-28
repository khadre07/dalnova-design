"use client";

/* One cue, from the figure to the page.

   The copy used to start on a hardcoded delay while the figure ran on its own
   clock, so the left column finished writing itself before he had broken the
   surface — two halves of one shot, timed independently, drifting apart every
   time either was adjusted.

   Now whichever scene is running says when the figure has arrived, and the
   copy is written from that moment. The flat scene calls it when the eyes
   catch; the model scene calls it when he comes through the water. Neither
   number appears twice. */

type Listener = () => void;

const listeners = new Set<Listener>();
const arrivals = new Set<Listener>();
let fired = false;

/** Called by the stage once the figure is there to be written from. */
export function figureIsUp() {
  arrived();
  if (fired) return;
  fired = true;
  for (const listener of listeners) listener();
}

/* Two signals, not one, because two things want different answers. The copy
   is written once and stays written; anything that accompanies his arrival —
   he comes back up out of the water every time his turn comes round — wants
   to hear about every one of them. */
export function arrived() {
  for (const listener of arrivals) listener();
}

/** Runs every time the figure arrives, including on returns. */
export function onArrival(listener: Listener) {
  arrivals.add(listener);
  return () => {
    arrivals.delete(listener);
  };
}

/**
 * Runs `listener` when the figure arrives — immediately if it already has, so
 * a late subscriber is never left waiting for a cue that has been and gone.
 */
export function onFigure(listener: Listener) {
  if (fired) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
