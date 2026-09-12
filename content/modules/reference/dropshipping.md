---
id: dropshipping
title: "Dropshipping Automation"
description: "Supplier management with product-to-supplier mapping, automatic order forwarding by email, API or webhook, tracking write-back and per-order profit."
keywords:
  - woocommerce dropshipping
  - supplier management
  - order forwarding
  - dropship tracking
format: md
---
## Overview

Dropshipping Automation manages the suppliers who fulfil a store's orders. A product is mapped to a supplier with a cost; when an order comes in, the relevant lines are forwarded to that supplier, tracked through to delivery, and the tracking number is recorded back against the WooCommerce order.

Because each mapping carries the supplier's **cost**, the module can report the **profit** on an order — what the customer paid against what the suppliers charged — which is the number a dropshipping store actually runs on.

Suppliers are generic rather than tied to one marketplace. Each has a notification method: **email**, an **API** call, a **webhook**, or **manual** for a supplier who is simply telephoned.

It is for stores whose stock is held and shipped by someone else.

## Availability

| Item            | Value                                                            |
| --------------- | ------------------------------------------------------------------ |
| Module key      | `dropshipping`                                                    |
| Tier            | Premium                                                           |
| Entitlement key | `dropshipping`                                                    |
| Admin tab       | `dropshipping`                                                    |
| Enabled option  | `aiowc_module_enabled_dropshipping` (off until turned on)         |
| REST namespace  | `aiowc/v1`                                                        |

Enabling the module creates the three tables below and schedules its jobs.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally.

## Settings

Stored under the `aiowc_ds_` prefix and registered through WordPress's own settings API on `admin_init`, in addition to the REST settings route.

| Stored key                 | Default          | Meaning                                                                |
| -------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `auto_forward`             | `true`           | Whether orders are forwarded to suppliers automatically.                |
| `auto_forward_statuses`    | `['processing']` | Which order statuses trigger forwarding.                                |
| `notify_supplier`          | `true`           | Whether the supplier is notified.                                       |
| `notification_method`      | `email`          | The default notification method for a supplier that names none.         |
| `enable_inventory_sync`    | `true`           | Whether supplier stock is synced.                                       |
| `sync_interval`            | `hourly`         | How often that sync runs.                                               |
| `low_stock_threshold`      | `5`              | The level at which supplier stock counts as low.                        |
| `default_margin_type`      | `percentage`     | How the default margin is expressed — a percentage or a fixed amount.   |
| `default_margin_value`     | `20`             | The default margin, so 20% over supplier cost unless a product overrides it. |
| `order_email_template`     | `''`             | The template used to notify a supplier of an order. **Empty by default.** |
| `tracking_email_template`  | `''`             | The template used for a tracking update. **Empty by default.**          |

A margin can also be set per product, overriding `default_margin_value`; the margin type and value live on the product mapping as well as in these defaults.

## Suppliers

| Field                          | Meaning                                                                |
| ------------------------------ | ------------------------------------------------------------------------ |
| `name`, `email`, `phone`, `website` | Who they are and how to reach them.                               |
| `api_url`, `api_key`, `api_secret`  | Credentials for an API-notified supplier. **See the limits.**     |
| `notification_method`          | `email`, `api`, `webhook` or `manual`. Email by default.                |
| `webhook_url`                  | Where a webhook notification is posted.                                 |
| `default_shipping_method`      | How they usually ship.                                                  |
| `processing_time_days`         | How long they take, which is what a delivery estimate is built from.    |
| Address fields                 | Where they ship from.                                                   |
| `notes`, `is_active`           | Internal notes, and whether they are used.                              |

Four notification methods including `manual` is an honest design: not every supplier has an API, and a module that assumed one would be unusable for most real suppliers.

## Order forwarding

When an order's status changes, the module inspects its lines and creates a dropship order per supplier, carrying the supplier's cost, the quantity and a status that moves through `pending`, `sent`, `confirmed`, `processing`, `shipped`, `delivered`, and `cancelled` or `failed`.

Forwarding also runs as a background job, and can be triggered for one order with `POST /dropshipping/orders/{wc_order_id}/forward` — which is what an administrator uses when a supplier missed a notification.

## Tracking

A dropship order records the tracking number, its URL, the carrier and the shipped time. Tracking is written back through `POST /dropshipping/orders/{id}/tracking`, so a supplier's response reaches the WooCommerce order and, through it, the customer.

## Profit

