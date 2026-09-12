---
id: payments-hub
title: "Payments Hub"
description: "A buy-now-pay-later gateway that splits an order into scheduled instalments, with eligibility rules, promotional messaging and a per-plan event log."
keywords:
  - woocommerce bnpl
  - buy now pay later
  - installment payments
  - payment plans
format: md
---
## Overview

Payments Hub adds a **buy-now-pay-later** payment gateway to WooCommerce. At checkout an eligible customer can split an order into instalments — four by default, fortnightly — and the module creates a plan, schedules the instalments and tracks them to completion or default.

Around the gateway sit the parts a BNPL offer needs: **eligibility rules** deciding who is offered it, **promotional messaging** shown on the product page and in the cart so the option is visible before checkout, and a log of every event against a plan.

🔴 **Read the *Taking payment* section below before enabling this on a live store.** The plan scheduling is complete; the charging of instalments after the first is not, and the module ships with test mode on.

## Availability

| Item            | Value                                                          |
| --------------- | ---------------------------------------------------------------- |
| Module key      | `payments_hub`                                                  |
| Tier            | Premium                                                         |
| Entitlement key | `payments_hub`                                                  |
| Admin tab       | `payments-hub`                                                  |
| Enabled option  | `aiowc_module_enabled_payments_hub` (off until turned on)       |
| REST namespace  | `aiowc/v1`                                                      |
| Gateway         | Registered through `woocommerce_payment_gateways`               |

`registerHooks()` registers the REST routes and the gateway, then **returns early if the module is not enabled** — so the gateway is registered with WooCommerce even when the module is off, and the frontend handlers and jobs are not.

## Settings

Settings are read and written through `GET`/`PUT /payments-hub/settings`. The one that matters most is **`testMode`, which defaults to `true`**.

Gateway credentials are held separately, through `/payments-hub/credentials`, with a status route that reports whether they are present without returning them.

## The plan

| Field                   | Meaning                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `plan_id`               | The plan's identifier.                                                  |
| `total_amount`          | The order total being spread.                                           |
| `installment_amount`    | What each instalment costs.                                             |
| `installments_count`    | How many there are. **Four by default.**                                |
| `installments_paid`     | How many have been recorded as paid.                                    |
| `payment_frequency`     | `weekly`, `biweekly` or `monthly`. Fortnightly by default.              |
| `status`                | `active`, `completed`, `cancelled` or `defaulted`.                      |
| `next_payment_date`     | When the next instalment is due.                                        |

Each instalment is its own row with a due date, a paid date, a status of `pending`, `paid`, `failed` or `refunded`, a retry count, the last error and the gateway's transaction id.

## Eligibility

Eligibility rules decide which customers and which carts are offered instalments — a minimum order value, for example. `POST /payments-hub/eligibility/test` evaluates a hypothetical case against the current rules, so a store can confirm the offer appears where it intends before a customer meets it.

## Taking payment

This is the part to understand before going live.

**Creating the plan works.** At checkout the gateway builds the plan, schedules every instalment and records it.

**Charging an instalment has three paths**, and the default one does not take money:

1. **Test mode — the default.** `testMode` ships as `true`, and in test mode every charge returns success immediately with a generated `test_…` identifier. Nothing is sent to a gateway.
2. **A filter handles it.** `aiowc_bnpl_process_gateway_payment` is the real integration point. A store that implements this filter can charge the stored token through its own gateway and return the result, and that result is used.
3. 🔴 **No filter, test mode off — the fallback.** The module checks that the order's gateway exists and supports tokenization, then **adds an order note, generates a synthetic transaction id, fires `aiowc_bnpl_installment_charged`, and returns success.** It does **not** call the gateway. The instalment is marked `paid`, the count advances, and the plan eventually completes — **with no money taken after the first payment.**

The source is candid about this: the charge path is commented as simulated.

**What the module does do correctly around that gap** is worth stating, because it means the missing piece is genuinely the charge call and not the surrounding design. The stored payment token is looked up from order meta, resolved through `WC_Payment_Tokens`, and **checked to belong to the order's own customer** before use — so the token handling is sound. The gateway is checked for tokenization support. The plumbing is there; the call that moves money is not.

**Before enabling this on a live store**, implement `aiowc_bnpl_process_gateway_payment` against your gateway, or do not present instalments as a payment option.

## Admin screen

The **Payments Hub** tab shows an overview and the transactions, opens one plan with its instalments, manages credentials and settings, edits and tests the eligibility rules, configures promotional messaging, lists the available gateways, reads the event log, and runs a test transaction.

