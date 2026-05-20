import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serverContent = readFileSync("server.js", "utf8");

assert.match(
  serverContent,
  /const port = process\.env\.PORT \|\| 3210;/,
  "server.js debe seguir respetando PORT para entornos PaaS"
);
assert.match(
  serverContent,
  /const host = process\.env\.HOST \|\| "0\.0\.0\.0";/,
  'server.js debe bindear por defecto a "0.0.0.0"'
);
assert.match(
  serverContent,
  /server\.listen\(port, host, \(\) => \{/,
  "server.js debe escuchar usando port y host"
);
assert.doesNotMatch(
  serverContent,
  /server\.listen\(port, \(\) => \{/,
  "server.js no debe escuchar solo en port sin host explicito"
);

console.log("Railway runtime check passed.");
