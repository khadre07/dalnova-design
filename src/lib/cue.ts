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
let fired = false;

/** Called by the stage once the figure is there to be written from. */
export function figureIsUp() {
  if (fired) return;
  fired = true;
  for (const listener of listeners) listener();
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
