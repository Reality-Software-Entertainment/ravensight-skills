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

The included `ravensight-docs` MCP server is a free documentation service at
`https://docs-mcp.ravensight.io/mcp`. It needs no account and searches public
Ravensight documentation only; it does not grant access to a studio, account, game
data or a wallet. It receives the search text Claude sends. The search handler does
not store queries, and service logs are kept for 14 days. Do not include secrets or
player data in a search.

## Optional studio account connection

Separately, and only if you choose to, you can connect your Ravensight studio
account to the account API at `https://api.ravensight.io/mcp` with a personal token
from Settings > MCP access. With that connection Claude can take actions you
authorize on your studio, such as reading studio records (games, analytics and
reports) or sending a teammate an invite email. The token is limited to the studio,
projects and permissions you choose, account calls are metered from your funded
balance, and you can revoke the token at any time. These skills explain scope,
consent and cost before such work.

The plugin does not set up this account connection for you. It contains no account
credentials, hooks, installer executable or private app code.

- [Documentation and support](https://ravensight.io/docs/)
- [Privacy policy](https://ravensight.io/privacy/)
- [Terms of service](https://ravensight.io/terms/)
- [Public source](https://github.com/Reality-Software-Entertainment/ravensight-skills)

Published by Reality Software Entertainment. MIT licensed.
