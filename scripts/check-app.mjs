import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const syntaxFiles = ["public/app.js", "server.js", "storage.js"];
const conflictCheckedFiles = ["public/app.js", "server.js", "storage.js", "package.json", "README.md"];
const extraCheckScripts = ["scripts/check-live-tests.mjs"];
const conflictMarkerPattern = /^(<<<<<<<|=======|>>>>>>>)(.*)$/m;

let failed = false;

for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    failed = true;
  }
}

for (const file of conflictCheckedFiles) {
  const content = readFileSync(file, "utf8");
  if (conflictMarkerPattern.test(content)) {
    console.error(`Conflict marker found in ${file}`);
    failed = true;
  }
}

for (const script of extraCheckScripts) {
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Full app safety check passed.");