`GET /dropshipping/orders/{wc_order_id}/profit` computes what the order made: the customer's payment against the suppliers' costs. Because cost lives on the mapping and is copied onto the dropship order, the figure reflects what the supplier charged **at the time of the order**, not what they charge now.

## Admin screen

The **Dropshipping** tab manages suppliers and product mappings, lists dropship orders with their status, forwards an order, records tracking, and shows the profit on an order. The module also adds a product meta box for mapping a product to its supplier, a column on the WooCommerce order list, and a panel on the order detail screen.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require an administrator.

| Method            | Path                                              | Purpose                                     | Required args                   |
| ----------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------- |
| GET               | `/dropshipping/orders`                            | Every dropship order.                        | –                               |
| POST              | `/dropshipping/orders/{wc_order_id}/forward`      | Forward an order to its suppliers.           | `wc_order_id`                   |
| POST / PUT        | `/dropshipping/orders/{id}/tracking`              | Record tracking against a dropship order.    | `id`, `tracking_number`         |
| GET               | `/dropshipping/orders/{wc_order_id}/profit`       | The profit on an order.                      | `wc_order_id`                   |
| GET               | `/dropshipping/products/{product_id}/mapping`     | A product's supplier mapping.                | `product_id`                    |
| POST / PUT        | `/dropshipping/products/{product_id}/mapping`     | Map a product to a supplier.                 | `product_id`, `supplier_id`     |
| DELETE            | `/dropshipping/products/{product_id}/mapping`     | Remove the mapping.                          | `product_id`                    |
| GET               | `/dropshipping/settings`                          | Read the settings.                           | –                               |

## WooCommerce integration

| Hook                                              | What the module does                                          |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `woocommerce_order_status_changed`                | Forwards the order's lines to their suppliers.                 |
| `add_meta_boxes`                                  | Adds the supplier mapping box to the product screen.           |
| `woocommerce_process_product_meta`                | Saves that mapping.                                            |
| `woocommerce_admin_order_data_after_order_details`| Shows the dropship status on the order screen.                 |
| `manage_shop_order_posts_custom_column`           | Adds a dropship column to the order list.                      |
| `admin_init`                                      | Registers the settings.                                        |
| `admin_notices`                                   | Surfaces problems in the admin.                                |

The module registers no shortcode and renders nothing on the storefront — the customer never sees that their order was dropshipped, which is the point.

## Database schema

| Table                                 | Holds                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_dropship_suppliers`    | The suppliers: contact details, API credentials, notification method and webhook URL, default shipping, processing time, address, notes, active flag. |
| `{prefix}aiowc_dropship_orders`       | One row per supplier per order: the WooCommerce order and item, the supplier and their order id, product and variation, quantity, cost and total, status, tracking number, URL and carrier, shipped time. |
| `{prefix}aiowc_dropship_products`     | Product-to-supplier mappings with their cost.                                              |

## Background jobs

| Hook                                     | Work                                                            |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Order forwarding job                     | Sends pending dropship orders to their suppliers.                |
| `aiowc_dropshipping_sync_inventory`      | Refreshes supplier stock levels.                                 |

Both run on Action Scheduler, in the module's own group, with the sync starting ten minutes after the module is enabled so it does not compete with activation.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module fires no supplier or order events, so an integration cannot react to an order being forwarded or a tracking number arriving.

## Entitlement limits

`dropshipping` is an on/off grant with no cap on suppliers, mappings or dropship orders.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.

## Known gaps

- 🔴 **Supplier API keys and secrets are stored as plain columns** in the suppliers table, alongside the supplier's address and phone number. Anyone with database access, a database backup, or an export of that table has those credentials. Treat supplier API credentials as you would any other production secret when planning backups and access.
- **No marketplace integration ships.** The module is generic supplier management: there is no AliExpress, Spocket or CJ importer, and no product import at all. Products are created in WooCommerce as usual and then mapped to a supplier.
- **Customer data is sent to suppliers** when an order is forwarded — a shipping address at minimum, since the supplier posts the parcel. That is a transfer of personal data to a third party and belongs in the store's privacy notice.
- No lifecycle hooks are fired, so an integration cannot observe forwarding or tracking without polling the tables.
- Profit is per order. There is no store-wide margin report.
- **The two email templates default to empty**, so a store relying on email notification should set them before turning auto-forwarding on.
- The margin settings describe the intended markup over supplier cost, but the module does not price products from them — a product's selling price is set in WooCommerce as usual, and the margin is used for reporting rather than to calculate what the customer is charged.
