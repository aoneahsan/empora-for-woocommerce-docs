---
id: returns-advanced
title: "Returns & Refunds (Advanced)"
description: "Give customers a return request form in My Account and the shop a queue: approve or reject, record the shipment, message the customer, refund."
keywords:
  - woocommerce returns
  - rma
  - refund workflow
  - return requests
format: md
---
## Goal

Give customers a return request form in My Account and give the shop a queue to work through: approve or
reject a request, record the return shipment, exchange messages with the customer, and issue the refund
through WooCommerce. Requests are numbered and tracked through their own status.

## Tier and entitlement

| Field           | Value              |
| --------------- | ------------------ |
| Tier            | Premium            |
| Entitlement key | `returns-advanced` |
| Admin tab       | `rma`              |
| Module key      | `returns-advanced` |
| Settings prefix | `aiowc_rma_`       |

Hooks register only when `aiowc_module_enabled_returns-advanced` is true and the licence permits the
`returns-advanced` entitlement.

## The request lifecycle

A customer raises a request against one of their orders, choosing a reason and the items involved. The
statuses used by `Service/RMAService.php` are `pending`, `approved`, `rejected`, `shipped` and
`received`, plus the refunded end state.

- A request is refused if the order is older than `return_window_days`.
- With `require_approval` on, the request starts `pending`; the shop approves or rejects it. Approval
  opens a `ship_back_window_days` window for the customer to return the goods.
- Tracking details recorded against the request move it to `shipped`, then `received`.
- The refund is created with WooCommerce's own `wc_create_refund()`. With `auto_refund` on it is issued
  automatically; otherwise the shop triggers it.
- `restocking_fee_default` is applied when the request is created.

Each request gets a number of the form `RMA-<date>-<random>`.

## What is not wired

Two services exist in the module but have no caller anywhere in it, so their behaviour is not reachable
in this release:

| Service                       | Intended behaviour                                              | State                                   |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `Service/LabelService.php`    | Writes a printable HTML return label into the uploads directory | No caller, and no REST route exposes it |
| `Service/ExchangeService.php` | Resolves a return as an exchange rather than a refund           | No caller                               |

Four settings are declared but never read: `allow_exchange` and `allow_store_credit` (the resolutions
they describe are not implemented), `notify_admin_email`, and `rma_number_prefix` — the RMA number
generator hardcodes the `RMA` prefix rather than reading the setting.

## Settings

Read through `ModuleSettings` with the `aiowc_rma_` prefix; defaults are
`ReturnsAdvancedModule::DEFAULTS`.

| Setting                  | Default | Meaning                                                | Consumed                         |
| ------------------------ | ------- | ------------------------------------------------------ | -------------------------------- |
| `return_window_days`     | `30`    | Days after an order that a return may be requested     | Yes                              |
| `ship_back_window_days`  | `14`    | Days after approval to return the goods                | Yes                              |
| `require_approval`       | `true`  | Whether a request waits for the shop before proceeding | Yes                              |
| `auto_refund`            | `false` | Whether the refund is issued without a manual step     | Yes                              |
| `restocking_fee_default` | `0.0`   | Fee applied when a request is created                  | Yes                              |
| `allow_exchange`         | `true`  | Intended to offer exchange as a resolution             | **No**                           |
| `allow_store_credit`     | `true`  | Intended to offer store credit as a resolution         | **No**                           |
| `notify_admin_email`     | empty   | Intended recipient for shop notices                    | **No**                           |
| `rma_number_prefix`      | `RMA`   | Intended prefix for the RMA number                     | **No** — the prefix is hardcoded |

## Admin screens

There are two.

- **The plugin's admin tab `rma`**. It lists
  requests by status, opens one to read and reply to its message thread, approves, rejects, records
  tracking and issues the refund, manages return reasons, and carries the settings form.
- **A separate WordPress admin menu page**, registered by `Frontend/AdminHandler.php` on `admin_menu`,
  with its own form posting to `admin_post_aiowc_rma_action`.

## Database schema

