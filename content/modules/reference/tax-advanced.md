---
id: tax-advanced
title: "Advanced Tax Calculator"
description: "Per-customer tax exemptions, EU reverse charge based on a verified VAT number, and a monthly tax report aggregated from real orders."
keywords:
  - woocommerce tax
  - eu vat reverse charge
  - vat validation
  - tax report
format: md
---
## Overview

The Tax module adds three things WooCommerce does not do on its own: per-customer tax exemptions, EU reverse charge based on a verified VAT number, and a monthly tax report aggregated from real orders.

It also keeps its own table of location-based tax rules, and exposes a calculation endpoint that applies them. That rules engine is reachable over REST and is used for the calculation endpoint; it does not replace WooCommerce's own rate tables in the cart — see [Known gaps](#known-gaps).

It is for stores selling business-to-business, or across EU borders, where some customers must not be charged tax and the store needs an auditable record of why.

## Availability

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Module key      | `tax-advanced`                                            |
| Tier            | Premium                                                   |
| Entitlement key | `tax-advanced`                                            |
| Admin tab       | `tax`, under **Operations**                               |
| Enabled option  | `aiowc_module_enabled_tax-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the three tables below, seeds the defaults and schedules the report job. Disabling it unschedules the job. Uninstalling drops the tables and deletes the settings row.

`registerHooks()` returns immediately when the licence does not grant `tax-advanced`, so on a store without it neither the filters nor the routes exist.

## Settings

Stored in the bundled option row `aiowc_tx_settings`.

| Stored key          | Default | Meaning                                                                                                                            |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `enable_engine`     | `true`  | Registers the cart, checkout and My Account handlers. Off means none of them are constructed.                                      |
| `eu_reverse_charge` | `false` | Allow reverse charge for cross-border EU customers with an approved VAT certificate.                                               |
| `store_country`     | `''`    | The store's own ISO country code, used to decide "cross-border". Blank falls back to WooCommerce's base country in the admin copy. |
| `auto_exempt_roles` | `[]`    | WordPress roles that are exempt without submitting a certificate.                                                                  |
| `enable_reports`    | `true`  | Whether the monthly report job produces anything.                                                                                  |

## Admin screen

The **Tax Automation** tab has two sub-tabs.

**Settings** carries the tax engine switch, the EU reverse-charge switch, the monthly reports switch, the store country field, and a role picker for automatic exemptions. It calls `GET /tax/settings` and `PUT /tax/settings`.

**Exemption certificates** lists what customers have submitted, filtered by _Awaiting review_, _Approved_, _Rejected_ or _All_, and approves or rejects each one. Because `GET /tax/certificates` widens to every certificate for a user who can `manage_woocommerce`, the same route serves both this screen and the customer's own list.

## Exemptions

A customer is exempt when either condition holds:

1. One of their WordPress roles appears in `auto_exempt_roles`.
2. An exemption row is active for them, matched on tax class and country.

An exemption row carries a type (`permanent` by default), a scope and scope value, an optional certificate id and an optional expiry. Exemptions are created and revoked by an administrator over REST.

## Certificates and EU reverse charge

A customer submits a certificate — certificate number, country, VAT number, business name and an optional evidence URL — from the **Tax Certificates** page in My Account, or over REST. It lands with status `pending` and an administrator approves or rejects it.

Reverse charge applies only when all of the following hold, and it is checked on each calculation:

- `eu_reverse_charge` is on;
- `store_country` is set and is an EU member state;
- the customer's country is an EU member state and is not the store's country;
- the customer holds an **approved** certificate for that country with a VAT number in valid EU format.

At checkout, a **VAT Number** field is added to the billing section. A submitted value is stored on the order as `_aiowc_tx_vat_number`, and the order is additionally flagged `_aiowc_tx_reverse_charge` when the conditions above are met.

## Tax rules

A rule row carries a name, country, state and postcode, tax class, rate, label, compound and shipping flags, a priority and an active flag. `TaxCalculationService::calculateTaxForLine()` selects the active rules for a location and tax class and sums them: non-compound rules apply to the net price, compound rules apply to the net price plus the tax accumulated so far. A rule that does not apply to shipping is skipped for a shipping line. The result reports the tax, the rules applied, and whether the line was exempt and why.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method             | Path                             | Purpose                                                                                                                                                       | Permission              | Required args                                    |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------ |
| POST               | `/tax/calculate`                 | Run the rules engine over a net price, tax class and address.                                                                                                 | Open read, rate limited | –                                                |
| GET                | `/tax/rules`                     | List tax rules.                                                                                                                                               | `manage_woocommerce`    | –                                                |
| POST               | `/tax/rules`                     | Create a rule.                                                                                                                                                | `manage_woocommerce`    | `name`                                           |
| PUT / PATCH / POST | `/tax/rules/{id}`                | Update a rule.                                                                                                                                                | `manage_woocommerce`    | `id`                                             |
| DELETE             | `/tax/rules/{id}`                | Delete a rule.                                                                                                                                                | `manage_woocommerce`    | `id`                                             |
| GET                | `/tax/exemptions`                | List exemptions.                                                                                                                                              | `manage_woocommerce`    | –                                                |
| POST               | `/tax/exemptions`                | Create an exemption.                                                                                                                                          | `manage_woocommerce`    | `user_id`                                        |
| DELETE             | `/tax/exemptions/{id}`           | Revoke an exemption.                                                                                                                                          | `manage_woocommerce`    | `id`                                             |
| GET                | `/tax/certificates`              | Dual-scoped: an administrator gets every certificate with the submitter's name and email, filtered by `status`; any other signed-in user gets only their own. | Signed-in user          | –                                                |
| POST               | `/tax/certificates`              | Submit a certificate.                                                                                                                                         | Signed-in user          | `certificate_number`, `country`, `business_name` |
| POST               | `/tax/certificates/{id}/approve` | Approve a certificate.                                                                                                                                        | `manage_woocommerce`    | `id`                                             |
| POST               | `/tax/certificates/{id}/reject`  | Reject a certificate, with an optional `reason`.                                                                                                              | `manage_woocommerce`    | `id`                                             |
| GET                | `/tax/report`                    | A monthly report for `year` and `month`.                                                                                                                      | `manage_woocommerce`    | –                                                |
| GET                | `/tax/settings`                  | Read the settings above.                                                                                                                                      | `manage_woocommerce`    | –                                                |
| PUT / PATCH / POST | `/tax/settings`                  | Update the settings above.                                                                                                                                    | `manage_woocommerce`    | –                                                |

## WooCommerce integration

Registered only when `enable_engine` is on.

| Hook                                                  | What the module does                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `woocommerce_product_get_tax_class`                   | Returns an empty tax class for an exempt signed-in customer.                        |
| `woocommerce_calc_taxes`                              | Returns `false` for an exempt signed-in customer, so WooCommerce calculates no tax. |
| `woocommerce_checkout_fields`                         | Adds the **VAT Number** billing field at priority 125.                              |
| `woocommerce_checkout_create_order`                   | Stores the VAT number, and the reverse-charge flag when it applies.                 |
| `woocommerce_account_menu_items`                      | Adds **Tax Certificates** to My Account after **Orders**.                           |
| `woocommerce_account_aiowc-tax-certificates_endpoint` | Renders the certificate page; its POST is nonce-verified.                           |

The monthly report reads orders through `wc_get_orders()` and the `WC_Order` API, so it is correct under both order storage modes including HPOS. It reads a bounded number of orders per report and the result records when that bound was reached.

## Database schema

| Table                            | Holds                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_tax_rules`        | Location-based rules: country, state, postcode, tax class, rate, label, compound and shipping flags, priority. |
| `{prefix}aiowc_tax_exemptions`   | Per-user exemptions: type, scope, scope value, certificate id, expiry.                                         |
| `{prefix}aiowc_tax_certificates` | Submitted certificates: number (unique), country, VAT number, business name, evidence URL, status, expiry.     |

