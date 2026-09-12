---
id: product-options
title: "Product Options"
description: "Reusable option sets attached to products, categories or tags, with conditional logic, file uploads and fixed, percentage or formula pricing."
keywords:
  - woocommerce product options
  - option sets
  - configurable products
  - formula pricing
format: md
---
## Overview

Product Options groups configurable inputs into **option sets** that are attached to products, categories, tags, or everything at once. Where [Product Add-Ons](/modules/reference/addons) defines each input individually, an option set is one reusable bundle — "Engraving", "Gift wrapping", "Framing" — assigned wherever it applies and edited in one place.

A set's fields are stored as JSON on the set itself, along with its conditional logic, so adding a field to a set changes every product the set is attached to. Pricing supports a fixed amount, a percentage, and a **formula** evaluated against the product's price and the entered value.

It is for stores where the same configuration repeats across a catalogue.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `product_options`                                               |
| Tier            | Premium                                                         |
| Entitlement key | `product_options`                                               |
| Admin tab       | `product-options`                                               |
| Enabled option  | `aiowc_module_enabled_product_options` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                                      |

Enabling the module creates the three tables below and schedules the file cleanup job.

`registerHooks()` performs no licence check of its own; the module registry applies the entitlement gate centrally before calling it.

## Settings

**This module has no settings row.** It declares no settings prefix and no defaults, so there is nothing at `aiowc_po_settings` or any equivalent. Everything is configured per option set, and the two numeric upload limits are filters rather than stored settings — see *Uploads* below.

## Option sets

| Field               | Meaning                                                                             |
| ------------------- | ------------------------------------------------------------------------------------- |
| `name`, `slug`      | What the set is called, and its stable identifier.                                   |
| `description`       | An internal note.                                                                    |
| `is_global`         | Whether the set applies to every product regardless of assignments.                  |
| `priority`          | The order sets are applied in when several reach one product.                        |
| `status`            | `draft`, `active` or `archived`. **A new set is `draft` by default.**                |
| `fields`            | The set's fields, stored as JSON.                                                    |
| `conditional_logic` | Rules that show or hide fields based on other answers, stored as JSON.               |

A set is `draft` until it is made active, so creating a set and assigning it is not enough on its own to make it appear on the storefront.

## Assignments

An assignment attaches a set to a target:

| `target_type` | Attaches the set to                    |
| ------------- | ---------------------------------------- |
| `product`     | One product, by id.                     |
| `category`    | Every product in a category.            |
| `tag`         | Every product carrying a tag.           |
| `all`         | Every product.                          |

Assignments carry their own priority, so a product-level assignment can be ordered ahead of a category-level one.

## Field validation

Each field carries validation rules, applied when the customer submits: `required`, a minimum and maximum value, a minimum and maximum length, and a regular-expression `pattern`. A pattern without delimiters is given them before use, so a plain expression works as written.

## Pricing

| Type      | Effect                                                                 |
| --------- | ------------------------------------------------------------------------ |
| `fixed`   | Adds a fixed amount.                                                    |
| `percent` | Adds a percentage of the product's price.                               |
| `formula` | Evaluates an arithmetic expression.                                     |

A formula may use the placeholders `{base_price}`, `{value}` and `{qty}`, and the operators `+`, `-`, `*`, `/` with parentheses. It is parsed into tokens and evaluated by the module itself — **not** by PHP's evaluator — and the tokeniser accepts only digits, a decimal point, those four operators, parentheses and whitespace, so a formula cannot be used to run code. Division by zero yields `0.0` rather than an error, and a non-numeric entered value is treated as `0`.

## Uploads

A file field posts to `/product-options/upload`. Uploads accept `image/jpeg`, `image/png`, `image/gif`, `image/webp` and `application/pdf`, up to **5 MB**. Both limits are filters rather than settings — `aiowc_product_options_allowed_mime_types` and `aiowc_product_options_max_upload_bytes` — so changing either needs a snippet, not an admin control.

An uploaded file is recorded against the visitor's session with an expiry, and claimed by an order when checkout completes. Files that are never claimed are removed by the cleanup job.

## Admin screen

