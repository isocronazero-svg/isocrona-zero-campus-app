const { installPasswordRecovery } = require("./server/password-recovery-bootstrap");

installPasswordRecovery();
require("./server.js");