## Background jobs

| Hook                         | Interval                                           | Work                                                                                                                                         |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_tax_reports_generate` | `monthly` (a 30-day interval the module registers) | Aggregates last month's orders into `aiowc_tx_report_YYYY_MM` and fires `aiowc_tax_report_ready`. Does nothing when `enable_reports` is off. |

## Action hooks for integrators

| Hook                              | Fired when                                  |
| --------------------------------- | ------------------------------------------- |
| `aiowc_tax_certificate_submitted` | A customer submits a certificate.           |
| `aiowc_tax_certificate_approved`  | A certificate is approved.                  |
| `aiowc_tax_certificate_rejected`  | A certificate is rejected, with the reason. |
| `aiowc_tax_report_ready`          | A monthly report has been stored.           |

## Entitlement limits

`tax-advanced` is an on/off grant with no numeric cap. The one bound in the module is the number of orders a single monthly report will read, which the report result reports back rather than hiding.

## Known gaps

- **The rules table does not drive WooCommerce's cart totals.** `CalcHandler` only suppresses tax for exempt customers; it does not inject the module's own rates into WooCommerce's calculation, so a store still keeps its rates in WooCommerce's standard tax tables. The rules engine answers `POST /tax/calculate` and nothing else.
- There is no admin screen for the rules table. Rules can only be created, edited and deleted over REST.
- VAT numbers are checked for **format** only. Nothing validates a number against VIES or any other registry.
- Monthly reports are stored one option row per month (`aiowc_tx_report_YYYY_MM`) with no index of what exists; `GET /tax/report` is asked for a specific year and month.
