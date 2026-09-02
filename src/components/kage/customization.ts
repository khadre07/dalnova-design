"use client";

/* The configured props, applied to a page instead of to a frame.

   In the package these reach the document through `applyPageCustomization`,
   which writes a <style> into the iframe's contentDocument. There is no
   contentDocument any more, so the same work is done here against the page
   itself: one stylesheet, appended once, holding the accent and the type.

   The colour is the interesting part. The brief calls primaryColor "the
   vermilion accent and the ember tint it drives", which is exactly right —
   Kage has two reds, and the second is a lighter, warmer relative of the
   first. So the ember is not set to the new colour; the relationship between
   the authored pair is measured in HSL and re-applied, which keeps the two
   reading as one family whatever colour they are moved to.

   What this cannot reach, and it is worth saying plainly: the world. The moon,
   the gate and the lacquer take their red from materials inside the Three.js
   scene, not from these variables — the three mentions of "vermilion" in the
   authored script are comments. The package's iframe version has the same
   limit for the same reason. So primaryColor moves the interface and leaves
   the temple its own colour. */

const AUTHORED = { vermilion: "#e0231c", ember: "#ff5a3c" };

type RGB = [number, number, number];
type HSL = { h: number; s: number; l: number };

function toRgb(hex: string): RGB {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.replace(/./g, (c) => c + c) : v;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

function toHsl(hex: string): HSL {
  const [r, g, b] = toRgb(hex).map((n) => n / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    (((max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) *
      60) +
      360) %
    360;
  return { h, s, l };
}

function toHex({ h, s, l }: HSL) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    [r + m, g + m, b + m]
      .map((n) => Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** The ember, carried across by the relationship it had to the vermilion. */
function derive(primary: string) {
  const from = toHsl(AUTHORED.vermilion);
  const to = toHsl(AUTHORED.ember);
  const next = toHsl(primary);
  return toHex({
    h: (next.h + (to.h - from.h) + 360) % 360,
    s: Math.min(1, next.s * (from.s > 0.01 ? to.s / from.s : 1)),
    l: Math.min(1, next.l * (from.l > 0.01 ? to.l / from.l : 1)),
  });
}

export type Customization = {
  primaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  headingWeight?: string;
  bodyWeight?: string;
  headingSize?: number;
  bodySize?: number;
  headingLetterSpacing?: number;
};

export function customizationCss(c: Customization) {
  const rules: string[] = [];

  if (c.primaryColor) {
    rules.push(
      `:root{--vermilion:${c.primaryColor};--ember:${derive(c.primaryColor)};}`,
    );
  }

  /* The heading size is a ceiling, not a size: the authored rule is a clamp,
     and replacing it with one number would give every screen the same display
     type. Only the top of the clamp moves. */
  const head: string[] = [];
  if (c.headingFont) head.push(`font-family:'${c.headingFont}',system-ui,sans-serif`);
  if (c.headingWeight) head.push(`font-weight:${c.headingWeight}`);
  if (c.headingSize) head.push(`font-size:clamp(30px,4vw,${c.headingSize}px)`);
  if (c.headingLetterSpacing !== undefined) {
    head.push(`letter-spacing:${c.headingLetterSpacing}em`);
  }
  if (head.length) rules.push(`.display,.h-sec{${head.join(";")};}`);

  const body: string[] = [];
  if (c.bodyFont) body.push(`font-family:'${c.bodyFont}',system-ui,sans-serif`);
  if (c.bodyWeight) body.push(`font-weight:${c.bodyWeight}`);
  if (c.bodySize) body.push(`font-size:${c.bodySize}px`);
  if (body.length) rules.push(`.lead,.body{${body.join(";")};}`);

  return rules.join("\n");
}
