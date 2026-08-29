---
id: bulk-edit
title: "Bulk Edit Products"
description: "Change prices, stock, dimensions, visibility and taxonomies across many products at once, with a history table that lets a run be reverted."
keywords:
  - woocommerce bulk edit
  - bulk price change
  - batch product update
  - revert bulk edit
format: md
---
## Overview

The Bulk Edit module changes many products in one operation: prices, stock, dimensions, visibility, taxonomies and tax settings. It records every run in a history table with the previous values, so a run can be reverted within a retention window, and it can save a set of changes as a reusable preset.

It is for stores making catalogue-wide changes — a seasonal price move, a stock reset, a shipping-class correction — that would otherwise be done product by product.

## Availability

| Item            | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Module key      | `bulk_edit`                                            |
| Tier            | Premium                                                |
| Entitlement key | `bulk_edit`                                            |
| Admin tab       | `bulk-edit`, under **Operations**                      |
| Enabled option  | `aiowc_module_enabled_bulk_edit` (off until turned on) |
| REST namespace  | `aiowc/v1`                                             |

Enabling the module creates the two tables below and seeds the settings row.

## Settings

Stored in a single option row, `aiowc_be_settings`, written once at enable time if it does not already exist. This module writes the row directly rather than through the shared settings helper, so there are no legacy per-key options to migrate.

| Key                     | Default             | Meaning                                                                           |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `max_products_per_edit` | `500`               | A run with more product ids than this is refused with `too_many_products`.        |
| `enable_undo`           | `true`              | Whether previous values are captured before a run, and whether undo is permitted. |
| `undo_retention_days`   | `30`                | Age beyond which an applied run can no longer be reverted.                        |
| `editable_fields`       | the 20 fields below | The fields the settings route reports as editable.                                |

## Editable fields

`regular_price`, `sale_price`, `stock_quantity`, `stock_status`, `manage_stock`, `weight`, `length`, `width`, `height`, `status`, `catalog_visibility`, `featured`, `categories`, `tags`, `sku`, `backorders`, `sold_individually`, `tax_status`, `tax_class`, `shipping_class`.

Numeric fields accept an operation rather than only a literal value. Prices support `set`, `increase_fixed`, `decrease_fixed`, `increase_percent` and `decrease_percent`; stock quantity supports `set`, `increase` and `decrease`.

## Admin screen

The **Bulk Edit** tab is a placeholder. It renders a heading, an "Apply Bulk Changes" button and a one-row example table. No control on it is wired to a request and the page calls no endpoint, so the routes below are reachable only by calling the API directly.

## How a run behaves

`POST /bulk-edit/apply` runs synchronously inside the request. In order it: refuses an empty product list or an empty change set; validates the changes; refuses a list longer than `max_products_per_edit`; captures the current value of each changed field for every product when undo is on; writes a `pending` history row holding the fields, the product ids and the captured values; then applies the changes product by product, collecting per-product errors rather than aborting.

Undo reads the history row, refuses when undo is disabled, when the row is not `applied`, or when the row is older than `undo_retention_days`, and otherwise writes the captured values back.

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce`, plus a REST nonce on cookie-authenticated requests. Unlike most modules here, these routes return their payload directly rather than wrapped in the shared response envelope.

| Method | Path                         | Purpose                                                                                         | Required args |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| POST   | `/bulk-edit/apply`           | Apply a change set. Body carries `productIds`, `changes` and an optional `presetId`.            | –             |
| POST   | `/bulk-edit/products`        | List products matching a filter set. Body carries `filters`, `limit` (default 50) and `offset`. | –             |
| GET    | `/bulk-edit/filter-options`  | The values available to build a filter with.                                                    | –             |
| GET    | `/bulk-edit/editable-fields` | The fields a run may change.                                                                    | –             |
| GET    | `/bulk-edit/history`         | Past runs; accepts `limit`, `offset`, `status`.                                                 | –             |
| POST   | `/bulk-edit/undo/{id}`       | Revert one applied run.                                                                         | `id`          |
| GET    | `/bulk-edit/presets`         | List saved presets; accepts `search`.                                                           | –             |
| POST   | `/bulk-edit/presets`         | Create a preset.                                                                                | –             |
| GET    | `/bulk-edit/presets/{id}`    | Read a preset.                                                                                  | `id`          |
| PATCH  | `/bulk-edit/presets/{id}`    | Update a preset.                                                                                | `id`          |
| DELETE | `/bulk-edit/presets/{id}`    | Delete a preset.                                                                                | `id`          |
| GET    | `/bulk-edit/settings`        | Read the settings above.                                                                        | –             |
| POST   | `/bulk-edit/settings`        | Update the settings above.                                                                      | –             |

## WooCommerce integration

The module registers no storefront hooks, no shortcodes and no blocks. Every product write goes through the `WC_Product` API — `wc_get_product()` and the product setters — so changes respect WooCommerce's own data layer.

## Database schema

| Table                             | Holds                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_bulk_edit_presets` | Saved change sets.                                                                                                                  |
| `{prefix}aiowc_bulk_edit_history` | One row per run: preset, user, product count, the fields changed, the product ids, the captured previous values and the run status. |

## Background jobs

`BulkApplyJob` exists and listens on `aiowc_be_bulk_apply` (batch size 50), but nothing schedules it: `BulkApplyJob::schedule()` has no caller, and the apply route does its work inline. In this release every bulk edit runs in the request that started it, which is what `max_products_per_edit` is guarding.

## Entitlement limits

`bulk_edit` is an on/off grant with no licence-side quota. The run size is bounded by `max_products_per_edit`, a store setting.

## Health check

The module reports a warning when its tables are missing, and otherwise reports that it is functioning normally.
