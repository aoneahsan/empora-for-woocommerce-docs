---
id: whatsapp-advanced
title: "WhatsApp Cloud Messaging"
description: "Connect the store to the WhatsApp Business Cloud API: a contact list, queued messages, template sync, a signed webhook and a chat button."
keywords:
  - woocommerce whatsapp
  - whatsapp business api
  - order notifications
  - chat button
format: md
---
## Overview

The WhatsApp module connects the store to the WhatsApp Business Cloud API. It keeps a contact list, queues outbound messages and sends them on a schedule, syncs the approved message templates from the business account, receives inbound events over a signed webhook, and can put a floating "chat on WhatsApp" button on the storefront.

It is for stores that already have a WhatsApp Business account, a phone number id and a permanent access token from Meta. Nothing is sent until those are entered.

Order-status messages are sent as **templates**, not free text, because WhatsApp only allows a business to open a conversation with an approved template.

## Availability

| Item            | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| Module key      | `whatsapp-advanced`                                            |
| Tier            | Premium                                                        |
| Entitlement key | `whatsapp-advanced`                                            |
| Admin tab       | `whatsapp`, under **Marketing & Email**                        |
| Enabled option  | `aiowc_module_enabled_whatsapp-advanced` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                     |

Enabling the module creates the three tables below, seeds the defaults and schedules both jobs. `registerHooks()` returns immediately when the licence does not grant `whatsapp-advanced`, so neither the hooks nor the routes exist without it.

## Settings

Stored in the bundled option row `aiowc_wa_settings`. The three secrets are write-only over REST: sending an empty value keeps what is stored, and reads return a `*_set` boolean rather than the value.

| Stored key             | Default                                                                                  | Meaning                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `enable_whatsapp`      | `true`                                                                                   | Master switch for sending.                                                   |
| `phone_number_id`      | `''`                                                                                     | The Cloud API phone number id messages are sent from.                        |
| `access_token`         | `''`                                                                                     | Meta access token. Write-only.                                               |
| `business_account_id`  | `''`                                                                                     | WhatsApp Business Account id, used by the template sync.                     |
| `business_phone`       | `''`                                                                                     | The public number behind the chat button and the `wa.me` link.               |
| `webhook_verify_token` | `''`                                                                                     | Guards the one-time `GET` subscription handshake only. Write-only.           |
| `app_secret`           | `''`                                                                                     | Meta app secret, used to verify every inbound event's signature. Write-only. |
| `enable_chat_button`   | `true`                                                                                   | Draw the floating chat button.                                               |
| `chat_button_label`    | `''`                                                                                     | Button text; empty falls back to "Chat on WhatsApp".                         |
| `notify_order_status`  | `true`                                                                                   | Send a template when an order changes status.                                |
| `status_templates`     | `processing → order_confirmed`, `completed → order_delivered`, `shipped → order_shipped` | Which template each order status sends.                                      |

`webhook_verify_token` and `app_secret` are different credentials for different checks, and both are needed: the first is what Meta echoes back when the webhook is first subscribed, the second is what proves every later event actually came from Meta.

## Admin screen

The **WhatsApp** tab has three sub-tabs.

**Status** shows whether the module is connected (a phone number id and an access token are both present), the business account and phone, the `wa.me` chat URL, the webhook URL to register with Meta, whether the verify token and app secret are set, template counts by status, when templates were last synced, and contact counts by status.

**Templates** lists the synced templates and triggers a re-sync.

**Settings** carries the fields above.

## Messages and contacts

A contact is one phone number with a status (`pending` until it is active), an optional WhatsApp id, a name and an optional linked user.

Outbound messages are never sent inline with a page request. They are written to the message table with status `queued`, and the send job drains them in batches. Each message records its WhatsApp message id and, as the webhook reports them, its sent, delivered and read times.

Order-status messages are queued only when the billing number matches an **active** contact — a customer who has never opted in is not messaged.

## Webhook

Two routes share one path and both are open, because Meta calls them unauthenticated:

- `GET /whatsapp/webhook` answers Meta's subscription handshake by echoing the challenge when `hub_verify_token` matches `webhook_verify_token`.
- `POST /whatsapp/webhook` verifies Meta's `X-Hub-Signature-256` — an HMAC-SHA256 of the raw request body keyed by `app_secret`, compared in constant time — before the payload reaches any handler. **With no app secret configured the check fails closed** and the event is refused with `403 whatsapp_app_secret_missing`, so a store must set the secret for inbound events to work at all.

## REST API endpoints

All routes are on `aiowc/v1`. Except the two webhook routes, all require `manage_woocommerce` plus a REST nonce on cookie-authenticated requests, and answer with the `{ success, data, message }` envelope.

| Method             | Path                       | Purpose                                                                       | Required args    |
| ------------------ | -------------------------- | ----------------------------------------------------------------------------- | ---------------- |
| GET                | `/whatsapp/status`         | Connection state, webhook URL, credential flags, template and contact counts. | –                |
| GET                | `/whatsapp/settings`       | Settings, with each secret reduced to a `*_set` flag.                         | –                |
| PUT / PATCH / POST | `/whatsapp/settings`       | Update settings; empty secrets keep the stored value.                         | –                |
| POST               | `/whatsapp/send`           | Queue a plain text message to a number.                                       | `to`, `body`     |
| POST               | `/whatsapp/template/send`  | Queue a template message, with `variables` and `lang`.                        | `to`, `template` |
| GET                | `/whatsapp/templates`      | The templates held locally.                                                   | –                |
| POST               | `/whatsapp/templates/sync` | Pull templates from the business account.                                     | –                |
| GET                | `/whatsapp/webhook`        | Meta's subscription handshake. Answers the raw challenge, not the envelope.   | –                |
| POST               | `/whatsapp/webhook`        | Inbound events, authenticated by signature.                                   | –                |

## WooCommerce integration

| Hook                               | What the module does                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `woocommerce_order_status_changed` | Queues the template mapped to the new status, for active contacts only. |
| `wp_footer`                        | Draws the floating chat button linking to `wa.me/{number}`.             |

The order handler is not registered at all when `notify_order_status` is off or the status-template map is empty, and the chat button is not registered when it is switched off or no business phone is set.

**Shortcode** `[aiowc_whatsapp_button]` places the same chat link inside content.

## Database schema

| Table                              | Holds                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_whatsapp_contacts`  | One row per phone number: WhatsApp id, name, linked user, opt-in time, last message, status. Unique on the number.              |
| `{prefix}aiowc_whatsapp_messages`  | Every queued, sent and inbound message with its template, variables, WhatsApp id, error and the sent, delivered and read times. |
| `{prefix}aiowc_whatsapp_templates` | Synced templates: name (unique), language, category, body, variables, status and last sync time.                                |

## Background jobs

| Hook                            | Interval                                              | Work                                                    |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `aiowc_whatsapp_send_queue`     | 5 minutes (`aiowc_every_5_minutes`, added by the job) | Sends up to 50 queued messages per pass.                |
| `aiowc_whatsapp_sync_templates` | daily                                                 | Pulls the approved templates from the business account. |

## Entitlement limits

`whatsapp-advanced` is an on/off grant with no message quota. The real ceiling is Meta's own conversation pricing and rate limits, and its template approval process — the module can only send templates the business account already has approved.

## Known gaps

- There is no contact-management screen: contacts are created by inbound events and by the send routes, and there is no UI for opting someone in or out.
- The message log has no screen either; delivery and read times are recorded but only readable from the database.
- Template _creation_ is not supported — templates are pulled from Meta, never pushed.
