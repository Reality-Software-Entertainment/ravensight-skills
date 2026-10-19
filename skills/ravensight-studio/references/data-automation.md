# Config, experiments and data automation

This reference describes the implemented contracts, not a live deployment status. Verify
available tools, installed SDK methods and the selected server's deployed contract
before using a capability. A local implementation or catalog entry does not prove
that production is running it. Use the existing RealitySE account and Ravensight
API; these workflows do not introduce another login service.

## Config and experiment evidence

Discover `list_remote_config`, `list_experiments` and `get_experiment_results`.
The first returns key names, types, versions and rule counts, not config values.
These tools are read-only. They do not publish config, start/stop experiments,
promote a winner or grant access through an incoming analytics share.

For config implementation, route to the installed instrumentation skill and
inspect the actual SDK. Fetch with the publishable ingest key, not an account
MCP token. Cache and assignment scope include endpoint, key, device, platform and
build. Use typed fallbacks, consent gating and offline behavior. Configuration
is public data, never secrets. Let the SDK attach `rs_exp_<key>` to events at
enqueue time; do not fabricate labels or retrofit old queued events. A fresh
config fetch consumes one ordinary event, while a valid conditional 304 is free.

Experiment outcomes use observed exposure cohorts, real players only, and
outcomes after first exposure. Mixed-variant devices are excluded. Report both
exposed and measured counts, metric units, uncertainty, maturity and returned
notes. The first variant is the comparison baseline. Read the returned metric
label: for example, `median_session_seconds` in experiment results is mean
session seconds per exposed player, not the dashboard's pooled median. Currency
is fixed per monetary test. Results may cover only the remaining 90-day raw
window and cap exposure cohorts at 50,000 players. A small p-value or a leading
variant does not automatically establish causality or authorize promotion;
repeated looks and multiple variants are not adjusted. Keep analysis separate
from a requested, reviewed configuration change in the dashboard.

Useful discovery links: https://ravensight.io/docs/#remote-config and
https://ravensight.io/docs/#experiments.

## Bounded analytics and exports

Prefer `explore`, `get_engagement_matrix`, `get_realtime`, `list_segments`,
`list_dashboards` and `list_anomalies` when they answer the question directly.
Check truncation, synthetic scope and saved segment scope. `list_report_schedules`
reads delivery configuration/status; it does not send a report.

`export_events` provides bounded event pages using returned `nextAfter` and
`nextSkip`. For bulk archives, use the existing bucket-export settings, not an
unbounded sequence of paid row reads. `list_export_deliveries` is owner-only
history and safe errors, never provider credentials or an export mutation.

Bucket destinations support S3 and GCS, with `jsonl.gz` (default) or `parquet`.
Format is fixed at destination creation; inspect the destination before proposing
a replacement. Both formats use the same cursor, manifest, retry behavior and
five weighted events per delivered event in this candidate. Parquet `props` and
`rs` are JSON strings; `data` is original payload text. Dynamic exposure labels
remain in those JSON maps, not dedicated columns. Monetary amounts remain minor
units and distinct currencies must not be summed. Cloud IAM setup, destination
tests and actual deliveries are separate actions requiring the appropriate
account and authorization; a successful local encoder test proves none of them.

## Warehouse SQL on the existing API

For a query beyond the bounded tools, the candidate REST endpoint is
`POST /api/v1/data/games/:gameId/sql`, on `https://api.ravensight.io`, with the
studio-bound `gt_mcp_...` Bearer credential and `{ "sql": "...", "include_synthetic": "exclude" }`.
Do not substitute this for an MCP tool named `run_sql`: the larger warehouse
profile is REST-only. Use a stable `X-Ravensight-Operation-Id` for a retry of the
same query and scope. Never place credentials in URLs or source files.

The server guards and rewrites read-only SQL for one game, estimates work before
reservation, and bounds results to 10,000 rows/4 MB, execution to 30 seconds,
read/memory limits to 1 GB and scanned rows to one billion. There are at most
200 admitted warehouse queries per token per UTC day. Price is two programmatic
calls plus one per started 500,000 estimated rows (100,000 weighted events per
call in this candidate). Lower actual work can refund the difference; missing
actual scan statistics do not imply a refund. Verify current rates and the user's
budget before an expensive query; do not split a refused query into many paid
queries without a bounded plan. Return billing metadata and query limitations.

## Organization management

Discover `org_list_games`, `org_list_projects`, `org_list_members` and
`org_list_invites`; REST equivalents are under `/api/v1/data/org`. Each costs one
programmatic call, unlike the separate free game-discovery endpoint. Lists cap
at 500 and report truncation. Organization operations need a whole-studio token,
current membership and role permissions; project-scoped tokens and incoming
cross-studio shares do not grant access.

Management tools are `org_create_game`, `org_create_project`, `org_update_game`,
`org_create_invite`, `org_remove_member` and `org_revoke_invite`. They additionally
require owner-enabled `canManage`, distinct from `canWrite` for studio content.
Do not enable either permission merely to complete a read. An admin's management
flag does not grant owner-only invitation/member actions. Organization tools
cannot manage money, tokens or ingest credentials, delete games/projects, change
roles, or remove the caller/owner. Creating a game does not return an ingest key;
use dashboard Settings for credential provisioning.

Inviting a teammate sends an email. Removing a member also revokes that person's
studio CLI access. Execute only the specific action the user authorized, after
resolving the target studio/resource. REST writes require a stable operation ID
of 8 to 100 letters, digits, dots, colons, underscores or hyphens. Reuse exactly
the same ID and input after an ambiguous response, preserving the transport's
`X-Ravensight-Operation-Id`. If an MCP client cannot control that header, reconcile
the target state before retrying a mutation; a fresh operation ID is new work.
The returned metadata records the operation ID, rate and event units.
