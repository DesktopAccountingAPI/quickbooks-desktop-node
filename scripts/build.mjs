// Builds dist/esm (ES modules) and dist/cjs (CommonJS), each with .d.ts declarations.
// Runs on `npm run build` and on `prepare` (so `npm install github:...` builds too).

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// typescript does not export ./bin/tsc, so resolve the installed file directly.
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");

function run(project) {
  const r = spawnSync(process.execPath, [tsc, "-p", join(root, project)], { stdio: "inherit", cwd: root });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

rmSync(join(root, "dist"), { recursive: true, force: true });
run("tsconfig.build.json");
run("tsconfig.build.cjs.json");
// Inside dist/cjs, .js and .d.ts files are CommonJS; the package root is "type": "module".
mkdirSync(join(root, "dist", "cjs"), { recursive: true });
writeFileSync(join(root, "dist", "cjs", "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
writeFileSync(join(root, "dist", "esm", "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");