Created by `Schema/ReturnsSchema.php` at schema version `1.0.0`.

| Table                                | Holds                                                                |
| ------------------------------------ | -------------------------------------------------------------------- |
| `{prefix}aiowc_returns_adv_requests` | The request: order, customer, RMA number, reason, resolution, status |
| `{prefix}aiowc_returns_adv_items`    | The order lines being returned                                       |
| `{prefix}aiowc_returns_adv_messages` | The message thread between customer and shop                         |
| `{prefix}aiowc_returns_adv_reasons`  | Configurable return reasons                                          |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Customer

| Method | Path                | Purpose                                                                  | Required args       | Permission               |
| ------ | ------------------- | ------------------------------------------------------------------------ | ------------------- | ------------------------ |
| POST   | `/rma/create`       | Raise a request; also accepts `reason_id`, `resolution`, `customer_note` | `order_id`, `items` | Signed in                |
| GET    | `/rma/my`           | The customer's own requests                                              | —                   | Signed in                |
| GET    | `/rma/{id}`         | Read one request                                                         | `id`                | Owner or manager         |
| POST   | `/rma/{id}/message` | Post a message on the thread                                             | `id`, `message`     | Owner or manager         |
| GET    | `/rma/reasons`      | List active return reasons                                               | —                   | Rate-limited public read |

### Shop

Permission: manage.

| Method             | Path                  | Purpose                                                                              | Required args             |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------ | ------------------------- |
| GET                | `/rma/admin/requests` | List requests, filterable by `status`, paginated                                     | —                         |
| POST               | `/rma/{id}/approve`   | Approve a request, with an optional `note`                                           | `id`                      |
| POST               | `/rma/{id}/reject`    | Reject a request, with an optional `note`                                            | `id`                      |
| POST               | `/rma/{id}/tracking`  | Record the return shipment                                                           | `id`, `carrier`, `number` |
| POST               | `/rma/{id}/refund`    | Issue the WooCommerce refund                                                         | `id`                      |
| POST               | `/rma/reasons`        | Create a reason; also accepts `slug`, `requires_evidence`, `sort_order`, `is_active` | `label`                   |
| PATCH              | `/rma/reasons/{id}`   | Update a reason                                                                      | `id`                      |
| DELETE             | `/rma/reasons/{id}`   | Delete a reason                                                                      | `id`                      |
| GET                | `/rma/settings`       | Read settings                                                                        | —                         |
| PUT / PATCH / POST | `/rma/settings`       | Update settings                                                                      | —                         |

## WooCommerce and WordPress integration

### My Account

| Hook                                         | Effect                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `init`                                       | Registers the `aiowc-returns` account endpoint                                           |
| `query_vars`                                 | Registers the endpoint's query variable                                                  |
| `woocommerce_account_menu_items`             | Adds the Returns menu item                                                               |
| `woocommerce_account_aiowc-returns_endpoint` | Renders the returns tab, which honours `return_window_days` when listing eligible orders |

### Admin

| Hook                          | Effect                                        |
| ----------------------------- | --------------------------------------------- |
| `admin_menu`                  | Registers the standalone WordPress admin page |
| `admin_post_aiowc_rma_action` | Handles that page's form submission           |

### Shortcode

| Shortcode         | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `[aiowc_returns]` | Renders the returns interface outside My Account |

No block is registered. Refunds go through WooCommerce's own `wc_create_refund()`, so they are handled by
whatever gateway the order used; the plugin ships no payment provider of its own.

## Background jobs

Both run on the WordPress cron scheduler, daily.

| Hook                  | Purpose                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `aiowc_rma_expire`    | Closes requests whose ship-back window has passed                                                              |
| `aiowc_rma_reminders` | Reminds about requests left pending, and about approved requests not yet shipped, using its own day thresholds |

## Entitlement limits

The `returns-advanced` entitlement gates the module as a whole. The return and ship-back windows are shop
settings, not licence limits, and no cap on requests is implemented.

## Related documentation

- [Module Architecture](/reference/architecture)
