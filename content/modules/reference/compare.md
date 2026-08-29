---
id: compare
title: "Product Compare"
description: "Let shoppers collect products into a list and compare price, rating, stock, attributes and dimensions side by side. Free core, no licence needed."
keywords:
  - woocommerce compare products
  - comparison table
  - free woocommerce module
  - product comparison
format: md
---
## Overview

The Compare module lets a shopper collect several products into a comparison list and view them side by side — price, description, rating, SKU, stock, weight, dimensions and shared attributes. A floating toolbar shows what is in the list, and the comparison table can be placed on any page with a shortcode.

It is the free-tier product-experience module: it needs no licence and no external service.

## Availability

| Item            | Value                                                |
| --------------- | ---------------------------------------------------- |
| Module key      | `compare`                                            |
| Tier            | **Free core**                                        |
| Entitlement key | `compare`                                            |
| Admin tab       | `compare`, under **Product Experience**              |
| Enabled option  | `aiowc_module_enabled_compare` (off until turned on) |
| REST namespace  | `aiowc/v1`                                           |

Free tier means the `compare` entitlement is granted by default, so the module can be enabled without a licence key. It is still off until switched on. Enabling it creates the table below and schedules the cleanup job.

## Settings

Stored in the bundled option row `aiowc_cmp_settings`; legacy per-key options `aiowc_cmp_<key>` are migrated on first read.

| API name             | Stored key             | Default                                                                  | Meaning                                                       |
| -------------------- | ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `maxProducts`        | `max_products`         | `4`                                                                      | How many products a list may hold. A further add is refused.  |
| `compareFields`      | `compare_fields`       | `price`, `description`, `rating`, `sku`, `stock`, `weight`, `dimensions` | Fields offered in the comparison table.                       |
| `showButtonPosition` | `show_button_position` | `after_add_to_cart`                                                      | Where the button goes on a product page (see below).          |
| `enableForGuests`    | `enable_for_guests`    | `true`                                                                   | Whether visitors without an account may build a list.         |
| `comparePageId`      | `compare_page_id`      | `0`                                                                      | Page the toolbar and buttons link to for the full comparison. |

`showButtonPosition` accepts `before_add_to_cart`, `after_add_to_cart` and `after_summary`. Any other value renders no button on the single-product page; the shop-loop button is added regardless.

`enableForGuests` is only consulted when the request has neither a signed-in user nor a WooCommerce session id. An ordinary guest with a WooCommerce session passes that check, so turning the setting off does not block most guests in practice.

## Admin screen

The **Compare** tab carries a small settings form with three controls — allow guest comparison, maximum items, and show the button on the shop.

The form posts `guest_compare`, `max_items` and `show_on_shop`. The settings route accepts only `maxProducts`, `compareFields`, `showButtonPosition`, `enableForGuests` and `comparePageId`, and ignores anything else, so saves from this screen do not currently change stored settings. The settings route itself works; the screen's field names do not match it.

## Lists and identity

A list belongs either to a signed-in user id or to the WooCommerce session id of a guest. `getOrCreate` resolves the current visitor to a list on every read or write. A merge routine that would move a guest list onto an account exists in the service and the repository, but nothing calls it, so a guest list is not carried over on sign-in.

## REST API endpoints

All routes are on `aiowc/v1`.

| Method             | Path                | Purpose                                     | Required args | Permission                         |
| ------------------ | ------------------- | ------------------------------------------- | ------------- | ---------------------------------- |
| GET                | `/compare`          | The current visitor's list.                 | –             | Open read, rate limited            |
| GET                | `/compare/data`     | The comparison matrix for the current list. | –             | Open read, rate limited            |
| POST               | `/compare/add`      | Add a product to the list.                  | `product_id`  | Public write (nonce, rate limited) |
| POST               | `/compare/remove`   | Remove a product from the list.             | `product_id`  | Public write (nonce, rate limited) |
| DELETE             | `/compare/clear`    | Empty the list.                             | –             | Public write (nonce, rate limited) |
| GET                | `/compare/overview` | Counts for the admin overview.              | –             | Manage (`manage_woocommerce`)      |
| GET                | `/compare/settings` | Read the settings above.                    | –             | Manage                             |
| PUT / PATCH / POST | `/compare/settings` | Update the settings above.                  | –             | Manage                             |

Open reads are limited to 120 requests a minute per caller; public writes to 30 a minute and they require a REST nonce.

## WooCommerce integration

Frontend handlers are skipped inside `wp-admin`.

| Hook                                       | Priority | What the module does                                                                        |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_button`    | 10       | Compare button, when `showButtonPosition` is `before_add_to_cart`.                          |
| `woocommerce_after_add_to_cart_button`     | 10       | Compare button, when `showButtonPosition` is `after_add_to_cart`.                           |
| `woocommerce_after_single_product_summary` | 6        | Compare button, when `showButtonPosition` is `after_summary`.                               |
| `woocommerce_after_shop_loop_item`         | 16       | Compare button in the shop loop.                                                            |
| `wp_enqueue_scripts`                       | 10       | Loads the compare assets.                                                                   |
| `wp_footer`                                | 10       | Renders the floating toolbar on product, shop, category, tag and compare pages only.        |
| `template_redirect`                        | 10       | When `aiowc-compare` is present in the query string, hooks the table into the page content. |
| `the_content`                              | 10       | Injects the comparison table, in the main query only.                                       |

### Shortcode

| Shortcode         | Renders                    |
| ----------------- | -------------------------- |
| `[aiowc_compare]` | The full comparison table. |

## Database schema

| Table                         | Holds                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| `{prefix}aiowc_compare_lists` | One list per user or guest session, with the product ids it holds. |

## Background jobs

| Hook                    | Interval | Group           | Work                                                                                    |
| ----------------------- | -------- | --------------- | --------------------------------------------------------------------------------------- |
| `aiowc_compare_cleanup` | 24 hours | `aiowc-compare` | Deletes guest lists older than 30 days. The 30 days is fixed in the job, not a setting. |

## Entitlement limits

`compare` is granted on the free tier, so there is no licence gate in practice and no quota. The one limit a shopper meets is `maxProducts`, a store setting that defaults to 4.

## Health check

The module reports a warning when its table is missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
