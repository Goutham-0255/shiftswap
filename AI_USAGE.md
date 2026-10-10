# AI Usage

Tool: Claude (chat assistant with access to this project folder).

I used AI to speed up writing code I had designed and reviewed. I read, ran and tested every
change before committing it.

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
