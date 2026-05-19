import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflowPath = ".github/workflows/import-test-zone-ivaspe.yml";
const workflow = readFileSync(workflowPath, "utf8");
const lines = workflow.split(/\r?\n/);

function assertIncludes(needle, message = `Missing workflow snippet: ${needle}`) {
  assert.ok(workflow.includes(needle), message);
}

function assertMatches(pattern, message = `Missing workflow pattern: ${pattern}`) {
  assert.match(workflow, pattern, message);
}

function assertNotMatches(pattern, message = `Unexpected workflow pattern: ${pattern}`) {
  assert.doesNotMatch(workflow, pattern, message);
}

function assertBefore(first, second, message) {
  const firstIndex = workflow.indexOf(first);
  const secondIndex = workflow.indexOf(second);
  assert.notEqual(firstIndex, -1, `Missing first snippet: ${first}`);
  assert.notEqual(secondIndex, -1, `Missing second snippet: ${second}`);
  assert.ok(firstIndex < secondIndex, message || `${first} must appear before ${second}`);
}

assertIncludes("workflow_dispatch:");
assertMatches(/dry_run:[\s\S]*?type:\s*boolean[\s\S]*?default:\s*true/, "dry_run must be a boolean input defaulting to true");
assertIncludes("RAILWAY_API_TOKEN: ${{ secrets.RAILWAY_API_TOKEN }}");
assertIncludes("RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}");
assertIncludes("Configure exactly one of RAILWAY_API_TOKEN or RAILWAY_TOKEN");
assertIncludes("Railway CLI accepts only one auth token environment variable at a time");
assertIncludes('if [ -z "${RAILWAY_API_TOKEN:-}" ] && [ -z "${RAILWAY_TOKEN:-}" ]; then');
assertIncludes('if [ -n "${RAILWAY_API_TOKEN:-}" ] && [ -n "${RAILWAY_TOKEN:-}" ]; then');
assertIncludes("RAILWAY_SSH_PRIVATE_KEY: ${{ secrets.RAILWAY_SSH_PRIVATE_KEY }}");
assertIncludes("Missing required GitHub secret RAILWAY_SSH_PRIVATE_KEY");
assertIncludes("--identity-file \"$ssh_key\"");
assertIncludes("railway ssh");
assertIncludes("Skipping railway whoami for token-based CI auth.");
assertNotMatches(/^\s*railway whoami\b/m, "railway whoami must not run as a blocking CI command");
assertIncludes("railway status \"${railway_args[@]}\"");
assertNotMatches(/\brailway run\b/, "Workflow must execute inside Railway via ssh, not railway run");

assertIncludes("IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION");
assertIncludes("is not allowed for this production import workflow");
assertNotMatches(/^\s*IZ_ALLOW_EPHEMERAL_STORAGE_IN_PRODUCTION\s*:\s*true\s*$/m);
assertIncludes("DATABASE_URL");
assertIncludes("IZ_DATA_DIR");
assertIncludes("Production import blocked: configure DATABASE_URL or IZ_DATA_DIR with real persistence");

assertBefore(
  "npm run import:test-zone-ivaspe -- --dry-run",
  "npm run import:test-zone-ivaspe'",
  "Remote dry-run must happen before the real import command"
);
assertIncludes('if [ "$DRY_RUN" != "false" ]; then');
assertIncludes("Dry-run requested. No production data was modified.");
assertIncludes("Validating remote Test Zone question count");
assertIncludes("testZoneQuestions");

for (const line of lines) {
  assert.ok(!line.includes("set -x"), "Workflow must not enable shell trace output");
  assert.ok(!line.includes("printenv"), "Workflow must not print the full environment");
  assert.ok(
    !/echo .*(\$RAILWAY_API_TOKEN|\$\{RAILWAY_API_TOKEN|\$RAILWAY_TOKEN|\$\{RAILWAY_TOKEN|\$RAILWAY_SSH_PRIVATE_KEY|\$\{RAILWAY_SSH_PRIVATE_KEY)/.test(line),
    "Workflow must not echo Railway secrets"
  );
}

console.log("Railway IVASPE workflow static check passed.");
