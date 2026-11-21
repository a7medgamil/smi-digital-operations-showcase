# Operations Case Lab

**Independent synthetic operations proof — fictional records, not SMI production.**

An original, runnable operations exercise: generate a fictional intake, review a queue, make a version-checked decision and inspect its audit trail. All names are generated as Demo 01, Demo 02 and so on. No contact details or free-text applicant fields exist.

## Quick start

Use Node 22 or newer. No dependency installation, build step, account or network service is needed.

```powershell
cd I:\GitHub-Career-Readiness\smi-operations-lab-20261121\demo\operations-case-lab
npm test
npm run check
npm start
```

Open **http://127.0.0.1:4173**. Stop with Ctrl+C. `PORT` may select another local port; binding always stays `127.0.0.1`. Use the numeric address: other Host values, including `localhost`, are intentionally rejected. The server exposes exactly five static assets, with no application API.

Reload discards all actions. **Reset simulation** restores the same six seeded records, receipts, audit events, virtual clock and intake draft while retaining the selected role. There is no browser persistence.

## A five-minute review

1. Begin as **Staff**. The simulation shows 6 total, 4 open, 1 approved and 2 resolved. Clock: `V+0013m`. Select Demo 01 and inspect its initial audit event.
2. Choose **Simulate competing review**, then **Start review**. The held version is stale, so the command fails without changing records, metrics, clock or audit. Refresh the case snapshot, then approve it.
3. Combine status, journey and generated-name/ID filters. A filter that excludes the current case clears or replaces the selected detail. Empty results never leave a hidden case available for action.
4. Switch to **Learner**, select New or Returning and submit. Repeat Submit or use **Replay last submission**: the same key returns the existing case without a new event. **Start another fictional applicant** explicitly allocates a new draft key; then choose the other journey and submit.
5. In Learner mode, add fixed synthetic evidence to Demo 04. It returns from Needs info to Submitted. Switch to Staff, filter and review it again. Try Request info or Reject; inspect the timeline and resulting metrics.

New uses a starter-checklist label; Returning uses a continuation-checklist label. Both intentionally follow the same decision rules. Returning never retrieves a real prior record.

## Role and status contract

| Operation | Learner | Staff |
|---|---|---|
| Submit / replay fictional intake | Allowed | Denied |
| Read queue / aggregate metrics | Denied | Allowed |
| Submitted → Under review | Denied | Allowed |
| Under review → Approved / Needs info / Rejected | Denied | Allowed |
| Needs info → Submitted with fixed evidence response | Allowed | Denied |
| Reopen Approved / Rejected | Denied | Denied |

Every write passes through `execute(state, command)` in [engine.mjs](engine.mjs). Queue and metrics queries also enforce the role. Role switching is an exercise, not authentication. No identity or record ownership is simulated; learners can respond to any needs-info demo. Anyone with browser developer tools controls this local simulation.

Status IDs are `submitted`, `under-review`, `approved`, `needs-info`, `rejected`; the interface uses readable labels. Every accepted mutation advances the virtual clock by one minute and appends one event with actor role, previous/next state, reason, case version, sequence and virtual timestamp. `V+0001m` is elapsed simulation time, not a date or timezone. Replays and failures advance nothing. The timeline contains accepted events; rejected attempts appear as notices.

Keys match `intake-` plus one to six digits. Within one in-memory run, identical key + journey returns the original case, even after it closes; a changed journey conflicts. Every intentional next draft gets a new key. Each transition compares an integer `expectedVersion`; a stale version rejects the entire command. Approvals/rejections cannot skip review or reopen terminal cases. Reasons are fixed enumerated values, not typed notes.

## Tests and checks

- `npm test`: Node's built-in test runner; 39 reported tests including server subtests. Covers all role/status actions, negative permissions, exact seed metrics, duplicate storms, audit invariants over repeated evidence loops, frozen-input rejection, version conflicts, independent clocks, active filters, safe headers and denied routes/methods/hosts.
- `npm run check`: syntax checks every `.mjs`; checks unique static HTML IDs, visible boundary and no dependencies; runs scoped credential/contact/endpoint/runtime heuristics. It is a focused static check, not a general-purpose linter or security certification. See [QA_REPORT.md](QA_REPORT.md) for scope and limits.
- `npm run qa:browser`: optional, dependency-free Chrome automation using Node's built-in WebSocket and Chrome DevTools Protocol. Always launches a fresh temporary headless profile, never attaches to existing user Chrome. Defaults to the standard Windows Chrome executable; set `CHROME_PATH` for another installed Google Chrome path. Writes JSON results and full-page PNGs under `qa-artifacts/`. It uses an ephemeral loopback server and blocks non-loopback page requests. It requires permission to launch Chrome renderers; a restricted environment may block it.

The [GitHub Actions workflow](../../.github/workflows/operations-case-lab.yml) uses Node 22, read-only repository permission, pinned actions, syntax/scan and tests. No dependency install, secrets, deployment or privileged PR execution. **GitHub CI has not executed for this uncommitted work.** Local QA used Node 24; exact Node 22 execution remains a reviewer/CI gate.

## Accessibility and visual QA

The interface uses native radios, buttons, selects and search; associated labels; fieldset legends; a skip link; visible focus; a polite atomic status region; text status labels; and a reduced-motion rule. Actions restore focus to the case heading after the detail is replaced. Selecting a queue item moves focus to its detail. Color is supplementary.

Automated Chrome checks exercise 1440 × 1000 and 390 × 844 viewports with reduced motion, real Tab key flow, visible focus and absence of horizontal overflow before/after interactions. Screenshots are [desktop](qa-artifacts/operations-1440.png) and [mobile](qa-artifacts/operations-390.png); [machine-readable results](qa-artifacts/browser-results.json) record the assertions.

For independent manual QA: navigate from the skip link using Tab/Shift+Tab; use arrow keys in radios/selects and Enter/Space on buttons; inspect live notices with a screen reader; check 200% zoom, enlarged text, forced colors and narrow intermediate widths. Full screen-reader, touch-device and cross-browser testing have **not** been performed. The browser run is automation plus screenshot inspection, not a claim of manual interaction or WCAG conformance.

## Scope and explicit omissions

This is a small in-memory state machine with a trusted engine-owned state shape, not a general untrusted-state deserializer. The UI accepts only fictional journey choices, generated keys and constrained decisions. Metrics are exact counts of this simulation only: open = Submitted + Under review + Needs info; resolved = Approved + Rejected. They do not measure actual institutional outcomes or throughput.

Unimplemented: identity, authentication, ownership, production authorization, backend command API, durable storage, multi-process/distributed locks, key expiry, database transactions, real concurrency transport, real timers/timezones, attachments/uploads, contact capture, integrations, notifications, email, delivery, SLA analytics, exports, payments, deletion and terminal-case reopening. The competing-review control sequentially simulates a second actor; it proves version semantics, not distributed locking.

No SMI application source, private records, production sessions or operational endpoints were used. This is separate from the Registration Hub and from the existing ChatGPT editorial evidence workstream. See [engineering decisions](../../docs/INDEPENDENT-OPERATIONS-ENGINEERING.md) and the actual [QA record](QA_REPORT.md).
