"use client";

/* The conduits are the page's wiring. A section coming into view sends a
   charge down one of them, and the copy in that section lights up when the
   charge lands — the figure is visibly what writes the page.

   The travel time is a constant, not a measurement. That is the whole point:
   every block in a section can wait exactly this long without anyone
   coordinating, and the copy can never fail to appear because something did
   not reach it. */
export const CHARGE_MS = 620;

type Listener = (index: number) => void;

const listeners = new Set<Listener>();

/** Subscribe a piece of the wiring — the conduit itself, its project tag. */
export function onCharge(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function fireCharge(index: number) {
  for (const listener of listeners) listener(index);
}

/** Whether anything is actually wired up. False on a page with no stage, or
 *  under reduced motion, where the copy should simply appear. */
export function chargeLive() {
  return listeners.size > 0;
}

/** Restart a one-shot animation on an element. Reading layout in between is
 *  what forces the browser to notice the animation was removed; without it the
 *  two style writes coalesce and nothing replays. */
export function replay(node: Element | null, animation: string) {
  if (!node || !(node instanceof HTMLElement || node instanceof SVGElement)) return;
  node.style.animation = "none";
  void node.getBoundingClientRect();
  node.style.animation = animation;
}
