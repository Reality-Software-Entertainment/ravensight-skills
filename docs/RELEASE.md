# Release and marketplace plan

Current package status, verified October 19, 2026: npm 0.2.1 is published and
The published 0.2.1 release / peeled v0.2.1 tag source is
`a243e12bf67f0d3963273b9ad7a376fb4a444890`. Version 0.2.2 is the local metadata
correction candidate, not a published release. Recheck these observations before
any publication. The owner authorized release,
superseding the earlier blanket hold. Check the [npm registry](https://www.npmjs.com/package/ravensight-skills)
and [repository releases](https://github.com/Reality-Software-Entertainment/ravensight-skills/releases)
for the current published version; this document is not a publication receipt. Publisher access, exact client registration and external review
remain separate prerequisites. Codex local onboarding passed on the updated
references; Claude behavioral tests remain blocked by account usage limits.

The preparation plan below is retained as dated history. Its 0.1.11 registry
observations, 0.2.0-next.0 version advice and blanket holds are not current release
instructions. Recheck exact package versions before publishing; never overwrite
a published version. OAuth implementation now exists in the platform, but its
client registrations and live activation remain unverified here.

## 1. Reconcile the held work first

The preparation branch retained local `b4b3b9b` (skills 0.1.12). GitHub and npm
were both 0.1.11 when checked earlier on October 17, 2026; recheck remote versions
before choosing a final release. The takeover now consolidates typed analytics,
exports, account/key work and the later roadmap in the local integration candidate.
These capabilities remain held and must be validated against the deployed server
before a customer is told they are available. Review the integration evidence and
remaining client/account tests before clearing the hold.

Review diffs against the then-current remote, merge/rebase deliberately, and verify
both SDK methods and deployed server support. In particular, typed helpers in an
SDK do not prove that live ingest implements accept-and-flag semantics. The skill
reference now gates these claims on supported deployed capabilities.

The 0.1.12 local commit is retained as history. It does not need a separate npm
publication before the combined main skill release. The local release candidate is
0.2.0; npm reported that exact version unused during the October 17 release review.
It remains unpublished and held. Recheck availability immediately before publication.
SDK branches reused some version numbers during preparation; reconcile each
reviewed artifact with the registry and choose an unused version before release.
Never publish two different artifacts under the same version.

## 2. Test the release candidate

- Run `npm test`, `npm run check-docs`, and `git diff --check`.
- Run `claude plugin validate .claude-plugin/plugin.json --strict` and
  `claude plugin validate .claude-plugin/marketplace.json --strict`.
- Run the bundled skill creator's quick validator on each skill where available.
- Install the built tarball offline into an empty project for Codex and Claude.
  Verify `--skill all`, selecting one skill, repeat installs, and a customer-edited
  destination. Existing instrumentation-only installs must continue to work.
- In a fresh Claude session, load `claude --plugin-dir .`; confirm all five skills
  and the public docs MCP are discovered. In Codex, test the standalone installation
  or the local repository marketplace using the current client instructions.
- Exercise the scenarios in `test/scenarios.md`. Record client version, result,
  tool calls and limitations. Automated package tests do not prove agent behavior.
- With a dedicated development account, test account MCP setup, a revoked token,
  wrong studio/project, exhausted cap, and one authorized read. No production
  credentials should enter the repository or test artifacts.

## 3. Publish the repository and npm package after approval

For the current release, confirm the prepared 0.2.2 version remains unused before publication.
Update package.json, all skill metadata, both plugin manifests and changelog
together. Rebuild and rerun tests. Review the npm tarball file list and SHA-256.
Push the reviewed branch/merge, then create the matching release tag only when
ready to publish. The existing workflow can publish npm through trusted publishing
when `NPM_TRUSTED_PUBLISHING=true`; verify the configured GitHub repository and
`publish.yml` on npm. Never retag or overwrite a published version.

Publish the release notes and tested tarball/hash. Verify the registry version
and that a fresh customer install gets the main pack with `--skill all`.
Publish website instructions only after that version is available. Keep the legacy
no-flag installation behavior documented.

## 4. Claude distribution

The repository contains `.claude-plugin/plugin.json`, `.mcp.json`, and
`.claude-plugin/marketplace.json`. After pushing the approved release, install it
from the GitHub marketplace in a clean client and verify the installed version.
The main pack has no Playtest dependency. A separate future Playtest plugin can
have a separate listing and installation choice.

To request official-directory inclusion, use the submission link on
https://claude.com/marketplace/plugins. You will need to sign in, provide the public
repository and support/privacy details, and complete the current review form.
A hosted GitHub marketplace works independently of official-directory acceptance.

## 5. OpenAI distribution

Use https://developers.openai.com/plugins/build/plugins for the current package
format and https://developers.openai.com/plugins/deploy/submission for submission.
The prepared package includes portable identity, five skills, OpenAI UI metadata,
an onboarding entry point and the no-auth public documentation MCP.

In the submission portal, use the remote-MCP path for the docs endpoint. Provide
publisher identity, verified domain where required, support contact, privacy/terms,
a clear description, appropriate screenshots, and reproducible test prompts.
Inspect the endpoint's discovered tools/resources: a GitHub skill directory does
not automatically become a remote MCP skill resource. Attach/import the skills
using the portal's supported package flow, or expose them through the docs MCP if
required by the current review flow. Test this before submitting. Never invent
an OpenAI app/server ID in the package.

For a local-code-only skills submission, follow
https://developers.openai.com/plugins/deploy/desktop-only and mark desktop execution
as required if that variant relies on local source tools. Account-specific portal
access or allowlisting may need your OpenAI contact. Do not claim browser-only
ChatGPT can edit a local game without the necessary executor and permissions.

Authenticated studio integration is a separate submission milestone. The current
account MCP uses personal tokens; OpenAI's hosted authenticated MCP flow expects
OAuth 2.1 with the required discovery and authorization behavior. Do not submit it
as an OAuth-ready connection or reuse Playtest device login. Design and test that
backend work separately, including consent, studio/project scopes, revocation,
expiry and spending controls. The docs-only and local skill release need not
pretend that work is finished.

Review approval is not publication. After approval, review the listing and publish
from the portal. Test a fresh install and monitor authentication/setup failures.

## 6. Website release

Use the matching website preparation branch. It fills current feature coverage,
adds main-skill onboarding docs, and regenerates the docs catalog. The consolidated
analytics/export and later-roadmap feature coverage must ship with its matching
reviewed API and SDK capabilities; do not publish website claims ahead of them.
Run the marketing audit, catalog tests and a desktop/mobile render check before
building with the existing analytics configuration and deploying. Verify live
bytes and CDN refresh after the owner clears the hold.

## What you personally need to do

1. Review the consolidated takeover, remaining validation gates and release evidence, then clear the release hold.
2. Confirm the release version and allow repository/npm/website publication.
3. Sign in to Claude's and OpenAI's submission portals, confirm publisher identity,
   and provide any account verification or review credentials requested there.
4. Approve the final listing, respond to reviewer feedback, and publish after approval.

Package creation, tests, docs and submission copy can be prepared before these steps.
No official-directory approval or real client acceptance is implied by this file.

## Local client test update, October 17, 2026

Real Codex CLI runs passed main-to-setup documentation onboarding, a read-only
Unity fixture audit, credential-type/unknown-deployment guidance, and a core-only
missing-sibling scenario. The docs lookup was refined and retested: six successful
MCP calls, no failed calls or full-index reads. Claude discovered all five skills
and connected to the explicitly configured docs MCP, but its model request was
blocked by the account usage limit. Claude behavior remains untested.

No live account token, event delivery, sales timeout or publisher workflow was
tested. Those scenarios and clean marketplace installation remain release gates.
See test/ONBOARDING-RESULTS.md in the source checkout for the full result.
At the October 17 checkpoint, publication was on hold. That historical blanket
hold was superseded by the owner's release authorization; it is not the current
package status. The current 0.2.2 candidate still requires final artifact review.


## Publisher metadata preflight (October 19, 2026)

The current [OpenAI submission field reference](https://developers.openai.com/plugins/deploy/submission)
requires a short description of at most 30 characters, Codex capabilities
(an empty array is allowed), and an HTTPS support URL for MCP review. Package
checks cover these fields. The support destination is the existing
[Ravensight documentation](https://ravensight.io/docs/), verified on this date
to include Getting help and support@realityse.com, not an invented support page.

These metadata corrections do not register a publisher, submit a plugin or
activate authenticated studio OAuth. The package continues to include only the
anonymous documentation MCP; Playtesting remains separate and optional.
Verified publisher access, domain verification, portal scans and real client
acceptance remain separate distribution requirements. Local package tests are
not marketplace acceptance. Version 0.2.1 remains published. The metadata correction
is prepared as 0.2.2; all versioned manifests and five skill metadata fields agree.
Recheck npm and the v0.2.2 tag before publishing the exact reviewed artifact.
