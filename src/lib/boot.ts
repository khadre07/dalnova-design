"use client";

/* How far the figure has got, for the boot screen to report.

   The uplink sequence it is drawn from runs a scripted timeline: eight and a
   half seconds of invented percentages, held, then looped. That is a
   decoration in the shape of a progress bar, and a progress bar that is not
   reporting anything is the one thing on a page a visitor is entitled to
   believe. This one counts the model's own bytes off the wire. */

type Listener = (loaded: number, total: number) => void;

const listeners = new Set<Listener>();
let done = false;
const doneListeners = new Set<() => void>();

export function reportProgress(loaded: number, total: number) {
  for (const listener of listeners) listener(loaded, total);
}

export function onProgress(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called once the figure is on screen. The boot screen stands down. */
export function reportReady() {
  if (done) return;
  done = true;
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
