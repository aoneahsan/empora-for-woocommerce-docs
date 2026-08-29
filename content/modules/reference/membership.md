---
id: membership
title: "Membership & Access Control"
description: "Tie a WordPress user to a membership tier for a period, then restrict post content, excerpts and product purchasability against that tier."
keywords:
  - woocommerce membership
  - content restriction
  - membership tiers
  - member access
format: md
---
## Goal

Restrict content and products to members of a tier. A membership ties a WordPress user to a tier for a
period; the module then filters post content, excerpts and WooCommerce product purchasability against
that membership. It is for stores that sell tiered access — a members' area, member-only products, or
content released on a schedule.

## Tier and entitlement

| Field           | Value        |
| --------------- | ------------ |
| Tier            | Premium      |
| Entitlement key | `membership` |
| Admin tab       | `membership` |
| Module key      | `membership` |
| Settings prefix | `aiowc_mb_`  |

Like every module, it registers its hooks only when `aiowc_module_enabled_membership` is true **and** the
licence permits the `membership` entitlement.

## What the code does

- Membership records with a lifecycle: create, activate, pause, resume, cancel, renew, and change tier.
- Tiers held in their own table, with a public listing endpoint and an administrative CRUD set.
- Access rules stored per content type and content ID, resolved against the user's active membership.
- Content filtering on `the_content` and `the_excerpt` at priority 99, with an optional preview of the
  first N characters before the restriction message.
- Product gating through `woocommerce_is_purchasable`, with the add-to-cart text and loop link filtered
  so a restricted product reads as member-only rather than appearing buyable.
- A member-only notice on the single product summary.
- Renewal reminder and expiry emails, sent by two scheduled jobs.
- Drip content, gated by a setting.

### What is not wired

`MembershipService::processOrder()` exists and accepts an order ID, but nothing calls it: the module
hooks no WooCommerce order or payment action. In this release a membership is created through the
administrative REST endpoint, not automatically from a purchase. `createMembership()`, `renewMembership()`
and `changeTier()` all accept an order ID, so the record can reference an order, but the link has to be
made by the caller.

## Settings

Read through the shared `ModuleSettings` helper with the `aiowc_mb_` prefix. Defaults come from
`MembershipModule::defaults()`.

| Setting                    | Default                                       | Meaning                                                        |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `restrict_message`         | "This content is restricted to members only…" | Shown in place of restricted post content                      |
| `restrict_product_message` | "This product is available to members only."  | Shown on a restricted product                                  |
| `renewal_reminder_days`    | `7`                                           | Days before expiry that the reminder email is sent             |
| `send_renewal_emails`      | `true`                                        | Whether renewal reminders are sent                             |
| `send_expiry_emails`       | `true`                                        | Whether expiry notices are sent                                |
| `grace_period_days`        | `3`                                           | Days a lapsed membership keeps access before it expires        |
| `allow_content_preview`    | `true`                                        | Whether restricted content shows an excerpt before the message |
| `preview_length`           | `200`                                         | Characters of preview shown when previews are allowed          |
| `drip_content_enabled`     | `true`                                        | Whether scheduled content release is applied                   |
| `default_tier_id`          | `0`                                           | Tier assigned when none is specified; `0` means none           |

## Admin screen

Admin tab `membership`. Three tabs, with
the active tab held in the URL hash under `mbTab`:

- **Members** — the membership list and its lifecycle actions.
- **Tiers** — tier CRUD.
- **Settings** — the options above.

## Database schema

Created by `Schema/DatabaseSchema.php` at schema version `1.0.0`.

| Table                            | Holds                                               |
| -------------------------------- | --------------------------------------------------- |
| `{prefix}aiowc_memberships`      | One row per user membership, with status and period |
| `{prefix}aiowc_membership_tiers` | Tier definitions                                    |
| `{prefix}aiowc_member_access`    | Access rules mapping content to tiers               |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope. Where several methods share a callback they
are listed together.

### Memberships

