"use client";

/* The link between the copy and the smoke that writes it.

   A module-level registry rather than context: blocks register from an effect
   and are then read sixty times a second by the smoke layer's own loop.
   Routing that through React would put a state update per block per frame back
   into the scroll path. */

export type BlockState = {
  /** 0 = not yet written, 1 = fully there. */
  ink: number;
  /** Seconds this block has been waiting, for the guarantee below. */
  waited: number;
  /** Whether the block is on screen and should be written. */
  active: boolean;
  /** Whether smoke has already been thrown at it this time round. */
  bloomed: boolean;
  /** Last value pushed to the DOM, so style is only touched when it moved. */
  painted: number;
};

const blocks = new Map<HTMLElement, BlockState>();

let live = false;

/** True while a smoke layer is actually running. */
export function veilLive() {
  return live;
}

export function setVeilLive(next: boolean) {
  live = next;
  if (!next) {
    // Going away — leave nothing half-written behind.
    for (const [el, state] of blocks) {
      state.ink = 0;
      state.painted = -1;
      state.bloomed = false;
      clearInk(el);
    }
  }
}

export function registerBlock(el: HTMLElement) {
  blocks.set(el, { ink: 0, waited: 0, active: false, bloomed: false, painted: -1 });
  return () => {
    blocks.delete(el);
    clearInk(el);
  };
}

/** Called by <Reveal> when a block enters or leaves the viewport.
 *
 *  Leaving does not wipe the ink — it lets the smoke layer ease it back down,
 *  so the block fades the way it arrived. Clearing it here made the exit a
 *  single frame while the entrance took half a second, and asymmetry of that
 *  size reads as a fault rather than as a choice. */
export function setBlockActive(el: HTMLElement, active: boolean) {
  const state = blocks.get(el);
  if (!state || state.active === active) return;
  state.active = active;
  if (!active) {
    // Ready to be written again from nothing on the way back.
    state.waited = 0;
    state.bloomed = false;
  }
}

export function eachBlock(visit: (el: HTMLElement, state: BlockState) => void) {
  for (const [el, state] of blocks) visit(el, state);
}

/* Mirrored onto an attribute as well as a custom property, so the blur only
   exists on blocks still being written — a finished paragraph carries no
   filter at all. */
export function paintInk(el: HTMLElement, state: BlockState) {
  if (Math.abs(state.painted - state.ink) < 0.008) return;
  state.painted = state.ink;

  if (state.ink >= 0.995) {
    el.style.setProperty("--ink", "1");
    delete el.dataset.inking;
    return;
  }
  if (state.ink <= 0.001) {
    el.style.setProperty("--ink", "0");
    delete el.dataset.inking;
    return;
  }
  el.style.setProperty("--ink", state.ink.toFixed(3));
  el.dataset.inking = "";
}

function clearInk(el: HTMLElement) {
  delete el.dataset.inking;
  el.style.removeProperty("--ink");
}
