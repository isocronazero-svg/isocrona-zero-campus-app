const { installPasswordRecovery } = require("./server/password-recovery-bootstrap");

// Isolated public demo uses only synthetic data, without production integrations.
installPasswordRecovery();
require("./server.js");
