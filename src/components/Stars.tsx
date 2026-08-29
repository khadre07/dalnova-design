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
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              // Spread over a long cycle so no two catch together and the
              // field never pulses as one.
              animationDuration: `${2.6 + rand(i + 17) * 5.2}s`,
              animationDelay: `${rand(i + 59) * -8}s`,
              opacity: 0.25 + rand(i + 5) * 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
