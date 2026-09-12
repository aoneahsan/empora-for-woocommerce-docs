---
id: square
title: "Square Payments + Sync"
description: "OAuth-connected bidirectional inventory sync with a Square location, a signed webhook for near-live updates and automatic token refresh."
keywords:
  - square woocommerce
  - square inventory sync
  - pos integration
  - square oauth
format: md
---
## Overview

Square Payments + Sync connects the store to a Square account over **OAuth** and keeps inventory in step between the two. A shop selling both in person through Square and online through WooCommerce has one stock level in two systems; this module's job is to stop them disagreeing.

Sync is **bidirectional** — each run records a direction — and each product carries a mapping to its Square item and variation with a sync hash, so a run only moves what changed.

A **webhook** endpoint lets Square push changes as they happen rather than waiting for the next scheduled run, and a **token refresh job** keeps the OAuth connection alive without anyone reconnecting it by hand.

It is for retailers selling in person and online.

## Availability

| Item            | Value                                                     |
| --------------- | ----------------------------------------------------------- |
| Module key      | `square`                                                   |
| Tier            | Premium                                                    |
| Entitlement key | `square`                                                   |
| Admin tab       | `square`                                                   |
| Enabled option  | `aiowc_module_enabled_square` (off until turned on)        |
| REST namespace  | `aiowc/v1`                                                 |

`registerHooks()` registers only the REST routes and the jobs. **This module hooks nothing in WooCommerce** — it does not add a payment gateway to checkout or change the storefront. Despite the name, what it implements is the **sync** half.

## Settings

Sync settings are read and written through `GET`/`POST /square/sync/settings`, and webhook settings have their own pair. The sync interval is a setting rather than a constant.

## Connecting

- `POST /square/connect` begins the OAuth flow against Square's authorisation endpoint.
- `GET /square/oauth/callback` receives the redirect. It is **public and rate-limited**, because Square calls it in the browser.
- `POST /square/disconnect` ends the connection.
- `POST /square/locations/select` chooses which Square **location** the store syncs against — a Square account can have several, and stock is per location, so this choice decides which shop's inventory WooCommerce mirrors.

Tokens are held in a dedicated token repository, and a **token refresh job** runs twice daily to renew them before they expire.

## Syncing

Each run writes a log row carrying its type, its **direction**, its status, counts of items processed and failed, timings and an error message.

Mappings tie a WooCommerce product to a Square item id and variation id with a sync hash. Because Square models an item with variations much as WooCommerce does, the mapping holds both levels.

## The webhook

`POST /square/webhook` is a public, rate-limited route that receives Square's notifications, with its own settings pair for configuring it. That is what turns a scheduled mirror into a near-live one: a sale rung up on a Square terminal can reduce WooCommerce stock without waiting for the next run.

Incoming notifications are authenticated by an **HMAC-SHA256 signature** in the `x-square-hmacsha256-signature` header, checked against a signature key from the webhook settings. 🔴 **When no signature key is configured, the check is skipped** — the code treats that as a development convenience. Configure the signature key as part of setting the webhook up; see the limits below.

## Admin screen

The **Square** tab manages the connection, lists the Square locations and selects one, browses the Square catalogue, manages product mappings, edits sync and webhook settings, runs a sync now, shows sync status and logs, and runs diagnostics with a repair action.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. All require an administrator except the OAuth callback and the webhook.

| Method     | Path                            | Purpose                                          |
| ---------- | ------------------------------- | -------------------------------------------------- |
| POST       | `/square/connect`               | Begin the OAuth flow.                             |
| GET        | `/square/oauth/callback`        | Receive Square's redirect. Public, rate-limited.  |
| POST       | `/square/disconnect`            | End the connection.                               |
| GET        | `/square/connection`            | Whether the store is connected.                   |
| GET        | `/square/locations`             | The locations in the Square account.              |
| POST       | `/square/locations/select`      | Choose the location to sync against.              |
| GET        | `/square/catalog`               | The Square catalogue.                             |
| GET / POST | `/square/mappings`              | List and create product mappings.                 |
| DELETE     | `/square/mappings/{id}`         | Remove a mapping.                                 |
| GET / POST | `/square/sync/settings`         | Read and write the sync settings.                 |
| POST       | `/square/sync/now`              | Run a sync immediately.                           |
| GET        | `/square/sync/status`           | Whether a sync is running.                        |
| GET        | `/square/sync/logs`             | Past runs.                                        |
| GET        | `/square/sync/logs/{id}`        | One run in detail.                                |
| POST       | `/square/webhook`               | Receive a Square notification. Public, rate-limited. |
| GET / POST | `/square/webhook/settings`      | Read and write the webhook settings.              |
| GET        | `/square/diagnostics`           | Detected problems.                                |
| POST       | `/square/diagnostics/repair`    | Repair them.                                      |

## WooCommerce integration

None. The module registers `cron_schedules` to add its sync interval and otherwise stays out of the request, reading and writing products when a sync runs.

## Database schema

| Table                                       | Holds                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `{prefix}aiowc_square_product_mappings`     | WooCommerce product to Square item and variation, with a sync hash and last sync time. |
| `{prefix}aiowc_square_sync_logs`            | Each run: type, direction, status, items processed and failed, timings, error and details. |

OAuth tokens are kept in their own repository rather than in these tables.

## Background jobs

| Hook                            | Interval        | Work                                                 |
| ------------------------------- | --------------- | ------------------------------------------------------ |
| `aiowc_square_inventory_sync`   | configurable    | Syncs inventory between WooCommerce and Square.       |
| `aiowc_square_token_refresh`    | twice daily     | Renews the OAuth tokens before they expire.           |
| `aiowc_square_sync_cleanup`     | daily           | Prunes old sync logs.                                 |

The token refresh job is the one that keeps this integration from quietly dying after a few weeks — worth confirming it is actually running on a site where WP-Cron is unreliable.

## Action hooks for integrators

| Hook                                        | Fired when                                    |
| ------------------------------------------- | ----------------------------------------------- |
| `aiowc_square_mapping_created` / `_updated` / `_deleted` | A product mapping changes.        |
| `aiowc_square_sync_log_created` / `_updated` / `_deleted` | A sync run changes state.        |
| `aiowc_track_event`                         | The module is enabled or disabled.             |

## Entitlement limits

`square` is an on/off grant with no cap on mappings or sync runs. Square's own API rate limits apply on their side.

## Health check

The diagnostics route reports the module's own state — connection, tokens, mappings — and the repair action fixes what it can.

## Known gaps

- 🔴 **The module is called "Square Payments + Sync" but implements the sync, not the payments.** It registers no WooCommerce payment gateway and hooks nothing at checkout. Square remains a place inventory is mirrored to and from; taking payment through Square on the storefront needs Square's own gateway plugin.
- **A Square account and an OAuth application are required**, and none ships with the plugin, so the module does nothing until a store completes that setup on Square's side.
- Only one location is synced at a time, so a chain with several Square locations mirrors one of them into WooCommerce, not the aggregate.
- Inventory sync depends on the token refresh job running. If WP-Cron does not fire, the token expires and sync stops — reported as a sync failure rather than as an expiry.
- 🔴 **The webhook skips signature validation when no signature key is configured.** The route is public, so with the key unset it accepts any request that reaches it and treats it as a Square notification — which drives inventory changes. Setting the signature key is not an optional hardening step; it is part of enabling the webhook at all.
