/* The water, shared by both scenes.

   Dark water at night shows three things and almost nothing else: rings
   spreading from where something meets the surface, a vertical smear of
   whatever is lit above it, and the room's own pattern broken up on the swell.
   All three are drawn in one plane rather than reflected for real — a true
   reflection means rendering the scene a second time every frame, and this
   page already runs two WebGL contexts.

   The pattern being broken up is the page's own dot field. The grid behind the
   copy is #78a5b4 at 1px every 30px; here it is that same field, seen through
   moving water, so the flat page and the scenes stay one idea.

   One copy, used by the figure and by the gallery ribbon. Two copies would
   have drifted apart the first time either was adjusted. */

export const WATER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const WATER_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uAccent;
  uniform float uIgnite;
  /* The plane's half-extents in world units. Everything below is measured in
     those rather than in the quad's own 0..1, so the surface can be made far
     wider than it is deep without the ripples turning into ellipses and the
     reflection smearing sideways with it. */
  uniform vec2 uHalf;
  /* How big one unit is in the scene using this water. The figure stands one
     unit tall; the gallery's panels are several. Dividing by it keeps the
     ripples the same size relative to what is floating on them rather than the
     same size in a scene's own arbitrary units. */
  uniform float uUnit;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    vec2 w = p * uHalf / uUnit;
    float r = length(w);

    /* Swell. Two crossing waves rather than one, so the surface never shows a
       single travelling direction — water in a still room does not. */
    float swell =
      sin(w.x * 3.1 + uTime * 0.7) * 0.5 +
      sin(w.y * 2.6 - uTime * 0.53) * 0.5;

    /* Rings leaving the middle. They thin as they widen, but slowly: what made
       the surface read as a pool was never its size, it was these falloffs
       going to nothing within half a metre. */
    float rings = sin(r * 13.0 - uTime * 1.5);
    rings = smoothstep(0.55, 1.0, rings) * exp(-r * 0.55);

    /* The dot field, seen through the water. The lookup is displaced by the
       swell, which is what breaks the grid up instead of sliding it. */
    vec2 q = w;
    q.x += swell * 0.03;
    q.y += sin(w.x * 4.4 - uTime * 0.61) * 0.024;
    vec2 cell = fract(q * 8.0) - 0.5;
    float grid = smoothstep(0.16, 0.02, length(cell));
    // Perspective: the far half of the plane is nearly edge-on, so its dots
    // crowd together and read as haze rather than as points.
    grid *= 0.45 + 0.55 * (0.5 - p.y * 0.5);

    /* The reflection. Stretched toward the viewer and pinched away from him,
       the way a bright thing smears down the near face of a swell. It stays
       narrow in world units, so widening the surface does not widen it. */
    float away = w.y > 0.0 ? w.y * 3.1 : -w.y * 0.7;
    float smear = exp(-abs(w.x) * 3.4) * exp(-away * 1.5);
    // Broken along its length, or it reads as a painted stripe.
    smear *= 0.55 + 0.45 * sin(w.y * 16.0 - uTime * 1.9);

    // The light it sits in, brightest just off the middle and carrying on
    // outward rather than stopping at arm's length.
    float pool = exp(-r * 0.9) * (1.0 - exp(-r * 5.6));

    float a = rings * 0.26 + grid * 0.17 + smear * 0.42 + pool * 0.3;

    /* Held to the plane's own edges rather than to a circle. A radial cut made
       the surface a disc that went out well before the sides of the frame. The
       plane is far wider than anything that can be in shot, so this fade only
       ever happens outside it — the water simply runs off both sides. */
    a *= smoothstep(1.0, 0.94, abs(p.x)) * smoothstep(1.0, 0.55, abs(p.y));
    a *= uIgnite;

    if (a <= 0.001) discard;
    gl_FragColor = vec4(uAccent * a, a);
  }
`;
