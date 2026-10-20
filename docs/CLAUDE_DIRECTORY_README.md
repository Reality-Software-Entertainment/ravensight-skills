# Ravensight

Guidance for game developers using [Ravensight](https://ravensight.io) to connect
their game, improve instrumentation and work with studio evidence.

In Claude Code, install from the public marketplace:

```text
/plugin install ravensight --marketplace Reality-Software-Entertainment/ravensight-skills
```

This plugin includes five focused skills:

- **ravensight** chooses the relevant workflow and carries context forward.
- **ravensight-setup** guides account, project, SDK and first-event setup.
- **ravensight-connect** explains documentation and authorized studio connections.
- **ravensight-instrumentation** audits and improves a game's event coverage.
- **ravensight-studio** guides analytics, design, brainstorms, marketing and sales.

Ask Claude to help set up Ravensight for your game or improve its analytics.
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
