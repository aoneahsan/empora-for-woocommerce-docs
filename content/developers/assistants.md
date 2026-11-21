---
id: assistants
title: Assistants
description: Connect Claude, ChatGPT, Claude Code or Cursor to your Empora account, choose what each may do, and see why disconnecting a store always waits for your yes.
sidebar_position: 4
keywords:
  - empora mcp
  - empora claude connector
  - empora chatgpt connector
  - woocommerce mcp server
  - claude code mcp empora
last_update:
  date: 2026-11-21
---

# Assistants

**Claude, ChatGPT, Claude Code and Cursor can look after your Empora licences and store connections for you.** The
assistant asks Empora for permission first, you sign in and choose what it can reach, and it then works through
one address:

```text
https://empora-api.aoneahsan.com/mcp
```

That is an MCP server, the standard way these assistants reach outside services. It reaches the same four parts
of your account as an [access key](./access-keys.md), and nothing on your store.

## Connecting {#connecting}

The same steps, with the address above to copy, are in your account under **Settings,
[Other apps](https://empora.aoneahsan.com/dashboard/settings?tab=apps), Connected assistants**.

### Claude {#claude}

1. In Claude, open **Settings**, then **Connectors**, and choose **Add custom connector**.
2. Name it *Empora* and paste the address above.
3. Claude opens Empora in a new window. Sign in, read what it asks for, and approve.

### ChatGPT {#chatgpt}

1. In ChatGPT, open **Settings**, then **Connectors**, and add a new connector.
2. Name it *Empora*, paste the address above and choose **OAuth** to sign in.
3. ChatGPT opens Empora. Sign in, read what it asks for, and approve.

### Claude Code {#claude-code}

1. Run this in your terminal:

   ```bash
   claude mcp add --transport http empora https://empora-api.aoneahsan.com/mcp
   ```

2. Start Claude Code, type `/mcp` and choose **empora** to sign in.
3. Your browser opens Empora. Sign in, read what it asks for, and approve.

### Cursor {#cursor}

1. In Cursor, open **Settings**, then **MCP**, and add a new server. Paste this into the file it opens:

   ```json
   { "mcpServers": { "empora": { "url": "https://empora-api.aoneahsan.com/mcp" } } }
   ```

2. Save the file. Cursor shows Empora with a button to sign in.
3. Your browser opens Empora. Sign in, read what it asks for, and approve.

The menu names inside each assistant belong to its maker and can move between their releases. The address does
not change.

## What you approve {#what-you-approve}

The connect page says which assistant is asking, which address it sends you back to when you finish, and which
Google account you are connecting. With [two-factor](./two-factor.md) on, it opens only once your sign-in has passed it.

Then it lists the four parts, each with **Read**, **Change** and **Remove** where they apply. Take off any tick you do
not want. **Remove** is unticked unless you tick it, whatever the assistant asked for. Underneath, the page lists what
is never shared, whatever you tick: your licence keys, the WooCommerce keys behind a store connection, your shoppers
and orders, card details and your Google sign-in.

An assistant that registered itself gives itself its name, and Empora has not checked who made it. The page says so
in that case: approve only an assistant you added yourself, just now. A connect request lasts 10 minutes; after that,
start again from the assistant.

**Approve** connects it and sends you back to the assistant. **Deny** shares nothing and tells the assistant you said
no. Either way you can close the window. After an approval, Empora emails you with the assistant's name, the address
it sends you to and what it can do.

## What an assistant can do {#what-an-assistant-can-do}

An assistant sees only the tools its ticks allow.

| Tool | Needs | What it does |
|---|---|---|
| `whoami` | Nothing | Shows your name, your plan, what this connection may do and today's use of your plan's limits |
| `list_licences` | Licences, Read | Lists your licences with their plan, status, expiry date and how many sites each allows |
| `get_licence` | Licences, Read | Shows one licence by its id |
| `list_sites` | Sites, Read | Lists the sites your licences are activated on, with their WordPress, WooCommerce and Empora versions |
| `deactivate_site` | Sites, Change | Deactivates one site on one of your licences, which frees its place on the licence |
| `get_plan` | Plan and billing, Read | Shows your plan, its status and the next renewal date |
| `list_stores` | Store connections, Read | Lists your store connections with their address, last sync and the totals shown |
| `get_store` | Store connections, Read | Shows one store connection by its id |
| `rename_store` | Store connections, Change | Renames one store connection. Only the name on Empora changes |
| `prepare_disconnect_store` | Store connections, Remove | Asks to disconnect a store. Nothing changes until you say yes on Empora within 10 minutes |
| `get_removal_request` | Nothing | Shows whether a disconnect this connection asked for was confirmed, kept or expired |

A list gives at most 50 results at a time. An assistant can make at most 10 changes a minute, and every tool call
counts against your plan's requests a day, the same count your access keys use.

## Disconnecting a store waits for your yes {#disconnecting-waits-for-your-yes}

When you ask an assistant to disconnect a store, it can only ask Empora. Empora answers with a link to
`https://empora.aoneahsan.com/dashboard/confirm/…`, which the assistant passes to you. Open it signed in, read what goes
and what stays, and choose **Disconnect** or **Keep it connected**. The assistant cannot press either for you.

The request lasts 10 minutes, then expires with nothing changed. A waiting request also appears at the top of Other
apps, as *"One request is waiting for your yes"*. The full list of what goes and what stays is in
[Removals wait for you](./api.md#removals-wait-for-you).

## Renaming and disconnecting {#renaming-and-disconnecting}

Each connected assistant has a row in Connected assistants, with the date it was connected and the address it sends
you to.

- **Rename** changes the name you see in Empora. Only you see this name; the assistant keeps its own.
- **Disconnect** ends the connection at once. Empora checks the connection on every call, so the assistant's next
  request gets a `401` answer, even one sent a second later. To use it again, connect it again.

An assistant stays signed in by renewing its own sign-in in the background. If it goes 30 days without doing that,
it has to connect again.

## How many you can connect {#how-many-you-can-connect}

Free allows 3 assistant connections, Starter, Professional and Business allow 10, and Enterprise allows 25.
Disconnecting one frees its place. Connecting the same assistant again replaces its old connection instead of taking
a second place. When all are in use, the connect page says so before you approve.

## The assistant reads your own words as data {#your-own-words-as-data}

Your store names and the notes on your account reach the assistant as plain data. Empora never passes on an
instruction written inside them, and no tool lets one connection reach another person's account. An assistant can
still misread what it is shown, so read what it proposes before you say yes to a change.

## For developers of MCP clients {#for-mcp-client-developers}

| Item | Value |
|---|---|
| Transport | Streamable HTTP, stateless. `POST /mcp` only; `GET` and `DELETE` answer `405` |
| Protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, `2025-03-26` |
| Protected-resource metadata | `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp` |
| Authorisation-server metadata | `/.well-known/oauth-authorization-server` |
| Authorisation | OAuth 2.1 authorisation code at `/oauth/authorize`, PKCE `S256` only, public clients |
| Token | `/oauth/token`: `authorization_code` and `refresh_token` grants. Access tokens last 10 minutes |
| Client registration | Dynamic registration at `/oauth/register` (RFC 7591). Registering grants nothing |
| Resource | `resource` must be `https://empora-api.aoneahsan.com/mcp` |
| Scopes | The seven scopes in [Access keys](./access-keys.md#what-each-tick-reaches), plus `offline_access` to stay connected |
| Browser origins | A request carrying an `Origin` header must come from `https://claude.ai`, `https://chatgpt.com` or `https://chat.openai.com`. Server-to-server calls send none |
| Sizes | A request body up to 64 KB; a tool result up to 32 KB |

Every path above is on `https://empora-api.aoneahsan.com`. The authorisation answer carries `iss` (RFC 9207).
