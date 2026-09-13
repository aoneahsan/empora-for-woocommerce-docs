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

`POST /shipping/import-rates` takes a CSV body and **adds and updates** the bands for one table rate. It deletes nothing unless `replace_existing` is sent true.

**A header row is detected from its own contents, not assumed.** A row counts as a header when at least one cell names a known column *and* no cell is numeric — the second condition is what protects a real band, since `min`, `max` and `cost` always hold numbers. When a header is present, columns are mapped **by name**, so reordering them is safe and an unrecognised column is ignored without shifting the others. Common aliases are accepted (`min_value`, `per_item_cost`, `country_code`, `zip`), so the module's own column names round-trip.

With no header, columns are read by position in this order:

```text
min, max, cost, per_item, country, state, postcode, label
```

An empty cell becomes an empty value rather than a zero, except `cost` and `per_item`, which fall back to `0`. Blank lines are skipped. A header carrying no cost column is refused rather than importing zeroes.

**Valid rows import; invalid rows are reported and skipped**, each error naming its line in the file, and counted in `skipped_count`. The response also carries `updated_count`, `header_detected` and `replaced`.

🔴 **`replace_existing: true` deletes every existing band on that rate first.** That is how the admin editor saves a whole card, and it is available to the import, but it is no longer what an import does by omission. One safety rule applies to it: **a replace over a file containing any invalid row writes nothing at all**, because applying the readable half would delete the bands the damaged half was meant to carry.

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

- There is no export, so a rate card that was imported cannot be downloaded back out.
- A `replace_existing` import still has no confirmation step and no undo. It is opt-in rather than the default, which is the safeguard; there is no second one.

## Changed on 2026-09-13

Three CSV-import behaviours this page previously recorded are fixed. All three could corrupt or destroy a
merchant's rate card without reporting anything:

- **The first row is no longer skipped unconditionally.** A header is detected from its contents, so a file starting with real data keeps that row instead of silently losing it.
- **Columns are mapped by name when a header is present**, so a reordered file no longer imports each value into the wrong field while passing validation.
- 🔴 **An import no longer replaces every band by default.** It adds and updates; deleting the card requires `replace_existing: true` explicitly. Importing a partial CSV used to discard every band it did not contain.
- A bad row no longer rejects the whole file: valid rows import and each invalid row is reported with its line number.