| Method             | Path                         | Purpose                                                                      | Required args        |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------- | -------------------- |
| GET                | `/memberships`               | List memberships, filterable by status and user, paginated                   | —                    |
| POST               | `/memberships`               | Create a membership                                                          | `user_id`, `tier_id` |
| GET                | `/memberships/{id}`          | Read one membership                                                          | —                    |
| PUT / PATCH / POST | `/memberships/{id}`          | Update a membership                                                          | —                    |
| DELETE             | `/memberships/{id}`          | Delete a membership                                                          | —                    |
| POST               | `/memberships/{id}/{action}` | Lifecycle action; `action` is one of `activate`, `pause`, `resume`, `cancel` | —                    |
| GET                | `/memberships/overview`      | Aggregate figures for the admin overview                                     | —                    |

Permission: manage.

### Tiers and access rules

| Method             | Path                             | Purpose                                                            | Required args |
| ------------------ | -------------------------------- | ------------------------------------------------------------------ | ------------- |
| GET                | `/memberships/admin/tiers`       | List all tiers                                                     | —             |
| POST               | `/memberships/admin/tiers`       | Create a tier                                                      | —             |
| GET                | `/memberships/admin/tiers/{id}`  | Read a tier                                                        | —             |
| PUT / PATCH / POST | `/memberships/admin/tiers/{id}`  | Update a tier                                                      | —             |
| DELETE             | `/memberships/admin/tiers/{id}`  | Delete a tier                                                      | —             |
| GET                | `/memberships/access-rules`      | List access rules, filterable by content type, content ID and tier | —             |
| POST               | `/memberships/access-rules`      | Create an access rule                                              | —             |
| PUT / PATCH / POST | `/memberships/access-rules/{id}` | Update an access rule                                              | —             |
| DELETE             | `/memberships/access-rules/{id}` | Delete an access rule                                              | —             |
| POST               | `/memberships/access-rules/bulk` | Update several access rules in one call                            | —             |

Permission: manage.

### Settings

| Method             | Path                    | Purpose         | Required args |
| ------------------ | ----------------------- | --------------- | ------------- |
| GET                | `/memberships/settings` | Read settings   | —             |
| PUT / PATCH / POST | `/memberships/settings` | Update settings | —             |

Permission: manage.

### Customer-facing

| Method | Path                        | Purpose                                                     | Required args                | Permission               |
| ------ | --------------------------- | ----------------------------------------------------------- | ---------------------------- | ------------------------ |
| GET    | `/memberships/tiers`        | List tiers available to buy or join                         | —                            | Rate-limited public read |
| GET    | `/memberships/my`           | The signed-in user's memberships                            | —                            | Signed in                |
| POST   | `/memberships/access-check` | Ask whether the signed-in user may see one piece of content | `content_type`, `content_id` | Signed in                |

## WooCommerce and WordPress integration

### Filters

| Hook                                   | Priority | Effect                                                                               |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `the_content`                          | 99       | Replaces restricted content with the restriction message, optionally after a preview |
| `the_excerpt`                          | 99       | Same treatment for excerpts                                                          |
| `woocommerce_is_purchasable`           | 10       | Makes a restricted product not purchasable                                           |
| `woocommerce_product_add_to_cart_text` | 10       | Replaces the button text on a restricted product                                     |
| `woocommerce_loop_add_to_cart_link`    | 10       | Replaces the loop add-to-cart link on a restricted product                           |

### Actions

| Hook                                 | Priority | Effect                                        |
| ------------------------------------ | -------- | --------------------------------------------- |
| `woocommerce_single_product_summary` | 6        | Prints the member-only notice above the price |
| `wp_enqueue_scripts`                 | default  | Loads the module's frontend assets            |

### Shortcodes

| Shortcode                    | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `[aiowc_restricted_content]` | Wraps content shown only to members of a tier |
| `[aiowc_member_content]`     | Wraps member-visible content                  |
| `[aiowc_membership_info]`    | Prints the current user's membership details  |

No block is registered.

## Background jobs

Both use the WordPress cron scheduler.

| Hook                                 | Schedule | Purpose                                                       |
| ------------------------------------ | -------- | ------------------------------------------------------------- |
| `aiowc_membership_expire`            | Hourly   | Expires memberships past their end date and grace period      |
| `aiowc_membership_renewal_reminders` | Daily    | Sends renewal reminders `renewal_reminder_days` before expiry |

## Entitlement limits

The `membership` entitlement gates the whole module; there is no cap on the number of tiers, memberships
or access rules in the module's code.

## Related documentation

- [Module Architecture](/reference/architecture)
