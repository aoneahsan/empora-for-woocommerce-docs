---
id: rest-api
title: REST API
description: Reference for the Empora dashboard's own account routes and the WordPress plugin's internal aiowc/v1 REST namespace, with a pointer to the public API for your own scripts.
keywords:
  - empora rest api
  - woocommerce plugin rest
  - laravel api
  - empora public api
sidebar_position: 3
---

# REST API

Empora exposes two REST surfaces: the **backend account/billing API** (Laravel) and the **plugin's internal REST namespace** (WordPress).

:::note Audience
These are reference notes for developers and integrators. Day-to-day store management does not require calling these directly — the admin UI and dashboard do it for you.
:::

## Backend account API (Laravel)

Base URL: `https://empora-api.aoneahsan.com/api`. All routes are versioned under `v1`.

:::tip For your own scripts, use the public API
The routes in this section serve the Empora dashboard and need the dashboard's own sign-in. To read your
licences, sites, plan and store connections from a script, an assistant or your own server, use the
[public API](../developers/api.md) with an [access key](../developers/access-keys.md). It is documented route by
route, described in OpenAPI, and reaches only what the key was given.
:::

### Auth

You sign in to the dashboard with Google; there is no email and password sign-in.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/auth/google` | Sign in with Google. |
| `POST` | `/v1/auth/logout` | End this sign-in. |
| `GET` | `/v1/auth/user` | Current user profile. |
| `PATCH` | `/v1/auth/user` | Update profile. |

### Licenses (account-scoped, token required)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/user/licenses` | List your licenses. |
| `GET` | `/v1/user/licenses/{id}` | One license + connected sites. |
| `POST` | `/v1/user/licenses/{id}/deactivate-site` | Release a connected site. |

### Subscription (token required)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/user/subscription` | Current subscription state — plan, status and renewal date. |

:::note No checkout endpoint in 1.0
Version 1.0 ships without a payment provider, so there is no checkout or payment-webhook endpoint. A paid
plan is applied to an account directly; see [Plans & pricing](/pricing). The subscription endpoint above
reports the resulting state and is the one to read when you need to know what a licence is entitled to.
:::

### Updates & health

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/updates/check` | Premium plugin update check. |
| `GET` | `/health` | Liveness. |
| `GET` | `/health/detailed` | Detailed health (rate-limited). |

The **plugin-facing license endpoints** (`/v1/licenses/activate`, `/validate`, `/deactivate`) are documented separately in the [License API reference](/reference/license-api).

## Plugin internal REST (WordPress)

Inside WordPress the plugin registers routes under the **`aiowc/v1`** namespace. Each enabled module contributes its own endpoints, consumed by the React admin. For example, the Email Automation module exposes routes such as:

```
GET    /wp-json/aiowc/v1/email-automation/overview
GET    /wp-json/aiowc/v1/email-automation/templates
POST   /wp-json/aiowc/v1/email-automation/templates
GET    /wp-json/aiowc/v1/email-automation/workflows
POST   /wp-json/aiowc/v1/email-automation/workflows/{id}/toggle
POST   /wp-json/aiowc/v1/email-automation/send-test
GET    /wp-json/aiowc/v1/email-automation/diagnostics
```

These internal routes use WordPress nonce/cookie authentication and `manage_woocommerce` capability checks. They exist to serve the admin UI; the exact set depends on which modules are enabled.

## Related

- [Empora for developers](../developers/index.md): the public API, assistants, webhooks and two-factor sign-in
- [License API](/reference/license-api)
- [Architecture](/reference/architecture)