The **Product Options** tab lists the option sets and creates, edits, duplicates and deletes them, edits each set's fields and conditional logic, and manages the assignments that decide which products a set reaches.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method            | Path                                              | Purpose                                      | Permission           | Required args          |
| ----------------- | ------------------------------------------------- | ---------------------------------------------- | -------------------- | ---------------------- |
| GET               | `/product-options/option-sets`                    | Every option set.                             | `manage_woocommerce` | –                      |
| POST              | `/product-options/option-sets`                    | Create an option set.                         | `manage_woocommerce` | `name`                 |
| GET               | `/product-options/option-sets/{id}`               | One option set.                               | `manage_woocommerce` | `id`                   |
| PATCH / PUT /POST | `/product-options/option-sets/{id}`               | Update a set. All three verbs are registered. | `manage_woocommerce` | `id`                   |
| DELETE            | `/product-options/option-sets/{id}`               | Delete a set.                                 | `manage_woocommerce` | `id`                   |
| POST              | `/product-options/option-sets/{id}/duplicate`     | Copy a set, with its fields.                  | `manage_woocommerce` | `id`                   |
| GET               | `/product-options/option-sets/{id}/assignments`   | The set's assignments.                        | `manage_woocommerce` | `id`                   |
| POST              | `/product-options/option-sets/{id}/assignments`   | Attach the set to a target.                   | `manage_woocommerce` | `id`, `target_type`    |
| DELETE            | `/product-options/assignments/{id}`               | Remove an assignment.                         | `manage_woocommerce` | `id`                   |
| GET               | `/product-options/products/{id}/option-sets`      | The sets that apply to one product.           | Public, rate-limited | `id`                   |
| POST              | `/product-options/upload`                         | Upload a file for a file field.               | Upload check         | –                      |
| DELETE            | `/product-options/upload/{fileId}`                | Discard an upload before checkout.            | Upload check         | `fileId`               |

## WooCommerce integration

| Hook                                          | What the module does                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `woocommerce_before_add_to_cart_button`       | Draws the option fields on the product page.                           |
| `woocommerce_add_to_cart_validation`          | Refuses the add when a required field is empty or a rule fails.        |
| `woocommerce_add_cart_item_data`              | Captures the answers into the cart item.                               |
| `woocommerce_cart_item_key`                   | Makes the answers part of the cart item's identity, so two differently configured copies of one product stay separate lines. |
| `woocommerce_before_calculate_totals`         | Applies the pricing.                                                   |
| `woocommerce_get_item_data`                   | Shows the answers in the cart and at checkout.                         |
| `woocommerce_checkout_create_order_line_item` | Writes the answers onto the order line.                                |
| `woocommerce_checkout_order_processed`        | Claims the uploaded files for the order.                               |
| `woocommerce_order_item_name` / `_meta_end`   | Shows the configuration on the order.                                  |
| `woocommerce_before_order_itemmeta`           | Shows it on the admin order screen.                                    |
| `wp_enqueue_scripts`                          | Loads the option-field assets.                                         |

## Database schema

| Table                                    | Holds                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_option_sets`              | The set: name, slug, description, global flag, priority, status, and its fields and conditional logic as JSON.  |
| `{prefix}aiowc_option_set_assignments`   | Which sets reach which targets: the set, the target type and id, a priority.                                    |
| `{prefix}aiowc_uploaded_files`           | Files awaiting an order: the file id, the session, the set and field, the original name, size and MIME type, the claiming order, and an expiry. |

The `fields` and `conditional_logic` columns are MySQL `JSON`, so this module needs a database that supports that type.

## Background jobs

| Hook                                  | Work                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `aiowc_product_options_file_cleanup`  | Deletes uploaded files that passed their expiry without being claimed by an order. |

## Action hooks for integrators

| Hook                                        | Purpose                                                        |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `aiowc_product_options_max_upload_bytes`    | Filter — the upload size limit. Default 5 MB.                   |
| `aiowc_product_options_allowed_mime_types`  | Filter — the accepted MIME types.                               |
| `aiowc_product_options_set_created`         | An option set is created.                                       |
| `aiowc_product_options_set_updated`         | An option set is updated.                                       |
| `aiowc_product_options_set_deleted`         | An option set is deleted.                                       |
| `aiowc_product_options_set_duplicated`      | An option set is copied.                                        |
| `aiowc_product_options_assignment_created`  | A set is attached to a target.                                  |
| `aiowc_product_options_assignment_deleted`  | An assignment is removed.                                       |
| `aiowc_product_options_delete_file`         | An unclaimed upload is discarded.                               |
| `aiowc_track_event`, `aiowc_capture_error`  | Module lifecycle events and caught errors.                       |

This is the richest integrator surface of the product-configuration modules; a store can react to every set and assignment change without polling.

## Entitlement limits

`product_options` is an on/off grant with no cap on the number of sets, fields or assignments.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **A new option set is created as a draft**, and a draft set is not applied on the storefront. Creating a set and assigning it is not sufficient; it must also be made active, which is easy to miss.
- The upload size and MIME allowlist are filters with no admin control, so changing them requires code.
- With no settings row there is no storefront kill switch: the module is either on, with all its hooks, or disabled entirely.
- Two modules can attach inputs to the same product — this one and [Product Add-Ons](/modules/reference/addons) — and they keep separate tables, separate admin screens and separate order line data. Nothing reconciles them or warns that both are active.
