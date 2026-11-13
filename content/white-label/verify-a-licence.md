---
id: verify-a-licence
title: "Verifying an Empora licence"
description: "Check an Empora white-label licence by its key or by the domain it runs on, and what each answer means."
slug: /white-label/verify-a-licence
sidebar_position: 5
last_update:
  date: 2026-11-13
keywords:
  - empora white label
  - white-label woocommerce plugin
  - verify licence key
---

# Verifying a licence

Anyone can check a white-label deployment on the [verify page](https://empora.aoneahsan.com/verify-license).
Verification is run by our licence service.

## By key

Enter the key from the certificate. The answer is one of:

| Answer | Meaning |
| --- | --- |
| Active licence | Paid, set up and in force |
| Paid, and being set up | The payment cleared; the deployment is not live yet |
| Revoked | The licence was used outside its terms and is no longer in force |
| No licence has that key | The key is well formed but unknown |
| That is not the shape of an Empora key | The text is not a key at all |

## By domain

Enter the address a deployment runs on. Our licence service reads
`https://<domain>/.well-known/empora-white-label-license.json` and checks the key it names. It reports whether the
domain holds a licence, names a licence for a different domain, serves no file, or could not be reached.

## What a check shows

Who holds the licence, its domains and parts, when it was issued and until when it is updated. Never an email, a
phone number, a price or a private key.
