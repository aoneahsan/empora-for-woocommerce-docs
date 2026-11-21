---
id: index
title: Empora for developers
sidebar_label: Overview
description: Reach your own Empora licences, site activations, plan and store connections from a script, Claude or ChatGPT, or a server of yours, with two-factor sign-in guarding the account.
slug: /developers
sidebar_position: 1
keywords:
  - empora api
  - empora mcp server
  - empora webhooks
  - woocommerce licence api
  - empora access key
last_update:
  date: 2026-11-21
---

# Empora for developers

**Your Empora account can be reached by tools you connect yourself:** a script or a spreadsheet with an access
key, an assistant such as Claude or ChatGPT, or a server of yours that hears about each change through a
webhook. You set all three up in your account, under **Settings, [Other apps](https://empora.aoneahsan.com/dashboard/settings?tab=apps)**,
on every plan, Free included.

Each one reaches only the parts you tick, and only your own account. None of them reaches your store itself:
your shoppers, orders and products stay in your own WordPress database, and nothing here changes that.

## Three ways in {#three-ways-in}

| You want | Use | Page |
|---|---|---|
| A script, a spreadsheet or a report that reads your licences and store connections | An access key and the API | [Access keys](./access-keys.md), [The API](./api.md) |
| Claude, ChatGPT, Claude Code or Cursor to look after licences and connections for you | The Empora address for assistants | [Assistants](./assistants.md) |
| Your own systems to hear when a licence, site, plan or connection changes | A webhook address | [Webhooks](./webhooks.md) |

All three act as you. A key or an assistant can never do more than you could do in the account yourself, and
usually does less, because it gets only what you tick.

## What an outside app can reach {#what-an-outside-app-can-reach}

Four parts of your account, each read in full. Two small changes are allowed, and one removal that always waits
for you.

| Part | Read | Change |
|---|---|---|
| **Licences** | Plan, status, expiry date and how many sites each licence allows | Nothing |
| **Sites** | Where each licence is activated, with the WordPress, WooCommerce and Empora versions | Deactivate a site, which frees its place on the licence |
| **Plan and billing** | Your plan, its status and the next renewal date | Nothing |
| **Store connections** | Stores connected to your dashboard: name, address, last sync and the totals shown | Rename a connection. Ask to disconnect one |

Disconnecting a store always waits for your yes on Empora, within 10 minutes, whichever app asks for it. The
app only gets a link to send you. [How a removal waits](./api.md#removals-wait-for-you).

### What it never reaches {#what-it-never-reaches}

Whatever you tick, these never leave Empora's server through a key, an assistant or a webhook:

- your licence keys, the ones you paste into the plugin;
- the WooCommerce keys Empora keeps for a store connection;
- your shoppers, orders and addresses, which stay on your own store;
- card details, which Polar holds, and your Google sign-in;
- anyone else's account.

The server sends a field only when it is named on a fixed list for that part. A new column added to a table
later does not reach anyone until it is added to that list on purpose.

## The addresses {#the-addresses}

| What | Address |
|---|---|
| The API | `https://empora-api.aoneahsan.com/api/v1` |
| Its OpenAPI description | [`/api/v1/openapi.json`](https://empora-api.aoneahsan.com/api/v1/openapi.json), also as [Markdown](https://empora-api.aoneahsan.com/api/v1/openapi.md) |
| The address for assistants (MCP) | `https://empora-api.aoneahsan.com/mcp` |
| Where you set it all up | [Settings, Other apps](https://empora.aoneahsan.com/dashboard/settings?tab=apps) and [Settings, Security](https://empora.aoneahsan.com/dashboard/settings?tab=security) |

The OpenAPI file is built from the same list the server registers its routes from, so the two cannot disagree.
It needs no key.

## Limits on each plan {#limits-on-each-plan}

| Plan | Access keys | Requests a day | Webhook addresses | Assistant connections |
|---|---|---|---|---|
| Free | 5 | 5,000 | 3 | 3 |
| Starter | 25 | 50,000 | 20 | 10 |
| Professional | 25 | 50,000 | 20 | 10 |
| Business | 25 | 50,000 | 20 | 10 |
| Enterprise | 50 | 100,000 | 40 | 25 |

Requests count every call from a key or an assistant, and start again at midnight UTC. A call over the limit
gets a `429` answer with the time it opens again; nothing is charged. **Use against your plan**, at the top of
Other apps, shows the numbers on your own account, and those are the ones Empora enforces.

## Keys and secrets stay hidden until you confirm it is you {#keys-and-secrets-stay-hidden}

Empora makes or shows an access key or a webhook signing secret only when your Google sign-in is at most
10 minutes old. With [two-factor sign-in](./two-factor.md) on, it also needs a code from your phone entered in
this sign-in; a remembered browser does not count as a code. When either is missing, Empora asks you to
confirm before it goes on.

## This is not the plugin's REST API {#not-the-plugin-api}

Everything in this section talks to your **Empora account** at `empora-api.aoneahsan.com`. The WordPress plugin
on your store has its own internal routes under `/wp-json/aiowc/v1`, which serve its admin screens and are not
meant for outside use. Those are described in [REST API](../reference/rest-api.md).

## In this section {#in-this-section}

- [Access keys](./access-keys.md): make, show again, replace and remove a key, and move from older keys.
- [The API](./api.md): every route, with `curl` examples and the answers they give.
- [Assistants](./assistants.md): connect Claude, ChatGPT, Claude Code or Cursor, and what each may do.
- [Webhooks](./webhooks.md): every event, sample deliveries, and checking a signature in Node or PHP.
- [Two-factor sign-in](./two-factor.md): setting it up, recovery codes, a remembered browser and a lost phone.
- [Developers changelog](./changelog.md): what changed here, and when.
