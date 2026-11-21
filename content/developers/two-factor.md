---
id: two-factor
title: Two-factor sign-in
description: Turn on two-factor sign-in for your Empora account, keep your ten recovery codes, skip the code on a trusted browser for 7 days, and get back in after losing your phone.
sidebar_position: 6
keywords:
  - empora two-factor
  - empora 2fa
  - empora recovery codes
  - lost authenticator phone
  - empora sign-in security
last_update:
  date: 2026-11-21
---

# Two-factor sign-in

**Two-factor adds a code from your phone to every sign-in to your Empora account.** Google proves who you are; the
code proves it is you signing in now. It is off unless you turn it on, and it is in your account under
**Settings, [Security](https://empora.aoneahsan.com/dashboard/settings?tab=security)**.

Once it is on, Empora also asks for a code before it shows an [access key](./access-keys.md) or a
[signing secret](./webhooks.md#adding-an-address) again, and the page for connecting an
[assistant](./assistants.md) opens only once your sign-in has passed two-factor. It protects your Empora account, not your WordPress admin: the plugin's own sign-in is unchanged.

## Setting it up {#setting-it-up}

1. Choose **Turn on two-factor**. If your last Google sign-in is more than 10 minutes old, Empora asks you to confirm
   with Google first, because this changes how you sign in.
2. **Scan the QR code** with your authenticator app. Google Authenticator, Microsoft Authenticator, 1Password and
   Authy all work. If you cannot scan it, type the key shown under it into the app instead.
3. **Enter the six digits** the app shows, and choose **Check the code**.
4. **Save your ten recovery codes.** They appear once the code is accepted. Use **Copy all** or **Download**, which
   saves `empora-recovery-codes.txt`, then tick *"I have saved these codes somewhere other than my phone"*.

Two-factor is on from the moment the code is accepted, so save the codes before you close the window. Empora emails
you to say it was turned on. The key to scan is held for 10 minutes; after that, start again.

## Signing in {#signing-in}

You sign in with Google as before. Empora then asks for the six-digit code for Empora from your authenticator app.

After five codes in a row that do not match, Empora waits 5 minutes before it takes another code. A recovery code
still works during the wait. A code that does not match is usually a phone whose clock has drifted: set it to the
network time, then try the newest code.

### Remembering a browser {#remembering-a-browser}

Under the code box, tick *"Skip the code on this browser for 7 days"* on a browser you trust. That browser then
signs in with Google alone for 7 days; Google is still asked every time.

- A browser is remembered only after a code from your phone, never after a recovery code, and never unless you tick
  the box.
- A remembered browser does not count as a code for showing keys and secrets. Empora still asks for one.
- **Remembered browsers** in Security lists each one with the date it was remembered and when it asks again.
  **Forget** one, or **Forget all**, and the next sign-in there asks for a code.

## Recovery codes {#recovery-codes}

You get ten. Each is ten characters with a dash, like `k7m2q-x9tpa`, and each signs you in once if you lose your
phone. Empora shows them only when they are made and keeps only a fingerprint of each, so it cannot show them to you
again, and neither can anyone at Empora.

- Using one emails you, with how many are left. Security shows the count too.
- **Make new recovery codes** needs a code from your phone. The old set stops working the moment the new one is made.
- Keep them somewhere other than your phone: a password manager, or printed and put away.

## A new phone {#a-new-phone}

**Move to a new phone** asks first for a code from the phone you use now, or a recovery code if that phone is gone.
Then scan the new key with the new phone and enter its code. Your recovery codes stay the same, and codes from the
old phone stop working.

## Turning it off {#turning-it-off}

**Turn off two-factor** needs a code from your phone. Then:

- signing in goes back to Google alone;
- every remembered browser is forgotten;
- your recovery codes stop working;
- access keys and signing secrets show again after a Google confirmation alone.

Empora emails you to say it was turned off, in case it was not you. You can turn it back on at any time, with a new
key and a new set of codes.

## Losing your phone {#losing-your-phone}

1. **Sign in with a recovery code.** On the code page, choose *Use a recovery code instead*.
2. **Move to a new phone** in Security, proving it with a second recovery code, or **Turn off two-factor** once you
   can enter a code again.
3. **Make new recovery codes** once the new phone works, since the set you have is now shorter.

With no phone and no recovery codes left, write to [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com) **from the
Google address you sign in with**. We check it is you before resetting anything.

### What support can and cannot do {#what-support-can-do}

Support can do one thing: turn two-factor off on your account, after checking that the request came from your
Google address. The reset needs a written reason, which Empora keeps in its record of your account with the name of the
person who did it, and Empora emails you that it happened. It also:

- forgets every remembered browser;
- signs you out everywhere, which also ends any [older keys](./access-keys.md#moving-from-older-keys), since those
  belong to sign-ins;
- makes your recovery codes stop working.

Your `em_pat_` access keys, connected assistants and webhook addresses are left as they are. Once you are back in,
turn two-factor on again with your new phone.

Support cannot:

- see your recovery codes, because Empora keeps only a fingerprint of each;
- make you a new set, or move two-factor to a new phone for you; only you can, in Security;
- show you an access key or a signing secret.

Support does not reset two-factor from a message that did not come from your Google address, whoever it says it is
from.

## Recent sign-ins {#recent-sign-ins}

Security lists recent sign-ins to your account: the browser, the time, and how each one got through (Google, Google
and a code, Google and a recovery code, or Google with a remembered browser). Nothing about where you were. Every
sign-in and every refused code is recorded.

**Sign out everywhere else** ends every other sign-in of your account, in other browsers and apps, at once. This
browser stays signed in.
