---
id: sms-advanced
title: "SMS Marketing & Notifications"
description: "Send SMS through your own Twilio account: an opt-in subscriber list, campaigns you send or schedule, and automatic order-status messages."
keywords:
  - woocommerce sms
  - twilio integration
  - sms campaigns
  - order notifications
format: md
---
## Overview

The SMS module sends text messages from the shop through Twilio. It covers three things: a subscriber list built from checkout opt-ins and inbound keywords, marketing campaigns that can be sent immediately or scheduled, and automatic order-status messages to customers who have opted in.

It is for stores that already have a Twilio account. The module holds no credentials of its own and sends nothing until an Account SID, auth token and sending number are entered.

Inbound messages are handled as well: a customer texting a registered keyword to the sending number can opt in, opt out, or be answered with a coupon code or a fixed reply.

## Availability

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Module key      | `sms-advanced`                                            |
| Tier            | Premium                                                   |
| Entitlement key | `sms-advanced`                                            |
| Admin tab       | `sms`, under **Marketing & Email**                        |
| Enabled option  | `aiowc_module_enabled_sms-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the four tables below, seeds the defaults and schedules both background jobs. Disabling it unschedules them. Uninstalling drops the tables and deletes the settings row.

Every hook and every REST route is behind the entitlement: `registerHooks()` returns immediately when the licence does not grant `sms-advanced`, so on a store without it the routes are not registered at all.

## Settings

Stored in the bundled option row `aiowc_sms_settings`, written with autoload off; legacy per-key options `aiowc_sms_<key>` are migrated on first read.

| Stored key           | Default | Meaning                                                                                    |
| -------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `enable_sms`         | `true`  | Master switch for sending.                                                                 |
| `twilio_account_sid` | `''`    | Twilio Account SID.                                                                        |
| `twilio_auth_token`  | `''`    | Twilio auth token. Write-only over REST — an empty value keeps the stored one.             |
| `from_number`        | `''`    | The sending number, in E.164 form.                                                         |
| `opt_in_required`    | `true`  | Only message numbers that subscribed through the store or a keyword.                       |
| `message_retention`  | `180`   | Days of message history kept before the cleanup job deletes it. Clamped to 1–3650 on save. |

With any of the SID, token or from-number missing, `SMSGatewayService::send()` refuses with `no_credentials` and the health check reports a warning.

## Admin screen

The **SMS** tab is a single screen with no sub-tabs:

- **Connection** — connected or not, the provider, the sending number, and a note when sending is switched off.
- **Account balance** — the balance Twilio reports, or the reason it could not be read.
- **Provider configuration** — a form over the six settings above, validated in the browser before it is submitted.
- **Send test SMS** — a dialogue that sends one message to a number you type, to confirm the credentials work.

The screen calls four routes: `GET /sms/status`, `GET /sms/settings`, `PUT /sms/settings` and `POST /sms/send-test`. Campaigns, keywords, subscribers and analytics have no screen — see [Known gaps](#known-gaps).

## Keyword actions

A keyword row carries an action, and the inbound handler matches the first keyword found in the message body, case-insensitively:

| Action            | Effect                                        |
| ----------------- | --------------------------------------------- |
| `opt_in`          | Subscribes the sending number.                |
| `opt_out`         | Opts the sending number out.                  |
| `coupon`          | Replies with the keyword's coupon code.       |
| `info` / `custom` | Replies with the keyword's response template. |

## REST API endpoints

All routes are on `aiowc/v1`. Unless stated otherwise they require `manage_woocommerce` — plus a REST nonce on cookie-authenticated requests — and answer with the `{ success, data, message }` envelope.

| Method             | Path                           | Purpose                                                                        | Required args         |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------ | --------------------- |
| GET                | `/sms/settings`                | Read the settings above.                                                       | –                     |
| PUT / PATCH / POST | `/sms/settings`                | Update the settings above; only the fields sent are written.                   | –                     |
| GET                | `/sms/status`                  | Connection state, sending number and Twilio balance.                           | –                     |
| POST               | `/sms/send-test`               | Send one message immediately.                                                  | `phone`, `message`    |
| GET                | `/sms/campaigns`               | List campaigns.                                                                | –                     |
| POST               | `/sms/campaigns`               | Create a campaign.                                                             | –                     |
| POST               | `/sms/campaigns/{id}/send`     | Queue the campaign to its segment now.                                         | `id`                  |
| POST               | `/sms/campaigns/{id}/schedule` | Schedule the campaign for a future time.                                       | `id`, `scheduled_for` |
| GET                | `/sms/analytics`               | Message statistics over `days` (defaults to 30).                               | –                     |
| GET                | `/sms/keywords`                | List inbound keywords.                                                         | –                     |
| POST               | `/sms/keywords`                | Create a keyword.                                                              | –                     |
| DELETE             | `/sms/keywords/{id}`           | Delete a keyword.                                                              | `id`                  |
| POST               | `/sms/subscribe`               | Subscribe a number. Open to guests; REST nonce required, 30 requests a minute. | `phone`               |
| POST               | `/sms/opt-out`                 | Opt a number out. Same guard as subscribe.                                     | `phone`               |
| POST               | `/sms/webhook`                 | Twilio's inbound-message webhook. Answers TwiML, not the envelope.             | –                     |

The webhook route accepts unauthenticated requests because Twilio sends them, and authenticates each one by recomputing the `X-Twilio-Signature` HMAC with the stored auth token and comparing it in constant time. A request failing that check is refused with `403 invalid_signature`.

## WooCommerce integration

| Hook                                              | What the module does                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `woocommerce_checkout_after_terms_and_conditions` | Renders the SMS opt-in checkbox on the checkout form.                                               |
| `woocommerce_checkout_create_order`               | Subscribes the billing phone when the box was ticked, and records `_aiowc_sms_opt_in` on the order. |
| `woocommerce_order_status_changed`                | Queues a status message for the billing number when it is an active subscriber.                     |

Order messages are produced for `processing`, `completed`, `on-hold`, `cancelled` and `refunded`. Any other status produces no message. Nothing is sent inline with the request — messages are queued and drained by cron.

**Shortcode** `[aiowc_sms_subscribe]` renders a subscribe form; its POST is handled on `init`.

## Database schema

| Table                           | Holds                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `{prefix}aiowc_sms_subscribers` | One row per phone number: status, opt-in and opt-out timestamps, optional user id. |
| `{prefix}aiowc_sms_campaigns`   | Campaign text, segment, schedule, status and sent, delivered and failed counts.    |
| `{prefix}aiowc_sms_messages`    | Every queued, sent and inbound message with its Twilio SID and error text.         |
| `{prefix}aiowc_sms_keywords`    | Keyword, action, response template and optional coupon code.                       |

## Background jobs

| Hook                   | Interval                                              | Work                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiowc_sms_send_queue` | 5 minutes (`aiowc_every_5_minutes`, added by the job) | Sends up to 50 queued messages per pass and updates campaign counts.                                                                                     |
| `aiowc_sms_cleanup`    | daily                                                 | Deletes delivered messages older than `message_retention` days, and marks a sending or scheduled campaign complete once its counts show it has finished. |

## Entitlement limits

`sms-advanced` is an on/off grant. It carries no message quota of its own — Twilio's account balance and pricing are the real ceiling, which is why the admin screen reads the balance. The plan-level limits in the licence (products, orders, customers, exports) are not applied by this module.

## Health check

The module reports a warning when its tables are missing, when WooCommerce is inactive, or when any of the SID, auth token and from-number is empty. Otherwise it reports that it is functioning normally.

## Known gaps

- The admin screen covers connection, settings and a test send only. Campaigns, keywords, subscribers and the message log are reachable over REST but have no screen.
- A campaign's segment is stored as free-form JSON on the campaign row; there is no segment builder.
- Twilio is the only gateway. `SMSGatewayService` posts to Twilio's API directly and has no provider abstraction.
