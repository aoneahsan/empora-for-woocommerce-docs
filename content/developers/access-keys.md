---
id: access-keys
title: Access keys
description: Make an Empora access key that reads only the parts of your account you tick, show it again, replace or remove it, and move from older keys that reach everything.
sidebar_position: 2
keywords:
  - empora access key
  - em_pat key
  - empora api key
  - replace older key
last_update:
  date: 2026-11-21
---

# Access keys

**An access key lets a script of yours call the [Empora API](./api.md) as you, for only the parts you tick.**
It starts `em_pat_`, works only with the API at `https://empora-api.aoneahsan.com/api/v1`, and is not your
licence key: the licence key goes into the plugin on your store, and an access key never does.

You manage keys in your account, under **Settings, [Other apps](https://empora.aoneahsan.com/dashboard/settings?tab=apps), Access keys**.

## Making a key {#making-a-key}

1. Choose **Make a key**.
2. Give it a name that says who uses it, like *Monthly sales sheet*. You see this name in the list, in the
   email Empora sends, and as the name a removal request was asked by.
3. Tick what it can reach. Tick only what the app needs: you cannot widen a key later, so a key that needs more
   is a new key.
4. Choose when it expires: **30 days**, **90 days**, **365 days** or **Never**.
5. Choose **Make the key**. If your last Google sign-in is more than 10 minutes old, Empora asks you to confirm
   it is you first, and with [two-factor](./two-factor.md) on, asks for a code from your phone as well.

The key appears in full. This is the one time Empora shows it without asking; copy it into the app that needs it.
Empora emails you to say a key was made, with its name, what it reaches and when it expires.

A key is `em_pat_`, then 40 letters and digits, then `_` and a six-character check. The check lets a secret
scanner tell a real Empora key from something that only looks like one. Empora stores a fingerprint to find the
key by and a sealed copy for **Show again**; the plain key is never written down on the server.

## What each tick reaches {#what-each-tick-reaches}

| Tick | Scope | What it allows |
|---|---|---|
| Licences, Read | `licences:read` | Read your licences: plan, status, expiry and how many sites each allows |
| Sites, Read | `sites:read` | Read the sites each licence is activated on |
| Sites, Deactivate a site | `sites:write` | Deactivate a site on one of your licences |
| Plan and billing, Read | `plan:read` | Read your plan and its renewal date |
| Store connections, Read | `stores:read` | Read your store connections: name, address, last sync and totals |
| Store connections, Rename a connection | `stores:write` | Rename a store connection |
| Store connections, Disconnect a store | `stores:delete` | Ask to disconnect a store. Nothing happens until you say yes on Empora |

A part a key can change is also a part it reads, so ticking **Deactivate a site** gives the key `sites:read`
as well. **Disconnect a store** is off unless you tick it, and even then the key only asks: Empora answers with a
link for you, and the store stays connected until you say yes there within 10 minutes.

## When a key expires {#when-a-key-expires}

**Never** is allowed only for a key that reads. A key that can change anything always expires, and Empora
refuses **Never** for it with *"A key that can change things cannot be set to never expire. Set to 365 days."*

Seven days before a key expires, Empora emails you once, with its name, what it reaches and the date it stops. In
its last 7 days, the key also shows how many days it has left in the list. Once it has expired, every call made
with it gets a `401` answer, and it stays in the list marked **Expired** until you remove it. An expired key
cannot be brought back, and **Replace** keeps the same expiry date, so make a new key instead.

## Showing a key again {#showing-a-key-again}

**Show again** puts the full key back on screen. Empora allows it only within 10 minutes of a Google sign-in,
and with two-factor on, only after a code from your phone in that sign-in. Empora records each time a key is
shown.

## Replacing a key {#replacing-a-key}

**Replace** makes a new key with the same name, reach and expiry date. The old key stops working the moment the
new one is made, so have the app ready to take the new key before you choose **Make the new key**.

## Removing a key {#removing-a-key}

**Remove** deletes the key at once. Anything still using it gets a `401` answer from its next call. Removing a
key changes nothing else on your account.

## Checking what a key can do {#checking-what-a-key-can-do}

`GET /account` answers with your name, your plan, the scopes the key holds and today's use of your plan's
limits. Any key may call it, whatever it was given.

```bash
curl -s https://empora-api.aoneahsan.com/api/v1/account \
  -H "Authorization: Bearer $EMPORA_KEY"
```

```json
{
  "success": true,
  "data": {
    "name": "Amira Haddad",
    "plan": "professional",
    "scopes": ["licences:read", "sites:read", "sites:write"],
    "usage": {
      "maxAccessKeys": { "used": 2, "limit": 25 },
      "maxApiRequestsPerDay": { "used": 318, "limit": 50000 },
      "maxWebhookEndpoints": { "used": 1, "limit": 20 },
      "maxAssistantConnections": { "used": 1, "limit": 10 }
    }
  }
}
```

A `limit` of `-1` means your plan sets no limit on that line.

## Moving from older keys {#moving-from-older-keys}

Keys made before keys had a reach of their own are listed under **Older keys**. Each one reaches everything your
account reaches, and none of them can be shown again, because Empora never kept a copy it could show.

Two things you can do with each one:

- **Replace** asks what the new key should reach and when it expires, then makes an `em_pat_` key with the older
  key's name. The older key stops working the moment the new one is made. Replacing an older key needs no free
  place under your plan's access-key limit, since one key goes as the other arrives.
- **Remove** deletes it. Anything still using it gets a `401` answer.

Until you do either, an older key still works with the API and still reaches every part. With two-factor on, an
older key works only if the sign-in that made it also passed the code, the same rule as the dashboard. A key
made by a sign-in that never entered a code gets a `401` answer.

The one older key belonging to the browser you are using now is the sign-in itself, so it cannot be replaced or
removed from this list. **Sign out everywhere else**, in [Security](./two-factor.md#recent-sign-ins), ends every
other one at once.

## How many you can have {#how-many-you-can-have}

Free allows 5 access keys, Starter, Professional and Business allow 25, and Enterprise allows 50. Older keys count towards it too; an expired key does not. When all are in use, Empora says so and makes no new
key until you remove one.
The full table is in [Limits on each plan](./index.md#limits-on-each-plan).
