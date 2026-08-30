/* Stars that catch, over the ones printed in the sky.

   Positions come from a seeded generator rather than Math.random: this renders
   on the server as well as the client, and a different sky on each would be a
   hydration mismatch — and a field that jumped on load.

   Held to the upper part of the frame, where the sky is. Below that the sky
   has already faded into the water and a star there would be floating in it. */

const COUNT = 78;

/** A small deterministic hash. Same star field every render, every machine. */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* Rounded before it reaches the DOM, and this is not cosmetic.

   A seeded generator is only half of what makes this hydrate. The other half
   is precision. Written out in full, `10.468242550996365%` is parsed by the
   browser and read back as `10.468243%`, so React compares what it computed
   against what the browser kept and finds two different strings — a mismatch
   on every load, on a component that is deterministic by construction. Three
   decimals is below what the browser trims, so both sides say the same thing. */
const px = (n: number) => `${n.toFixed(3)}px`;
const pct = (n: number) => `${n.toFixed(3)}%`;
const sec = (n: number) => `${n.toFixed(3)}s`;

export default function Stars() {
  return (
    <div className="stars" aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => {
        const x = rand(i + 1) * 100;
        // Squared, so they crowd toward the top of the sky rather than
        // spreading evenly down into the water.
        const y = Math.pow(rand(i + 43), 1.7) * 62;
        const size = 1 + rand(i + 91) * 1.4;
        return (
          <span
            key={i}
            className="star-dot"
            style={{
              left: pct(x),
              top: pct(y),
              width: px(size),
              height: px(size),
              // Spread over a long cycle so no two catch together and the
              // field never pulses as one.
              animationDuration: sec(2.6 + rand(i + 17) * 5.2),
              animationDelay: sec(rand(i + 59) * -8),
              opacity: Number((0.25 + rand(i + 5) * 0.4).toFixed(3)),
            }}
          />
        );
      })}
    </div>
  );
}
