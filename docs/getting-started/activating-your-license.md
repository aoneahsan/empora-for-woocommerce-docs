---
id: activating-your-license
title: Activating Your License
description: Enter and activate an Empora premium license to unlock premium modules, manage connected sites, and understand plan entitlements.
keywords:
  - empora license
  - activate woocommerce license
  - premium woocommerce modules
  - license key
sidebar_position: 3
---

# Activating Your License

A license is **only** required to enable premium modules. The free core never needs one.

## Where licenses come from

Buy a plan on the product website: [empora.aoneahsan.com/pricing](https://empora.aoneahsan.com/pricing). Plans are **Free**, **Professional**, **Business**, and **Enterprise**. Each paid tier unlocks a different combination of premium modules and allows a different number of connected sites. After purchase, your license key is shown in your account dashboard at [empora.aoneahsan.com/dashboard/license](https://empora.aoneahsan.com/dashboard/license).

## Activate inside WordPress

1. Go to **Empora → Settings → License**.
2. Paste your license key.
3. Click **Activate**.

The plugin calls the license server to activate the key for this site. On success the **License** page shows:

- The active **plan name**.
- The **maximum sites** allowed.
- The live **entitlement list** — exactly which premium modules this license unlocks.

Once activated, premium modules become available to toggle on under **Empora → Modules**.

## How activation works (under the hood)

The plugin talks to the backend License API:

| Action | Endpoint (plugin → server) |
|---|---|
| Activate this site | `POST /api/v1/licenses/activate` |
| Re-validate periodically | `POST /api/v1/licenses/validate` |
| Release this site | `POST /api/v1/licenses/deactivate` |

Activation binds the license to your site URL and counts against the plan's site limit. Validation runs on a schedule so entitlements stay current if you upgrade or downgrade.

See the [License API reference](/reference/license-api) for the full contract.

## Managing sites

You can connect a license to multiple sites up to the plan limit. To free a slot:

- **From WordPress:** **Empora → Settings → License → Deactivate** on the site you want to release.
- **From your account:** [empora.aoneahsan.com/dashboard/license](https://empora.aoneahsan.com/dashboard/license) → deactivate a site from the connected-sites list.

## Troubleshooting activation

| Symptom | Likely cause | Fix |
|---|---|---|
| "License limit reached" | All site slots are in use | Deactivate a site you no longer use, or upgrade the plan. |
| "Invalid license key" | Typo, or key belongs to a different account | Re-copy the key from your dashboard. |
| Premium modules still hidden | License activated but page cached | Reload **Empora → Modules**; the entitlement list refreshes on validation. |
| Activation request fails | Site cannot reach the license server | Confirm outbound HTTPS is allowed from your server. |

More: [Troubleshooting](/troubleshooting).
