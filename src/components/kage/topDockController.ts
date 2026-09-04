"use client";

/* The Sable dock's proximity spring, pointed at this page's own nav.

   Taken from the component and not reimplemented: the behaviour is the
   measure/target/spring/apply loop, and it is worth having exactly. Each item
   is measured at rest, the pointer's distance to each centre becomes a
   smoothstepped influence, a critically-ish damped spring chases that
   influence, and the value is spent as width, height and a small drop. That is
   the whole of it.

   Three things the source carries that this page does not, and so are not
   here: the vertical rail (axis "y"), the renormalised strip (distribute) and
   the pinned track (lockTrack). They exist for the modern, retro and glass
   variants. This is the sable one, and carrying three unused branches would be
   carrying three other docks.

   Two adaptations, both forced by where it now lives:

   The enable threshold is this page's own breakpoint rather than 600. Below
   821 the links leave the bar entirely and become the slide-in sheet, and a
   spring writing pixel widths onto a full-width sheet row is writing into a
   layout that no longer exists. The source's 600 is the width its own bar
   collapses at; ours is 820.

   The Enter/Space key handler is gone. The source's items are buttons, which
   need it. Ours are anchors: Enter already follows the href, and taking Space
   would take the page scroll away from anyone reading with the keyboard. The
   focus handling stays — that is the keyboard's proximity, and it is the part
   worth having. */

export type TopDockOptions = {
  proximity: number;
  spring: number;
  damping: number;
  widthGrowth: number;
  heightGrowth: number;
  drop: number;
};

/** The configured Sable numbers, unchanged. */
export const TOP_DOCK_DEFAULTS: TopDockOptions = {
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
};

