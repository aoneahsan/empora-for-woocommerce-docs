---
id: custom-fields
title: "Custom Product Fields"
description: "Structured product attributes the store owns — an ISBN, a material, a supplier code — defined once, filled in per product and variation, and searchable through the products REST query."
keywords:
  - woocommerce custom fields
  - product attributes
  - product metadata
  - searchable product fields
format: md
---
## Overview

Custom Product Fields adds structured fields to products that the store itself owns — an ISBN, a material, a warranty period, a supplier code. Unlike [Product Add-Ons](/modules/reference/addons), these are not questions asked of the customer and they do not change the price: they are attributes of the product, filled in by whoever edits it.

A field is defined once with a key, a type and its validation rules, then filled in per product from a panel on the product edit screen. Values can be displayed on the product page and made searchable through the WooCommerce products REST query.

It is for stores whose catalogue carries data WooCommerce has no field for.

## Availability

| Item            | Value                                                        |
| --------------- | -------------------------------------------------------------- |
| Module key      | `custom-fields`                                               |
| Tier            | Premium                                                       |
| Entitlement key | `custom-fields`                                               |
| Admin tab       | `custom-fields`                                               |
| Enabled option  | `aiowc_module_enabled_custom-fields` (off until turned on)    |
| REST namespace  | `aiowc/v1`                                                    |

Enabling the module creates the two tables below and seeds the defaults.

`registerHooks()` returns early when the licence does not grant `custom-fields`. The REST routes and the product edit panel always register; the two optional handlers register only when their setting is on.

## Settings

Stored in the bundled option row `aiowc_cf_settings`.

| Stored key               | Default | Meaning                                                                                |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------- |
| `allow_frontend_display` | `true`  | Whether fields marked for display are printed on the single product page.               |
| `search_custom_fields`   | `true`  | Whether fields marked searchable are included in the WooCommerce products REST query.   |

Each setting switches a whole handler on or off, so turning one off removes its hooks from the request rather than hiding output later.

## Fields

A field definition carries:

| Field                 | Meaning                                                                          |
| --------------------- | ---------------------------------------------------------------------------------- |
| `name`, `label`       | The internal name and the label shown to whoever fills it in.                     |
| `field_key`           | The stable key the value is stored and queried under.                             |
| `field_type`          | The control used. Defaults to `text`.                                             |
| `options`             | The choices, for a field type that has them.                                      |
| `validation_rules`    | The rules applied to a submitted value.                                           |
| `is_searchable`       | Whether the value participates in product search.                                 |
| `is_frontend_display` | Whether the value is shown on the product page. On by default.                    |
| `scope`               | What the field attaches to. Defaults to `product`.                                |
| `applies_to`          | Narrows the field to particular products or categories.                           |
| `sort_order`          | The order fields appear in on the edit panel.                                     |

A value is stored per product, and optionally per variation, so a variable product can carry a different value on each variation.

## Admin screen

The **Custom Fields** tab defines the fields — creating, editing, deleting and bulk-editing them. The values themselves are filled in elsewhere: the module adds its own tab and panel to the WooCommerce **product edit screen**, and saves what is entered there on `woocommerce_process_product_meta`.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method | Path                       | Purpose                                            | Permission           | Required args                     |
| ------ | -------------------------- | ---------------------------------------------------- | -------------------- | --------------------------------- |
| GET    | `/custom-fields`           | Every field definition.                             | `manage_woocommerce` | –                                 |
| POST   | `/custom-fields`           | Create a field definition.                          | `manage_woocommerce` | `name`, `key`, `label`, `field_type` |
| PATCH  | `/custom-fields/{id}`      | Update a field definition.                          | `manage_woocommerce` | `id`                              |
| DELETE | `/custom-fields/{id}`      | Delete a field definition and its values.           | `manage_woocommerce` | –                                 |
| POST   | `/custom-fields/bulk`      | Apply an action to several definitions at once.     | `manage_woocommerce` | –                                 |
| GET    | `/products/{id}/fields`    | The field values for one product.                   | Public, rate-limited | `id`                              |
| PUT    | `/products/{id}/fields`    | Write the field values for one product.             | `edit_products`      | `id`                              |

The write route requires `edit_products` rather than `manage_woocommerce`, so a shop editor who may edit products can fill in field values without being given full store management.

## WooCommerce integration

| Hook                                  | What the module does                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `woocommerce_product_data_tabs`       | Adds the custom-fields tab to the product edit screen.                      |
| `woocommerce_product_data_panels`     | Draws the fields in that tab.                                               |
| `woocommerce_process_product_meta`    | Saves the entered values when the product is saved.                         |
| `woocommerce_product_meta_end`        | Prints displayable values on the single product page.                       |
| `woocommerce_rest_product_object_query`| Extends the products REST query so searchable fields can be filtered on.    |

## Database schema

| Table                                | Holds                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_custom_fields`        | The field definitions: name, key, label, type, options, validation rules, searchable and display flags, scope, targeting, sort order. |
| `{prefix}aiowc_custom_field_values`  | The values: the field, the product, optionally the variation, and the value itself.                          |

## Background jobs

This module schedules no background jobs.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

## Entitlement limits

`custom-fields` is an on/off grant with no cap on the number of definitions or values.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- Deleting a field definition removes its stored values with it; there is no archive and no export first.
- `is_searchable` only reaches the WooCommerce **REST** product query. It does not extend the ordinary storefront search box, so a field marked searchable is not necessarily findable by a shopper typing into the site's search.
- The module offers no filter for adding a field type or a validation rule of its own.
- There is no bulk fill: values are entered product by product on the edit screen, or written one product at a time over REST.
