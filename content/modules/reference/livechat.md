---
id: livechat
title: "Live Chat & Customer Support"
description: "Support conversations handled inside WordPress. This module is in the catalogue but does not register in 1.0 and cannot be enabled."
keywords:
  - woocommerce live chat
  - customer support
  - support conversations
  - not in 1.0
format: md
---
:::warning This module does not ship in 1.0
`livechat` (Live Chat & Customer Support) is part of the catalogue but does not run in 1.0: it is
not registered, so it cannot be enabled and nothing described below is active on a live site. The
page records what the code is written to do, so the module can be assessed and finished. See the
[module reference](/modules/reference).
:::

## Availability

The plugin's module manifest declares this module with `register: false` and
`status: "unregistered"`. `ModuleRegistry::registerFromManifest()` skips every manifest row whose
`register` flag is falsy, so `LiveChatModule` is never instantiated. Nothing downstream of that runs:

- `registerHooks()` is never called, so no REST route in the `aiowc/v1/livechat/*` namespace is registered
  and every request to one returns a 404.
- The chat widget is never printed on the storefront, because the `wp_footer` hook is never added.
- The two Action Scheduler jobs are never scheduled.
- `activate()` never runs, so the three database tables are never created.
- `registerSettings()` never runs, so the `aiowc_lc_*` options are never registered and never receive
  their defaults.

The plugin's admin navigation still lists a **Live Chat** tab, under the _Operations_ group in the admin app. That screen is built and calls the REST endpoints below, so it
loads against a namespace that does not exist. This is recorded in the manifest as
`advertised (admin page) but never registered`.

The rest of this page describes what the code would do if the module were registered. Treat it as a
description of unshipped work, not as a setup guide — the steps cannot be followed in this release.

## Goal

Handle customer support conversations inside WordPress rather than through a third-party chat service.
Visitors open a chat from a storefront widget; staff answer it from the plugin's admin screen. Messages
are delivered by polling, not by a websocket, so no external realtime service is involved.

## Tier and entitlement

| Field           | Value      |
| --------------- | ---------- |
| Tier            | Premium    |
| Entitlement key | `livechat` |
| Admin tab       | `livechat` |
| Module key      | `livechat` |

## Intended features

Taken from the module class and its services:

- Visitor-initiated chat sessions, optionally capturing a name and email address before the first message.
- An agent roster held in its own table, with per-agent display name, maximum concurrent chats and an
  online/offline status.
- Session assignment: an agent claims a pending session, and can transfer it to another agent.
- Message polling from both sides, with a configurable poll interval.
- An offline form that captures a message when no agent is available.
- File attachments on a session, with a configurable size limit.
- A post-chat rating and feedback field captured when the visitor ends the session.
- Session and message retention with scheduled cleanup.
- Deletion of a user's chat data when their WordPress account is deleted
  (`delete_user` → `ChatService::deleteUserData()`).

## Settings

Settings are individual options, each prefixed `aiowc_lc_`, registered in the `aiowc_livechat` group.
Defaults come from `LiveChatModule::getDefaultSettings()` and are written on activation only when the
option does not already exist.

| Option (`aiowc_lc_` + key) | Default                                             | Meaning                                                        |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `enable_widget`            | `true`                                              | Whether the storefront chat widget renders at all              |
| `widget_position`          | `bottom-right`                                      | Corner the widget is anchored to                               |
| `widget_color`             | `#7f54b3`                                           | Accent colour of the widget                                    |
| `welcome_message`          | "Hello! How can we help you today?"                 | First message shown when the widget opens                      |
| `enable_offline_form`      | `true`                                              | Whether visitors can leave a message when no agent is online   |
| `offline_message`          | "We are currently offline. Please leave a message." | Text shown above the offline form                              |
| `offline_email`            | empty                                               | Address that receives offline submissions                      |
| `auto_popup_delay`         | `0`                                                 | Seconds before the widget opens by itself; `0` disables it     |
| `require_email`            | `false`                                             | Whether a visitor must supply an email address to start a chat |
| `enable_file_upload`       | `true`                                              | Whether attachments are accepted on a session                  |
| `max_file_size`            | `5`                                                 | Attachment size limit in megabytes                             |
| `poll_interval`            | `3000`                                              | Milliseconds between message polls                             |
| `session_retention_days`   | `90`                                                | Age at which closed sessions become eligible for cleanup       |
| `inactive_timeout_minutes` | `30`                                                | Idle time after which a session is closed by the timeout job   |

Enablement is separate from these settings: like every module, Live Chat reads
`aiowc_module_enabled_livechat`, which defaults to `false`.

## Admin screen

