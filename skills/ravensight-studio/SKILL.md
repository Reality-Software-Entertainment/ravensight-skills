---
name: ravensight-studio
description: Use connected Ravensight tools to answer player analytics questions and work with brainstorms, design documents, studio memory, marketing, Pulse, sales, experiments, exports and studio administration. Use for studio data workflows, not SDK installation or running AI playtests.
metadata:
  version: "0.2.0-next.0"
---

# Work with your Ravensight studio

Start with the question, intended studio/project/environment and time window. Discover the available MCP tools and schemas. If access is missing, use `ravensight-connect` if installed; do not restart onboarding when a narrower permission is missing. Use https://ravensight.io/docs/#mcp and the relevant product section for current behavior.

Read only the tools needed for the question. Tool names below are discovery hints, not a promise that a particular client or token exposes them. Prefer a targeted summary over fetching every event, game or board.

| Work | Starting tools or docs |
| --- | --- |
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

## Keep conclusions tied to evidence

Keep synthetic sessions separate from real-player analytics unless explicitly comparing them. Honor the game's detection profile: inferred rage quit, stuck or engagement labels are signals, not known player intent. Missing events or a zero count in a narrow window do not establish missing implementation. Include coverage limits and sample/time scope in conclusions.

Sales totals remain separate by currency and period granularity. Unknown is not zero. Prefer server summaries to summing daily and monthly rows together. Marketing lift is correlation under a stated baseline, not campaign attribution. Distinguish confirmed memory from proposed patterns and external claims. Use source IDs/links and observation dates so a decision can be revisited.

For a read request, return analysis without writing new facts, cards, touchpoints, sales or publisher state. For an authorized write, resolve the exact target, inspect required fields, and preview an import when supported. Do not retry an ambiguous non-idempotent write: reconcile by reading the target first. Never mark a publisher report sent merely because it was generated, or send it externally without explicit instructions. Money, members and account provisioning are not implied by a studio task.

Account tool calls are metered; reuse results and keep the work bounded by the authorized task and budget. Playtesting remains optional and separate. Existing playtest findings may be read if relevant and authorized, but this skill never installs or starts a playtest.

End with the answer or saved artifact, evidence and important limitations, what changed (if anything), and the next useful decision. Carry those facts back to the main skill only if another workflow is actually needed.
