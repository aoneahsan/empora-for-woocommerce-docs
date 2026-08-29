---
id: license-api
title: License API
description: The plugin-facing license activation, validation, and deactivation endpoints Empora's WordPress plugin uses to unlock premium modules.
keywords:
  - empora license api
  - license activation endpoint
  - woocommerce license validation
sidebar_position: 4
---

# License API

The **License API** is the contract between the Empora plugin on a store and the backend license server. It governs how a license is bound to a site and which premium modules that site may enable.

The plugin calls these endpoints for you — this page documents the contract for transparency and for anyone self-hosting or auditing.

Base URL: `https://empora-api.aoneahsan.com/api`. These plugin-facing endpoints are rate-limited and identified by license key + site URL (not by a user token).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/licenses/activate` | Bind this license key to this site URL. Counts against the plan's site limit. Returns the plan + entitlement list. |
| `POST` | `/v1/licenses/validate` | Re-check that the license is still valid for this site and refresh entitlements. Runs on a schedule. |
| `POST` | `/v1/licenses/deactivate` | Release this site from the license, freeing a slot. |

## Activation flow

```mermaid
sequenceDiagram
  participant P as Empora plugin
  participant S as License server
  P->>S: POST /v1/licenses/activate { key, siteUrl }
  S-->>P: { plan, maxSites, entitlements[] }
  Note over P: Store entitlements; unlock premium modules
  loop scheduled
    P->>S: POST /v1/licenses/validate { key, siteUrl }
    S-->>P: { valid, entitlements[] }
  end
  P->>S: POST /v1/licenses/deactivate { key, siteUrl }
  S-->>P: { released: true }
```

## What entitlements control

The response carries an **entitlement list** — the set of premium module ids this license unlocks. The plugin uses it to:

- Show/enable exactly those premium modules on the **Modules** grid.
- Hide or disable modules the plan does not include.
- Stay current when you upgrade/downgrade (the next `validate` refreshes the list).

## Site counting

Activation binds the license to your **site URL**. Each active site counts against the plan's `maxSites`. To move a license to a new site, deactivate an old one (from the plugin's License page or your account dashboard) to free a slot.

## Failure behaviour

- If the server is unreachable, the plugin keeps the **last known** entitlements for a grace window so a transient outage does not disable your premium features mid-day.
- A definitive `invalid`/`deactivated` response gates premium modules off; the free core is never affected.

## Self-hosting note

The license server is the Laravel backend in the Empora monorepo. If you self-host it, point the plugin's update/license base URL at your deployment and keep the same endpoint contract above.

## Related

- [Activating your license](/getting-started/activating-your-license)
- [REST API](/reference/rest-api)
