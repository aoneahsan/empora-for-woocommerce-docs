---
id: klaviyo
title: "Klaviyo Integration"
description: "Send store events, customer profiles and the product catalogue to Klaviyo, with idempotent queued delivery, recorded retries and separate email and SMS consent."
keywords:
  - klaviyo woocommerce
  - email marketing integration
  - customer profile sync
  - catalog sync
format: md
---
## Overview

Klaviyo Integration sends the store's activity to Klaviyo so its email and SMS flows can act on it. Three things move: **events** (a product viewed, added to cart, an order placed, cancelled or refunded), **profiles** (the customer record, with consent), and the **catalogue** (products, so Klaviyo can render them in an email).

What distinguishes this module from a simple webhook is that delivery is treated as unreliable. Every event is queued in a local table with an **idempotency key**, a status, an attempt count and a next-retry time, and a retry job works the failures. Klaviyo's response is stored against the event, so a failure can be diagnosed rather than guessed at.

Consent is modelled explicitly: the profile mapping records email and SMS consent separately.

It is for stores running their marketing in Klaviyo.

## Availability

| Item            | Value                                                        |
| --------------- | -------------------------------------------------------------- |
| Module key      | `klaviyo`                                                     |
| Tier            | Premium                                                       |
| Entitlement key | `klaviyo`                                                     |
| Admin tab       | `klaviyo`                                                     |
| Enabled option  | `aiowc_module_enabled_klaviyo` (off until turned on)          |
| REST namespace  | `aiowc/v1`                                                    |

`registerHooks()` registers the REST routes and the jobs, then registers the WooCommerce event listeners **only when the store is connected**. That is the right shape: with no credentials, no store events are captured and no queue builds up behind a connection that does not exist.

## Settings

Settings are read and written through `GET`/`POST /klaviyo/settings`. Credentials are held in a dedicated credential repository rather than alongside ordinary settings.

## Events

The listener captures these WooCommerce and WordPress events:

| Hook                                      | What it means to Klaviyo                     |
| ----------------------------------------- | ---------------------------------------------- |
| `woocommerce_add_to_cart`                 | A product was added to a cart.                |
| `woocommerce_checkout_init`               | A checkout was started.                       |
| `woocommerce_checkout_order_processed`    | An order was placed.                          |
| `woocommerce_order_status_completed`      | An order completed.                           |
| `woocommerce_order_status_cancelled`      | An order was cancelled.                       |
| `woocommerce_order_status_refunded`       | An order was refunded.                        |
| `woocommerce_created_customer`            | A customer account was created.               |
| `woocommerce_customer_save_address`, `profile_update` | A customer's details changed.     |

Each becomes a row carrying its type and name, the customer's email and id, the payload as JSON, and an **idempotency key**. The key is what stops a re-fired hook or a retried job recording the same event twice in Klaviyo.

## Delivery and retries

An event's status is `pending`, `sent`, `failed` or `retrying`, with an attempt count, the time of the last attempt and the time of the next. A send job drains the queue and a retry job works the failures, storing the error message and Klaviyo's own response against the row.

Retries can also be driven by hand: `/klaviyo/events/retry` retries one and `/klaviyo/events/retry-all` retries everything outstanding, which is what an administrator uses after fixing a credential or an outage.

## Profiles and consent

A profile mapping ties a WooCommerce customer to a Klaviyo profile id and records the email, phone, **email consent and SMS consent separately**, plus a hash of the properties last sent so an unchanged profile is not re-sent.

Separate consent flags matter: consent to email is not consent to SMS, and a module that collapses the two puts the store on the wrong side of that distinction.

## Catalogue

Catalogue items map a WooCommerce product to a Klaviyo item id with a sync hash and a status of `pending`, `synced` or `failed`, plus the error where it failed.

## Admin screen

The **Klaviyo** tab connects and disconnects the account, shows the connection and an overview, lists Klaviyo lists and the mapped profiles, runs a profile or catalogue sync and shows catalogue status, reads and clears the event log, retries failed events individually or in bulk, edits the settings, and runs diagnostics with a repair action.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require an administrator.

