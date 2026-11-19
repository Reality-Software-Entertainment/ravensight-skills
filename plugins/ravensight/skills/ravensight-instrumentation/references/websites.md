# Public website tracking and MCP

> Docs catalog revision: `dc770dc4b90c0270dfc3efee566a48356304eddcf73ed057e8430d6019d149df`, checked 2026-11-18 against https://www.ravensight.io/docs/catalog.json.

Use this reference for company/game websites, optional heatmaps, or replacing a
website analytics provider. The public [website guide](https://ravensight.io/docs/#websites)
and [JavaScript SDK guide](https://ravensight.io/docs/#javascript-sdk) cover the
installed service. Discover the connected server's actual tool schemas first.
The setup tools and heatmap-page discovery below require a server that advertises
them; this package does not deploy or enable them. If unavailable, complete local
work and use the supported dashboard flow, stating what remains unverified.

## Scope and credentials

- Company Website belongs to the studio. Each existing game title can also own
  one Game Website, shared across its gameplay environments. A company or title
  can have many forms. Do not create a synthetic game for company traffic or mix
  company reports into a game's Website view.
- Account MCP takes a scoped `gt_mcp_` token. The optional `project_id` tool field
  is a **title slug**, resolved within that studio, not the environment game id.
  Omit it for company scope only with a studio-wide token. Project-restricted
  tokens must explicitly name an allowed title. Current membership/permission
  still applies; a shared game's analytics access is not website write access.
- Website installation uses its own publishable, origin-restricted `gt_site_`
  key. It is not a gameplay ingest key, account/MCP token or Playtest credential.
  Never copy player/device/account identifiers or gameplay session tokens into
  website events. Anonymous website IDs and gameplay identity remain separate.
- Public documentation MCP is free and anonymous. The bundled plugin connects
  only documentation. Account MCP needs separate secure token setup; never claim
  that this skill activates OAuth, registers a client or grants paid access.

## Before removing another provider

Inventory browser and server capture wrappers, automatic collection, current
properties, saved goals/funnels and report consumers. Trace real firing paths.
Use a compact parity matrix: question/event, trigger, bounded properties, old
consumer, Ravensight destination, test, and received-data query. Include visits,
campaign/referrer attribution, navigation/CTA intent, signup and purchase outcomes,
failures and retries that the product actually uses. Do not invent session replay
or AI features when they are outside the requested scope.

Preserve every useful event/property/outcome or explicitly document an exclusion.
An existing gameplay event can retain an authenticated conversion outcome without
copying it to an anonymous website funnel. Say where that outcome is available;
website CTA clicks alone do not prove signup or purchase completion. SDK presence,
a green doctor or a successful page view does not establish parity.

If the destination cannot store or report a required dimension, resolve that gap
or retain the old producer until the user accepts the limitation. Do not strip
properties silently, rename them to evade validation, or claim two scopes are
joined. Remove the old runtime/config/dependencies only within the authorized
migration scope after forward capture/report checks. Historical export/import is
a separate choice; do not assume it is required or discard history without the
user's direction. Avoid unintended dual events during cutover.

## Authorized setup through account MCP

Read/write permissions differ. `list_sites` (where available), `get_site`,
`verify_site` and `get_site_report` require `site:read`. `create_site`, `update_site`, `get_site_installation`,
`save_site_goal` and `save_site_funnel` require `site:write` and an owner-enabled
write token (`canWrite`). Installation-key retrieval is write-gated even though
it reads configuration. An advertised tool does not bypass token scope.

1. Resolve the intended company or existing title (where available, `list_sites`
   shows the websites the token can see), then call `get_site` with that
   scope. It returns settings, goal/funnel definitions and supported report names,
   without the installation key. Reuse a configured website.
2. If missing and creation is authorized, use `create_site` with `name`, `domains`
   and intended `settings`. `domains` are exact HTTPS origins, including bare and
   www variants only when both serve the site. Settings use `consent: 'opt_in'`
   or `'opt_out'`, `heatmaps` and `engagement`. New websites default to disabled;
   heatmaps default off, engagement on. Explicitly preserve the site's policy.
3. `get_site_installation` supplies the canonical snippet/public key. Configure
   it through the repository's normal local secret/config mechanism without
   printing keys or committing credential-bearing environment files. MCP itself
   never edits a repository or deploys the website.
4. Enable the authorized configuration using `update_site({ ..., enabled: true })`.
   Updates preserve identity/key and omitted settings. Do not replace a website
   merely to change domains or settings.
5. After authorized deployment and normal traffic, `verify_site` returns
   `installed` and `lastAcceptedAt`. `installed: false` means no accepted traffic
   has been observed; the call does not generate a test event. Confirm the expected
   page/action in a bounded report read as well.

Matching `create_site` retries reuse the website/key; conflicting settings require
an update. For an uncertain mutation, reuse the transport's supported
`X-Ravensight-Operation-Id` when available to avoid duplicate work/charges. This is
not an invented tool argument. If the client cannot reuse it, reconcile by reading
before retrying. Save returned goal/funnel ids and retain them for edits; a new
id-less creation is not an idempotent update. These tools do not delete websites,
import history or expose raw visitor/contact records.

## Browser integration

Use the installed JavaScript SDK's `createSiteTracker` or the returned installation
snippet, once per page lifecycle. The site API base is normally
`https://api.ravensight.io/api/v1`; verify the generated configuration. Keep a
working gameplay client and its capture defaults unchanged. A newer package can
change automatic gameplay events: inspect defaults before upgrading. If necessary,
use a separate npm alias for the website SDK while retaining the current gameplay
version. Never vendor a second tracker or initialize both snippet and npm mode.

The SDK supports automatic initial/history page views. Alternatively set
`autoPageviews: false` and call `pageView()` once after a completed public route
change. Choose one owner of navigation, avoid render-triggered duplicates, and
tear down or exclude tracking on private routes. Preserve existing SSO-token
stripping before analytics initialization. Default auth/account exclusions do not
cover every application's private game path; include the actual boundaries such
as `/game`, `/dynasties` and `/settings`. Test public-to-private transitions and
browser back navigation, not only direct page loads. Call `destroy()` when removing
the client so handlers/timers do not accumulate.

Respect the site's actual consent policy. With `consent: 'opt_in'`, call
`grantConsent()` only after the visitor's decision; use `optOut()` for withdrawal.
Do not auto-grant consent to populate an empty chart. DNT/GPC are honored, and
blocked storage has an SDK fallback. Website mode does not require cookies. Query
strings are removed except supported bounded campaign values; referrers are
reduced. Do not add emails, names, tokens, raw errors, form values or account IDs.
Keep bot/headless QA and gameplay personas out of production website statistics.

Custom event names are machine names. Properties must match the installed SDK
and server's registered public event schema. Unknown fields are rejected, not
arbitrary free-form dimensions. For example, a supported
`track('landing_cta_clicked', { cta_location: 'hero' })` records a fixed placement;
never substitute the button's text, typed input or an authenticated user id.
Inspect the actual event catalog before selecting additional fields. A schema gap
is a product gap to report or implement within scope, not permission to drop data.

When the parity matrix requires anonymous signup arrival or failure counts, a
compatible collector and JavaScript SDK 0.10.0 or later support a separate
`createSiteTracker({ ..., outcomesOnly: true })`. Verify the installed version and
deployed contract before using it. Destroy the public-page tracker before entering
private routes, retain the same consent policy, and call `trackOutcome` explicitly for the registered
`signup_form_viewed`, `signup_failed` or `checkout_failed` names. Only their bounded
catalog fields are allowed, such as `code: 'network'`; never forward raw errors.
This optional mode has no page views, DOM/history observation or attribution. It
sends the origin for validation, a fixed signup/checkout context and the website's
anonymous IDs; neither the event nor the HTTP Referer records the private address.
Lifecycle delivery still flushes pending events. A failure on a still-public page
can use a short-lived outcome client alongside its public tracker without creating
another view. Destroy the outcome client when finished; do not reset anonymous
identity or join it to player identity. Reports retain no authentication-page address.
Do not add it when existing gameplay capture already covers the required outcome,
or infer successful signup/purchase from these arrival/failure events. Keep
authenticated success and player identity in the existing gameplay integration.

`heatmaps: true` collects coarse click/scroll summaries only when the server's
website setting also enables them. `engagement: true` adds bounded visible active
time; check the installed defaults. Neither takes screenshots, captures page text
or records replay. Mark private DOM regions with `data-ravensight-private` or
`data-ravensight-ignore`; editable/form controls are excluded. Click coordinates
are normalized against the full document, grouped by small/medium/large viewport.
The density view draws real counts without an uploaded image. A reference image
is optional, manually sanitized page context and can become stale after layout
changes; never manufacture a screenshot and imply it came from visitors.

## Reports and saved definitions

Use `get_site_report` with the same scope, an explicit range and only the filters
needed. `from`/`to` are Unix seconds converted to calendar dates, with the end date
inclusive. UTC is the default; daily historical aggregates and heatmaps require
UTC. Preserve response coverage/history/pagination metadata, including unknown
values and retained-history limits. Do not sum daily unique visitors into a
range-wide unique count.

- Discover supported reports with `get_site`. Available reports can include
  overview, pages, sources, audience, events, goals, funnels, retention,
  diagnostics, history, realtime, campaigns, heatmaps, heatmap_pages and export.
- For heatmaps, use `report: 'heatmap_pages'` to obtain
  `data.items[{page, viewport, lastSeen, activeDays}]` and pagination. Then request
  `report: 'heatmaps'` for a returned page/viewport pair, with the same UTC range.
  No page capture or reference-image request is necessary. Overlapping positions
  must sum their counts; the image-free chart is a normalized map, not a render
  of the website. Scroll bins count summaries, not unique visitors.
- Event/property breakdowns use the schema's `event`, `property`, `property_value`
  and `breakdown` fields. Source/campaign/device filters remain bounded. Unsupported
  combinations are refused; do not invent filters or quietly widen the query.
- `save_site_goal` accepts a path or event definition. `save_site_funnel` accepts
  2 to 8 ordered path/event steps and optional `window_seconds`. Save ids for later
  edits; query a saved funnel with `funnel_id`. Ordered conversion requires retained
  raw history, not merely historical daily totals. Do not create definitions for
  a read-only request.
- Paginate or narrow large reports. Current website MCP supports `limit` up to
  500 and `offset` up to 100000, with the unchanged 128000-byte response cap.
  Aggregate `export` uses `export_report` and is complete or refused, never a
  silently truncated CSV. Check the returned schema and metadata if limits change.

## Billing and acceptance

One accepted website page view, custom event (including an explicit outcome), form page view/response, or combined
engagement/heatmap summary consumes one event on the existing organization meter.
Batching does not reduce event count. Retry IDs prevent double charging. At
exhausted usable capacity, collection pauses/refuses; the SDK discards the refused
website queue instead of accumulating a later catch-up bill. Fresh activity can
resume after recovery. Existing gameplay events remain separately counted.

Account MCP calls use the **programmatic** meter, currently 100000 event units per
successful metered call, plus its funding requirement and token budget. They are
not one-hit collector events. Consult free `get_usage_rate` when available, keep
reads bounded and reuse results. Setup, verification and report reads do not
manufacture visitor events. Do not raise budgets or enable recharge implicitly.

Prepare local validation of payloads/counts using fake keys and an intercepted
collector or an existing development setup. The developer runs it: give them the
command and say what it checks, then interpret the results they share. Cover initial/SPA visits, campaigns/referrers,
allowlisted actions, consent refusal/revocation, DNT/GPC, private routes/forms,
heatmap coordinates, capacity refusal, retry deduplication and teardown. Preserve
existing game signup/purchase/session tests if the site shares a game runtime.
For outcome-only mode, also verify no private URL/referrer in payloads or request
headers, no automatic views, approved failure fields, and hide/exit delivery.
Then distinguish the developer's code/test/build evidence from authorized live accepted traffic
and report readback. Report remaining schema or outcome gaps before calling the
provider replacement complete.
