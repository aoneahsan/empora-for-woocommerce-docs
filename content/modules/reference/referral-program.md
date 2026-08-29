---
id: referral-program
title: "Referral Program"
description: "Give each customer a referral code, attribute signups and orders back to the referrer, and record their reward, with a leaderboard."
keywords:
  - woocommerce referral program
  - referral codes
  - customer rewards
  - referral leaderboard
format: md
---
## Goal

Give each customer a referral code, attribute signups and orders back to whoever sent them, and record a
reward for the referrer. It is for shops that want customers recruiting customers, with a leaderboard and
optional tiers.

## Tier and entitlement

| Field           | Value              |
| --------------- | ------------------ |
| Tier            | Premium            |
| Entitlement key | `referral-program` |
| Admin tab       | `referrals`        |
| Module key      | `referral-program` |
| Settings prefix | `aiowc_ref_`       |

Hooks register only when `aiowc_module_enabled_referral-program` is true and the licence permits the
`referral-program` entitlement.

## How attribution works

1. A visitor arrives with `?ref=CODE`. On `init` at priority 5 the click is recorded and the code is
   written to the `aiowc_ref` cookie for `cookie_duration` days.
2. On `user_register`, a signup is recorded against the cookie's code. Self-referral is refused unless
   `allow_self_referral` is on.
3. On `woocommerce_checkout_order_processed`, the code is resolved to a referrer and a referral row is
   created for the order. An existing pending referral for the same order and referrer is not duplicated.
4. On `woocommerce_order_status_completed`, the referral becomes eligible for a reward.
5. The daily rewards job issues rewards for eligible referrals, subject to `min_order_total` and
   `require_approval`.

## Rewards — what is and is not wired

`Service/RewardService.php` writes a reward row, marks the referral `paid`, and then fires an action for
the payout:

| `reward_type`  | Action fired                   | Listener in the plugin |
| -------------- | ------------------------------ | ---------------------- |
| `store_credit` | `aiowc_award_store_credit`     | **None**               |
| `coupon`       | `aiowc_create_coupon_for_user` | **None**               |
| `cash`         | No action is fired             | —                      |

Nothing in this release listens to either action, and the Store Credit module is not registered. The
consequence is concrete: the reward is recorded in the plugin's own table and the referral is marked
paid, but no store credit is granted and no coupon is created. A site can supply its own listener for
either action; without one, the payout is a record only.

`redeemReward()` likewise only moves a reward row from `issued` to `redeemed`.

## Settings

Read through `ModuleSettings` with the `aiowc_ref_` prefix; defaults are
`ReferralProgramModule::DEFAULTS`. All ten are consulted.

| Setting               | Default        | Meaning                                                       |
| --------------------- | -------------- | ------------------------------------------------------------- |
| `enable_referrals`    | `true`         | Master switch                                                 |
| `commission_type`     | `percentage`   | How `commission_rate` is read                                 |
| `commission_rate`     | `10.0`         | Reward size, as a percentage or a fixed amount                |
| `reward_type`         | `store_credit` | One of `store_credit`, `coupon` or `cash`                     |
| `min_order_total`     | `0.0`          | Order value a referral must reach to earn a reward            |
| `cookie_duration`     | `30`           | Days the `aiowc_ref` cookie survives                          |
| `require_approval`    | `false`        | Whether a referral must be approved before a reward is issued |
| `allow_self_referral` | `false`        | Whether a user may redeem their own code                      |
| `enable_tiers`        | `true`         | Whether the tier system applies                               |
| `show_leaderboard`    | `true`         | Whether the public leaderboard is offered                     |

## Admin screen

Admin tab `referrals`. It lists referrals
by status, shows the programme statistics, and carries the settings form.

## Database schema

Created by `Schema/ReferralsSchema.php` at schema version `1.0.0`.

| Table                            | Holds                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `{prefix}aiowc_referral_codes`   | One code per participating user                                                                     |
| `{prefix}aiowc_referrals`        | Attributed signups and orders, with status                                                          |
| `{prefix}aiowc_referral_rewards` | Reward rows, with `reward_type` defaulting to `store_credit` and a status of `issued` or `redeemed` |
| `{prefix}aiowc_referral_tiers`   | Tier definitions; a user's current tier is held in the `_aiowc_referral_tier_id` user meta          |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Participant

| Method | Path                 | Purpose                            | Required args | Permission |
| ------ | -------------------- | ---------------------------------- | ------------- | ---------- |
| GET    | `/referrals/my-code` | The signed-in user's referral code | —             | Signed in  |
| GET    | `/referrals/stats`   | The signed-in user's own figures   | —             | Signed in  |
| GET    | `/referrals/rewards` | The signed-in user's rewards       | —             | Signed in  |
| POST   | `/referrals/redeem`  | Redeem one reward                  | `reward_id`   | Signed in  |

### Public

| Method | Path                     | Purpose                      | Required args | Permission               |
| ------ | ------------------------ | ---------------------------- | ------------- | ------------------------ |
| GET    | `/referrals/leaderboard` | Top referrers, up to `limit` | —             | Rate-limited public read |
| POST   | `/referrals/track-click` | Record a click on a code     | `code`        | Public write check       |

### Shop

Permission: manage.

| Method             | Path                         | Purpose                                           | Required args |
| ------------------ | ---------------------------- | ------------------------------------------------- | ------------- |
| GET                | `/referrals/admin/referrals` | List referrals, filterable by `status`, paginated | —             |
| GET                | `/referrals/admin/stats`     | Programme statistics                              | —             |
| GET                | `/referrals/settings`        | Read settings                                     | —             |
| PUT / PATCH / POST | `/referrals/settings`        | Update settings                                   | —             |

## WooCommerce and WordPress integration

| Hook                                   | Priority | Effect                                                                            |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `init`                                 | 5        | Reads `?ref=` from the request, records the click and sets the `aiowc_ref` cookie |
| `user_register`                        | 10       | Attributes a signup to the cookie's code                                          |
| `woocommerce_checkout_order_processed` | 10       | Creates the referral row for the order                                            |
| `woocommerce_order_status_completed`   | 10       | Makes the referral eligible for a reward                                          |

### Shortcode

| Shortcode                    | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `[aiowc_referral_dashboard]` | The participant's own code, statistics and rewards |

No block is registered.

### Emitted actions

| Action                                              | Fired when                                            |
| --------------------------------------------------- | ----------------------------------------------------- |
| `aiowc_award_store_credit`                          | A `store_credit` reward is issued — no listener ships |
| `aiowc_create_coupon_for_user`                      | A `coupon` reward is issued — no listener ships       |
| `aiowc_track_event` with `referral_reward_issued`   | A reward row is written                               |
| `aiowc_track_event` with `referral_reward_redeemed` | A reward is redeemed                                  |

## Background jobs

All three run on the WordPress cron scheduler, daily.

| Hook                             | Purpose                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `aiowc_referral_process_rewards` | Issues rewards for eligible referrals                                     |
| `aiowc_referral_tier_updates`    | Recalculates each participant's tier and writes `_aiowc_referral_tier_id` |
| `aiowc_referral_cleanup`         | Prunes referral data past the retention window                            |

## Entitlement limits

The `referral-program` entitlement gates the module as a whole. `min_order_total` and `commission_rate`
are programme settings, not licence limits, and no cap on codes, referrals or rewards is implemented.

## Related documentation

- [Module Architecture](/reference/architecture)