type DockItemState = {
  element: HTMLElement;
  baseWidth: number;
  baseHeight: number;
  value: number;
  velocity: number;
  target: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function createTopDockController(
  root: HTMLElement,
  getOptions: () => TopDockOptions,
) {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisionQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  const items: DockItemState[] = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dock-item]"),
  ).map((element) => ({
    element,
    baseWidth: 0,
    baseHeight: 0,
    value: 0,
    velocity: 0,
    target: 0,
  }));

  let enabled = false;
  let pointerActive = false;
  let dirty = false;
  let frame = 0;

  const canAnimate = () =>
    !reducedQuery.matches &&
    root.clientWidth > 0 &&
    window.innerWidth > 820 &&
    precisionQuery.matches;

  const measure = () => {
    enabled = canAnimate();
    for (const state of items) {
      state.element.style.width = "";
      state.element.style.height = "";
      state.element.style.transform = "";
      state.element.dataset.dockNear = "false";
    }
    for (const state of items) {
      const rect = state.element.getBoundingClientRect();
      state.baseWidth = rect.width;
      state.baseHeight = rect.height;
      state.value = 0;
      state.velocity = 0;
      state.target = 0;
    }
    pointerActive = false;
    dirty = false;
    root.dataset.dockState = enabled ? "idle" : "static";
    root.dataset.dockMax = "0.00";
    placeIndicator();
  };

  const setTargets = (clientX: number) => {
    if (!enabled) return;
    const options = getOptions();
    const rects = items.map((state) => state.element.getBoundingClientRect());
    for (let index = 0; index < items.length; index += 1) {
      const rect = rects[index];
      const center = rect.left + rect.width * 0.5;
      const proximity = clamp(
        1 - Math.abs(clientX - center) / Math.max(1, options.proximity),
        0,
        1,
      );
      /* smoothstep, so an item eases into its neighbour's influence instead of
         handing it over on a straight line */
      const influence = proximity * proximity * (3 - 2 * proximity);
      items[index].target = influence;
      items[index].element.dataset.dockNear = influence > 0.08 ? "true" : "false";
    }
    pointerActive = true;
    dirty = true;
    root.dataset.dockState = "active";
  };

  const focusItem = (item: HTMLElement) => {
    if (!enabled) return;
    const index = items.findIndex((state) => state.element === item);
    if (index < 0) return;
    items.forEach((state, itemIndex) => {
      state.target =
        itemIndex === index ? 1 : Math.abs(itemIndex - index) === 1 ? 0.24 : 0;
      state.element.dataset.dockNear = state.target > 0.08 ? "true" : "false";
    });
    pointerActive = false;
    dirty = true;
    root.dataset.dockState = "focus";
  };

  const reset = () => {
    pointerActive = false;
    dirty = true;
    items.forEach((state) => {
      state.target = 0;
      state.element.dataset.dockNear = "false";
    });
  };

  /* The link bar, under the port you are on.

     Written here rather than only when the chapter changes, because the port's
     own width moves while the pointer approaches it: set once, the bar would
     sit beside what it points at for as long as the spring ran. offsetLeft is
     measured against the track, which is positioned, so it is already the
     coordinate the bar is drawn in. */
  const indicator = root.querySelector<HTMLElement>(".nav-ind");
  const placeIndicator = () => {
    if (!indicator) return;
    const active = items.find((state) => state.element.classList.contains("on"));
    if (!active) {
      root.style.setProperty("--ind-o", "0");
      return;
    }
    const el = active.element;
    root.style.setProperty("--ind-x", `${el.offsetLeft}px`);
    root.style.setProperty("--ind-w", `${el.offsetWidth}px`);
    root.style.setProperty("--ind-o", "1");
  };

  /* The only place item geometry is written. */
  const applyLayout = () => {
    const options = getOptions();
    for (const state of items) {
      const value = clamp(state.value, 0, 1.08);
      /* the width growth is capped at a quarter of the item's own width, so a
         narrow tile does not gain proportionally more than a wide one and the
         row keeps its rhythm */
      const extraWidth = Math.min(options.widthGrowth, state.baseWidth * 0.24);
      state.element.style.width = `${(state.baseWidth + extraWidth * value).toFixed(2)}px`;
      state.element.style.height = `${(state.baseHeight + options.heightGrowth * value).toFixed(2)}px`;
      state.element.style.transform = `translateY(${(value * options.drop).toFixed(2)}px)`;
    }
    placeIndicator();
  };

  const draw = () => {
    if (enabled && dirty) {
      const options = getOptions();
      let moving = false;
      let maxValue = 0;
      for (const state of items) {
        state.velocity += (state.target - state.value) * options.spring;
        state.velocity *= options.damping;
        state.value += state.velocity;
        if (
          Math.abs(state.target - state.value) < 0.001 &&
          Math.abs(state.velocity) < 0.001
        ) {
          state.value = state.target;
          state.velocity = 0;
        } else {
          moving = true;
        }
        maxValue = Math.max(maxValue, clamp(state.value, 0, 1.08));
      }
      applyLayout();
      root.dataset.dockMax = maxValue.toFixed(2);
      if (!moving) {
        dirty = false;
        if (items.every((state) => state.target === 0)) root.dataset.dockState = "idle";
      }
    }
    frame = requestAnimationFrame(draw);
  };

  const onPointerMove = (event: PointerEvent) => setTargets(event.clientX);
  /* the row grows downward past the track, so an item can still be under the
     pointer after it has left the track's own box: the release is measured
     against the lowest edge any item currently reaches */
  const onWindowPointerMove = (event: PointerEvent) => {
    if (!pointerActive) return;
    const rootRect = root.getBoundingClientRect();
    const itemRects = items.map((state) => state.element.getBoundingClientRect());
    const bottom = Math.max(rootRect.bottom, ...itemRects.map((rect) => rect.bottom));
    const outside =
      event.clientX < rootRect.left ||
      event.clientX > rootRect.right ||
      event.clientY < rootRect.top ||
      event.clientY > bottom;
    if (outside) reset();
  };
  const onFocusIn = (event: FocusEvent) => {
    const item = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-dock-item]",
    );
    if (item) focusItem(item);
  };
  const onFocusOut = () =>
    requestAnimationFrame(() => {
      if (!root.contains(document.activeElement)) reset();
    });
  const onClick = () => reset();

  /* The spring writes an explicit pixel width onto every item, so the base
     measurement has to happen after the label font is available — measured
     against a fallback face, an auto-width item locks in a box its own text
     then overflows. */
  let released = false;
  const remeasure = () => {
    if (!released) measure();
  };
  document.fonts?.ready.then(remeasure);

  /* Measured from the bar and not from the track: the track is what grows, and
     observing it would re-measure — and so cancel — the spring on every frame
     it moved. */
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root.parentElement ?? root);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", reset);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("click", onClick);
  window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
  reducedQuery.addEventListener("change", measure);
  precisionQuery.addEventListener("change", measure);
  /* The scene script owns the "on" class — it reads which chapter the scroll is
     in — so the bar has to be told when that changes. While the spring is
     running applyLayout already places it every frame; this is for the far more
     common case of scrolling with the pointer nowhere near the bar. */
  const chapterWatch = new MutationObserver(placeIndicator);
  for (const state of items) {
    chapterWatch.observe(state.element, { attributes: true, attributeFilter: ["class"] });
  }

  measure();
  placeIndicator();
  frame = requestAnimationFrame(draw);

  return () => {
    released = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    chapterWatch.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", reset);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("click", onClick);
    window.removeEventListener("pointermove", onWindowPointerMove);
    reducedQuery.removeEventListener("change", measure);
    precisionQuery.removeEventListener("change", measure);
    for (const state of items) {
      state.element.style.width = "";
      state.element.style.height = "";
      state.element.style.transform = "";
      delete state.element.dataset.dockNear;
    }
    for (const name of ["--ind-x", "--ind-w", "--ind-o"]) root.style.removeProperty(name);
    delete root.dataset.dockState;
    delete root.dataset.dockMax;
  };
}
