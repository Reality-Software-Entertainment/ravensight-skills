---
name: ravensight-studio
description: Use connected Ravensight tools to answer player or website analytics questions and work with brainstorms, design documents, studio memory, marketing, Pulse, sales, experiments, exports and studio administration. Use for studio data workflows, not SDK installation or running AI playtests.
metadata:
  version: "0.2.4"
---

# Work with your Ravensight studio

Start with the question, intended studio/project/environment and time window. Discover the available MCP tools and schemas. If access is missing, use `ravensight-connect` if installed; do not restart onboarding when a narrower permission is missing. Use https://ravensight.io/docs/#mcp and the relevant product section for current behavior.

Read only the tools needed for the question. Tool names below are discovery hints, not a promise that a particular client or token exposes them. Prefer a targeted summary over fetching every event, game or board.

| Work | Starting tools or docs |
| --- | --- |
| Company or Game Website reports and heatmaps | `get_site`, `verify_site`, `get_site_report`; docs #websites. Use the website procedure below. |
| Player behavior and data quality | `list_games`, `get_integration_status`, `get_metrics`, `get_funnel`, `get_property_breakdown`; docs #dashboard |
| Design and next-game context | `get_starting_context`, `get_game_brief`, `search_studio_context`, `list_design_docs`, `get_design_doc`; docs #design-studio |
| Brainstorming | `list_brainstorm_sessions`, `get_brainstorm_board`; create sessions/cards only when requested; docs #brainstorm |
| Memory and lessons | `search_studio_context`, `get_studio_digest`, `add_studio_fact` when authorized; docs #studio-context |
| Marketing and audience feedback | `list_touchpoints`; discover Pulse tools for posts, interactions and summaries; docs #marketing-memory and #pulse |
| Sales and connected stores | `summarize_sales`, `list_sales`, `get_launch_curve`, `list_connections`; docs #sales-ledger and #connections |
| Publishers | `list_publishers`, `get_publisher_report`; docs #publishers |
| Config and experiments | `list_remote_config`, `list_experiments`, `get_experiment_results`; read [data automation](references/data-automation.md) for exposure and interpretation limits |
| Explore, segments and reports | `explore`, `get_engagement_matrix`, `list_segments`, `list_dashboards`, `list_report_schedules`; read [data automation](references/data-automation.md) |
| Warehouse, bulk exports or organization administration | Read [data automation](references/data-automation.md) for the existing API, permission boundaries, metering and retries |
| Traffic problems | `list_traffic_sources`, `list_ip_blocks`; changes require an explicit blocking/unblocking task; docs #traffic |
| Existing playtest or simulation evidence | `list_playtest_jobs`, `get_playtest_report`, `list_playtest_findings`; docs #playtest-simulation. Reading a report does not require starting another paid job. |

## Website reports

Keep company scope separate from a title's Game Website. The optional `project_id` is the existing title slug, not an environment game id. Omit it for company scope only if the token permits the whole studio; project-restricted tokens must name an allowed title. Website tools need `site:read`; they do not return visitor/contact records or join account/player identity. Discover the selected server's tools and returned report list before requesting a report.

Use `get_site_report` for the narrow question and date range. Its `from`/`to` use Unix seconds, converted to inclusive calendar dates. Preserve `meta.coverage`, history, timezone and pagination; unknown evidence is not zero. For heatmaps, request `report: 'heatmap_pages'` first, page through returned `data.items` as needed, then use a returned `page` and `viewport` in `report: 'heatmaps'` with UTC. The dashboard can draw normalized density directly from aggregate coordinates/counts; a reference image is optional context, never a visitor screenshot. Scroll bins count received summaries, not unique visitors or session replay.

Saved website goals/funnels are distinct from gameplay funnels. Read existing definitions from `get_site`; retain returned ids for authorized edits with `save_site_goal` or `save_site_funnel`. Those writes require `site:write` and an owner-enabled write token. Do not create a definition merely to answer a read request. Report reads and configuration use the programmatic meter; they are not one-hit website collector events. Keep calls within the user's token cap and authorized budget.

For installing a website or changing event coverage, use the setup/instrumentation skill when installed. The [website docs](https://ravensight.io/docs/#websites) and actual tool schemas remain the fallback, without requiring another skill installation.

## Keep conclusions tied to evidence

Keep synthetic sessions separate from real-player analytics unless explicitly comparing them. Honor the game's detection profile: inferred rage quit, stuck or engagement labels are signals, not known player intent. Missing events or a zero count in a narrow window do not establish missing implementation. Include coverage limits and sample/time scope in conclusions.

Simulation Runner reports describe seeded, game-defined strategies. Compare completed, failed and truncated runs separately; outcome and metric summaries cover completed games only. Do not equate synthetic outcomes with player enjoyment, retention or a proven balance defect. Cite the job, seed and configuration hash. A stored summary is evidence available for an authorized analysis, not an automatically confirmed studio fact. Detailed replay traces stay on the runner's machine. If the connected server predates simulation support, explain that limit rather than claiming a missing report is empty.

Sales totals remain separate by currency and period granularity. Unknown is not zero. Prefer server summaries to summing daily and monthly rows together. Marketing lift is correlation under a stated baseline, not campaign attribution. Distinguish confirmed memory from proposed patterns and external claims. Use source IDs/links and observation dates so a decision can be revisited.

For a read request, return analysis without writing new facts, cards, touchpoints, sales or publisher state. For an authorized write, resolve the exact target, inspect required fields, and preview an import when supported. Do not retry an ambiguous non-idempotent write: reconcile by reading the target first. Never mark a publisher report sent merely because it was generated, or send it externally without explicit instructions. Money, members and account provisioning are not implied by a studio task.

Account tool calls are metered; reuse results and keep the work bounded by the authorized task and budget. Playtesting remains optional and separate. Existing playtest findings may be read if relevant and authorized, but this skill never installs or starts a playtest.

End with the answer or saved artifact, evidence and important limitations, what changed (if anything), and the next useful decision. Carry those facts back to the main skill only if another workflow is actually needed.
