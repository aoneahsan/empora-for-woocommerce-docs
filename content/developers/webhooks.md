---
id: webhooks
title: Webhooks
description: Have Empora send a signed message to a server of yours when a licence, site, plan or store connection changes, with every event, sample deliveries, and signature checks in Node and PHP.
sidebar_position: 5
keywords:
  - empora webhooks
  - woocommerce licence webhook
  - standard webhooks php
  - verify webhook signature node
  - whsec signing secret
last_update:
  date: 2026-11-21
---

# Webhooks

**A webhook is an address on a server of yours that Empora sends a signed message to when something changes on your
account.** A licence renews, a site is deactivated, a payment does not go through, a store stops syncing: your own
systems hear about it without asking. Each delivery carries the licence, site, plan or connection as the
[API](./api.md) returns it, and never a licence key, a store credential or anything about your shoppers.

You set addresses up in your account, under **Settings, [Other apps](https://empora.aoneahsan.com/dashboard/settings?tab=apps), Webhooks**.

## Adding an address {#adding-an-address}

1. Choose **Add an address**.
2. Enter an `https` address on a server of yours, like `https://hooks.yourstore.com/empora`.
3. Add a note if it helps, like *Slack alert for licence changes*.
4. Choose the events it should hear. At least one.
5. Choose **Add the address**. Adding an address makes a signing secret, so Empora asks you to confirm it is you if
   your last sign-in is more than 10 minutes old, and with [two-factor](./two-factor.md) on, for a code as well.

Empora shows the signing secret, which starts `whsec_`, and sends a test straight away. Copy the secret into your
server: it is how your side proves a delivery came from Empora. Within 10 minutes of signing in you can see it again
with **Signing secret**, and after that Empora asks you to confirm first.

## Addresses Empora refuses {#addresses-empora-refuses}

Empora checks the address when you add it and again before every send. It refuses eight kinds:

| Refused | Why |
|---|---|
| Anything but `https` | Every delivery is signed, and a signature is only worth something over https |
| A user name or password in the address | The signature already proves the sender, so the address needs none |
| A port other than 443 or 8443 | Empora sends to no other ports |
| The machine itself (`localhost`, `127.0.0.1`, `::1`) | That is the server the address runs on, not one on the internet |
| A private, link-local, shared or multicast address | Such as `10.0.0.5`, `192.168.1.20`, `169.254.169.254` or `100.64.0.1`. No one online can reach them |
| A name that works only inside a network | Names ending in `.local`, `.internal`, `.lan`, `.home` or `.corp` |
| One of Empora's own addresses | Anything on `aoneahsan.com`. Point it at a server of yours |
| A name that points to any of the above | Empora looks the name up and refuses it when any answer is one of those addresses |

The last check also runs at send time, and Empora connects to exactly the address it checked, so a name cannot be
pointed somewhere private between the check and the send. Numeric forms such as `2130706433` or `0x7f.1` are read as
the address they are.

Each refusal says which rule it broke. An address on your WooCommerce store's own domain is fine, as long as it is
public and on https.

## Events {#events}

| Event | Sent when | `data` holds |
|---|---|---|
| `licence.created` | A licence was added to your account | [The licence](#licence-events) |
| `licence.renewed` | A licence expiry date moved later | [The licence](#licence-events) |
| `licence.expired` | A licence reached its expiry date | [The licence](#licence-events) |
| `licence.suspended` | A licence was suspended | [The licence](#licence-events) |
| `licence.revoked` | A licence was revoked | [The licence](#licence-events) |
| `activation.activated` | A site was activated on a licence | [The site](#site-events) |
| `activation.deactivated` | A site was deactivated | [The site](#site-events) |
| `subscription.started` | A paid plan started | [The plan](#plan-events) |
| `subscription.plan_changed` | Your plan changed | [The plan](#plan-events) |
| `subscription.renewed` | Your plan renewed | [The plan](#plan-events) |
| `subscription.past_due` | A payment did not go through | [The plan](#plan-events) |
| `subscription.canceled` | Your plan was cancelled | [The plan](#plan-events) |
| `connection.connected` | A store was connected | [The connection](#connection-events) |
| `connection.renamed` | A connection was renamed | [The connection](#connection-events) |
| `connection.sync_failed` | A store failed to sync three times in a row | [The connection](#connection-events) |
| `connection.disconnected` | A store was disconnected | [The connection](#connection-events) |
| `webhook.test` | Sent only when you press **Send a test**, add an address or turn one back on | [A test](#test-event) |

An event is raised by the change itself, whichever way it happened: your dashboard, the plugin, a payment, a key,
an assistant or the Empora team. So one change sends one event, once, to every address that hears it. `subscription.canceled` and its `status` value are spelt
`canceled`, with one l, exactly as they arrive; match that spelling in your code.

## What a delivery looks like {#what-a-delivery-looks-like}

Each delivery is a `POST` with a JSON body and these headers:

```text
POST /empora HTTP/1.1
Host: hooks.yourstore.com
Content-Type: application/json
User-Agent: Empora-Webhooks/1.0
webhook-id: msg_2Kp7vQ9xLm4TzR8wNc3bYh
webhook-timestamp: 1795252443
webhook-signature: v1,Kd3/gYx/g1NffbIUFddudPFyF9nek+pZwDttre1DASo=

{"type":"licence.renewed","timestamp":"2026-11-21T09:14:03Z","data":{"id":4182,"plan":"professional","status":"active","expires_at":"2027-11-21T09:14:03+00:00","max_sites":1,"active_sites":1,"created_at":"2025-11-21T09:12:40+00:00"}}
```

| Part | Holds |
|---|---|
| `webhook-id` | One id per event. It stays the same on every retry and on **Send again**, so your side can ignore a repeat |
| `webhook-timestamp` | When this attempt was signed, in seconds since 1970 (UTC) |
| `webhook-signature` | `v1,` and a base64 HMAC-SHA256. For 24 hours after you replace the secret, two entries separated by a space |
| `type` | The event name |
| `timestamp` | When the event happened, in UTC |
| `data` | The licence, site, plan or connection, with the same fields the API returns |

This follows [Standard Webhooks](https://www.standardwebhooks.com), so any library written for it verifies an
Empora delivery as it is.

## Sample deliveries {#sample-deliveries}

Each sample is the body only. The values are examples.

### Licence events {#licence-events}

`licence.created`, `licence.renewed`, `licence.expired`, `licence.suspended` and `licence.revoked` carry the licence.

```json title="licence.created"
{"type":"licence.created","timestamp":"2026-11-21T09:12:40Z","data":{"id":4183,"plan":"business","status":"active","expires_at":"2027-11-21T09:12:40+00:00","max_sites":3,"active_sites":0,"created_at":"2026-11-21T09:12:40+00:00"}}
```

```json title="licence.renewed"
{"type":"licence.renewed","timestamp":"2026-11-21T09:14:03Z","data":{"id":4182,"plan":"professional","status":"active","expires_at":"2027-11-21T09:14:03+00:00","max_sites":1,"active_sites":1,"created_at":"2025-11-21T09:12:40+00:00"}}
```

```json title="licence.expired"
{"type":"licence.expired","timestamp":"2026-11-21T00:00:05Z","data":{"id":3977,"plan":"starter","status":"expired","expires_at":"2026-11-21T00:00:00+00:00","max_sites":1,"active_sites":1,"created_at":"2025-11-20T14:02:51+00:00"}}
```

```json title="licence.suspended"
{"type":"licence.suspended","timestamp":"2026-11-21T10:30:00Z","data":{"id":4182,"plan":"professional","status":"suspended","expires_at":"2027-11-21T09:14:03+00:00","max_sites":1,"active_sites":1,"created_at":"2025-11-21T09:12:40+00:00"}}
```

```json title="licence.revoked"
{"type":"licence.revoked","timestamp":"2026-11-21T10:31:12Z","data":{"id":4182,"plan":"professional","status":"revoked","expires_at":"2027-11-21T09:14:03+00:00","max_sites":1,"active_sites":0,"created_at":"2025-11-21T09:12:40+00:00"}}
```

### Site events {#site-events}

`activation.activated` and `activation.deactivated` carry the site. `licence_id` says which licence it is on.

```json title="activation.activated"
{"type":"activation.activated","timestamp":"2026-11-21T11:20:15Z","data":{"id":9032,"licence_id":4183,"site_url":"https://wholesale.example.com","site_name":"Harbour Tea Wholesale","wp_version":"6.8.3","wc_version":"10.3.0","plugin_version":"1.0.0","is_active":true,"activated_at":"2026-11-21T11:20:15+00:00","last_validated_at":"2026-11-21T11:20:15+00:00"}}
```

```json title="activation.deactivated"
{"type":"activation.deactivated","timestamp":"2026-11-21T11:45:02Z","data":{"id":9031,"licence_id":4182,"site_url":"https://shop.example.com","site_name":"Harbour Tea Co.","wp_version":"6.8.3","wc_version":"10.3.0","plugin_version":"1.0.0","is_active":false,"activated_at":"2026-02-03T11:20:15+00:00","last_validated_at":"2026-11-21T06:00:02+00:00"}}
```

### Plan events {#plan-events}

`subscription.started`, `subscription.plan_changed`, `subscription.renewed`, `subscription.past_due` and
`subscription.canceled` carry the plan. No card details, ever.

```json title="subscription.started"
{"type":"subscription.started","timestamp":"2026-11-21T09:10:00Z","data":{"plan":"starter","status":"active","current_period_end":"2026-12-21T09:10:00+00:00","cancel_at_period_end":false,"pending_plan":null}}
```

```json title="subscription.plan_changed"
{"type":"subscription.plan_changed","timestamp":"2026-11-21T12:00:41Z","data":{"plan":"professional","status":"active","current_period_end":"2026-12-21T09:10:00+00:00","cancel_at_period_end":false,"pending_plan":null}}
```

```json title="subscription.renewed"
{"type":"subscription.renewed","timestamp":"2026-12-21T09:10:07Z","data":{"plan":"professional","status":"active","current_period_end":"2027-01-21T09:10:00+00:00","cancel_at_period_end":false,"pending_plan":null}}
```

```json title="subscription.past_due"
{"type":"subscription.past_due","timestamp":"2027-01-21T09:11:30Z","data":{"plan":"professional","status":"past_due","current_period_end":"2027-01-21T09:10:00+00:00","cancel_at_period_end":false,"pending_plan":null}}
```

```json title="subscription.canceled"
{"type":"subscription.canceled","timestamp":"2027-01-24T09:11:30Z","data":{"plan":"professional","status":"canceled","current_period_end":"2027-01-21T09:10:00+00:00","cancel_at_period_end":false,"pending_plan":null}}
```

### Connection events {#connection-events}

`connection.connected`, `connection.renamed`, `connection.sync_failed` and `connection.disconnected` carry the store
connection. `totals` holds numbers only. `connection.disconnected` carries the connection as it was just before it
went.

```json title="connection.connected"
{"type":"connection.connected","timestamp":"2026-11-21T13:02:19Z","data":{"id":312,"name":"Harbour Tea Wholesale","url":"https://wholesale.example.com","status":"connected","last_sync_at":null,"last_sync_status":null,"totals":null,"created_at":"2026-11-21T13:02:19+00:00"}}
```

```json title="connection.renamed"
{"type":"connection.renamed","timestamp":"2026-11-21T13:10:44Z","data":{"id":311,"name":"Harbour Tea, retail","url":"https://shop.example.com","status":"connected","last_sync_at":"2026-11-21T08:00:11+00:00","last_sync_status":"ok","totals":{"orders":12,"revenue":340.5},"created_at":"2026-03-14T16:41:09+00:00"}}
```

```json title="connection.sync_failed"
{"type":"connection.sync_failed","timestamp":"2026-11-21T14:00:09Z","data":{"id":311,"name":"Harbour Tea, retail","url":"https://shop.example.com","status":"error","last_sync_at":"2026-11-21T14:00:09+00:00","last_sync_status":"error","totals":{"orders":12,"revenue":340.5},"created_at":"2026-03-14T16:41:09+00:00"}}
```

```json title="connection.disconnected"
{"type":"connection.disconnected","timestamp":"2026-11-21T14:20:55Z","data":{"id":311,"name":"Harbour Tea, retail","url":"https://shop.example.com","status":"error","last_sync_at":"2026-11-21T14:00:09+00:00","last_sync_status":"error","totals":{"orders":12,"revenue":340.5},"created_at":"2026-03-14T16:41:09+00:00"}}
```

`connection.sync_failed` is sent on the third failure in a row, not on each one, and not again until a sync has
worked and three more have failed.

### The test event {#test-event}

`webhook.test` is never sent by a change on your account. `address` is the reference of the address it was sent to.

```json title="webhook.test"
{"type":"webhook.test","timestamp":"2026-11-21T09:20:00Z","data":{"address":"wh_3fk8q2mzv7tx9pd4hc6n","message":"A test from Empora. If your server checked the signature and answered 2xx, this address works."}}
```

## Checking the signature {#checking-the-signature}

Check every delivery before you act on it. The signature is an HMAC-SHA256 of three things joined by full stops: the
`webhook-id`, the `webhook-timestamp`, and the body **exactly as it arrived**. The key is the part of your secret
after `whsec_`, base64-decoded.

Three rules make a check correct:

- **Use the raw body.** Parsing the JSON and encoding it again changes the bytes, and the signature no longer matches.
- **Compare in constant time,** and accept a match with any `v1` entry: after you replace the secret, two arrive.
- **Refuse an old timestamp.** Five minutes either side of your clock is the usual window. Empora signs each attempt
  when it sends it, so a retry carries a fresh timestamp.

### Node {#node}

No package needed. Node's own `crypto` does the work.

```js title="verify-empora.mjs"
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Checks one Empora delivery. `rawBody` is the request body exactly as it arrived,
 * before any JSON parsing. Returns true only for a genuine, recent delivery.
 */
export function verifyEmporaDelivery({ rawBody, headers, secret, toleranceSeconds = 300 }) {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signatures = headers['webhook-signature'];
  if (!id || !timestamp || !signatures) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  // Two signatures arrive for 24 hours after you replace the secret: accept either.
  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
```

A small server that uses it, with Node's own `http`, so the body is never parsed before the check:

```js title="server.mjs"
import { createServer } from 'node:http';
import { verifyEmporaDelivery } from './verify-empora.mjs';

createServer((req, res) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const ok = verifyEmporaDelivery({ rawBody, headers: req.headers, secret: process.env.EMPORA_WEBHOOK_SECRET });
    if (!ok) {
      res.writeHead(401).end();
      return;
    }
    const event = JSON.parse(rawBody);
    // Hand the event to a queue here, and answer straight away.
    res.writeHead(204).end();
  });
}).listen(8080);
```

With Express, read the body with `express.raw({ type: 'application/json' })` on this route, so `req.body` is still
the raw bytes when you check it.

### PHP {#php}

Plain PHP 8.1, nothing to install:

```php title="verify-empora.php"
<?php
/**
 * Checks one Empora delivery. $raw_body is the request body exactly as it arrived,
 * before json_decode(). Returns true only for a genuine, recent delivery.
 */
function empora_verify_delivery(string $raw_body, string $id, string $timestamp, string $signatures, string $secret, int $tolerance = 300): bool
{
    if ($id === '' || $signatures === '' || ! ctype_digit($timestamp)) {
        return false;
    }
    if (abs(time() - (int) $timestamp) > $tolerance) {
        return false;
    }

    $key = base64_decode(preg_replace('/^whsec_/', '', $secret), true);
    if ($key === false) {
        return false;
    }
    $expected = base64_encode(hash_hmac('sha256', $id . '.' . $timestamp . '.' . $raw_body, $key, true));

    // Two signatures arrive for 24 hours after you replace the secret: accept either.
    foreach (explode(' ', $signatures) as $entry) {
        [$version, $value] = array_pad(explode(',', $entry, 2), 2, '');
        if ($version === 'v1' && hash_equals($expected, $value)) {
            return true;
        }
    }

    return false;
}
```

On a standalone PHP endpoint, read the body with `file_get_contents('php://input')` and the headers from
`$_SERVER['HTTP_WEBHOOK_ID']`, `$_SERVER['HTTP_WEBHOOK_TIMESTAMP']` and `$_SERVER['HTTP_WEBHOOK_SIGNATURE']`.

### On your WordPress site {#on-wordpress}

If the receiver is your WooCommerce site, a small plugin or your theme's `functions.php` can register a REST route
for it. `WP_REST_Request::get_body()` returns the raw body, which is what the check needs. Keep the secret in
`wp-config.php`, not in the database.

```php title="empora-webhook-receiver.php"
<?php
/**
 * Plugin Name: Empora webhook receiver
 * Description: Receives signed deliveries from Empora at /wp-json/empora-hooks/v1/receive.
 */

// In wp-config.php: define( 'EMPORA_WEBHOOK_SECRET', 'whsec_…' );

require_once __DIR__ . '/verify-empora.php';

add_action( 'rest_api_init', function () {
    register_rest_route( 'empora-hooks/v1', '/receive', array(
        'methods'             => 'POST',
        'permission_callback' => function ( WP_REST_Request $request ) {
            return empora_verify_delivery(
                $request->get_body(),
                (string) $request->get_header( 'webhook-id' ),
                (string) $request->get_header( 'webhook-timestamp' ),
                (string) $request->get_header( 'webhook-signature' ),
                (string) EMPORA_WEBHOOK_SECRET
            );
        },
        'callback'            => function ( WP_REST_Request $request ) {
            $event = json_decode( $request->get_body(), true );
            // Remember $request->get_header( 'webhook-id' ) and skip one you have seen.
            // Schedule the slow work, for example with as_enqueue_async_action(), and answer at once.
            return new WP_REST_Response( null, 204 );
        },
    ) );
} );
```

The address to add in Empora is then `https://yourstore.com/wp-json/empora-hooks/v1/receive`. A refused signature
answers `401` from WordPress, which Empora counts as a failure and tries again.

### Test your check against this delivery {#test-vector}

Before you point a real address at your code, run it against this delivery. The secret below is an example made for
this page and signs nothing else.

| Input | Value |
|---|---|
| Secret | `whsec_ZW1wb3JhLWRvY3MtZXhhbXBsZS1ub3QtYS1zZWNyZXQ=` |
| `webhook-id` | `msg_2Kp7vQ9xLm4TzR8wNc3bYh` |
| `webhook-timestamp` | `1795252443` |
| Body | the `licence.renewed` body in [What a delivery looks like](#what-a-delivery-looks-like), exactly, with no newline at the end |
| Expected `webhook-signature` | `v1,Kd3/gYx/g1NffbIUFddudPFyF9nek+pZwDttre1DASo=` |

Your check should accept it once you widen the time window to let a 2026 timestamp through, and refuse it when one
character of the body changes. The value was produced by Empora's own signing code and both checks on this page pass
it.

## Answering a delivery {#answering-a-delivery}

Answer with any `2xx` within 10 seconds. Do the slow work afterwards, from a queue, because Empora waits no longer.

- A `3xx` counts as a failure. Redirects are never followed, so give Empora the final address.
- Empora keeps only the status and the first 4 KB of your answer for the delivery log, never its headers.
- `410 Gone` turns the address off at once. Use it when the address is retired for good.

## Retries and turning off {#retries}

A delivery that fails is tried again after 5 seconds, 5 minutes, 30 minutes, 2 hours, 5 hours and twice after
10 hours: eight tries in all. Each retry carries the same `webhook-id`.

When an address has failed for 5 days in a row, Empora turns it off and emails you with its last answer. Nothing is
sent to it after that. Choose **Turn on** when it answers again: Empora sends a test first, and the address stays
off unless the test gets a `2xx`.

## Pause, test, send again {#pause-test-send-again}

- **Pause** stops deliveries to an address without removing it. Events raised while it is paused wait in its
  deliveries, and go out, oldest first, when you turn it back on (Empora sends a test first). Events older than the
  30-day log are not kept. An address that Empora **turned off** after failures does not collect events: those are
  listed as skipped, and **Send again** sends any one of them.
- **Send a test** sends a `webhook.test` event to the address, whatever its state. Its answer shows under
  **Deliveries**.
- **Deliveries** lists what went to an address in the last 30 days: the event, when, the answer, how many tries,
  and the next try. **Send again** sends an event again with the same `webhook-id` and a fresh set of tries.
- **Remove** deletes the address. Nothing more goes to it.

Changing an address's URL or events keeps its signing secret.

## Replacing the signing secret {#replacing-the-secret}

**Replace the secret** makes a new one. For the next 24 hours each delivery carries two signatures, one from each
secret, so you can swap the secret on your server without missing a delivery. After 24 hours, only the new one signs.
Replacing needs the same confirmation as showing it.

## How many addresses you can have {#how-many-addresses}

Free allows 3 webhook addresses, Starter, Professional and Business allow 20, and Enterprise allows 40. Paused and
turned-off addresses count; removing one frees its place.
