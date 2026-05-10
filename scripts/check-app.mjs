import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const syntaxFiles = ["public/app.js", "server.js", "storage.js"];
const conflictCheckedFiles = ["public/app.js", "server.js", "storage.js", "package.json", "README.md"];
const conflictMarkerPattern = /^(<<<<<<<|=======|>>>>>>>)(.*)$/m;
const extraCheckScripts = ["scripts/check-live-tests.mjs", "scripts/check-member-notifications.mjs"];
const associateActionContracts = [
  "approve-associate",
  "approve-associate-payment",
  "approve-associate-profile-request",
  "create-associate-campus-access",
  "mark-associate-paid",
  "mark-associate-reviewed",
  "notify-associate-application",
  "notify-associate-payment",
  "notify-associate-profile-request",
  "preview-associate-workbook-import",
  "reject-associate",
  "reject-associate-payment",
  "reject-associate-profile-request",
  "request-associate-info",
  "settle-all-visible-associate-fees",
  "toggle-associate-application-selection",
  "toggle-associate-payment-selection",
  "toggle-associate-profile-request-selection"
];
const publicAppSnippets = [
  'return renderMemberOverview();',
  'const ASSOCIATE_ADMIN_ONLY_ACTIONS = new Set([',
  'Estas en modo socio/alumno. Vuelve a administracion para abrir esa zona.',
  'label: "Mi aula"',
  'label: "Mis diplomas"'
];

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

const publicAppContent = readFileSync("public/app.js", "utf8");

for (const snippet of publicAppSnippets) {
  if (!publicAppContent.includes(snippet)) {
    console.error(`Missing frontend guard snippet: ${snippet}`);
    failed = true;
  }
}

for (const action of associateActionContracts) {
  const hasRenderedAction = publicAppContent.includes(`data-action="${action}"`);
  const hasHandler =
    publicAppContent.includes(`action === "${action}"`) ||
    publicAppContent.includes(`dataset.action === "${action}"`);
  if (hasRenderedAction && !hasHandler) {
    console.error(`Associate action without handler: ${action}`);
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
