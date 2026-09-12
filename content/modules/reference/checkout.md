---
id: checkout
title: "Custom Checkout Fields"
description: "Add fields to WooCommerce checkout with conditional logic and validation, stored against the order and shown on the order screen, account page and emails."
keywords:
  - woocommerce checkout fields
  - custom checkout
  - checkout validation
  - conditional checkout fields
format: md
---
## Overview

Custom Checkout Fields adds fields to WooCommerce's checkout: a delivery instruction, a VAT number, a purchase-order reference, a date the customer needs the order by. Each field declares where it belongs, whether it is required, how it is validated, and the conditions under which it appears at all.

The values are stored against the order in the module's own table and shown wherever the order is — the admin order screen, the customer's order detail page, and the order emails.

A layout can be saved so the arrangement of the checkout form is itself a stored, switchable thing rather than a set of individual field positions.

It is for stores that need to collect something WooCommerce's checkout does not ask for.

## Availability

| Item            | Value                                                    |
| --------------- | ---------------------------------------------------------- |
| Module key      | `checkout`                                                |
| Tier            | Premium                                                   |
| Entitlement key | `checkout`                                                |
| Admin tab       | `checkout`                                                |
| Enabled option  | `aiowc_module_enabled_checkout` (off until turned on)     |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the three tables below, seeds the defaults and schedules the cleanup job.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

Stored in the bundled option row `aiowc_co_settings`. The defaults are produced by a method rather than declared as a constant, because one of them is JSON-encoded at runtime.

| Stored key                 | Default                            | Meaning                                                        |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `field_positions`          | `["billing","shipping","order"]`   | The sections fields may be placed in, stored as a JSON string.  |
| `enable_field_validation`  | `true`                             | Whether the module's own validation rules are applied.          |
| `enable_conditional_logic` | `true`                             | Whether conditional rules are evaluated.                        |

## Fields

| Field               | Meaning                                                                        |
| ------------------- | -------------------------------------------------------------------------------- |
| `field_key`         | The stable key the value is stored under.                                       |
| `label`             | The label shown to the customer.                                                |
| `field_type`        | The control used. Defaults to `text`.                                           |
| `placeholder`       | Placeholder text for the control.                                               |
| `required`          | Whether checkout refuses to proceed without it.                                 |
| `section`           | `billing`, `shipping` or `order`. Defaults to `billing`.                        |
| `position`          | Where within that section the field sits. Defaults to `after_billing_form`.     |
| `priority`          | The order fields appear in.                                                     |
| `options`           | The choices, for a field type that has them. Stored as JSON.                    |
| `conditional_rules` | When the field is shown. Stored as JSON.                                        |
| `validation_rules`  | How a submitted value is checked. Stored as JSON.                               |
| `enabled`           | Whether the field is on the form at all.                                        |

## Layouts

A layout is a named, stored arrangement of the checkout form, with `is_active` deciding which one is in force — and **no layout is active by default**, so a store that has not chosen one gets the field-by-field positions rather than a layout.

## Validation

Validation runs on `woocommerce_after_checkout_validation`, so a value that fails is reported with the rest of WooCommerce's own checkout errors rather than in a separate pass. The module also exposes `POST /checkout/validate` for checking a value before submission, which is what allows the form to report a problem as the customer types.

## Admin screen

The **Checkout** tab defines the fields — creating, editing, deleting and reordering them — manages layouts, and edits the module's settings. An overview endpoint backs a summary of what is configured, and each field's collected values can be inspected from the same screen.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope. Every route requires `manage_woocommerce` except `/checkout/validate`.

| Method            | Path                            | Purpose                                                      |
| ----------------- | ------------------------------- | -------------------------------------------------------------- |
| GET               | `/checkout/fields`              | Every field definition.                                       |
| POST              | `/checkout/fields`              | Create a field.                                               |
| GET               | `/checkout/fields/{id}`         | One field.                                                    |
| PATCH / PUT /POST | `/checkout/fields/{id}`         | Update a field. All three verbs are registered.               |
| DELETE            | `/checkout/fields/{id}`         | Delete a field.                                               |
| GET               | `/checkout/fields/{id}/values`  | The values collected for one field.                           |
| POST              | `/checkout/fields/reorder`      | Reorder the fields.                                           |
| GET               | `/checkout/overview`            | A summary of the configured checkout.                         |
| GET / PATCH / PUT / POST | `/checkout/settings`     | Read and write the module's settings.                         |
| POST              | `/checkout/validate`            | Validate a value before submission. Nonce, rate-limited.      |

These sit under `/checkout/`, while the separate [Multi-Step Checkout](/modules/reference/multi-step-checkout) module owns `/checkout/steps/` and its own step routes, so neither shadows the other.

## WooCommerce integration

| Hook                                              | What the module does                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `woocommerce_checkout_fields`                     | Adds the configured fields to the checkout form.                    |
| `woocommerce_billing_fields` / `woocommerce_shipping_fields` | Places fields inside those two sections.                  |
| `woocommerce_before_checkout_form` / `_after_checkout_form` | Renders fields positioned outside the standard sections.    |
| `woocommerce_after_checkout_validation`           | Applies the validation rules alongside WooCommerce's own.           |
| `woocommerce_checkout_create_order`               | Stores the submitted values against the order.                      |
| `woocommerce_admin_order_data_after_billing_address` / `_shipping_address` | Shows the values on the admin order screen.  |
| `woocommerce_order_details_after_order_table`     | Shows them on the customer's order page.                            |
| `woocommerce_email_after_order_table`             | Adds them to the order emails.                                      |
| `wp_enqueue_scripts`, `wp_footer`                 | Loads the conditional-logic and validation assets.                  |

## Database schema

| Table                                    | Holds                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_checkout_fields`          | The field definitions: key, label, type, placeholder, required flag, section and position, priority, options, conditional and validation rules as JSON, enabled flag. |
| `{prefix}aiowc_checkout_layouts`         | Named form layouts, one of which may be active, with the arrangement stored as its configuration.             |
| `{prefix}aiowc_checkout_field_values`    | One row per value collected: the field, the order, and the value.                                             |

The fields table is named `aiowc_checkout_fields`. The separate [Multi-Step Checkout](/modules/reference/multi-step-checkout) module keeps its own field table under an `msc_` prefix, so the two never share a row.

## Background jobs

| Hook                             | Interval | Work                                                                    |
| -------------------------------- | -------- | ------------------------------------------------------------------------- |
| `aiowc_checkout_field_cleanup`   | daily    | Deletes collected values whose **field definition** no longer exists.    |

The job runs on Action Scheduler, in the `aiowc` group.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

The module exposes no filter for adding a field type or a validation rule.

## Entitlement limits

`checkout` is an on/off grant with no cap on the number of fields, layouts or stored values.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **Two modules filter `woocommerce_checkout_fields`** — this one and [Multi-Step Checkout](/modules/reference/multi-step-checkout). With both enabled they both modify the same field array, and nothing coordinates the result or warns that both are active.
- No layout is active by default, so the layout feature does nothing until one is explicitly chosen — which is easy to read as the feature not working.
- There is no filter for field types or validation rules, so anything the module does not already implement requires modifying it.
- **Deleting a field deletes the values collected under it**, including those belonging to completed orders, so what a past customer entered is lost with the definition. There is no confirmation of that consequence and no export first.
- **Deleting an order does not remove its checkout field values.** The repository has a delete-by-order method, but nothing calls it and the cleanup job only removes values orphaned by a deleted *field*, so values belonging to deleted orders accumulate indefinitely. That is worth knowing where a data-retention policy applies.
