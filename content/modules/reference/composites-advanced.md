---
id: composites-advanced
title: "Composite Products (Advanced)"
description: "Build a product from chosen parts: components with quantity limits, allowed products and dependencies, priced through to the order line."
keywords:
  - woocommerce composite products
  - configurable products
  - product builder
  - component pricing
format: md
---
## Overview

The Composites module builds a product out of chosen parts. A composite defines components — each with a name, a required flag, a minimum and maximum quantity, a list of allowed products and an optional dependency on another component — and the shopper picks a product for each. The pick set is priced, carried into the cart and stored on the order line.

It is for configurable goods: a bike built from a frame, wheels and a saddle, a hamper assembled from a fixed list, a machine with required and optional parts.

## Availability

| Item            | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `composites-advanced`                                            |
| Tier            | Premium                                                          |
| Entitlement key | `composites-advanced`                                            |
| Admin tab       | `composite`, under **Product Experience**                        |
| Enabled option  | `aiowc_module_enabled_composites-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                       |

`registerHooks()` re-checks the entitlement and returns immediately when it is absent, and `onEnable()` does the same before creating tables. Uninstalling drops the three tables and deletes the settings row.

## Settings

Stored in the bundled option row `aiowc_cp_settings`.

| Stored key            | Default | Meaning                                  |
| --------------------- | ------- | ---------------------------------------- |
| `enable_composites`   | `true`  | Stored flag for the composite builder.   |
| `allow_save_configs`  | `true`  | Stored flag for saving a configuration.  |
| `allow_share_configs` | `true`  | Stored flag for sharing a configuration. |

All three are read and written through the shared settings helper, but no code path currently reads them: the builder renders, and the save and share routes answer, regardless of their values. There is also no settings REST route for this module, so the values can only be changed in the database.

## Pricing modes

A composite carries a `pricing_mode`, a `base_price` and a `discount_percent`.

| Mode                | Total                                                         |
| ------------------- | ------------------------------------------------------------- |
| `fixed`             | `base_price`, ignoring what was picked.                       |
| `sum`               | The sum of each pick's unit price multiplied by its quantity. |
| `sum_with_discount` | That sum, less `discount_percent` of it.                      |

Anything other than `fixed` is treated as a sum; the discount is applied only for `sum_with_discount` and only when the percentage is above zero.

## Admin screens

### Plugin admin tab

The **Composites** tab lists composites with their pricing mode, base price, discount and status, and offers a delete action and a link to edit the underlying product. It has no create form — the empty state directs the user to create a product and add components.

### Product edit screen

The module adds a **Composite** tab to the WooCommerce product data panel. It renders a "Composite product?" checkbox and, once the product is marked, a read-only table of its components (name, required, min/max, allowed products, depends-on).

The checkbox is rendered but not saved: the module registers no `woocommerce_process_product_meta` handler, so ticking it and saving the product leaves `_aiowc_is_composite` unchanged. Since the storefront builder only renders when that meta is `yes`, the builder cannot currently be switched on from this screen.

## REST API endpoints

All routes are on `aiowc/v1`.

| Method | Path                            | Purpose                                                                                                                     | Required args                | Permission              |
| ------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------- |
| GET    | `/composites`                   | List composites.                                                                                                            | –                            | Manage                  |
| POST   | `/composites`                   | Create a composite; accepts `product_id`, `base_price`, `discount_percent`, `allow_save_config`, `is_active`, `components`. | `name`, `pricing_mode`       | Manage                  |
| GET    | `/composites/{id}`              | Read a composite with its components.                                                                                       | `id`                         | Open read, rate limited |
| PATCH  | `/composites/{id}`              | Update a composite and its components.                                                                                      | –                            | Manage                  |
| DELETE | `/composites/{id}`              | Delete a composite.                                                                                                         | `id`                         | Manage                  |
| POST   | `/composites/{id}/configure`    | Validate a pick set and price it, without saving.                                                                           | `id`, `selections`           | Public write            |
| POST   | `/configurations/save`          | Save a pick set for the current user or guest session; accepts `name`.                                                      | `composite_id`, `selections` | Public write            |
| GET    | `/configurations/{share_token}` | Load a saved configuration by its share token.                                                                              | `share_token`                | Open read, rate limited |

Open reads are limited to 120 requests a minute per caller; public writes to 30 a minute and they require a REST nonce. A saved configuration is keyed by a unique share token, and belongs to a user id or a WooCommerce session id.

`configure` and `configurations/save` accept an optional `price` on each pick and use it in the total they return and store. The total those routes report is therefore a client-influenced preview, not an authoritative price.

## WooCommerce integration

| Hook                                          | Priority | What the module does                                                                                             |
| --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `woocommerce_single_product_summary`          | 28       | Renders the component builder, only when the product's `_aiowc_is_composite` meta is `yes`.                      |
| `woocommerce_add_cart_item_data`              | 10       | Reads the posted composite id and picks, and stores the picks plus a snapshot of the composite on the cart item. |
| `woocommerce_get_cart_item_from_session`      | 10       | Restores that data when the cart is rebuilt from the session.                                                    |
| `woocommerce_before_calculate_totals`         | 30       | Recalculates the line price from the stored snapshot and picks, and sets it on the cart item.                    |
| `woocommerce_get_item_data`                   | 10       | Shows the chosen components under the cart and checkout line.                                                    |
| `woocommerce_checkout_create_order_line_item` | 10       | Persists the configuration onto the order line item.                                                             |
| `woocommerce_product_data_tabs`               | 10       | Adds the Composite tab to the product data panel.                                                                |
| `woocommerce_product_data_panels`             | 10       | Renders that panel.                                                                                              |

The cart path reads only `product_id` and `qty` from the posted picks and re-resolves every price from the product, so a forged add-to-cart form cannot set a price. It also registers no `woocommerce_add_to_cart_validation` callback, so a pick that breaks a component's rules is dropped silently rather than refused with a notice.

### Shortcode

| Shortcode                    | Renders                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `[aiowc_composite id="123"]` | The builder form for one composite. Renders nothing without a valid `id`. |

## Database schema

| Table                                | Holds                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_composites`           | Composite definitions: name, linked product, pricing mode, base price, discount, active flag.                               |
| `{prefix}aiowc_composite_components` | Components: required flag, min and max quantity, sort order, allowed product ids, optional dependency on another component. |
| `{prefix}aiowc_configurations`       | Saved pick sets with their user or session, share token, selections, name and total.                                        |

## Background jobs

The module registers none.

## Entitlement limits

`composites-advanced` is an on/off grant, checked when the module is enabled, again in `registerHooks()` and again in `onEnable()`. There is no licence-side cap on composites, components or saved configurations. The only per-composite limits are the component `min_quantity` and `max_quantity` values.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
