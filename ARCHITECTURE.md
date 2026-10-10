# Architecture

## Overview

```
 Browser (React + Vite)                         Server (Express + TypeScript)
 ┌──────────────────────────┐   HTTP + JSON    ┌───────────────────────────────────────────┐
 │ pages/   (one per screen)│  X-Actor-Id hdr  │ routes      → URL + Zod validation        │
 │ hooks/   useApi useAction│ ───────────────▶ │ controller  → HTTP in/out, stays thin     │
 │ api/client.ts (only      │                  │ service     → workflow + audit log        │
 │   place that calls fetch)│ ◀─────────────── │   ├ stateMachine → allowed status moves   │
 │ actor/ "acting as"       │  { data } or     │   ├ rules/       → 5 pure labour rules    │
 └──────────────────────────┘  { error }       │   └ repository   → all Prisma queries     │
                                               │ errorHandler → one JSON error format      │
                                               └──────────────────┬────────────────────────┘
                                                                  │ Prisma
                                                           SQLite file (dev.db)
```

Each layer only talks to the one below it. The rules never touch the database, the controller
never contains business logic, and only the repository knows about Prisma.

## Backend folders

| Path | Responsibility |
| ---- | -------------- |
| `src/config/env.ts` | Validates environment variables at startup (fails fast) |
| `src/middleware/` | Actor lookup (`X-Actor-Id`), Zod validation, logging, 404, central error handler |
| `src/lib/AppError.ts` | Known errors with an HTTP status (400, 401, 403, 404, 409, 422) |
| `src/lib/time.ts` | UTC maths on `"YYYY-MM-DDTHH:MM"` strings (minutes, week start, hours) |
| `src/modules/listings/rules/` | One file per labour rule, plus `evaluateClaim` / `evaluateLabourRules` |
| `src/modules/listings/listing.stateMachine.ts` | The table of allowed status changes |
| `src/modules/listings/listing.service.ts` | Post, withdraw, claim, unclaim, approve, reject; writes history |
| `src/modules/listings/listing.repository.ts` | Database access, guarded updates, approval transaction |
| `src/db/seed.ts` | Loads `data/seed.json` once, only when the database is empty |

## Listing state machine

```
           claim (rules 1-5 pass)          approve (rules 2-5 re-checked)
   OPEN ─────────────────────────▶ CLAIMED ───────────────────────────▶ APPROVED
    │  ◀─────────────────────────    │                                  (shift reassigned)
    │        unclaim / reject        │
    ▼ withdraw                       ▼ approve fails → stays CLAIMED, reasons returned
 WITHDRAWN
```

A shift can have only one OPEN or CLAIMED listing at a time. Any move not in the table returns 409;
a claim on a listing that is not OPEN returns "This listing is no longer available" without checking
anything else.

## Claim rules

| # | Rule | File |
| - | ---- | ---- |
| 1 | You cannot claim your own shift (if broken, only this is reported) | `notOwnShift.rule.ts` |
| 2 | You need the shift's required certification | `certification.rule.ts` |
| 3 | No overlap with your shifts (`a.start < b.end && b.start < a.end`) | `noOverlap.rule.ts` |
| 4 | At least 11h rest between this shift and each of your other shifts | `minimumRest.rule.ts` |
| 5 | At most 40h in the Monday-to-Monday week the shift starts in | `weeklyHours.rule.ts` |

Every rule has the same shape, `(context) → violations[]`, and the engine runs all of them so the
user sees every reason at once, with the conflicting shift id.

## Key decisions

- **Optimistic concurrency instead of locks.** Status changes run as
  `UPDATE ... WHERE id = ? AND status = <expected>`. If two people claim at once, one update matches
  and the other changes 0 rows and gets 409. The workflow tests prove exactly one wins.
- **Approval in one transaction.** Marking the listing APPROVED and moving the shift to the claimer
  happen together or not at all.
- **Audit log written by one wrapper.** `audited()` in the service records every action, successful
  or refused, with the reasons, so no action can forget to log.
- **The server decides, the UI displays.** The open listings response includes `canClaim` and
  `reasons`, so the frontend never re-implements a rule.
- **No login.** The spec has no authentication, so the chosen person is sent in an `X-Actor-Id`
  header and checked against the staff table on every request.
- **SQLite via Prisma.** No setup and no paid service; switching to Postgres means changing the
  provider in `schema.prisma` and regenerating the migration.

## Testing

- `backend/tests/rules.test.ts`: the five rules in isolation, including exact boundaries (11h rest,
  40h week, a night shift crossing midnight).
- `backend/tests/listings.api.test.ts`: the full HTTP workflow against a fresh `test.db`, including
  role checks, the approval re-check and two simultaneous claims.
