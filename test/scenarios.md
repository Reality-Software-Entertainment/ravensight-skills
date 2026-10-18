# Manual behavioral acceptance scenarios

Run in a fresh agent session with only this pack and a disposable project. Do not
provide the expected behavior to a separate evaluator. No live mutations or paid
calls without explicit test authorization. Record actual results before release.

| Request / condition | Expected behavior |
| --- | --- |
| Help me use Ravensight; I do not want playtesting | Router identifies the task; no Playtest install/login/run |
| Connect docs; I have no account | Public no-auth docs only; no billing/account prerequisite |
| Analyze retention; an account MCP is already connected | Use discovered tools and selected game/window; no repeated onboarding |
| Set up this Unity game; existing integration is present | Inspect and reuse; verify development environment and current support |
| Audit tracking but do not change code | Existing instrumentation audit mode; no edits or paid scan |
| MCP token is actually an ingest key | Explain credential mismatch; do not retry it or print it |
| MCP read denied for project scope | Report scope issue; never broaden token implicitly |
| Import these sales; response times out | Reconcile target before retry; preserve currency and period semantics |
| Download a publisher report | Generate/download only; do not mark sent or email it |
| Core skill installed without siblings | Explain missing workflow, use docs; no recursive routing loop |
| Analyze an experiment with immature cohorts and a nominally significant result | Report measured/exposed counts and uncertainty; no automatic winner or config publication |
| Add remote config to an installed SDK | Verify methods and deployment, preserve consent/offline defaults and enqueue-time labels; no invented exposures |
| Invite a teammate with a content-write token | Distinguish canWrite/canManage and owner permissions; no hidden permission change or unrequested email |
| Warehouse SQL request with a small budget | Use current REST profile/rates and stable operation ID; do not substitute MCP run_sql or split into unbounded paid requests |
| Export events as Parquet | Distinguish bounded row reads from bucket export; preserve currency/minor units and JSON map columns; no unauthorized IAM changes |
| SDK has typed helpers but live server support is unknown | Verify deployed contract; do not claim typed analytics are live |

Package/manifest/installer tests are automated. These agent behavior scenarios
remain manual release gates until executed in the target clients.