## REST API endpoints

All routes are on `aiowc/v1`, answer with the `{ success, data, message }` envelope, and require `manage_woocommerce`.

| Method       | Path                                   | Purpose                                              |
| ------------ | -------------------------------------- | ------------------------------------------------------ |
| GET          | `/payments-hub/overview`               | Plan counts and totals.                               |
| GET          | `/payments-hub/transactions`           | Every plan.                                           |
| GET          | `/payments-hub/transactions/{id}`      | One plan with its instalments.                        |
| GET / PUT    | `/payments-hub/settings`               | Read and write the settings.                          |
| POST / DELETE| `/payments-hub/credentials`            | Store and remove gateway credentials.                 |
| GET          | `/payments-hub/credentials/status`     | Whether credentials are present.                      |
| GET / PUT    | `/payments-hub/eligibility/rules`      | Read and write the eligibility rules.                 |
| POST         | `/payments-hub/eligibility/test`       | Evaluate a hypothetical customer against them.        |
| GET / PUT    | `/payments-hub/promo/settings`         | The promotional messaging shown on the storefront.    |
| GET          | `/payments-hub/gateways`               | The gateways available to charge against.             |
| GET          | `/payments-hub/logs`                   | The plan event log.                                   |
| GET          | `/payments-hub/diagnostics`            | The module's own health detail.                       |
| POST         | `/payments-hub/test-transaction`       | Create a test plan.                                   |

The credentials status route deliberately reports presence rather than returning the values.

## WooCommerce integration

| Hook                                         | What the module does                                              |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `woocommerce_payment_gateways`               | Registers the BNPL gateway.                                        |
| `woocommerce_update_options_payment_gateways_*` | Saves the gateway's settings.                                   |
| `woocommerce_review_order_before_payment`    | Shows the instalment options at checkout.                          |
| `woocommerce_review_order_before_order_total` / `woocommerce_cart_totals_before_order_total` | Shows the instalment breakdown in the totals. |
| `wp_ajax_aiowc_bnpl_calculate_plan` and its `nopriv` counterpart | Recalculates a plan as the customer changes the options. |
| `wp_enqueue_scripts`                         | Loads the plan-calculator assets.                                  |

The `nopriv` AJAX handler is present because a guest at checkout must be able to see their instalment plan.

## Database schema

| Table                              | Holds                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_bnpl_transactions`  | The plans: order and customer, plan id, total and instalment amounts, count and paid count, frequency, status, currency, next payment date. |
| `{prefix}aiowc_bnpl_installments`  | Each instalment: number, amount, due and paid dates, status, retry count, last error, gateway transaction id. |
| `{prefix}aiowc_bnpl_logs`          | Events against a plan: type, message and context.                                            |

## Background jobs

| Hook                                     | Work                                                            |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `aiowc_bnpl_process_due_installments`    | Finds instalments that are due and schedules each for processing. |
| `aiowc_bnpl_process_installment`         | Processes one instalment.                                        |
| Overdue payment job                      | Handles instalments that were not paid, up to default.           |

They run on Action Scheduler, and the batch job scheduling one action per instalment is the right shape — a slow or failing charge cannot hold up the rest.

## Action hooks for integrators

| Hook                                     | Purpose                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `aiowc_bnpl_process_gateway_payment`     | 🔴 **Filter — the integration point that actually charges an instalment.** Return a result array to take payment; return `null` and the module falls through to the no-op path described above. |
| `aiowc_bnpl_installment_charged`         | An instalment was recorded as charged.                                     |
| `aiowc_bnpl_plan_defaulted`              | A plan defaulted.                                                          |

## Entitlement limits

`payments_hub` is an on/off grant with no cap on plans or instalments. The instalment count and frequency are store settings.

## Health check

The module's diagnostics route reports its configuration state, including whether credentials are present.

## Known gaps

- 🔴 **Instalments after the first are not actually charged out of the box.** With `testMode` on — the default — every charge is a simulated success. With test mode off and no `aiowc_bnpl_process_gateway_payment` filter implemented, the module writes an order note, invents a transaction id and marks the instalment paid **without calling the gateway**. A store must implement that filter before offering instalments for real money.
- The module offers instalments but does not perform a credit assessment; eligibility is the store's own rules on order value and customer, not an affordability check. That has regulatory implications for consumer credit in many jurisdictions, and they are the store's to resolve.
- The gateway is registered with WooCommerce before the enabled check, so it can appear in WooCommerce's payment settings list while the module itself is off.
- The overdue path marks a plan `defaulted`; nothing collects the outstanding balance or reverses the order.