Admin tab `livechat`. The screen carries
four tabs — a live console for pending and accepted sessions, History, Agents and Settings — and calls
the endpoints below. Because the module does not register, those
calls have no server side in this release.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`, which the module records in its own
version option. Three tables, each carrying the WordPress table prefix:

| Table                         | Holds                                                                   |
| ----------------------------- | ----------------------------------------------------------------------- |
| `{prefix}aiowc_chat_sessions` | One row per conversation, keyed by a public session key                 |
| `{prefix}aiowc_chat_messages` | Individual messages, with sender type, attachment fields and read state |
| `{prefix}aiowc_chat_agents`   | The agent roster, keyed by WordPress user ID                            |

## REST endpoints

Namespace `aiowc/v1`. Taken from the plugin's REST contract file. All of these return a bare
response body rather than the shared envelope. **None of them are reachable in this release.**

### Visitor endpoints

| Method | Path                                        | Purpose                                          | Required args              |
| ------ | ------------------------------------------- | ------------------------------------------------ | -------------------------- |
| GET    | `/livechat/availability`                    | Report whether any agent is online               | —                          |
| POST   | `/livechat/sessions`                        | Start a chat session                             | —                          |
| GET    | `/livechat/sessions/{session_key}`          | Read one session                                 | `session_key`              |
| POST   | `/livechat/sessions/{session_key}/messages` | Send a visitor message                           | `session_key`, `message`   |
| GET    | `/livechat/sessions/{session_key}/poll`     | Fetch messages newer than `last_message_id`      | `session_key`              |
| POST   | `/livechat/sessions/{session_key}/upload`   | Attach a file to a session                       | `session_key`              |
| POST   | `/livechat/sessions/{session_key}/end`      | End a session, with optional rating and feedback | `session_key`              |
| POST   | `/livechat/offline`                         | Submit the offline form                          | `name`, `email`, `message` |

Read endpoints here use a rate-limited public permission check; write endpoints use a public write check.

### Agent endpoints

Permission check: agent.

| Method | Path                                     | Purpose                              | Required args    |
| ------ | ---------------------------------------- | ------------------------------------ | ---------------- |
| GET    | `/livechat/agent/pending`                | List sessions waiting to be claimed  | —                |
| GET    | `/livechat/agent/sessions`               | List the calling agent's sessions    | —                |
| POST   | `/livechat/agent/sessions/{id}/accept`   | Claim a pending session              | `id`             |
| POST   | `/livechat/agent/sessions/{id}/messages` | Send an agent message                | `id`, `message`  |
| POST   | `/livechat/agent/sessions/{id}/transfer` | Hand a session to another agent      | `id`, `agent_id` |
| POST   | `/livechat/agent/status`                 | Set the calling agent's availability | `status`         |
| GET    | `/livechat/agents/online`                | List agents currently online         | —                |

### Administrative endpoints

Permission check: admin.

| Method | Path                         | Purpose                              | Required args |
| ------ | ---------------------------- | ------------------------------------ | ------------- |
| GET    | `/livechat/agents`           | List all agents                      | —             |
| POST   | `/livechat/agents`           | Add an agent                         | `user_id`     |
| PUT    | `/livechat/agents/{user_id}` | Update an agent                      | `user_id`     |
| DELETE | `/livechat/agents/{user_id}` | Remove an agent                      | `user_id`     |
| GET    | `/livechat/history`          | Paginated session history            | —             |
| GET    | `/livechat/statistics`       | Session statistics over a date range | —             |
| GET    | `/livechat/settings`         | Read module settings                 | —             |
| POST   | `/livechat/settings`         | Update module settings               | —             |

## WordPress and WooCommerce integration

- `wp_footer` — renders the chat widget on the storefront.
- `wp_enqueue_scripts` — loads the widget's assets.
- `delete_user` — deletes that user's chat data.
- `admin_init` — registers the `aiowc_lc_*` settings.

The module does not hook any WooCommerce order, product, cart or email action. It registers no
shortcode and no block.

## Background jobs

Both jobs run through Action Scheduler in the `aiowc-livechat` group.

| Hook                           | Schedule                  | Purpose                                        |
| ------------------------------ | ------------------------- | ---------------------------------------------- |
| `aiowc_livechat_cleanup`       | Daily, first run at 03:00 | Delete sessions past the retention window      |
| `aiowc_livechat_timeout_check` | Every 5 minutes           | Close sessions idle beyond the timeout setting |

Both emit `aiowc_track_event` observability events on completion
(`livechat_cleanup_completed`, `livechat_sessions_timed_out`).

## Entitlement limits

The entitlement is a gate, not a quota. `ModuleRegistry::initializeModules()` calls `registerHooks()`
only for modules that are both enabled and permitted by the licence, so without the `livechat`
entitlement the module contributes nothing at runtime. No per-seat, per-session or per-message limit is
implemented in the module's code.

## Related documentation

- [Module Architecture](/reference/architecture)
