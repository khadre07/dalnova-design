/* Give @splinetool/runtime the Draco decoders it asks for but does not ship.
 *
 * Its DRACOLoader references ../libs/draco/draco_decoder.js and three siblings
 * relative to its own build directory, and no published version of the package
 * contains that directory — the build fails to resolve before it ever runs.
 * three ships exactly those four, so they are copied across after install.
 *
 * A postinstall rather than a checked-in patch: node_modules is not ours to
 * keep, and this has to happen again on every clean install and on the build
 * machine, where nobody is watching.
 */
import { copyFile, cp, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/three/examples/jsm/libs/draco");
const to = join(root, "node_modules/@splinetool/runtime/libs/draco");

try {
  await access(from);
} catch {
  // three is not installed, or moved its decoders. Nothing to do, and this
  // must never be the reason an install fails.
  process.exit(0);
}

try {
  await access(join(root, "node_modules/@splinetool/runtime"));
} catch {
  process.exit(0);
}

await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });

/* And a second name for a file that was renamed without its reference.
 *
 * build/boolean.js asks for boolean_wasm_bg.wasm beside itself — the name
 * wasm-bindgen gives a crate called boolean_wasm. The package ships the same
 * bytes as boolean.wasm and never renamed the call. */
const build = join(root, "node_modules/@splinetool/runtime/build");
try {
  await access(join(build, "boolean.wasm"));
  await copyFile(join(build, "boolean.wasm"), join(build, "boolean_wasm_bg.wasm"));
} catch {
  // Not there in this version. Not a reason to fail an install.
}

console.log("spline: draco decoders copied from three, wasm alias written");
