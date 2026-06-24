---
id: rest-api
title: REST API
description: Reference for the Empora backend account/billing REST API and the WordPress plugin's internal aiowc/v1 REST namespace.
keywords:
  - empora rest api
  - woocommerce plugin rest
  - laravel api
  - sanctum auth
sidebar_position: 3
---

# REST API

Empora exposes two REST surfaces: the **backend account/billing API** (Laravel) and the **plugin's internal REST namespace** (WordPress).

:::note Audience
These are reference notes for developers and integrators. Day-to-day store management does not require calling these directly — the admin UI and dashboard do it for you.
:::

## Backend account API (Laravel)

Base URL: `https://empora-api.aoneahsan.com/api`. Authentication uses **Laravel Sanctum** bearer tokens. All routes are versioned under `v1`.

### Auth (public)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/auth/register` | Create an account. |
| `POST` | `/v1/auth/login` | Obtain a token. |
| `POST` | `/v1/auth/forgot-password` | Start password reset. |
| `POST` | `/v1/auth/reset-password` | Complete password reset. |
| `POST` | `/v1/auth/google` | Sign in with Google. |

### Auth (token required)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/auth/logout` | Revoke the current token. |
| `GET` | `/v1/auth/user` | Current user profile. |
| `PATCH` | `/v1/auth/user` | Update profile. |
| `POST` | `/v1/auth/change-password` | Change password. |

### Licenses (account-scoped, token required)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/user/licenses` | List your licenses. |
| `GET` | `/v1/user/licenses/{id}` | One license + connected sites. |
| `POST` | `/v1/user/licenses/{id}/deactivate-site` | Release a connected site. |

### Billing (token required)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/checkout` | Create a Stripe checkout session. |
| `GET` | `/v1/user/subscription` | Current subscription state. |
| `POST` | `/v1/webhooks/stripe` | Stripe webhook (server-to-server; signature-verified). |

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

- [License API](/reference/license-api)
- [Architecture](/reference/architecture)
