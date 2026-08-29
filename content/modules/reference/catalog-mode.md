---
id: catalog-mode
title: "Catalog Mode & Quote Request"
description: "Hide prices and the add-to-cart button and take enquiries instead, for wholesale, made-to-order and trade stores that quote rather than publish."
keywords:
  - woocommerce catalog mode
  - hide prices
  - quote request
  - enquiry form
format: md
---
## Overview

The Catalog Mode module turns a WooCommerce store into a browsable catalogue: it can hide prices, remove the add-to-cart button, and offer an enquiry form in their place. Enquiries are stored, answered from the admin screen, and emailed to both sides.

It is for wholesale, made-to-order and trade stores where a price is quoted rather than published, and for stores that want a catalogue open while checkout is closed.

## Availability

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Module key      | `catalog_mode`                                            |
| Tier            | Premium                                                   |
| Entitlement key | `catalog_mode`                                            |
| Admin tab       | `catalog-mode`, under **Pricing & Promotions**            |
| Enabled option  | `aiowc_module_enabled_catalog_mode` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the two tables below, seeds the defaults and schedules the cleanup job. Every storefront behaviour is off by default: enabling the module changes nothing a shopper sees until at least one of `hide_prices`, `hide_add_to_cart` or `enable_inquiry_form` is turned on.

## Settings

Stored in the bundled option row `aiowc_cm_settings`; legacy per-key options `aiowc_cm_<key>` are migrated on first read.

| API name            | Stored key            | Default                  | Meaning                                                                      |
| ------------------- | --------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `hidePrices`        | `hide_prices`         | `false`                  | Register the price filters.                                                  |
| `hideAddToCart`     | `hide_add_to_cart`    | `false`                  | Register the cart-button filters.                                            |
| `enableInquiryForm` | `enable_inquiry_form` | `false`                  | Register the enquiry button, modal and submit handler.                       |
| `inquiryEmail`      | `inquiry_email`       | site admin email         | Address notified of a new enquiry, and the from address on the reply.        |
| `showCallForPrice`  | `show_call_for_price` | `true`                   | Show replacement text where a price would have been.                         |
| `replacementText`   | `replacement_text`    | "Contact us for pricing" | The text shown in place of a price.                                          |
| `applyToRoles`      | `apply_to_roles`      | `[]` (all users)         | When set, only users with these roles are subject to catalogue mode.         |
| `applyToCategories` | `apply_to_categories` | `[]` (all products)      | When set, catalogue mode applies only to products in these categories.       |
| `cleanupDays`       | `cleanup_days`        | `180`                    | Age at which closed enquiries are deleted. `0` or less disables the cleanup. |

The three switches are read once, when hooks are registered, so a change takes effect on the next request rather than mid-request.

## Rules

Beyond the module-wide switches, catalogue mode can be scoped by rules. Each rule has a type, a set of target ids, its own `hide_price`, `hide_cart` and `show_inquiry` flags, optional replacement text, a priority and an active flag.

Rules resolve most specific first — `product`, then `role`, then `category`, then `global` — and within one type the lower priority number wins. Exactly one rule wins per product and visitor; results are cached per product and role for the request.

## Admin screen

The **Catalog Mode** tab has three sub-tabs, and the active one is held in the URL:

| Sub-tab       | What it offers                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| **Rules**     | Create, edit and delete catalogue rules through a rule editor dialogue.        |
| **Enquiries** | The enquiry queue, a detail dialogue, status changes, admin notes and replies. |
| **Settings**  | A form over the module settings above.                                         |

## REST API endpoints

All routes are on `aiowc/v1`. Administration requires `manage_woocommerce` plus a REST nonce on cookie-authenticated requests. The submit route accepts guests but requires a REST nonce and is rate limited to 30 requests a minute.

