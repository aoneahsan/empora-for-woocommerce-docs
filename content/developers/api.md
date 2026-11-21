---
id: api
title: The Empora API
description: Every route of the Empora API with curl examples and real answers, for reading your licences, sites, plan and store connections, deactivating a site and renaming a connection.
sidebar_position: 3
keywords:
  - empora api
  - empora rest api
  - woocommerce licence api
  - empora openapi
  - deactivate licence site api
last_update:
  date: 2026-11-21
---

# The Empora API

**The Empora API reads your own licences, the sites they are activated on, your plan and your store connections,
and makes two changes: deactivating a site and renaming a connection.** Disconnecting a store can be asked for,
and then waits for your yes on Empora. It lives at:

```text
https://empora-api.aoneahsan.com/api/v1
```

Every route below answers JSON and reaches only the account the key belongs to. A row on anyone else's account
answers `404`, never `403`, so a key cannot even learn that it exists.

The machine-readable description is [`/api/v1/openapi.json`](https://empora-api.aoneahsan.com/api/v1/openapi.json)
(OpenAPI 3.1, also as [Markdown](https://empora-api.aoneahsan.com/api/v1/openapi.md)). It needs no key, and it is
built from the same list the routes are, so a route on this page that is missing there is a mistake on this page.

## Signing requests {#signing-requests}

Send an [access key](./access-keys.md) as a bearer token:

```bash
export EMPORA_KEY='em_pat_…'

curl -s https://empora-api.aoneahsan.com/api/v1/licences \
  -H "Authorization: Bearer $EMPORA_KEY"
```

A missing, removed, expired or mistyped key answers `401`:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Send an access key as a bearer token: Authorization: Bearer em_pat_…"
  }
}
```

The API accepts keys only. Your browser's sign-in to the dashboard does not work here, and neither does a
licence key.

## What comes back {#what-comes-back}

One thing answers inside `data`:

```json
{ "success": true, "data": { "id": 4182, "plan": "professional" } }
```

A list answers an array inside `data`, with the cursor for the next page in `meta`:

```json
{ "success": true, "data": [ { "id": 4182 } ], "meta": { "next_cursor": null } }
```

Dates are ISO 8601 with an offset, such as `2026-11-21T09:14:03+00:00`. A field with no value is `null`, never
missing: every answer for a part carries the same fields.

## Errors {#errors}

Every error has the same shape:

```json
{
  "success": false,
  "error": {
    "code": "SCOPE_REQUIRED",
    "message": "This key was not given that. Make a new key and tick it.",
    "details": { "scope": "stores:write" }
  }
}
```

| Status | `code` | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No key, or a key that is removed, expired or not a real key |
| 403 | `SCOPE_REQUIRED` | The key was not given the tick this route needs. `details.scope` names it |
| 404 | `NOT_FOUND` | Nothing with that id is on your account |
| 422 | `VALIDATION_FAILED` | A parameter or the body is wrong. `details` says which |
| 422 | `INVALID_CURSOR` | The cursor is not one Empora gave for this list, or it is more than 15 minutes old |
| 429 | `DAILY_REQUEST_LIMIT` | Today's requests on your plan are used |
| 429 | `TOO_MANY_REQUESTS` | More than 120 requests in one minute from one address |

Read `code`, not `message`. The codes stay the same; the messages are written for people and may be reworded.

## Pages of results {#pages-of-results}

Lists come newest first, 20 to a page. Ask for up to 50 with `limit`. When `meta.next_cursor` is a string, pass it
back as `cursor` for the next page; when it is `null`, you have the last page.

```bash
curl -s "https://empora-api.aoneahsan.com/api/v1/sites?limit=50&cursor=$NEXT" \
  -H "Authorization: Bearer $EMPORA_KEY"
```

A cursor lasts 15 minutes and belongs to one list. It cannot be reused for another list, or read for what it holds.

## Rate limits {#rate-limits}

Every call made with a valid key counts against your plan's **requests a day**, including a call refused for a
missing tick. The count starts again at midnight UTC. Each answer carries:

| Header | Holds |
|---|---|
| `RateLimit-Limit` | Your plan's requests a day |
| `RateLimit-Remaining` | What is left today |
| `RateLimit-Reset` | Seconds until midnight UTC |

Past the limit, the answer is `429` with `Retry-After` in seconds and `details.resets_at`. Nothing is charged, and
nothing is queued: call again after the reset. The numbers for each plan are in
[Limits on each plan](./index.md#limits-on-each-plan).

## Your account {#your-account}

### `GET /account` {#get-account}

Your name, your plan, what this key may do and today's use of your plan's limits. Any key may call it. The answer is
shown in [Checking what a key can do](./access-keys.md#checking-what-a-key-can-do).

## Licences {#licences}

Needs **Licences, Read** (`licences:read`).

### `GET /licences` {#get-licences}

Your licences, newest first.

```bash
curl -s https://empora-api.aoneahsan.com/api/v1/licences \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": [
    {
      "id": 4182,
      "plan": "professional",
      "status": "active",
      "expires_at": "2027-11-21T09:14:03+00:00",
      "max_sites": 1,
      "active_sites": 1,
      "created_at": "2025-11-21T09:12:40+00:00"
    }
  ],
  "meta": { "next_cursor": null }
}
```

`status` is one of `active`, `expired`, `suspended` or `revoked`. `expires_at` is `null` for a licence that does
not expire. `active_sites` counts the sites activated on it now. The licence key itself is never in an answer.

### `GET /licences/{id}` {#get-licence}

One licence, in the same shape.

## Sites {#sites}

Reading needs **Sites, Read** (`sites:read`).

### `GET /sites` {#get-sites}

Where your licences are activated, newest first. Add `licence_id` for one licence's sites only.

```bash
curl -s "https://empora-api.aoneahsan.com/api/v1/sites?licence_id=4182" \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": [
    {
      "id": 9031,
      "licence_id": 4182,
      "site_url": "https://shop.example.com",
      "site_name": "Harbour Tea Co.",
      "wp_version": "6.8.3",
      "wc_version": "10.3.0",
      "plugin_version": "1.0.0",
      "is_active": true,
      "activated_at": "2026-02-03T11:20:15+00:00",
      "last_validated_at": "2026-11-21T06:00:02+00:00"
    }
  ],
  "meta": { "next_cursor": null }
}
```

The versions are the ones the plugin reported the last time it checked in, so they can be a day behind your store.

### `POST /sites/{id}/deactivate` {#deactivate-site}

Needs **Sites, Deactivate a site** (`sites:write`). Frees the site's place on its licence, the same as
**Deactivate** in your dashboard. The plugin on that site stops validating against this licence until it is
activated again. The store's own data is not touched.

```bash
curl -s -X POST https://empora-api.aoneahsan.com/api/v1/sites/9031/deactivate \
  -H "Authorization: Bearer $EMPORA_KEY"
