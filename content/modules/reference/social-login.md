---
id: social-login
title: "Social Login"
description: "Let shoppers sign in or register with Google, Facebook, Apple or X through a full OAuth 2.0 flow linked to their WordPress account."
keywords:
  - woocommerce social login
  - oauth sign in
  - google login
  - one-click registration
format: md
---
## Overview

The Social Login module lets a shopper sign in or register with Google, Facebook, Apple or X (Twitter) instead of a password. It runs a full OAuth 2.0 authorisation-code flow, stores the resulting provider link against a WordPress user, and keeps the access tokens refreshed in the background.

It is for stores that want fewer abandoned registrations at checkout. Each provider has to be set up in that provider's own developer console first — the module needs a client id and secret for every provider it is asked to offer.

Buttons appear on the WooCommerce login and registration forms, on the WordPress login screen, above the checkout form, and a **Social Accounts** page is added to My Account where a customer can see and unlink what they have connected.

## Availability

| Item            | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Module key      | `social_login`                                            |
| Tier            | Premium                                                   |
| Entitlement key | `social_login`                                            |
| Admin tab       | `social-login`, under **Loyalty & Customers**             |
| Enabled option  | `aiowc_module_enabled_social_login` (off until turned on) |
| REST namespace  | `aiowc/v1`                                                |

Enabling the module creates the account table, seeds the defaults and schedules the two jobs through the plugin's job queue. Disabling it cancels them.

## Settings

Stored in the bundled option row `aiowc_sl_settings`, written with autoload off. Every provider is off by default and every credential is empty, so a freshly enabled module offers no buttons at all.

| Stored key              | Default     | Meaning                                                   |
| ----------------------- | ----------- | --------------------------------------------------------- |
| `enable_google`         | `false`     | Offer the Google button.                                  |
| `google_client_id`      | `''`        | Google OAuth 2.0 web client id.                           |
| `google_client_secret`  | `''`        | Google client secret. Stored encrypted.                   |
| `enable_facebook`       | `false`     | Offer the Facebook button.                                |
| `facebook_app_id`       | `''`        | Meta app id.                                              |
| `facebook_app_secret`   | `''`        | Meta app secret. Stored encrypted.                        |
| `enable_apple`          | `false`     | Offer the Apple button.                                   |
| `apple_client_id`       | `''`        | Apple services id.                                        |
| `apple_team_id`         | `''`        | Apple team id. Stored encrypted.                          |
| `enable_twitter`        | `false`     | Offer the X (Twitter) button.                             |
| `twitter_api_key`       | `''`        | X API key.                                                |
| `twitter_api_secret`    | `''`        | X API secret. Stored encrypted.                           |
| `button_style`          | `icon_text` | `icon_text`, `icon_only` or `text_only`.                  |
| `login_redirect_url`    | `''`        | Where to send the shopper after a successful login.       |
| `register_redirect_url` | `''`        | Where to send the shopper after a new account is created. |

The four secret fields are encrypted before they are written, and `GET /social-login/settings` redacts them on the way out.

## Providers

| Provider | Authorisation endpoint                 | Scope requested         |
| -------- | -------------------------------------- | ----------------------- |
| Google   | `accounts.google.com/o/oauth2/v2/auth` | `openid email profile`  |
| Facebook | `facebook.com/v18.0/dialog/oauth`      | `email,public_profile`  |
| Apple    | `appleid.apple.com/auth/authorize`     | `name email`            |
| X        | `twitter.com/i/oauth2/authorize`       | `tweet.read users.read` |

Apple has no profile endpoint; the profile is parsed out of the returned `id_token`. X uses PKCE, and the code verifier is held in a ten-minute transient keyed by the state value.

Every flow generates a 32-character `state`, stores it in a transient with its provider, and refuses the callback when the state is missing, expired, or belongs to a different provider.

## How a login resolves to a user

`AccountService::processLogin()` works in a fixed order:

1. **An existing link** for that provider and provider user id — the stored tokens are updated and that WordPress user is signed in.
2. **A WordPress user with the same email address** — the provider is linked to that account and the user is signed in. This is an automatic link on matching email.
3. **Otherwise a new WordPress user is created** and the provider linked to it. If the link fails, the newly created user is deleted again.

Unlinking refuses to remove a customer's last social account unless they have set a password, so an account cannot be locked out of itself.

## Admin screen

The **Social Login** tab is one screen:

