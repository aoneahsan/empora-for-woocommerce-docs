---
id: pre-orders-advanced
title: "Pre-Orders (Advanced)"
description: "Sell before stock arrives: take a deposit at checkout, track the pre-order through its own states, and collect the balance on release."
keywords:
  - woocommerce pre-orders
  - deposit payment
  - balance capture
  - release date
format: md
---
## Goal

Sell a product before it is in stock, take a deposit at checkout, and collect the balance when the
product is released. A pre-order record is created from the customer's order, tracked through its own
status, and settled by a scheduled job using the store's existing WooCommerce payment gateway.

## Tier and entitlement

| Field           | Value                 |
| --------------- | --------------------- |
| Tier            | Premium               |
| Entitlement key | `pre-orders-advanced` |
| Admin tab       | `pre-orders`          |
| Module key      | `pre-orders-advanced` |
| Settings prefix | `aiowc_po_`           |

Hooks register only when `aiowc_module_enabled_pre-orders-advanced` is true and the licence permits the
`pre-orders-advanced` entitlement.

## What the code does

- Two product meta fields mark a product as a pre-order and give it an expected availability date.
- A product marked as a pre-order reports as in stock through `woocommerce_product_is_in_stock`, so it
  stays buyable while out of stock, and shows a badge in the product summary.
- When an order is processed, every pre-order line item in it becomes a pre-order record holding the
  product, variation, customer, order, deposit type and amount, product price and availability date.
- The balance is charged by taking the customer's default stored WooCommerce payment token for the
  gateway the order used and calling that gateway's own `process_payment`. The plugin ships no payment
  provider of its own; it drives whichever gateway the store already has.
- A charge that cannot proceed marks the pre-order `failed` with a reason —
  `wc_unavailable`, `order_missing`, `no_customer_or_gateway`, `no_token`, `gateway_unavailable`,
  `gateway_failed` or `exception`.
- Customer notifications logged per pre-order, sent by `wp_mail`. The types are `confirmation`,
  `reminder`, `charge_due`, `charged`, `shipping_soon`, `shipped` and `failed`.
- A shortcode a customer can use to see the status of their pre-orders.

## Settings

Read through `ModuleSettings` with the `aiowc_po_` prefix; defaults are
`PreOrdersAdvancedModule::DEFAULTS`. The settings endpoint accepts exactly these six keys.

| Setting                  | Default      | Meaning                                                               |
| ------------------------ | ------------ | --------------------------------------------------------------------- |
| `enable_pre_orders`      | `true`       | Master switch for pre-order behaviour                                 |
| `require_deposit`        | `false`      | Whether a deposit is taken rather than the full price                 |
| `deposit_type`           | `percentage` | How `deposit_amount` is read                                          |
| `deposit_amount`         | `50.0`       | Deposit size, as a percentage or a fixed amount depending on the type |
| `auto_charge_on_release` | `true`       | Whether the daily charge job settles balances automatically           |
| `notify_before_days`     | `7`          | Days before the availability date that the reminder is sent           |

## Product fields

Rendered into the WooCommerce product editor on `woocommerce_product_options_advanced` and saved on
`woocommerce_process_product_meta`. The save handler checks `edit_product` and verifies the product-meta
nonce itself rather than relying on WooCommerce having done so.

| Meta key                 | Field                            | Meaning                 |
| ------------------------ | -------------------------------- | ----------------------- |
| `_aiowc_po_enabled`      | Enable pre-order (checkbox)      | Stored as `yes` or `no` |
| `_aiowc_po_availability` | Availability date (`YYYY-MM-DD`) | Expected release date   |

## Admin screen

Admin tab `pre-orders`. It lists
pre-orders by status and offers the per-record actions the REST layer exposes — charge, cancel, fulfil
and send a notification — plus the settings form.

## Database schema

Created by `Schema/PreOrdersSchema.php` at schema version `1.0.0`.

| Table                                   | Holds                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_pre_orders`              | One row per pre-ordered line item, with deposit, balance due, status and availability date |
| `{prefix}aiowc_pre_order_notifications` | A log of notifications sent for a pre-order                                                |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

| Method             | Path                       | Purpose                                            | Required args            | Permission           |
| ------------------ | -------------------------- | -------------------------------------------------- | ------------------------ | -------------------- |
| GET                | `/pre-orders`              | List pre-orders, filterable by `status`, paginated | —                        | Manage               |
| POST               | `/pre-orders`              | Create a pre-order record                          | `product_id`, `order_id` | Manage               |
| GET                | `/pre-orders/{id}`         | Read one pre-order                                 | `id`                     | Own record or manage |
| POST               | `/pre-orders/{id}/charge`  | Charge the outstanding balance now                 | `id`                     | Manage               |
| POST               | `/pre-orders/{id}/cancel`  | Cancel the pre-order                               | `id`                     | Manage               |
| POST               | `/pre-orders/{id}/fulfill` | Mark the pre-order fulfilled                       | `id`                     | Manage               |
| POST               | `/pre-orders/{id}/notify`  | Send one notification of the given `type`          | `id`, `type`             | Manage               |
| GET                | `/pre-orders/my`           | The signed-in customer's pre-orders                | —                        | Signed in            |
| GET                | `/pre-orders/settings`     | Read settings                                      | —                        | Manage               |
| PUT / PATCH / POST | `/pre-orders/settings`     | Update settings                                    | —                        | Manage               |

`POST /pre-orders` also accepts `variation_id`, `user_id`, `deposit_type`, `deposit_amount`,
`product_price` and `availability_date`.

## WooCommerce integration

| Hook                                   | Priority | Effect                                                |
| -------------------------------------- | -------- | ----------------------------------------------------- |
| `woocommerce_product_options_advanced` | default  | Renders the two product fields                        |
| `woocommerce_process_product_meta`     | 10       | Saves the two product fields                          |
| `woocommerce_product_is_in_stock`      | 10       | Reports a pre-order product as in stock               |
| `woocommerce_single_product_summary`   | 24       | Prints the pre-order badge                            |
| `woocommerce_checkout_order_processed` | 30       | Creates pre-order records from the order's line items |

### Shortcode

| Shortcode                  | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `[aiowc_pre_order_status]` | Shows the current customer's pre-order status |

No block is registered.

### Emitted actions

| Action                                       | Fired when                                                     |
| -------------------------------------------- | -------------------------------------------------------------- |
| `aiowc_pre_order_charged`                    | A balance charge succeeds, or there was nothing left to charge |
| `aiowc_track_event` with `pre_order_charged` | A gateway charge succeeds                                      |

## Background jobs

Both run on the WordPress cron scheduler, daily.

| Hook                      | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `aiowc_pre_orders_charge` | Charges balances for released pre-orders when `auto_charge_on_release` is on |
| `aiowc_pre_orders_notify` | Sends availability reminders `notify_before_days` ahead of the release date  |

## Entitlement limits

The `pre-orders-advanced` entitlement gates the module as a whole. No cap on the number of pre-order
products or records is implemented in the module's code.

## Related documentation

- [Module Architecture](/reference/architecture)
