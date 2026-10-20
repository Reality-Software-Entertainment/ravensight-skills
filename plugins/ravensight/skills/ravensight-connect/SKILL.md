---
name: ravensight-connect
description: Configure or troubleshoot Ravensight documentation and account MCP connections in an agent client. Distinguish free public docs from authenticated metered studio access and guide secure token setup.
metadata:
  version: "0.2.2"
---

# Connect Ravensight MCP

Choose the connection the task needs:

| Connection | Endpoint | Access |
| --- | --- | --- |
| Documentation | `https://docs-mcp.ravensight.io/mcp` | Public, no token, no studio data. `search_docs` and `get_doc`. |
| Account | `https://api.ravensight.io/mcp` | Personal MCP token, scoped studio access, metered operations. |

Read https://ravensight.io/docs/#docs-mcp or #mcp as appropriate. The bundled plugin connects only public documentation. Do not add account access just to answer a setup question.

## Configure the intended client

Inspect existing client configuration and supported MCP commands without dumping credential-bearing files. Preserve unrelated servers. Check the current client docs or CLI help for its transport and credential mechanism; transport labels differ between clients. Prefer the client's secure secret entry or environment-variable reference. Avoid literal tokens in command history, project files, screenshots and chat. If secure entry requires the user, provide the exact field/location and resume after it is set. Explain the destination before any configuration change.

For account access, the current Ravensight contract is a `gt_mcp_` personal token from Settings > MCP access, used as an Authorization Bearer credential. Choose the correct studio before minting it. Use the narrowest permitted projects and read permissions; a monthly token budget bounds agent loops. A game ingest key and a `gt_cli_` Playtest token cannot authenticate this MCP server. There is no general OAuth sign-in flow implemented by this skill. Never describe Playtest login as a substitute.

Discover tools before calling them; use returned schemas instead of guessing arguments. Check the free `get_usage_rate` tool when available before paid account work, and read the current cost/access requirements. Account MCP requires a previously funded balance and uses weighted events. Do not infer that an included event allowance means unlimited free MCP, or silently enable auto-recharge. Existing authorization for scoped paid work persists; if scope or spending permission is missing, establish it before the metered call.

The same studio-bound token authenticates the existing `/api/v1/data` REST API.
Organization management uses a separate owner-enabled `canManage` flag; content
`canWrite` does not enable it, and neither bypasses the current role or project
scope. Keep management disabled for ordinary analysis. For warehouse pricing,
mutation retries and invitations, use `ravensight-studio` and its data automation
reference. Never provision a new auth service or substitute a Playtest login.

## Diagnose, then resume

- Missing tools: check installation, enabled server and session reload; do not create duplicate servers.
- Authentication failure: confirm credential type and whether it was revoked, without displaying its value.
- Permission/scope refusal: check studio and project membership, selected environment and allowed operations. Do not broaden a token silently.
- Budget/funding refusal: report the exact account requirement and dashboard location; do not retry paid calls in a loop.
- Network failure: report the failed endpoint and bounded retry outcome; retain docs/local work as a fallback.

Successful tool discovery proves connectivity, not access to every project. Report what was verified, then return to the original workflow with connection name, scope and cost constraints, never the credential.
