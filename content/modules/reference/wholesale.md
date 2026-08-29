---
id: wholesale
title: "Wholesale"
description: "Give approved trade customers their own prices: wholesale roles with discounts and tax exemption, and per-role product prices with quantity tiers."
keywords:
  - woocommerce wholesale
  - b2b pricing
  - trade prices
  - quantity tiers
format: md
---
## Overview

The Wholesale module gives approved trade customers their own prices. It defines wholesale roles, each with a discount and optional tax exemption; it holds per-product, per-role prices with quantity tiers; it filters WooCommerce's price so a signed-in wholesale customer sees and pays the wholesale figure; and it takes B2B applications an administrator approves.

It is for stores selling to both the public and the trade from one catalogue.

The REST API behind all of this is complete. The admin screen is not — see [Admin screen](#admin-screen) before planning around it.

## Availability

| Item            | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Module key      | `wholesale`                                            |
| Tier            | Premium                                                |
| Entitlement key | `wholesale`                                            |
| Admin tab       | `wholesale`, under **Loyalty & Customers**             |
| Enabled option  | `aiowc_module_enabled_wholesale` (off until turned on) |
| REST namespace  | `aiowc/v1`                                             |
| Recorded issue  | "admin page named inert by the August audit"           |

Enabling the module creates the three tables below, seeds the defaults and schedules the price-sync job through Action Scheduler in the `aiowc-wholesale` group. Disabling it cancels the job.

## Settings

Stored in the bundled option row `aiowc_ws_settings`.

| Stored key              | Default | Meaning                                                                      |
| ----------------------- | ------- | ---------------------------------------------------------------------------- |
| `enable_registration`   | `true`  | Accept B2B applications.                                                     |
| `registration_approval` | `true`  | An application lands as `pending`; with this off it is approved on the spot. |
| `min_order_amount`      | `0`     | Store-wide minimum an order must reach; a role can set its own.              |
| `hide_prices_guests`    | `false` | Hide prices and block purchase for signed-out visitors.                      |
| `tax_exempt_roles`      | `[]`    | Roles treated as VAT-exempt in the cart.                                     |

## Roles, prices and rules

Three concepts, in the order the price resolver consults them:

1. **A per-product price with a quantity tier** — a row keyed by product, variation, role and minimum quantity. The best row for the quantity in the cart wins.
2. **A category rule** — a rule row on the role typed `category_discount`, whose JSON data names `category_ids`, a `discount_type` and a `discount_value`. Every matching rule is evaluated and the best price wins.
3. **The role's own discount** — `percentage` or `fixed`, applied to the product's regular price. A role with a zero discount contributes nothing.

The first of the three that produces a price is used; if none does, the customer pays the ordinary price.

A wholesale customer is a WordPress user whose wholesale status meta reads `approved` and who is assigned a role. Applications, approvals and rejections are all recorded in user meta rather than in a table.

## Admin screen

**The Wholesale tab is a placeholder and does not work.** It renders a heading, an "Add Wholesale Role" button with no handler, and a Roles table containing one hardcoded example row — "Wholesale Gold, 25% Off, Tax Exempt: Yes" — that is not read from the database. Its _Registrations_ and _Settings_ tabs have no content at all: the tab triggers exist, the panels do not.

The screen calls no endpoint. Everything below is reachable only through the REST API until that screen is built.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. Everything requires `manage_woocommerce` — plus a REST nonce on cookie-authenticated requests — except the two registration routes marked otherwise.

### Roles

| Method             | Path                    | Purpose                                                                                     | Required args      |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------- | ------------------ |
| GET                | `/wholesale/roles`      | List roles.                                                                                 | –                  |
| POST               | `/wholesale/roles`      | Create a role; accepts `discount_type`, `discount_value`, `min_order_amount`, `tax_exempt`. | `role_key`, `name` |
| PUT / PATCH / POST | `/wholesale/roles/{id}` | Update a role.                                                                              | `id`               |
| DELETE             | `/wholesale/roles/{id}` | Delete a role.                                                                              | `id`               |

### Prices and rules

| Method             | Path                     | Purpose                                                                 | Required args                       |
| ------------------ | ------------------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| GET                | `/wholesale/prices`      | Prices, filtered by `product_id` and `role_id`.                         | –                                   |
| POST               | `/wholesale/prices`      | Create or update one price row, with `variation_id` and `min_quantity`. | `product_id`, `role_id`, `price`    |
| DELETE             | `/wholesale/prices/{id}` | Delete a price row.                                                     | `id`                                |
| GET                | `/wholesale/rules`       | Rules, filtered by `role_id`.                                           | –                                   |
| POST               | `/wholesale/rules`       | Create a rule.                                                          | `role_id`, `rule_type`, `rule_data` |
| PUT / PATCH / POST | `/wholesale/rules/{id}`  | Update a rule.                                                          | `id`                                |
| DELETE             | `/wholesale/rules/{id}`  | Delete a rule.                                                          | `id`                                |

### Registrations, overview and settings

| Method             | Path                                         | Purpose                                                                       | Permission           | Required args |
| ------------------ | -------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- | ------------- |
| POST               | `/wholesale/register`                        | Submit an application, with company name, tax id, phone, address and message. | Signed-in user       | `role_id`     |
| GET                | `/wholesale/register/status`                 | The caller's own application status.                                          | Signed-in user       | –             |
| GET                | `/wholesale/registrations`                   | Applications awaiting review.                                                 | `manage_woocommerce` | –             |
| POST               | `/wholesale/registrations/{user_id}/approve` | Approve an application and assign the requested role.                         | `manage_woocommerce` | `user_id`     |
| POST               | `/wholesale/registrations/{user_id}/reject`  | Reject one, with an optional `reason`.                                        | `manage_woocommerce` | `user_id`     |
| GET                | `/wholesale/overview`                        | Counts for an administrator overview.                                         | `manage_woocommerce` | –             |
| GET                | `/wholesale/settings`                        | Read the settings above.                                                      | `manage_woocommerce` | –             |
| PUT / PATCH / POST | `/wholesale/settings`                        | Update the settings above.                                                    | `manage_woocommerce` | –             |

## WooCommerce integration

| Hook                                                                                           | Priority | What the module does                                        |
| ---------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `woocommerce_product_get_price`                                                                | 99       | Substitutes the wholesale price.                            |
| `woocommerce_product_get_regular_price`                                                        | 99       | Substitutes the regular price for a wholesale customer.     |
| `woocommerce_product_variation_get_price`                                                      | 99       | The same for variations.                                    |
| `woocommerce_product_variation_get_regular_price`                                              | 99       | The same for variations.                                    |
| `woocommerce_get_price_html`                                                                   | 99       | Rewrites the displayed price.                               |
| `woocommerce_get_price_html`                                                                   | 100      | Hides the price for guests when `hide_prices_guests` is on. |
| `woocommerce_is_purchasable`                                                                   | 100      | Blocks purchase by guests under the same setting.           |
| `woocommerce_before_calculate_totals`                                                          | 99       | Applies wholesale pricing to the cart.                      |
| `woocommerce_check_cart_items`                                                                 | 10       | Enforces the minimum order amount.                          |
| `woocommerce_cart_totals_before_order_total` and `woocommerce_review_order_before_order_total` | 10       | Shows what the customer saved.                              |
| `woocommerce_customer_is_vat_exempt`                                                           | 10       | Applies the role's tax exemption.                           |
| `woocommerce_cart_item_name`                                                                   | 10       | Marks a cart line as wholesale-priced.                      |
| `woocommerce_account_menu_items`                                                               | 10       | Adds the wholesale registration page to My Account.         |
| `woocommerce_account_wholesale-register_endpoint`                                              | 10       | Renders that page.                                          |
| `woocommerce_register_form`                                                                    | 10       | Adds the wholesale fields to the registration form.         |
| `woocommerce_created_customer`                                                                 | 10       | Processes a wholesale application submitted at signup.      |
| `wp_loaded`                                                                                    | 10       | Handles the standalone registration form's POST.            |

The registration handler is not registered inside `wp-admin`; the price and cart handlers always are.

## Database schema

| Table                            | Holds                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_wholesale_roles`  | Roles: key (unique), name, discount type and value, minimum order amount, tax-exempt flag, active flag. |
| `{prefix}aiowc_wholesale_prices` | Per-product prices: product, variation, role, price, minimum quantity. Unique on that combination.      |
| `{prefix}aiowc_wholesale_rules`  | Role rules: type, JSON data, active flag, priority.                                                     |

Application data, the requested role, the approval status and any rejection reason live in **user meta**, not in a table.

## Background jobs

| Hook                         | Interval | Group             | Work                                                                                                                                                 |
| ---------------------------- | -------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_wholesale_price_sync` | 6 hours  | `aiowc-wholesale` | Pushes a variable product's role price down to its variations where none exists, and deletes price rows whose product or variation has been removed. |

## Entitlement limits

`wholesale` is an on/off grant with no cap on roles, prices or wholesale customers. The numeric limits are store settings: the store-wide and per-role minimum order amounts.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- **The admin screen is a placeholder.** Its roles table shows a hardcoded example, its button does nothing, and its registrations and settings tabs render no content. Roles, prices, rules, registrations and settings are REST-only in practice.
- There is no screen for setting a product's wholesale price, so prices must be posted to `/wholesale/prices` directly.
- `rule_type` is a free string on the table and the create route accepts any value, but the resolver only ever looks up `category_discount`. A rule of any other type is stored and never consulted.
