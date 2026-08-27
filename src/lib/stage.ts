"use client";

/* How present the figure is, computed from the scroll rather than switched by
   it.

   It used to flip on a single line — an observer with a -45% margin fired, and
   presence went from 1 to 0 in one frame. However long the CSS transition
   afterwards, the *decision* was a step, and a step read as a jolt: the figure
   dropped out at one scroll position and came back at another, with nothing in
   between tied to what the reader was doing.

   Now it is a continuous function of how much of the viewport a full-width
   band is covering. Scroll a little, the figure withdraws a little. */

const zones = new Set<HTMLElement>();

/** Marks a band as one that pushes the figure back while it is on screen. */
export function registerRecess(el: HTMLElement) {
  zones.add(el);
  return () => {
    zones.delete(el);
  };
}

/**
 * 1 = the figure is fully staged, 0 = fully withdrawn. Reads the largest share
 * of the viewport any recessing band currently holds; the 1.4 means the figure
 * is fully back before such a band has to fill the screen, so the withdrawal
 * finishes rather than still being underway when the reader arrives.
 */
/** Last computed presence, for anything that needs to know without measuring. */
let current = 1;

export function presenceValue() {
  return current;
}

export function presenceNow(viewport: number) {
  if (viewport <= 0) return 1;
  let covered = 0;
  for (const el of zones) {
    const rect = el.getBoundingClientRect();
    const overlap = Math.min(viewport, rect.bottom) - Math.max(0, rect.top);
    if (overlap > 0) covered = Math.max(covered, overlap / viewport);
  }
  current = Math.max(0, 1 - Math.min(1, covered * 1.4));
  return current;
}
