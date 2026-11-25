# Agent operating rules

Scope: this repository only. Never modify the other project or production infrastructure.

## Workflow
1. Read the current open issues, PRs, CI state and latest project log before changing anything.
2. Choose one scoped issue at a time. Do not duplicate work in another open PR.
3. Work in a feature branch; open a draft PR against main. Never push to main, auto-merge, or deploy production.
4. Run `npm run check:app` before requesting review. If dependencies or execution are unavailable, mark tests NOT RUN; never claim PASS.
5. In the PR include: linked issue, rationale, files changed, commands and results, risk, rollback, and next action.
6. Never use real user data in QA or expose credentials, tokens, personal data, or private QA URLs.
7. Minimize resource consumption: skip no-op runs, avoid redundant CI reruns, cap debugging to two attempts per failure, and stop on blocked access or missing secrets.
8. Require explicit owner approval for merge, production deployment, paid services, destructive migrations, and changes to authentication or authorization policy.

## Completion criteria
Issue linked; minimal diff; tests evidenced; security/privacy reviewed; rollback described; draft PR ready for human approval.