| Method             | Path                                 | Purpose                                                                                                                      | Required args                                   | Permission   |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------ |
| POST               | `/catalog-mode/inquire`              | Submit an enquiry; accepts `customer_phone` and `message`.                                                                   | `product_id`, `customer_name`, `customer_email` | Public write |
| GET                | `/catalog-mode/inquiries`            | List enquiries; accepts `status`, `page`, `per_page`.                                                                        | –                                               | Manage       |
| GET                | `/catalog-mode/inquiries/{id}`       | Read one enquiry.                                                                                                            | `id`                                            | Manage       |
| PUT / PATCH / POST | `/catalog-mode/inquiries/{id}`       | Update status or admin notes.                                                                                                | `id`                                            | Manage       |
| DELETE             | `/catalog-mode/inquiries/{id}`       | Delete an enquiry.                                                                                                           | `id`                                            | Manage       |
| POST               | `/catalog-mode/inquiries/{id}/reply` | Email a reply to the customer and record it; accepts `admin_notes`.                                                          | `id`, `reply_text`                              | Manage       |
| GET                | `/catalog-mode/rules`                | List rules; accepts `limit`, `offset`.                                                                                       | –                                               | Manage       |
| POST               | `/catalog-mode/rules`                | Create a rule; accepts `target_ids`, `hide_price`, `hide_cart`, `show_inquiry`, `replacement_text`, `priority`, `is_active`. | `rule_type`                                     | Manage       |
| PUT / PATCH / POST | `/catalog-mode/rules/{id}`           | Update a rule.                                                                                                               | `id`                                            | Manage       |
| DELETE             | `/catalog-mode/rules/{id}`           | Delete a rule.                                                                                                               | `id`                                            | Manage       |
| GET                | `/catalog-mode/settings`             | Read the settings above.                                                                                                     | –                                               | Manage       |
| PUT / PATCH / POST | `/catalog-mode/settings`             | Update the settings above.                                                                                                   | –                                               | Manage       |

## WooCommerce integration

Frontend handlers are skipped inside `wp-admin`, and each group is registered only when its switch is on.

### Hiding prices (`hide_prices`)

| Filter                            | Priority |
| --------------------------------- | -------- |
| `woocommerce_get_price_html`      | 100      |
| `woocommerce_cart_item_price`     | 100      |
| `woocommerce_cart_item_subtotal`  | 100      |
| `woocommerce_variable_price_html` | 100      |

### Hiding the cart button (`hide_add_to_cart`)

| Hook                                 | Priority | Effect                                         |
| ------------------------------------ | -------- | ---------------------------------------------- |
| `woocommerce_loop_add_to_cart_link`  | 100      | Replaces the loop button.                      |
| `woocommerce_is_purchasable`         | 100      | Marks the product not purchasable.             |
| `woocommerce_single_product_summary` | 1        | Removes the single-product add-to-cart output. |
| `woocommerce_add_to_cart_validation` | 100      | Refuses a direct add-to-cart attempt.          |

Because purchasability and add-to-cart validation are both filtered, a hidden product cannot be added by posting to the cart URL directly.

### Enquiry form (`enable_inquiry_form`)

| Hook                                                                  | Effect                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `woocommerce_single_product_summary` (35)                             | Renders the enquiry button on the product page.         |
| `woocommerce_after_shop_loop_item` (15)                               | Renders the enquiry button in the loop.                 |
| `wp_footer`                                                           | Renders the enquiry modal.                              |
| `wp_ajax_aiowc_submit_inquiry`, `wp_ajax_nopriv_aiowc_submit_inquiry` | Handles the form post for signed-in and guest visitors. |
| `wp_enqueue_scripts`                                                  | Loads the enquiry assets.                               |

The form can therefore be submitted either through admin-ajax or through `POST /catalog-mode/inquire`.

### Email

A new enquiry is emailed to `inquiry_email`, falling back to the site admin address when it is empty. A reply is emailed to the customer from the same address. Both go through `wp_mail`, so they use whatever the site is already configured to send with.

## Database schema

| Table                              | Holds                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_catalog_mode_rules` | Rules: type, target ids, per-rule hide flags, replacement text, priority and active state. |
| `{prefix}aiowc_catalog_inquiries`  | Enquiries: product, customer name, email, phone, message, status, admin notes and replies. |

## Background jobs

| Hook                            | Interval | Work                                                                                                     |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `aiowc_catalog_inquiry_cleanup` | 24 hours | Deletes closed enquiries older than `cleanupDays`. Returns immediately when that setting is `0` or less. |

## Entitlement limits

`catalog_mode` is an on/off grant with no licence-side quota on rules or enquiries. Enquiry volume is bounded by the public-write rate limit of 30 requests a minute per caller, and enquiry retention by `cleanupDays`.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
