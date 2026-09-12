---
id: table-rate-shipping
title: "Table Rate Shipping"
description: "A shipping method whose cost is looked up in bands of price, weight or quantity, narrowed by destination, with CSV import of a carrier rate card."
keywords:
  - woocommerce table rate shipping
  - shipping rate table
  - weight based shipping
  - csv shipping rates
format: md
---
## Overview

Table Rate Shipping adds a WooCommerce shipping method whose cost is looked up in a table of bands. A table rate names the property being measured — price, weight or quantity — and holds rows saying what to charge between a minimum and a maximum value, optionally narrowed to a country, state or postcode.

Each row can carry both a fixed cost and a per-item cost, so a band can charge a base plus an amount for every item in it. A handling fee is added on top of whatever the table produced.

Rows are typed in or imported from CSV, which is how a carrier's published rate card usually arrives.

It is for stores whose postage is a published table rather than a rule.

## Availability

| Item            | Value                                                             |
| --------------- | ------------------------------------------------------------------- |
| Module key      | `table-rate-shipping`                                              |
| Tier            | Premium                                                            |
| Entitlement key | `table-rate-shipping`                                              |
| Admin tab       | `table-rate-shipping`                                              |
| Enabled option  | `aiowc_module_enabled_table-rate-shipping` (off until turned on)   |
| REST namespace  | `aiowc/v1`                                                         |
| Shipping method | Registered through `woocommerce_shipping_methods`                  |

Enabling the module creates the two tables below and seeds the defaults. `registerHooks()` returns early when the licence does not grant `table-rate-shipping`.

## Settings

Stored in the bundled option row `aiowc_tr_settings`.

| Stored key      | Default | Meaning                                                    |
| --------------- | ------- | ------------------------------------------------------------ |
| `enable_method` | `true`  | Whether the shipping method is registered with WooCommerce. |

With `enable_method` off the method is not registered at all, so it disappears from every zone; the REST routes still answer, which keeps the admin screen usable. Everything else about a rate — its bands, its scope, its fees — is table data rather than a setting.

## Table rates

A table rate is the method's configuration for one zone:

| Field                | Meaning                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| `name`               | What the customer sees at checkout.                                           |
| `zone_id`            | The WooCommerce shipping zone it belongs to. Empty means every zone.          |
| `calculation_method` | What the bands measure: `price`, `weight` or `quantity`. Defaults to `price`. |
| `priority`           | Which rate wins when more than one applies.                                   |
| `handling_fee`       | Added to whatever the matching band produced.                                 |
| `is_active`          | Whether the rate is offered.                                                  |

## Bands

Each band row belongs to one table rate:

| Field                       | Meaning                                                                 |
| --------------------------- | ------------------------------------------------------------------------- |
| `min_value` / `max_value`   | The range of price, weight or quantity this row covers.                  |
| `cost`                      | The fixed amount charged when the row matches.                           |
| `per_item_cost`             | An additional amount for each item.                                      |
| `country_code`, `state_code`, `postcode` | Narrow the row to a destination. Empty matches anywhere.    |
| `label`                     | An optional label for the row.                                           |
| `sort_order`                | The order rows are considered in.                                        |

## CSV import

`POST /shipping/import-rates` takes a CSV body and replaces the bands for one table rate.

The **first row is always skipped**, whatever it contains — the importer treats it as a header without checking it, so a file whose first line is real data loses that line. Columns are read **by position**, not by name, in this order:

```text
min, max, cost, per_item, country, state, postcode, label
```

An empty cell becomes an empty value rather than a zero, except `cost` and `per_item`, which fall back to `0`. Blank lines are skipped. The import is validated before anything is written: if any row fails validation the whole import is rejected, reporting `imported_count: 0` and one error per bad row with its line number.

🔴 **A successful import replaces every band on that table rate.** The write deletes all existing rows for the rate first and then inserts the file's rows, so importing a partial CSV discards the bands it does not contain. Import the complete card, not a correction to it.

## Admin screen

The **Table Rate Shipping** tab lists the table rates, creates and edits them, clones one, and imports a CSV of bands into a chosen rate. A test tool posts a sample cart to `/shipping/test-rate` and shows which band matched and what it would charge.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require `manage_woocommerce`.

| Method            | Path                              | Purpose                                          | Required args |
| ----------------- | --------------------------------- | -------------------------------------------------- | ------------- |
| GET               | `/shipping/table-rates`           | Every table rate.                                 | –             |
| POST              | `/shipping/table-rates`           | Create a table rate.                              | `name`        |
| PATCH / PUT /POST | `/shipping/table-rates/{id}`      | Update a table rate. All three verbs registered.  | `id`          |
| DELETE            | `/shipping/table-rates/{id}`      | Delete a table rate and its bands.                | `id`          |
| POST              | `/shipping/table-rates/{id}/clone`| Copy a table rate, with its bands.                | `id`          |
| POST              | `/shipping/import-rates`          | Import a CSV of bands into a table rate.          | –             |
| POST              | `/shipping/test-rate`             | Price a sample cart against the tables.           | –             |

These share the `/shipping/` prefix with [Conditional Shipping Rules](/modules/reference/shipping-rules), but the two modules use different sub-paths — `/shipping/table-rates` and `/shipping/rules` — so neither shadows the other.

## WooCommerce integration

| Hook                                       | What the module does                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `woocommerce_shipping_init`                | Loads the shipping method class.                               |
| `woocommerce_shipping_methods`             | Registers the method so it can be added to a zone.             |
| `woocommerce_update_options_shipping_*`    | Saves the method's instance settings.                          |

## Database schema

| Table                             | Holds                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `{prefix}aiowc_table_rates`       | The rate itself: name, zone, what the bands measure, priority, handling fee, active flag.             |
| `{prefix}aiowc_rate_conditions`   | The bands: min and max value, cost, per-item cost, destination narrowing, label, sort order.          |

## Background jobs

This module schedules no background jobs. Rates are read at checkout and written by an administrator; nothing needs to run on a timer.

## Action hooks for integrators

| Hook                | Fired when                           |
| ------------------- | -------------------------------------- |
| `aiowc_track_event` | The module is enabled or disabled.   |

## Entitlement limits

`table-rate-shipping` is an on/off grant with no cap on the number of table rates or bands.

## Health check

The module reports a warning when its tables are missing or WooCommerce is inactive, and otherwise reports that it is functioning normally. A disabled module reports that it is disabled.

## Known gaps

- **The CSV header row is skipped unconditionally**, so a file that starts with data rather than a header silently loses its first row. There is no header validation and no warning.
- CSV columns are matched by position, so a file whose columns are in a different order imports wrong values without complaint, provided each one passes validation for the field it landed in.
- An import replaces every band on the rate rather than merging, and there is no confirmation step and no undo.
- There is no export, so a rate card that was imported cannot be downloaded back out.