```

The answer is the site with `"is_active": false`. Deactivating a site that is already inactive changes nothing and
answers the same.

## Plan and billing {#plan}

### `GET /plan` {#get-plan}

Needs **Plan and billing, Read** (`plan:read`).

```bash
curl -s https://empora-api.aoneahsan.com/api/v1/plan \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": {
    "plan": "professional",
    "status": "active",
    "current_period_end": "2026-12-21T09:14:03+00:00",
    "cancel_at_period_end": false,
    "pending_plan": null
  }
}
```

An account with no paid plan answers `"status": "none"` with its plan, usually `free`. `pending_plan` names a plan
change already scheduled to take effect later, and is `null` when there is none. Card details are never here; Polar holds them.

## Store connections {#stores}

Reading needs **Store connections, Read** (`stores:read`).

### `GET /stores` {#get-stores}

The stores connected to your dashboard, newest first.

```bash
curl -s https://empora-api.aoneahsan.com/api/v1/stores \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": [
    {
      "id": 311,
      "name": "Harbour Tea Co.",
      "url": "https://shop.example.com",
      "status": "connected",
      "last_sync_at": "2026-11-21T08:00:11+00:00",
      "last_sync_status": "ok",
      "totals": { "orders": 12, "revenue": 340.5 },
      "created_at": "2026-03-14T16:41:09+00:00"
    }
  ],
  "meta": { "next_cursor": null }
}
```

`totals` holds the summary numbers your Overview shows for that store, numbers only and at most 20 of them, and is
`null` before the first sync. Which numbers appear depends on what the store reported. A name, an email or
anything else about a shopper cannot travel in this field: anything that is not a number is dropped. The
WooCommerce keys Empora keeps for the connection are never in an answer.

### `GET /stores/{id}` {#get-store}

One store connection, in the same shape.

### `PATCH /stores/{id}` {#rename-store}

Needs **Store connections, Rename a connection** (`stores:write`). Only the name on Empora changes; the store
itself is not touched.

```bash
curl -s -X PATCH https://empora-api.aoneahsan.com/api/v1/stores/311 \
  -H "Authorization: Bearer $EMPORA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Harbour Tea, wholesale"}'
```

The name is 1 to 120 characters, with any HTML taken out. The answer is the connection with its new name.

### `DELETE /stores/{id}` {#disconnect-store}

Needs **Store connections, Disconnect a store** (`stores:delete`). This does not disconnect anything. It asks, and
answers `202` with a link for you:

```bash
curl -s -X DELETE https://empora-api.aoneahsan.com/api/v1/stores/311 \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": {
    "ref": "rq_4hx9t2mk7qv3bn8wz6pc1jfd",
    "status": "waiting",
    "kind": "store",
    "asked_by": "Monthly sales sheet",
    "preview": {
      "store": "Harbour Tea Co.",
      "url": "https://shop.example.com",
      "connected_at": "2026-03-14T16:41:09+00:00"
    },
    "confirm_url": "https://empora.aoneahsan.com/dashboard/confirm/rq_4hx9t2mk7qv3bn8wz6pc1jfd",
    "expires_at": "2026-11-21T09:24:03+00:00",
    "note": "Nothing happens unless you say yes here."
  }
}
```

## Removals wait for you {#removals-wait-for-you}

A removal asked for by a key or an assistant is only a request. You open `confirm_url`, signed in to Empora, and read
what goes and what stays:

- **What goes:** the connection between that store and your dashboard, the WooCommerce keys Empora keeps for it
  (deleted for good), and its totals on your Overview.
- **What stays:** your store, with its orders, customers and products; the Empora plugin on it; and your licence.

Then you choose **Disconnect** or **Keep it connected**. Neither the key nor an assistant can answer for you. A
request lasts 10 minutes; after that it expires and nothing changes. Requests still waiting also appear at the top of
Other apps.

### `GET /removals/{ref}` {#get-removal}

Whether a request this account made was answered. Any key may call it.

| `status` | Means |
|---|---|
| `waiting` | Nobody has answered yet, and the 10 minutes are not up |
| `done` | You said yes, and the store is disconnected |
| `kept` | You said no. Nothing changed |
| `gone` | You said yes, but the connection was already gone |
| `expired` | Nobody answered within 10 minutes. Nothing changed |

## What the API never serves {#what-the-api-never-serves}

- Licence keys, and the WooCommerce keys behind a store connection.
- Anything about your shoppers or orders. Those live on your store and the API has no route to them.
- Card details or your Google sign-in.
- Any other person's licences, sites or stores.
- Account changes beyond the three on this page: no new licence, no plan change and no account deletion.
