"use client";

/* Scroll to chapters, the way Kage does it.

   Its grammar, not its world. The mechanism there is worth taking whole: the
   sections carry a camera index in the markup, the scroll position is turned
   into a *fractional* index — 2.37 meaning a bit over a third of the way from
   the third stop to the fourth — and a spline through the stops is sampled at
   that fraction. That is what makes the travel continuous while the stops stay
   nameable, and it is why the camera arrives somewhere rather than drifting.

   Kept exactly: the anchors, with the first section pinned to the top of the
   document, the last to the bottom, and every one in between to its own middle
   meeting the middle of the screen; the strict ordering pass that follows,
   which keeps two short sections from sharing an anchor and dividing by zero;
   and the fractional walk.

   Not kept: reading `document.documentElement.scrollHeight` on every scroll.
   Kage measures once and on resize; here it is measured on resize and when the
   sections themselves change size, because this page has bands that grow when
   their images land. */

export type Anchors = { at: number[]; max: number };

/** Where each chapter sits on the scrollbar. */
export function measure(sections: HTMLElement[]): Anchors {
  const viewport = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - viewport);

  const at = sections.map((el, i) => {
    if (i === 0) return 0;
    if (i === sections.length - 1) return max;
    // The section's middle meeting the screen's middle: a chapter is arrived
    // at when it is centred, not when its top edge crosses the fold.
    const centre = el.offsetTop + el.offsetHeight / 2 - viewport / 2;
    return Math.min(Math.max(centre, 0), max);
  });

  /* Strictly increasing. Two short bands can otherwise land on the same
     anchor, and the walk below would divide by zero between them. */
  for (let i = 1; i < at.length; i += 1) {
    if (at[i] <= at[i - 1]) at[i] = at[i - 1] + 1;
  }

  return { at, max };
}

/** Scroll position to a fractional chapter index. */
export function progressAt(y: number, anchors: Anchors) {
  const { at } = anchors;
  if (at.length === 0) return 0;
  if (y <= at[0]) return 0;
  for (let i = 0; i < at.length - 1; i += 1) {
    if (y <= at[i + 1]) return i + (y - at[i]) / (at[i + 1] - at[i]);
  }
  return at.length - 1;
}