- **OAuth callback** — the callback URL to paste into each provider console, with a copy button, and a count of linked accounts.
- **Buttons & redirects** — button style, and the post-login and post-registration redirects.
- **One card per provider** — Google, Facebook, Apple and X, each with its enable switch and credential fields.

It calls `GET /social-login/settings` and `PUT /social-login/settings`.

## REST API endpoints

All routes are on `aiowc/v1` and answer with the `{ success, data, message }` envelope.

| Method             | Path                                 | Purpose                                                            | Permission              | Required args               |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------ | ----------------------- | --------------------------- |
| GET                | `/social-login/providers`            | The enabled providers and the button style, for rendering.         | Open read, rate limited | –                           |
| GET                | `/social-login/authorize/{provider}` | Build the provider's authorisation URL and issue the state.        | Open read, rate limited | `provider`                  |
| GET                | `/social-login/callback`             | Provider redirect target.                                          | Open read, rate limited | –                           |
| POST               | `/social-login/callback`             | Complete the flow: exchange the code, resolve the user, sign in.   | Open read, rate limited | `code`, `state`, `provider` |
| POST               | `/social-login/link`                 | Link a provider to the signed-in account.                          | Signed-in user          | `provider`, `code`, `state` |
| DELETE             | `/social-login/unlink/{provider}`    | Unlink a provider from the signed-in account.                      | Signed-in user          | `provider`                  |
| GET                | `/social-login/accounts`             | The signed-in user's linked accounts.                              | Signed-in user          | –                           |
| GET                | `/social-login/settings`             | Settings with secrets redacted, per-provider counts, callback URL. | `manage_woocommerce`    | –                           |
| PUT / PATCH / POST | `/social-login/settings`             | Update settings; secrets are encrypted before storage.             | `manage_woocommerce`    | –                           |

## WooCommerce integration

| Hook                                           | What the module does                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `woocommerce_login_form_end`                   | Draws the provider buttons on the account login form.                   |
| `woocommerce_register_form_end`                | Draws the provider buttons on the registration form.                    |
| `login_form` / `register_form`                 | Draws the same buttons on the WordPress login and registration screens. |
| `woocommerce_before_checkout_form` (5)         | Draws the buttons above the checkout form.                              |
| `woocommerce_account_menu_items` (20)          | Adds **Social Accounts** to the My Account menu.                        |
| `woocommerce_account_social-accounts_endpoint` | Renders the linked-accounts page.                                       |
| `woocommerce_account_dashboard`                | Renders a linked-accounts widget on the account dashboard.              |
| `init`                                         | Registers the `social-accounts` account endpoint.                       |

`AvatarService` filters `get_avatar_url` and `pre_get_avatar_data` so a linked provider's picture can be used as the user's avatar.

## Database schema

| Table                           | Holds                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_social_accounts` | One row per provider link: user id, provider, provider user id, email, display name, avatar URL, encrypted access and refresh tokens, and token expiry. Unique on provider plus provider user id. |

## Background jobs

Both run through the plugin's job queue rather than a bare `wp_schedule_event`.

| Hook                     | Interval | Work                                                                                      |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| `aiowc_sl_token_refresh` | 6 hours  | Refreshes access tokens expiring within the next two hours.                               |
| `aiowc_sl_cleanup`       | daily    | Deletes expired accounts that have no refresh token, orphaned rows, and stale transients. |

## Entitlement limits

`social_login` is an on/off grant with no numeric cap. The number of linked accounts is unlimited as far as the plugin is concerned; the real constraints are each provider's own app review and rate limits.

## Health check

The module reports a warning when its table is missing, or when none of the four providers is enabled. Otherwise it reports that it is functioning normally.

## Known gaps

- **Apple's token exchange sends the wrong credential.** `OAuthService::getClientSecret()` maps Apple to `apple_team_id` and posts it as `client_secret`. Apple expects a signed JWT built from a `.p8` private key, its key id and the team id — a value the module has no field for and does not generate — so the Apple exchange cannot succeed as written (`includes/Modules/SocialLogin/Service/OAuthService.php`, `getClientSecret()`).
- There is no admin view of who has linked what. `GET /social-login/accounts` is scoped to the caller, and the settings response carries per-provider counts only.
- The four provider secrets are encrypted at rest. `GET /social-login/settings` blanks each one and adds a `<field>_set` boolean beside it, so a screen can show whether a secret exists without ever receiving it. Linked-account reads strip the stored access and refresh tokens the same way.
