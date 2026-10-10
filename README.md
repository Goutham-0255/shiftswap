# ShiftSwap

Shift-swap system for CityCare Clinic: staff post shifts they cannot work, colleagues claim them,
managers approve or reject. Every action is validated against the clinic's labour rules, every
refusal explains why, and every action is recorded in a history log.

## Engineering highlights

- **Rules engine (strategy pattern):** each labour rule is its own module with the same
  `check(context) → violations[]` shape; the engine runs all of them and reports every violation
  with the conflicting shift. Adding a rule means adding one file.
- **Pure, unit-tested rules:** rules never touch the database, so boundaries (exactly 11h rest,
  exactly 40h, night shifts crossing midnight) are covered by fast unit tests.
- **Time-zone-proof time maths:** shift times are converted with UTC arithmetic, so the server's
  own time zone or daylight saving can never change a rule's result.
- **Seed only when empty:** `seed.json` is loaded in a single transaction only when the database
  has no data, so restarts never overwrite saved state.
- **State machine for listings:** every allowed status change (`OPEN → CLAIMED`, `CLAIMED → APPROVED`, ...)
  lives in one table; any other move is refused in one place.
- **Optimistic concurrency:** claims and approvals update a listing only if it is still in the status
  that was read (`WHERE status = 'OPEN'`), so two people clicking at the same moment cannot both win.
- **Atomic approval:** reassigning the shift and approving the listing run in one database transaction.
- **Append-only audit trail:** every action is recorded with its outcome, including refusals and their
  reasons.

## Tech stack

| Layer    | Choice                                  |
| -------- | --------------------------------------- |
| Frontend | React, Vite, TypeScript                 |
| Backend  | Node.js, Express 5, TypeScript, Zod     |
| Database | SQLite via Prisma (local file, no setup) |
| Tests    | Vitest, Supertest                       |

## Running locally

Requirements: Node 20+.

```bash
# Backend (http://localhost:4000)
cd backend
cp .env.example .env
npm install
npm run db:deploy    # creates the SQLite database
npm run dev          # loads seed.json on first start
npm test

# Frontend (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev
```

## Assumptions

- All shift times are local clinic time; the real current date never affects any rule.
- Hours for rule 5 are each shift's full length, counted in the week the shift starts.
