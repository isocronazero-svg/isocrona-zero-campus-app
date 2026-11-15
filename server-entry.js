const { installPasswordRecovery } = require("./server/password-recovery-bootstrap");

// Demo access is mandatory for runtime; CI executes isolated tests without public exposure.
if (process.env.CI !== "true") {
  const { installDemoGate } = require("./server/demo-access-gate");
  installDemoGate();
}

installPasswordRecovery();
require("./server.js");
