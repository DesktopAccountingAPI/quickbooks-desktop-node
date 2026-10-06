// Runs the unit tests and the conformance suite as compiled JavaScript, for Node.js versions
// without TypeScript type stripping (Node.js 20). Compiles src/ and test/ into build/test-dist.
//
//   node scripts/test-dist.mjs

import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "build", "test-dist");
rmSync(out, { recursive: true, force: true });

const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
const compile = spawnSync(process.execPath, [tsc, "-p", join(root, "tsconfig.test-dist.json")], { stdio: "inherit", cwd: root });
if (compile.status !== 0) process.exit(compile.status ?? 1);

const unit = readdirSync(join(out, "test", "unit"))
  .filter((f) => f.endsWith(".test.js"))
  .sort()
  .map((f) => join(out, "test", "unit", f));
const files = [...unit, join(out, "test", "conformance.test.js")];
const run = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit", cwd: root });
console.log(`node ${process.version}: ${run.status === 0 ? "passed" : "failed"}`);
process.exit(run.status ?? 1);
