import { spawnSync } from "node:child_process";

const files = ["public/app.js"];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Frontend syntax check passed.");
