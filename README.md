# ShiftSwap

Shift-swap system for CityCare Clinic: staff post shifts they cannot work, colleagues claim them,
managers approve or reject. Every action is validated against the clinic's labour rules, every
refusal explains why, and every action is recorded in a history log.

## Try it (2-minute demo)

Start both apps, open http://localhost:5173 and use "Acting as" at the top right.

1. **Asha (S1)** → My shifts → **Post** SH004 (Mon 2 Mar, 15:00–23:00, needs ICU).
2. **Ben (S2)** → Open listings: SH004 shows why he can't claim it: Rule 2 (no ICU) and Rule 4
   (not enough rest next to his other shifts).
3. **Tarun (S6)** → Open listings → **Claim** SH004. It moves to "My claims, waiting for a manager".
4. **Meera (M1)** → Approvals → **Approve**. SH004 now belongs to Tarun (see his My shifts).
5. **History**: every step above with who did it and when. Refused actions (for example a claim on a
   listing someone else just took) are shown in red with their reasons.

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
- **Workflow tests:** API tests cover the full post → claim → approve flow, every refusal type, the
  approval re-check and two simultaneous claims (exactly one wins), against a separate test database.
- **Atomic approval:** reassigning the shift and approving the listing run in one database transaction.
- **Append-only audit trail:** every action is recorded with its outcome, including refusals and their
  reasons.
- **Server decides, UI displays:** the frontend never re-implements the labour rules; it shows the
  `canClaim` flag and reasons the backend computed, so there is one source of truth.
- **Single API client:** one `api` module adds the `X-Actor-Id` header and turns every error response
  into a readable message, and one `useApi` hook gives each page loading, error and reload.
- **Stale-data recovery:** if an action gets `409` (someone else acted first), the page shows why and
  reloads its data automatically, so the user never acts on an outdated list.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layers, the listing state machine and key decisions.

## Tech stack

| Layer    | Choice                                  |
| -------- | --------------------------------------- |
| Frontend | React 19, React Router, Vite, TypeScript |
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
cp .env.example .env # VITE_API_URL points at the backend
npm install
npm run dev
```

## Deployment

- **Backend on Render** (Web Service): root directory `backend`, build command
  `npm ci --include=dev && npm run build`, start command `npm run start:prod` (applies migrations,
  then starts). Environment: `NODE_ENV=production`, `DATABASE_URL=file:./prod.db`,
  `CORS_ORIGIN=<the Vercel URL>`.
- **Frontend on Vercel**: root directory `frontend` (Vite preset), environment
  `VITE_API_URL=<the Render URL>`. `vercel.json` sends every path to `index.html` so page URLs
  survive a refresh.
- **Note:** Render's free plan has no persistent disk, so the hosted SQLite file resets when the
  service restarts and the seed loads again. Run locally to see data survive restarts.

## API

Every request except `GET /api/staff` and `GET /api/history` sends the chosen person in an
`X-Actor-Id` header (there is no login).

| Method | Path | Who | What |
| ------ | ---- | --- | ---- |
| GET | `/api/staff` | anyone | People for the "acting as" picker |
| GET | `/api/shifts/mine` | staff | My shifts, each with its open/claimed listing |
| GET | `/api/listings?status=OPEN` | staff | Other people's open listings with `canClaim` and every reason |
| GET | `/api/listings?status=CLAIMED` | manager | Claims waiting for approval |
| POST | `/api/listings` `{ shiftId }` | shift owner | Post a shift |
| POST | `/api/listings/:id/withdraw` | poster | OPEN → WITHDRAWN |
| POST | `/api/listings/:id/claim` | other staff | OPEN → CLAIMED if rules pass |
| POST | `/api/listings/:id/unclaim` | claimer | CLAIMED → OPEN |
| POST | `/api/listings/:id/approve` | manager | CLAIMED → APPROVED, shift reassigned (rules re-checked) |
| POST | `/api/listings/:id/reject` | manager | CLAIMED → OPEN |
| GET | `/api/history` | anyone | Every action: who, what, which shift, outcome, reasons |

Errors always look like `{ "error": { "message": "...", "details": [...] } }`:
`400` invalid input · `401` no/unknown person · `403` wrong role or not yours ·
`409` "no longer available" or wrong state · `422` labour rules broken (details lists every rule with
the conflicting shift).

## Assumptions

- All shift times are local clinic time; the real current date never affects any rule.
- Hours for rule 5 are each shift's full length, counted in the week the shift starts.
- A staff member does not see their own listings in the open listings view (they see them under "My shifts").
- Refused actions on a listing id that does not exist return 404 and are not logged, since there is no shift to record.
