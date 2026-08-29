---
id: barcode
title: "Barcode & SKU Management"
description: "Store a barcode against every product and variation, generate missing codes in the background, and look a product up from a scanned code."
keywords:
  - woocommerce barcode
  - sku management
  - barcode lookup
  - product labels
format: md
---
## Overview

The Barcode module gives each product and variation a stored barcode value, generates missing ones in the background, looks a product up from a scanned code, and builds a label payload for printing.

It is for stores that pick and pack their own stock and want a code they can scan back to a product. The module stores and resolves barcode _values_; drawing the bars and printing the sheet is left to the client that consumes the print payload.

## Availability

| Item            | Value                                                |
| --------------- | ---------------------------------------------------- |
| Module key      | `barcode`                                            |
| Tier            | Premium                                              |
| Entitlement key | `barcode`                                            |
| Admin tab       | `barcode`, under **Operations**                      |
| Enabled option  | `aiowc_module_enabled_barcode` (off until turned on) |
| REST namespace  | `aiowc/v1`                                           |

Enabling the module creates its table, seeds the defaults and schedules the generate-missing job; disabling it unschedules the job.

## Supported symbologies

| Value     | Symbology                                                                                     |
| --------- | --------------------------------------------------------------------------------------------- |
| `code128` | Code 128. Generated as a prefix, a numeric seed and a random alphanumeric suffix.             |
| `ean13`   | EAN-13, built with a pseudo-random 200–299 prefix (the internal-use range) and a check digit. |
| `upc-a`   | UPC-A, built from the seed with a check digit.                                                |
| `code39`  | Code 39, seed plus a random alphanumeric suffix.                                              |

Generated EAN-13 and UPC-A values are internal codes: they are well formed and carry a valid check digit, but they are not registered with GS1 and are not usable as retail identifiers outside the store.

Generation is idempotent. If the product or variation already has a row, its existing value is returned unchanged. A newly built value that collides with an existing row is rebuilt, up to five attempts.

## Settings

Stored in the bundled option row `aiowc_bc_settings`; legacy per-key options `aiowc_bc_<key>` are migrated on first read.

| Stored key           | Default   | Meaning                                                                                   |
| -------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `enable_barcodes`    | `true`    | Read and written by the settings routes and shown in the admin form.                      |
| `barcode_type`       | `code128` | Symbology used when a barcode is generated from the product page, in bulk, or by the job. |
| `auto_generate`      | `true`    | Whether the background job fills in missing barcodes.                                     |
| `include_variations` | `true`    | Whether the job also generates codes for the variations of a variable product.            |

`enable_barcodes` is stored and returned, but no code path reads it: the product field, the REST routes and the job all run regardless of its value. Turning it off currently disables nothing.

## Admin screen

The **Barcode** tab carries three cards:

- **Settings** — a form over the four settings above, validated in the browser and saved through the settings route.
- **Generate for a product** — generates and stores a barcode for a product or variation.
- **Look up a code** — resolves a code back to its product.

## Product edit screen

On the WooCommerce product data panel, the module adds a barcode type select and a barcode value input to the **Inventory** tab, with a Generate button beside the field. The value is limited to 64 characters, and the save path verifies its own nonce.

| Hook                                                 | What the module does                       |
| ---------------------------------------------------- | ------------------------------------------ |
| `woocommerce_product_options_inventory_product_data` | Renders the barcode type and value fields. |
| `woocommerce_process_product_meta`                   | Saves the submitted barcode.               |

## REST API endpoints

All routes are on `aiowc/v1` and require `manage_woocommerce`, plus a REST nonce on cookie-authenticated requests. The module has no public route: a scan is an authenticated staff action, not a shopper one.

| Method             | Path                 | Purpose                                                                                         | Required args |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| POST               | `/barcodes/generate` | Generate and store a barcode; accepts `variation_id` and `type`.                                | `product_id`  |
| GET                | `/barcodes/lookup`   | Find a barcode by `sku` or by `value`.                                                          | –             |
| POST               | `/barcodes/scan`     | Resolve a scanned code to its product, variation, SKU, name and stock state.                    | `value`       |
| POST               | `/barcodes/print`    | Build a label payload; `layout` is one of `4x6`, `2x1`, `3x2`, `a4-sheet`, defaulting to `4x6`. | `ids`         |
| GET                | `/barcodes/settings` | Read the settings above.                                                                        | –             |
| PUT / PATCH / POST | `/barcodes/settings` | Update the settings above.                                                                      | –             |

`POST /barcodes/print` returns the chosen layout and, for each requested id, the barcode value, its type, the product name and the SKU. It returns no image and no PDF.

## Database schema

| Table                    | Holds                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| `{prefix}aiowc_barcodes` | One row per product or variation: the barcode value, its type and the owning ids. |

## Background jobs

| Hook                              | Schedule | Work                                                                                                                                                                                                                               |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_barcodes_generate_missing` | Daily    | Returns immediately when `auto_generate` is off. Otherwise generates codes for up to 200 products without one, and — when `include_variations` is on — up to 200 variations per variable product. Failures are logged, not raised. |

## Entitlement limits

`barcode` is an on/off grant with no per-code quota. The only bound is the job's batch size of 200 per run.

## Health check

The module reports a warning when its table is missing or WooCommerce is inactive, and otherwise reports that it is functioning normally.
