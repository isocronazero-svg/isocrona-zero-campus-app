const { installPasswordRecovery } = require("./server/password-recovery-bootstrap");
const { installSessionCredentialGuard } = require("./server/session-credential-guard");

installPasswordRecovery();
installSessionCredentialGuard();
require("./server.js");