| Method | Path                                | Purpose                                              |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| POST   | `/klaviyo/connect`                  | Connect the account.                                  |
| POST   | `/klaviyo/disconnect`               | Disconnect it.                                        |
| GET    | `/klaviyo/connection`               | Whether the store is connected.                       |
| GET    | `/klaviyo/overview`                 | Summary of events, profiles and catalogue state.      |
| GET    | `/klaviyo/lists`                    | The lists in the connected account.                   |
| GET    | `/klaviyo/profiles`                 | The mapped customer profiles.                         |
| POST   | `/klaviyo/profiles/sync`            | Sync profiles now.                                    |
| GET    | `/klaviyo/catalog/status`           | Catalogue sync state.                                 |
| POST   | `/klaviyo/catalog/sync`             | Sync the catalogue now.                               |
| GET    | `/klaviyo/events/logs`              | The event queue and its history.                      |
| POST   | `/klaviyo/events/retry`             | Retry one event.                                      |
| POST   | `/klaviyo/events/retry-all`         | Retry everything outstanding.                         |
| POST   | `/klaviyo/events/logs/clear`        | Clear the log.                                        |
| GET / POST | `/klaviyo/settings`             | Read and write the settings.                          |
| GET    | `/klaviyo/diagnostics`              | Detected problems.                                    |
| POST   | `/klaviyo/diagnostics/repair`       | Repair them.                                          |

## WooCommerce integration

Beyond the event hooks listed above, the module registers `cron_schedules` to add the interval its sync jobs run on. It renders nothing on the storefront and changes no WooCommerce behaviour — it observes and reports.

## Database schema

| Table                                       | Holds                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_klaviyo_event_logs`          | The event queue: type and name, customer email and id, payload, idempotency key, status, attempts, last attempt and next retry, error message and Klaviyo's response. |
| `{prefix}aiowc_klaviyo_profile_mappings`    | Customer to Klaviyo profile: profile id, email, phone, email and SMS consent, a properties hash, last sync time. |
| `{prefix}aiowc_klaviyo_catalog_items`       | Product to Klaviyo item: item id, sync hash, status, last sync time and any error.          |

## Background jobs

| Hook                            | Work                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| `aiowc_klaviyo_send_event`      | Drains the pending event queue.                             |
| `aiowc_klaviyo_retry_failed`    | Re-attempts failed events on their retry schedule.          |
| `aiowc_klaviyo_profile_sync`    | Syncs customer profiles.                                    |
| `aiowc_klaviyo_catalog_sync`    | Syncs the product catalogue.                                |
| `aiowc_klaviyo_log_cleanup`     | Prunes old event rows.                                      |

## Action hooks for integrators

| Hook                                        | Fired when                                    |
| ------------------------------------------- | ----------------------------------------------- |
| `aiowc_klaviyo_event_log_created` / `_updated` | An event is queued or its status changes.  |
| `aiowc_track_event`                         | The module is enabled or disabled.             |

## Entitlement limits

`klaviyo` is an on/off grant with no cap on events, profiles or catalogue items. Klaviyo's own account limits apply on their side.

## Health check

The diagnostics route reports the module's own state, and the repair action fixes what it can.

## Known gaps

- **A Klaviyo account and API credentials are required**, and none ships with the plugin. Until the store connects one, the module captures no events at all — which is correct behaviour, but means "nothing is happening" is the expected state before connecting.
- 🔴 **Customer personal data leaves the store.** Events carry the customer's email and a JSON payload; profiles carry email and phone. That is the entire purpose of the integration, but it is a transfer of identifiable customer data to a third party and must appear in the store's privacy notice, with a lawful basis and — where it applies — a processor agreement with Klaviyo.
- The module records email and SMS consent on the profile, but that consent has to be collected somewhere; nothing in this module asks the customer for it.
- The event payload is stored locally in full, so the event log is itself a store of customer data and is pruned only by the cleanup job.
- No filter is exposed to alter or suppress an event before it is queued, so excluding a particular event type means disabling the hook in code.
