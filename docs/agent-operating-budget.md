# Autonomous development budget and PR protocol

## Work queue
- Source of truth: GitHub Issues and existing open pull requests.
- Priority: P0 security/data loss; P1 broken core flow; P2 user-facing improvement; P3 polish.
- One issue per agent cycle; check existing PRs first.
- No code changes if there is no actionable issue or the same work is already in review.

## Resource controls
- Default: one scoped change and one local test pass per cycle.
- Maximum two retries on the same failure; then create/update a blocking issue.
- Never rerun a green workflow just to reconfirm; avoid empty commits.
- No paid external API, infrastructure upgrade or deployment without approval.
- Report tokens/credits only if measured by a real source; otherwise say 'not available'.

## PR checklist
- [ ] Issue linked and scope explained
- [ ] Relevant tests run with actual results (or explicitly NOT RUN)
- [ ] No secrets or real personal data
- [ ] Risk and rollback plan
- [ ] No production changes
- [ ] Owner approval required before merge

## Daily report
Project | commit/PR | verified tests | blocked items | next action | measured consumption (or unavailable).
