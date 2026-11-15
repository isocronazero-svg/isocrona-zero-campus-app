const { installPasswordRecovery } = require("./server/password-recovery-bootstrap");

// The demo-only branch must never start without its external access gate.
const { installDemoGate } = require("./server/demo-access-gate");
installDemoGate();

installPasswordRecovery();
require("./server.js");
