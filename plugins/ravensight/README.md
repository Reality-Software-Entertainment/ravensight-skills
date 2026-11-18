# Ravensight

Guidance for game developers using [Ravensight](https://ravensight.io) to connect
their game or website, improve instrumentation and work with studio evidence.

In Claude Code, install from the public marketplace:

```text
/plugin install ravensight --marketplace Reality-Software-Entertainment/ravensight-skills
```

This plugin includes five focused skills:

- **ravensight** chooses the relevant workflow and carries context forward.
- **ravensight-setup** guides account, project, company/Game Website, SDK and first-event setup.
- **ravensight-connect** explains documentation and authorized studio connections.
- **ravensight-instrumentation** audits game/website event coverage and provider migration parity.
- **ravensight-studio** guides player/website reports, heatmaps, design, marketing and sales.

Ask Claude to help set up Ravensight for your game or website, or improve its analytics.
Website tracking uses a separate anonymous key. Heatmap density does not require
a screenshot upload; account MCP setup/report tools depend on the connected
server’s advertised capabilities and your scoped authorization.
Skills load when relevant. They do not run an autonomous pipeline or install
game SDKs without your request. Playtesting is a separate optional package.

## Documentation connection and privacy

The included `ravensight-docs` MCP server is a free, anonymous documentation
service at `https://docs-mcp.ravensight.io/mcp`. It supplies public setup guidance;
it does not grant access to a studio, account, game data or a wallet. Documentation
requests are sent to that service. Do not include secrets or player data in them.

Account-specific analytics require a separate authorized Ravensight connection.
These skills explain scope, consent and metered usage before such work. The plugin
contains no account credentials, hooks, installer executable or private app code.

- [Documentation and support](https://ravensight.io/docs/)
- [Privacy policy](https://ravensight.io/privacy/)
- [Terms of service](https://ravensight.io/terms/)
- [Public source](https://github.com/Reality-Software-Entertainment/ravensight-skills)

Published by Reality Software Entertainment. MIT licensed.
