# AI Usage

Tool: Claude (chat assistant with access to this project folder).

I directed this project and made the product, design and process decisions; Claude drafted most of
the code under that direction. Nothing was written without my go-ahead on the next step, and I ran,
tested, committed and deployed every change myself, so I can explain every file.

## Decisions I made

- **Problem choice:** weighed both problem statements and chose ShiftSwap because its core is rule
  validation, concurrency and an audit trail, which is close to spend-audit work.
- **Raised the bar on the design:** rejected the first, simpler design as not professional enough and
  asked for production patterns. That is why the project has a rules engine, a state machine,
  optimistic concurrency, an approval transaction and an append-only audit log.
- **Way of working:** fixed the phases (analyze, design, MVP, deploy, polish, test, submit), started
  from a fresh repo instead of the prepared starter, one branch per feature with `--no-ff` merges,
  and docs updated in the same commits as the code.
- **Frontend approach:** questioned plain tabs and moved to React Router so each page has its own URL;
  kept the UI to plain CSS with no component library so every piece stays explainable.
- **Found bugs by testing the app myself:** switching from staff to manager left the manager on an
  empty staff page (now redirects to the role's home page), and the logo did not return to the
  person picker (now it does).
- **Reviewed scalability:** questioned whether the person cards scale; kept them because there is no
  login in the spec and the roster has 10 people, while a real product would use login instead.
- **Deployment:** set up Render and Vercel myself, and configured CORS for both the local and the
  deployed frontend.
- **Final check:** had the finished app checked line by line against the problem statement before
  submitting.

## Where AI was used

| Area | What AI did | What I accepted, changed or rejected |
| ---- | ----------- | ------------------------------------ |
| Problem choice | Compared the two problem statements | I chose ShiftSwap for its rule-validation and audit-trail focus |
| Backend setup | Generated Express/TypeScript base files (env validation, error handler) | Accepted after review |
| Data model | Drafted the Prisma schema and seed loader | Accepted; kept times as text to match the seed format |
| Claim rules | Drafted the five rule modules and unit tests | Reviewed each boundary case against the spec |
| Listing workflow | Drafted the state machine, repository and service (post, withdraw, claim, unclaim, approve, reject) | Reviewed the order of checks: "no longer available" is checked before the labour rules, as the spec requires |
| API and tests | Drafted routes, controller and API tests | Rejected `prisma migrate reset` in the test setup; tests now build a fresh `test.db` with `migrate deploy` so they never touch dev data |
| Frontend base | Drafted the API client, `useApi` hook, "acting as" picker and router layout | Chose React Router over plain tabs so each page has a URL; left out Redux/React Query as too much for four pages |
| Staff pages | Drafted My shifts and Open listings pages, `useAction` hook and shift-time formatting | Kept time formatting on UTC maths so the browser's time zone cannot shift shift times; reasons come from the server, not re-checked in the UI |
| Manager and history pages | Drafted the Approvals and History pages and a `RequireRole` wrapper | Kept role checks on the server (403) as the real guard; the wrapper only hides buttons that would always fail |
| Docs and polish | Drafted ARCHITECTURE.md and the README demo walkthrough | Ran each demo step on a fresh database first and corrected the expected outcomes to match what the app really shows |
| Frontend tests and filter | Drafted `format.test.ts` and the "Only refused" filter on History | Added the month-end night-shift case after reviewing which dates could break |
| Role-switch fix | I found that switching "Acting as" from staff to manager left the manager on a staff URL with an empty page; AI proposed redirecting to the role's home page | Accepted; kept History shared so switching person there stays on History; tested every switch in the browser |
| UI polish | I asked for a less plain UI; AI drafted a welcome screen with person cards, avatars, page headers with counts, two-line shift times, certification tags and a new stylesheet | Kept it to plain CSS and small components (no UI library) so every piece stays explainable; checked desktop and mobile in the browser |
| Team page | I decided the app was too static and asked for staff management; AI drafted `POST /api/staff` (manager only, Zod-validated, generated ids), its tests and the Team page | Kept it out of the database schema (no migration) to keep the change safe near the deadline; tested adding a person and acting as them in the browser |
| Rules made visible | I felt the app only showed rules when something failed; AI drafted a weekly-hours card and an approval preview (`canApprove` + reasons from the server) | Kept the decision on the server (same `evaluateLabourRules` as approve) and disabled Approve when it would fail; added an API test for the warning |
