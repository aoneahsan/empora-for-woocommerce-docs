---
id: multi-step-checkout
title: "Multi-Step Checkout"
description: "Split checkout into saved steps with per-step validation, restored progress, trust badges and a single-product order bump."
keywords:
  - woocommerce multi step checkout
  - checkout steps
  - save checkout progress
  - order bump
format: md
---
## Overview

Multi-Step Checkout breaks WooCommerce's single checkout page into a sequence of steps — by default Cart, Shipping, Payment and Review — with progress saved as the customer moves through them. A customer who leaves and comes back is restored to the step they reached, with what they had already entered.

Because each step is validated on its own, a customer is told about a problem at the step that caused it instead of meeting every error at once on submit.

The module also carries two conversion features: trust badges shown beside the payment step, and an **order bump** — a single product offered during checkout.

It is for long checkouts, where a single form loses people.

## Availability

| Item            | Value                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Module key      | `multi-step-checkout`                                                 |
| Tier            | Premium                                                               |
| Entitlement key | `multi-step-checkout`                                                 |
| Admin tab       | `multi-step-checkout`                                                 |
| Enabled option  | `aiowc_module_enabled_multi-step-checkout` (off until turned on)      |
| REST namespace  | `aiowc/v1`                                                            |

Enabling the module creates the two tables below, seeds the defaults and schedules the session cleanup job.

`registerHooks()` returns early when the licence does not grant `multi-step-checkout`.

## Settings

Stored in the bundled option row `aiowc_msc_settings`.

| Stored key              | Default                                          | Meaning                                                   |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `enable_multi_step`     | `true`                                           | Whether checkout is split into steps.                      |
| `step_labels`           | `['Cart','Shipping','Payment','Review']`         | The four step names shown in the progress indicator.       |
| `show_trust_badges`     | `true`                                           | Whether trust badges are shown.                            |
| `trust_badges`          | Secure Checkout (lock), Money-Back Guarantee (shield) | The badges themselves: a label and an icon name each. |
| `order_bump_product_id` | `0`                                              | The product offered as an order bump. `0` means none.      |
| `session_ttl_days`      | `30`                                             | How long a saved checkout session is kept.                 |

🔴 **The default trust badges make a claim the store may not honour.** `Money-Back Guarantee` ships as a default badge and is displayed to customers as soon as the module is on. If the store has no such guarantee, remove or reword that badge before going live — it is a statement to the customer, not decoration.

## Steps and saved progress

Each step is saved to the module's session table as the customer completes it, keyed by a session id and, for a signed-in customer, their user id. The stored step data and the last step reached are what `GET /checkout/restore` returns, so the progress indicator and the form come back to where the customer left off.

Sessions carry an expiry derived from `session_ttl_days` and are removed by the cleanup job once past it.

## Step fields

The module keeps its own field table so a field can be assigned to a particular step, with its own label, type, required flag, options, validation rules and sort order. This is how a field is made to appear at step 2 rather than wherever the checkout form would otherwise put it.

## Order bump

When `order_bump_product_id` names a product, it is offered on `woocommerce_review_order_before_payment` — beside the payment section, at the point the customer is committing. One product, not a list.

## Admin screen

The **Multi-Step Checkout** tab edits the step labels, the trust badges, the order bump product and the session lifetime, and manages the per-step fields.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                            | Purpose                                                   | Permission           | Required args |
| ------ | ------------------------------- | ------------------------------------------------------------ | -------------------- | ------------- |
| GET    | `/checkout/steps/fields`        | Every step field definition.                               | `manage_woocommerce` | –             |
| POST   | `/checkout/steps/fields`        | Create a step field.                                       | `manage_woocommerce` | –             |
| PATCH  | `/checkout/steps/fields/{id}`   | Update a step field.                                       | `manage_woocommerce` | `id`          |
| DELETE | `/checkout/steps/fields/{id}`   | Delete a step field.                                       | `manage_woocommerce` | `id`          |
| POST   | `/checkout/save-step`           | Save the customer's progress at a step.                    | Nonce, rate-limited  | –             |
| POST   | `/checkout/validate-step`       | Validate one step without submitting the order.            | Nonce, rate-limited  | –             |
| GET    | `/checkout/restore`             | Restore a saved session's step and data.                   | Public, rate-limited | –             |

These sit under `/checkout/steps/` and the three step verbs, while the separate [Custom Checkout Fields](/modules/reference/checkout) module owns `/checkout/fields` and `/checkout/settings`, so neither shadows the other.

## WooCommerce integration

| Hook                                       | What the module does                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `woocommerce_before_checkout_form`         | Draws the step progress indicator above the form.                       |
| `woocommerce_checkout_fields`              | Assigns the configured fields to their steps.                           |
| `woocommerce_checkout_process`             | Validates the submission across the steps.                              |
| `woocommerce_review_order_before_payment`  | Shows the trust badges and the order bump.                              |
| `wp_enqueue_scripts`                       | Loads the step navigation and save-progress assets.                     |

## Database schema

| Table                                  | Holds                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_checkout_sessions`      | Saved progress: the session id, the customer if signed in, the step data, the last step reached, and an expiry. |
| `{prefix}aiowc_msc_checkout_fields`    | Step field definitions: key, label, type, the step it belongs to, required flag, options, validation rules, sort order, enabled flag. |

The field table carries an `msc_` prefix because the plainer name belongs to the separate [Custom Checkout Fields](/modules/reference/checkout) module.

## Background jobs

| Hook                               | Interval | Work                                                     |
| ---------------------------------- | -------- | ---------------------------------------------------------- |
| `aiowc_checkout_cleanup_sessions`  | daily    | Deletes saved sessions past their expiry.                 |

The job runs on WP-Cron, first scheduled an hour after the module is enabled.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

## Entitlement limits

`multi-step-checkout` is an on/off grant with no cap on the number of step fields or saved sessions. The order bump is **one** product by design, not a limit imposed by the licence.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **The default `Money-Back Guarantee` trust badge is a claim about the store**, shown by default, that a given store may not offer. It should be reviewed before the module goes live.
- **Two modules filter `woocommerce_checkout_fields`** — this one and [Custom Checkout Fields](/modules/reference/checkout). With both enabled they both modify the same field array, and nothing coordinates the result or warns that both are active.
- The step count is fixed at four by the default labels; the setting renames the steps rather than adding or removing one.
- The order bump is a single product id with no targeting — it is offered to every customer regardless of what is in the cart.
- A saved session stores what the customer has entered until its expiry, which is 30 days by default. That is checkout data at rest, and it is worth accounting for in a store's retention and privacy position.
