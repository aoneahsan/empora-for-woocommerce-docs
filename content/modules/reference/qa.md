---
id: qa
title: "Product Questions & Answers"
description: "Let shoppers ask questions on a product page and let the shop or other customers answer, held in dedicated tables rather than as comments."
keywords:
  - woocommerce product questions
  - product q and a
  - customer answers
  - question moderation
format: md
---
## Goal

Let shoppers ask a question on a product page and let the shop — or other customers — answer it.
Questions and answers are held in the plugin's own tables rather than as WordPress comments, pass through
a moderation queue, and can be voted on.

## Tier and entitlement

| Field           | Value        |
| --------------- | ------------ |
| Tier            | Premium      |
| Entitlement key | `qa`         |
| Admin tab       | `product-qa` |
| Module key      | `qa`         |
| Settings prefix | `aiowc_qa_`  |

Hooks register only when `aiowc_module_enabled_qa` is true and the licence permits the `qa` entitlement.

## What the code does

- A question form and the question list render below the product summary on the single product page, and
  the same list is available anywhere through a shortcode.
- Guests may ask a question when `allow_guest_questions` is on, supplying a name and email address.
  Signed-in users are identified by their account.
- New questions and answers land as `pending` when `require_approval` is on, and are only shown once
  approved.
- Moderation moves an item to `approved`, `rejected` or `spam`. The same three transitions exist for both
  questions and answers, selected by the `type` argument.
- Voting is recorded in its own table against either a question or an answer.
- A daily job notifies the shop about questions that are still unanswered.
- Answers submitted through the REST API require a signed-in user; questions do not.

## Settings

Read through `ModuleSettings` with the `aiowc_qa_` prefix; defaults are `QaModule::DEFAULTS`.

| Setting                 | Default | Meaning                                            | Consumed                                                                   |
| ----------------------- | ------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| `allow_guest_questions` | `true`  | Whether a signed-out visitor may ask               | Yes — the product form and the ask service                                 |
| `require_approval`      | `true`  | Whether new questions and answers start as pending | Yes — the question and answer services                                     |
| `notify_admin`          | `true`  | Whether the shop is emailed about new activity     | Yes — the notification service                                             |
| `enable_shortcode`      | `true`  | Whether `[aiowc_qa]` is registered at all          | Yes — checked before `add_shortcode`                                       |
| `enable_voting`         | `true`  | Intended to switch voting off                      | **No** — the key is declared but never read, so voting is always available |

There is no REST endpoint for these settings. The module registers no settings route, so the values can
only be changed through the options they are stored in.

## Admin screen

Admin tab `product-qa`. Two tabs —
**Questions** and **Answers** — both showing the pending moderation queue with approve, reject and spam
actions, backed by the moderation endpoints below. The screen carries no settings form, matching the
absence of a settings endpoint.

## Database schema

Created by `Schema/QaSchema.php` at schema version `1.0.0`.

| Table                        | Holds                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `{prefix}aiowc_qa_questions` | Questions, with product, author, status and timestamps |
| `{prefix}aiowc_qa_answers`   | Answers belonging to a question                        |
| `{prefix}aiowc_qa_votes`     | Votes cast against a question or an answer             |

## REST endpoints

Namespace `aiowc/v1`. All responses use the shared envelope.

### Public and customer

| Method | Path               | Purpose                                                                | Required args            | Permission               |
| ------ | ------------------ | ---------------------------------------------------------------------- | ------------------------ | ------------------------ |
| GET    | `/qa/product/{id}` | Questions and answers for a product, filterable by `status`, paginated | `id`                     | Rate-limited public read |
| POST   | `/qa/ask`          | Ask a question; also accepts `author_name` and `author_email`          | `product_id`, `question` | Public write check       |
| POST   | `/qa/{id}/answer`  | Answer a question                                                      | `id`, `answer`           | Signed in                |
| POST   | `/qa/{id}/vote`    | Vote on a question or an answer; `target` selects which                | `id`, `value`            | Public write check       |

### Moderation

Permission: manage. Each takes a `type` argument selecting question or answer.

| Method | Path                          | Purpose                                        | Required args |
| ------ | ----------------------------- | ---------------------------------------------- | ------------- |
| GET    | `/qa/moderation/queue`        | Pending items, filterable by `type`, paginated | —             |
| POST   | `/qa/moderation/{id}/approve` | Approve an item                                | `id`          |
| POST   | `/qa/moderation/{id}/reject`  | Reject an item                                 | `id`          |
| POST   | `/qa/moderation/{id}/spam`    | Mark an item as spam                           | `id`          |

## WooCommerce and WordPress integration

| Hook                                       | Priority | Effect                                          |
| ------------------------------------------ | -------- | ----------------------------------------------- |
| `woocommerce_after_single_product_summary` | 60       | Renders the Q&A block below the product summary |
| `init`                                     | default  | Handles the non-JavaScript form submission      |

### Shortcode

| Shortcode    | Purpose                                                             |
| ------------ | ------------------------------------------------------------------- |
| `[aiowc_qa]` | Renders the Q&A list. Registered only when `enable_shortcode` is on |

No block is registered, and the module hooks no WooCommerce order or email action.

## Background jobs

| Hook                         | Schedule                               | Purpose                                      |
| ---------------------------- | -------------------------------------- | -------------------------------------------- |
| `aiowc_qa_notify_unanswered` | Daily, on the WordPress cron scheduler | Notifies the shop about unanswered questions |

## Entitlement limits

The `qa` entitlement gates the module as a whole. There is no cap on questions, answers or votes in the
module's code.

## Related documentation

- [Module Architecture](/reference/architecture)
