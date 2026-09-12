---
id: quantity-rules
title: "Min/Max Quantity Rules"
description: "Minimum, maximum and step quantity rules per product, variation, category, customer role or whole cart, enforced on the quantity control and on every cart write."
keywords:
  - woocommerce minimum quantity
  - maximum order quantity
  - step quantity
  - wholesale minimums
format: md
---
## Overview

Min/Max Quantity Rules constrains the quantities a customer can put in the cart: a minimum, a maximum, and a step so quantities move in multiples. A rule targets a product, a variation, a category, a customer role, or the cart as a whole.

The constraint is applied in two places that matter. The quantity input on the product page is given the rule's bounds, so the control itself will not offer a disallowed number; and the cart is re-checked on add and on update, so a quantity that arrives another way is still refused.

It is for stores selling in packs, with wholesale minimums, or with per-customer caps.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `quantity-rules`                                                |
| Tier            | Premium                                                         |
| Entitlement key | `quantity-rules`                                                |
| Admin tab       | `quantity-rules`                                                |
| Enabled option  | `aiowc_module_enabled_quantity-rules` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the table below and seeds the defaults.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the option row `aiowc_mm_settings`.

| Stored key                 | Default | Meaning                                                                 |
| -------------------------- | ------- | ------------------------------------------------------------------------- |
| `enable_quantity_rules`    | `true`  | Master switch. Off means every quantity is allowed.                      |
| `show_validation_messages` | `true`  | Whether a refused quantity explains itself with a notice.                |
| `enforce_step_quantity`    | `true`  | Whether the step rule is enforced, or only the minimum and maximum.      |

Unlike most modules, these defaults are written directly to the option row when the module is enabled, rather than through the shared settings helper. The row is only written when it does not already exist, so re-enabling the module does not overwrite a store's choices.

## Rules

| Field         | Meaning                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `rule_type`   | What the rule targets: `product`, `variation`, `category`, `role` or `cart`. |
| `target_id`   | The product, variation or category id. Required for those three types.       |
| `target_key`  | The role key. Required for a `role` rule.                                    |
| `min_qty`     | Smallest allowed quantity. `0` means no minimum.                             |
| `max_qty`     | Largest allowed quantity. `0` means no maximum.                              |
| `step_qty`    | Quantities must be a multiple of this. Defaults to `1`.                      |
| `message`     | The notice shown when the rule refuses a quantity.                           |
| `priority`    | Which rule wins when more than one applies.                                  |
| `is_active`   | Whether the rule is enforced.                                                |

A rule is rejected at creation if it names a type that needs a target and does not supply one: `product`, `variation` and `category` rules require a positive `target_id`, and a `role` rule requires a `target_key`. The custom message has a maximum length, and a longer one is refused rather than truncated.

## Admin screen

The **Min/Max Quantity Rules** tab lists the rules and creates, edits and deletes them, with a bulk action for several at once. It also carries a **tester**: enter a product and a quantity and it reports whether the rules would allow it, which is how a store confirms a rule before a customer meets it. The tester reflects the module's own master switch — with `enable_quantity_rules` off, every quantity is reported as allowed, because that is what the storefront would do.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                       | Purpose                                           | Permission           | Required args |
| ----------------- | -------------------------- | --------------------------------------------------- | -------------------- | ------------- |
| GET               | `/quantity-rules`          | Every rule.                                        | `manage_woocommerce` | –             |
| POST              | `/quantity-rules`          | Create a rule.                                     | `manage_woocommerce` | `rule_type`   |
| GET               | `/quantity-rules/{id}`     | One rule.                                          | `manage_woocommerce` | `id`          |
| PATCH / PUT /POST | `/quantity-rules/{id}`     | Update a rule. All three verbs are registered.     | `manage_woocommerce` | `id`          |
| DELETE            | `/quantity-rules/{id}`     | Delete a rule.                                     | `manage_woocommerce` | `id`          |
| POST              | `/quantity-rules/bulk`     | Apply an action to several rules at once.          | `manage_woocommerce` | –             |
| POST              | `/quantity-rules/validate` | Ask whether a quantity would be allowed.           | Public, rate-limited | `product_id`  |

`/validate` is public and rate-limited because the product page calls it for visitors who are not signed in; it is also what the admin tester uses.

## WooCommerce integration

| Hook                                | What the module does                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `woocommerce_quantity_input_args`   | Sets the min, max and step on the quantity control, so the input itself enforces the rule. |
| `woocommerce_add_to_cart_validation`| Refuses an add that breaks a rule.                                               |
| `woocommerce_update_cart_validation`| Refuses a cart update that breaks a rule.                                        |
| `woocommerce_check_cart_items`      | Re-checks the whole cart, which is what catches a cart-wide rule and a cart that was valid when built and is not now. |
| `wp_enqueue_scripts`                | Loads the assets behind the quantity control.                                    |

The constraint is applied on the control **and** on every write path, so a quantity submitted outside the UI is still refused.

## Database schema

| Table                          | Holds                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_quantity_rules` | One row per rule: its type, target id or role key, minimum, maximum and step, custom message, priority, active flag. |

## Background jobs

This module schedules no background jobs. Rules are evaluated on the request that needs them.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module exposes no filter for adding a rule type or overriding a decision.

## Entitlement limits

`quantity-rules` is an on/off grant with no cap on the number of rules.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- Settings are written straight to the option row rather than through the shared settings helper, so this module does not take part in the lazy migration from older per-key options that the others use.
- There is no filter for adding a rule type, so a constraint the five types cannot express requires modifying the module.
- A rule's `message` is a single string with no placeholders, so a notice cannot quote the offending quantity or the limit it broke.
- The rules apply to quantities only. There is no value-based equivalent — a minimum order total is not expressible here.
