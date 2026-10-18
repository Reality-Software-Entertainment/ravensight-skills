# Real-client onboarding results

October 17, 2026. Release status: HOLD. No push, tag, npm publication, marketplace submission or website deployment.

## Executed

Claude Code 2.1.302 was launched with the local plugin in an isolated test directory, existing subscription sign-in, restricted read tools, and an explicitly supplied public docs MCP configuration. The client discovered all five qualified Ravensight skills and connected to the documentation endpoint. Its first model request was rejected with HTTP 429 / usage_limit_reached. No model-generated skill behavior ran. This is a client loading/connectivity pass and a BLOCKED behavioral test, not a full Claude onboarding pass. The client reports the weekly limit resets October 21 at 5pm America/Los_Angeles; it also reports a spend-limit block, so the reset alone may not resolve access. Billing settings were not changed and no retry loop was used.

Codex CLI 0.162.0-alpha.17.2 was run through its real exec workflow, with existing ChatGPT sign-in, fresh ephemeral sessions, read-only sandbox, user config/rules ignored, installed project skills and the public docs MCP. No model override was applied. Host/system skills may remain available; traces show the Ravensight workflows actually read. This exercises local skill installation and MCP configuration, not a marketplace install or portal approval.

| Test | Result | Evidence |
|---|---|---|
| Main skill, no account, no Playtest, current Unity documentation | PASS after refinement | Loaded main then setup; retrieved live public docs, followed returned SDK repository link; no account creation or paid product calls |
| Existing Unity integration, audit only | PASS | Inspected actual synthetic fixture; reused declared dependency; correctly distinguished package declaration from installed SDK, missing event coverage, and unverified delivery |
| Ingest / Playtest credentials proposed for account MCP | PASS, guidance only | Loaded main then connect; refused credential substitution and described scoped personal token requirements; no real credential submitted |
| SDK typed helpers with unknown deployed server | PASS, guidance only | Did not assume monetization was live; required matching deployed contract and later authorized verification |
| Core skill installed without sibling workflows | PASS with minor recovered tool error | Identified missing siblings; used existing docs connection; no installation or routing loop; one invalid empty search was corrected |
| Claude plugin discovery and public docs connection | PASS | All five skills discovered; docs server connected with explicit test MCP config |
| Claude skill execution | BLOCKED | Account usage_limit_reached before model execution |

## Improvement from the test

The first Codex onboarding run completed but made three unsuccessful discovery calls and repeatedly read the whole catalog while looking for a Unity section that does not exist. Updated ravensight-setup to use returned IDs and schemas, follow the repository link when the catalog lacks an engine-specific guide, and avoid repeated full-index reads. The fresh rerun used six successful docs MCP calls, zero failed MCP calls, and no full-index reads.

The rerun honestly reported inconsistent Unity support text returned by web search. A separate direct fetch of the current public raw README confirmed newer Unity 6000.6.5f1 verification and a v0.2.1 pin example. The discrepancy was stale retrieved content; no product support claims were changed based on the cached result.

## Integrity and remaining gates

SHA-256 comparison found no changes to the original fixture/installed-skill files after the first three Codex runs. Traces show read-only file inspections and documentation reads, with no account MCP, Playtest, paid scan, publishing or deployment calls. No real Ravensight credential was supplied. Tests used a synthetic Unity project, not a Unity runtime, so SDK installation, compilation and received-event delivery remain unverified.

Authenticated account onboarding, wrong-scope/revoked-token/budget tests, sales timeout reconciliation and publisher-report behavior were not executed against a live account. They require an explicitly selected development account/token and suitable fixtures. Claude behavioral scenarios must be rerun when the client's existing account can make model requests. Native marketplace installation and hosted OpenAI authenticated integration are separate gates; OAuth was not implemented or validated here.

After the observed skill change, all 41 package tests and the setup skill validator passed. Public evidence is in ravensight-onboarding-evidence.json. Full local traces and exact prompts are retained in work/onboarding-tests for reproducibility. Deployment remains held until the stalled branch is reconciled and the owner clears the hold.

## Held roadmap reference update

Config, experiments, organization automation, warehouse SQL and Parquet guidance
was added from the held local platform implementation on October 17, 2026.
The earlier five Codex behavioral passes do not cover these new workflows.
Before release, rerun the added scenarios in `test/scenarios.md` through real
Codex and Claude clients. Claude model execution remains blocked by the last
observed account usage/spend limit until a successful new run proves otherwise.

Still distinct and unexecuted here: authenticated development-account MCP/REST
onboarding; revoked/wrong-scope/budget-limited token cases; owner canManage versus
content canWrite behavior; idempotent mutation reconciliation with mocked mail;
warehouse estimate/billing disclosure; config/experiment readiness and incomplete
cohort interpretation; Parquet consumer interpretation; native marketplace install
and official-directory review. Real mail, cloud IAM, paid queries and production
writes remain held. Package/static checks are not behavioral onboarding passes.

Local validation for this update: 41 package tests passed, all four changed skills
passed the skill-creator validator, and reference quotes matched local catalog
`45dd237435ce` after incorporating the typed-event detection explanation.
The catalog may change again before release; repeat the reference check against
the final reviewed catalog, then the published catalog after deployment approval.
