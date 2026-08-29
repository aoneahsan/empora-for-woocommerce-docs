---
id: variations-enhanced
title: "Enhanced Product Variations"
description: "Swatches in place of attribute dropdowns, the selected variation price, stock and description under the form, and bulk editing of variations."
keywords:
  - woocommerce variation swatches
  - variable products
  - bulk edit variations
  - colour swatches
format: md
---
## Overview

The Variations module does three things to WooCommerce's variable products: it replaces attribute dropdowns with swatches, it shows the selected variation's price, stock and description under the variations form, and it lets variation fields be edited in bulk instead of one variation at a time.

It is for stores whose products vary by colour, material or size, where a row of colour chips reads better than a `<select>`, and where a catalogue has enough variations that editing them individually is impractical.

Swatches are attached to attribute **terms**, not to products, so one swatch definition covers every product using that term.

## Availability

| Item            | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `variations-enhanced`                                            |
| Tier            | Premium                                                          |
| Entitlement key | `variations-enhanced`                                            |
| Admin tab       | `variations-enhanced`, under **Product Experience**              |
| Enabled option  | `aiowc_module_enabled_variations-enhanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                       |

Enabling the module creates the two tables below and seeds the defaults. Uninstalling drops the tables and deletes the settings row. `registerHooks()` returns immediately when the licence does not grant `variations-enhanced`.

## Settings

Stored in the bundled option row `aiowc_ve_settings`.

| Stored key             | Default  | Meaning                                                                 |
| ---------------------- | -------- | ----------------------------------------------------------------------- |
| `enable_swatches`      | `true`   | Register the swatch renderer. Off leaves WooCommerce's dropdowns alone. |
| `swatch_size`          | `medium` | Size class applied to the rendered swatches.                            |
| `enable_tooltips`      | `true`   | Show a swatch's tooltip text on hover.                                  |
| `show_variation_stock` | `true`   | Show the selected variation's availability under the form.              |
| `show_variation_price` | `true`   | Show the selected variation's price under the form.                     |
| `enable_bulk_update`   | `true`   | Register the bulk-update control on the product edit screen.            |

`enable_swatches` and `enable_bulk_update` are read once, when hooks are registered. When both `show_variation_stock` and `show_variation_price` are off, the details block is not printed at all.

## Swatch types

| Type     | Rendered as        | Field used                                             |
| -------- | ------------------ | ------------------------------------------------------ |
| `color`  | A colour chip.     | `color_value`, validated as a 3- or 6-digit hex value. |
| `image`  | A thumbnail.       | `image_url`                                            |
| `button` | A labelled button. | `button_label`                                         |
| `label`  | A text label.      | `button_label`                                         |

Each swatch also carries an optional tooltip and a sort order, and is unique on the attribute slug plus term id.

## Admin screen

The **Enhanced Product Variations** tab has two sub-tabs, and exists because the module's administrator routes had no caller.

**Swatches** creates, edits and deletes swatches for an attribute — `POST`, `PATCH` and `DELETE` on `/variations/swatches`.

**Variation data** edits variation metadata: `PATCH /variations/{id}/meta` for one variation and `POST /variations/bulk-update` for many.

Swatches can also be edited where the terms live: the module adds swatch fields to the add-term and edit-term forms of every WooCommerce product attribute taxonomy, so a colour swatch can be set while creating the colour term.

## Bulk update

`POST /variations/bulk-update` takes a list of updates and applies only these fields; anything else in an update is ignored:

`price`, `regular_price`, `sale_price`, `stock_quantity`, `stock_status`, `sku`, `description`, `weight`, `dimensions`, `custom_meta`.

`stock_status` accepts `instock`, `outofstock` or `onbackorder`. Custom metadata is written to the module's own variation-meta table rather than to post meta.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                                    | Purpose                                          | Permission              | Required args                              |
| ------ | --------------------------------------- | ------------------------------------------------ | ----------------------- | ------------------------------------------ |
| GET    | `/variations/{id}/meta`                 | Read a variation's extra metadata.               | Open read, 120 a minute | `id`                                       |
| PATCH  | `/variations/{id}/meta`                 | Write a variation's extra metadata.              | `edit_products`         | `id`, `fields`                             |
| POST   | `/variations/bulk-update`               | Apply the allowed fields across many variations. | `edit_products`         | `updates`                                  |
| GET    | `/variations/swatches/{attribute_slug}` | List the swatches on an attribute.               | Open read, 120 a minute | `attribute_slug`                           |
| POST   | `/variations/swatches`                  | Create a swatch.                                 | `manage_woocommerce`    | `attribute_slug`, `term_id`, `swatch_type` |
| PATCH  | `/variations/swatches/{id}`             | Update a swatch.                                 | `manage_woocommerce`    | `id`                                       |
| DELETE | `/variations/swatches/{id}`             | Delete a swatch.                                 | `manage_woocommerce`    | `id`                                       |

The two write routes on variation data require `edit_products` rather than `manage_woocommerce`, so a shop manager or editor who may edit products can use them.

## WooCommerce integration

| Hook                                                    | What the module does                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `woocommerce_dropdown_variation_attribute_options_html` | Replaces the attribute dropdown with swatches when that attribute has any.               |
| `woocommerce_after_variations_form`                     | Prints the price, stock and description block, filled in by the `found_variation` event. |
| `wp_enqueue_scripts`                                    | Enqueues the swatch stylesheet and script, on product pages only.                        |
| `admin_init`                                            | Attaches swatch fields to every product attribute taxonomy's term forms.                 |
| `created_pa_*` / `edited_pa_*`                          | Saves the swatch fields with the term.                                                   |
| `woocommerce_product_options_general_product_data`      | Draws the bulk-update control on the product edit screen.                                |
| `admin_enqueue_scripts`                                 | Enqueues that control's assets.                                                          |

An attribute with no swatches is left alone — the filter returns WooCommerce's own markup unchanged.

## Database schema

| Table                              | Holds                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_variation_swatches` | One row per attribute term: type, colour, image URL, button label, tooltip, sort order. Unique on attribute slug plus term id. |
| `{prefix}aiowc_variation_meta`     | Extra per-variation metadata as key and value, unique on variation id plus key.                                                |

## Background jobs

None. The module has no scheduled work, and `onDisable()` only records the event.

## Entitlement limits

`variations-enhanced` is an on/off grant with no numeric cap. There is no limit on the number of swatches, variations or bulk updates.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive. Otherwise it reports that it is functioning normally.

## Known gaps

- The variation details block is filled by an inline script bound to WooCommerce's `found_variation` jQuery event, so it depends on the default variations form; a theme that replaces that form will not populate it.
- `swatch_size` is passed to the renderer as a class name; the module ships one stylesheet and does not otherwise validate the value.
