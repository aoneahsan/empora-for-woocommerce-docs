---
id: inventory
title: "Advanced Inventory Management"
description: "Multi-location stock, transfers and an audit log. This module is in the catalogue but does not register in 1.0 and cannot be enabled."
keywords:
  - woocommerce multi location stock
  - inventory transfers
  - stock audit log
  - not in 1.0
format: md
---
:::warning This module does not ship in 1.0
`inventory` (Advanced Inventory Management) is part of the catalogue but does not run in 1.0: it is
not registered, so it cannot be enabled and nothing described below is active on a live site. The
page records what the code is written to do, so the module can be assessed and finished. See the
[module reference](/modules/reference).
:::

## Not available in this release

**This module does not load.** The canonical module manifest marks it `register: false` with the status `unregistered`, so bootstrap never instantiates the module class. Nothing described on this page is active on a live site:

- No REST routes are registered, so every `/aiowc/v1/inventory/...` request returns a 404.
- No WooCommerce hooks are attached, so stock changes and order transitions are not recorded.
- No background jobs are scheduled.
- The database tables are never created, because the code that creates them runs when the module is enabled and the module cannot be enabled.
- It does not appear on the Modules screen, so there is no switch to turn it on.

The plugin's admin navigation still carries an **Inventory** tab under **Operations**, and that screen renders its five sub-tabs. Every request those tabs make will fail while the module is unregistered. This is recorded in the manifest as a known issue: "advertised (admin page) but never registered".

The rest of this page describes what the code in `includes/Modules/Inventory/` is written to do, so the module can be assessed and finished. Read it as a description of unreleased code, not as a setup guide.

## Intended purpose

Multi-location stock: stock counted per location rather than only per product, transfers of stock between locations with their own lifecycle, an audit log of every change with its reason, and a low-stock alert email.

It is aimed at stores holding stock in more than one place — a shop and a warehouse, several branches — where WooCommerce's single stock figure per product is not enough.

## Manifest row

| Item            | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Module key      | `inventory`                                                |
| Tier            | Premium                                                    |
| Entitlement key | `inventory`                                                |
| Admin tab       | `inventory`, under **Operations**                          |
| Registered      | **No** — `register: false`, `status: "unregistered"`       |
| REST namespace  | `aiowc/v1` (declared in code, never registered at runtime) |

## Settings the code defines

Intended to live in the bundled option row `aiowc_iv_settings`, with a rename step from an older prefix and a lazy migration on first read.

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

## Admin screen the code ships

The **Inventory** tab holds five sub-tabs, with the active one held in the URL: **Overview**, **Locations**, **Audit Logs**, **Transfers** and **Settings**. All five are built and wired to the routes below — they are simply calling routes that do not exist while the module is unregistered.

## REST routes the code declares

Declared in `InventoryRest` and listed in the REST contract file, but never registered at runtime. Each is gated on `manage_woocommerce`. Unlike the shared permission callback used elsewhere in the plugin, this module's check verifies the capability alone and does not verify a REST nonce for cookie-authenticated requests. These routes also return their payload directly rather than wrapped in the shared response envelope.

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

## WooCommerce hooks the code declares

None of these are attached while the module is unregistered.

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

## Tables the code would create

| Table                               | Holds                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `{prefix}aiowc_inventory_locations` | Locations: name, code, address, contact, default flag, active flag, priority. |
| `{prefix}aiowc_inventory_logs`      | Stock changes with product, location, change type and reason.                 |
| `{prefix}aiowc_inventory_transfers` | Transfers between locations with their status.                                |

## Background jobs the code declares

| Hook                               | Schedule             | Intent                                                                                                                        |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_inventory_low_stock_alerts` | Daily                | Emails up to 100 low-stock products to `alert_email`. Returns immediately when `enable_low_stock_alerts` is off.              |
| `aiowc_inventory_stock_sync`       | From `sync_interval` | Verifies stock levels and processes stale transfers. Returns immediately when `enable_auto_sync` is off.                      |
| `aiowc_inventory_cleanup`          | Daily                | Deletes log rows older than 90 days and completed or cancelled transfers older than 180 days. Both ages are fixed in the job. |

## Entitlement limits

`inventory` is a premium entitlement, but the gate is not what is stopping the module: it is unregistered in the manifest, so the entitlement is never consulted. Nothing in the code applies a licence-side quota to locations, transfers or log rows.

## What would be needed to release it

Flipping `register` to `true` in the manifest is the mechanical part. Before that is worth doing, the routes need the same nonce verification the rest of the plugin's manage routes use, and the module needs the end-to-end check its admin screen has never been able to run.
