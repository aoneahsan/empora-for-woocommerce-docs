---
id: inventory
title: "Advanced Inventory Management"
description: "Count stock per location rather than per product, move it between locations with tracked transfers, and keep an audit log of every change."
keywords:
  - woocommerce multi location stock
  - inventory transfers
  - stock audit log
  - low stock alerts
format: md
---
## Overview

Advanced Inventory Management counts stock per location rather than only per product. A store holding stock in
more than one place — a shop and a warehouse, several branches — gets a stock figure per location, transfers
that move stock between them with their own lifecycle, an audit log recording every change with its reason,
and a daily low-stock alert email.

It is a premium module. Enable it from **Empora → Modules** once your license includes `inventory`; enabling
it creates its three tables and seeds its settings.

## Availability

| Item            | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Module key      | `inventory`                                           |
| Tier            | Premium                                               |
| Entitlement key | `inventory`                                           |
| Admin tab       | `inventory`, under **Operations**                     |
| Enabled option  | `aiowc_module_enabled_inventory` (off until enabled)  |
| REST namespace  | `aiowc/v1`                                            |

## Settings

Stored in the bundled option row `aiowc_iv_settings`. The prefix was renamed from an older one that collided
with the Invoicing module's storage; existing installs have their per-key options copied across on the first
request after upgrade.

| Stored key                | Default          | Meaning                                                                |
| ------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `enable_multi_location`   | `true`           | Count stock per location.                                              |
| `enable_transfers`        | `true`           | Allow stock transfers between locations.                               |
| `enable_audit_log`        | `true`           | Record every stock change.                                             |
| `enable_low_stock_alerts` | `true`           | Send the low-stock email.                                              |
| `low_stock_threshold`     | `5`              | Quantity at or below which a product counts as low.                    |
| `alert_email`             | site admin email | Where the low-stock email goes.                                        |
| `show_location_stock`     | `false`          | Show per-location stock on the product page.                           |
| `show_stock_status_label` | `true`           | Show a stock badge in the shop loop.                                   |
| `enable_auto_sync`        | `true`           | Let the sync job run.                                                  |
| `sync_interval`           | `hourly`         | `hourly`, `twicedaily` or `daily`; anything else falls back to hourly. |

## Admin screen

The **Inventory** tab holds five sub-tabs, with the active one held in the URL: **Overview**, **Locations**, **Audit Logs**, **Transfers** and **Settings**. All five call the routes below.

## REST API endpoints

Registered by `InventoryRest` on `rest_api_init` and listed in the REST contract file. Each is gated on the shared `manage_woocommerce` permission check, which also verifies the REST nonce on cookie-authenticated requests. Unlike most of the plugin, these routes return their payload directly rather than wrapped in the shared response envelope — see [Known gaps](#known-gaps).

| Method | Path                                       | Purpose                                                                                                     | Required args                                                  |
| ------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/inventory/summary`                       | Overview figures.                                                                                           | –                                                              |
| GET    | `/inventory/locations`                     | List locations; accepts `active_only`.                                                                      | –                                                              |
| POST   | `/inventory/locations`                     | Create a location; accepts address, contact, `is_default`, `is_active`, `priority`.                         | `name`                                                         |
| GET    | `/inventory/locations/{id}`                | Read a location.                                                                                            | `id`                                                           |
| PUT    | `/inventory/locations/{id}`                | Update a location.                                                                                          | `id`                                                           |
| DELETE | `/inventory/locations/{id}`                | Delete a location.                                                                                          | `id`                                                           |
| GET    | `/inventory/logs`                          | Audit log; accepts `product_id`, `location_id`, `change_type`, `start_date`, `end_date`, `limit`, `offset`. | –                                                              |
| GET    | `/inventory/low-stock`                     | Products at or below a threshold; accepts `threshold`, `limit`.                                             | –                                                              |
| POST   | `/inventory/products/{product_id}/adjust`  | Adjust stock; accepts `reason` and `location_id`.                                                           | `product_id`, `quantity`                                       |
| GET    | `/inventory/products/{product_id}/history` | Stock history for one product; accepts `limit`.                                                             | `product_id`                                                   |
| GET    | `/inventory/transfers`                     | List transfers; accepts `status`, `limit`, `offset`.                                                        | –                                                              |
| POST   | `/inventory/transfers`                     | Create a transfer; accepts `notes`.                                                                         | `from_location_id`, `to_location_id`, `product_id`, `quantity` |
| GET    | `/inventory/transfers/{id}`                | Read a transfer.                                                                                            | `id`                                                           |
| POST   | `/inventory/transfers/{id}/ship`           | Move a transfer to in transit.                                                                              | `id`                                                           |
| POST   | `/inventory/transfers/{id}/complete`       | Complete a transfer.                                                                                        | `id`                                                           |
| POST   | `/inventory/transfers/{id}/cancel`         | Cancel a transfer; accepts `reason`.                                                                        | `id`                                                           |
| GET    | `/inventory/settings`                      | Read the settings above.                                                                                    | –                                                              |
| POST   | `/inventory/settings`                      | Update the settings above.                                                                                  | –                                                              |

A transfer moves through `pending`, `in_transit`, `completed` and `cancelled`; only a pending or in-transit transfer may be cancelled.

## WooCommerce integration

Attached by `registerHooks()` when the module is enabled and the license grants it.

| Hook                                                                    | Intent                                               |
| ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `woocommerce_product_set_stock`                                         | Record a stock change.                               |
| `woocommerce_variation_set_stock`                                       | Record a variation stock change.                     |
| `woocommerce_order_status_changed`                                      | Record stock movement caused by an order transition. |
| `admin_init`                                                            | Register the settings.                               |
| `woocommerce_get_stock_html`                                            | Replace the stock message.                           |
| `woocommerce_after_add_to_cart_form`                                    | Show per-location stock.                             |
| `woocommerce_before_shop_loop_item_title`                               | Show a stock badge in the loop.                      |
| `manage_product_posts_columns` and `manage_product_posts_custom_column` | Add a stock column to the products list.             |
| `wp_enqueue_scripts`                                                    | Load the stock display assets.                       |

## Database schema

Created by `Schema/DatabaseSchema.php` when the module is enabled.

| Table                               | Holds                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `{prefix}aiowc_inventory_locations` | Locations: name, code, address, contact, default flag, active flag, priority. |
| `{prefix}aiowc_inventory_logs`      | Stock changes with product, location, change type and reason.                 |
| `{prefix}aiowc_inventory_transfers` | Transfers between locations with their status.                                |

## Background jobs

Registered when the module is enabled and unscheduled when it is disabled.

| Hook                               | Schedule             | Intent                                                                                                                        |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_inventory_low_stock_alerts` | Daily                | Emails up to 100 low-stock products to `alert_email`. Returns immediately when `enable_low_stock_alerts` is off.              |
| `aiowc_inventory_stock_sync`       | From `sync_interval` | Verifies stock levels and processes stale transfers. Returns immediately when `enable_auto_sync` is off.                      |
| `aiowc_inventory_cleanup`          | Daily                | Deletes log rows older than 90 days and completed or cancelled transfers older than 180 days. Both ages are fixed in the job. |

## Entitlement limits

The entitlement is a single on/off grant: without `inventory` the module stays locked, and while it is absent none of the above loads. Nothing in the code applies a license-side quota to locations, transfers or log rows.

## Known gaps

The module's REST routes answer with the payload alone, where the rest of the plugin wraps a response in a shared envelope. A client reading these endpoints should expect the bare body.

Disabling the module unschedules its jobs but leaves its three tables and their rows in place, so stock history survives a module being switched off and on again.
