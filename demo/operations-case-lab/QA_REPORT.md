# Operations Case Lab — executed QA record

**Date:** 21 November 2026. **Scope:** TASK 02 only, original synthetic operations demonstration. All application records are generated fictional records. No production/PII security certification or actual SMI outcome is claimed.

## Environment and preflight

- Windows, PowerShell; repository `I:\GitHub-Career-Readiness\smi-operations-lab-20261121`.
- Branch `codex/operations-lab-20261121`; starting HEAD `083ca57` (`docs: add SMI eight-domain operating model`). Origin read from local config: public `a7medgamil/smi-digital-operations-showcase`.
- Initial `git status --short` / `git status --porcelain=v1`: no preexisting changes. No branch switch, remote fetch, commit, push, PR, merge or deployment performed.
- Required root README, operating model, system inventory and architecture were read. The sequential queue was read only; no other queued task or repository was accessed or changed. No applicable local/ancestor AGENTS.md was found.
- Node `v24.21.0`, npm `11.19.0`; Google Chrome `157.0.8103.79` in a new temporary headless profile for each browser run. No packages installed.
- Git emitted a nonfatal warning that the global ignore file was inaccessible. A combined discovery command returned 1 because `rg` found no AGENTS.md. `Get-CimInstance Win32_Process` was denied (exit 1); a fallback `Get-Process` listed process IDs/names, but could not establish their working directories. No other process was controlled. Full duplicate-writer process-command-line verification was therefore unavailable.

## Commands and actual results

Commands below ran in `demo/operations-case-lab/` unless stated otherwise. This report records the latest successful checks and earlier failures; it does not treat the workflow file as an executed CI run.

| Command / operation | Exit | Observed result |
|---|---:|---|
| `npm test` | 0 | 39 tests reported, 39 passed, 0 failed, 0 skipped; engine assertions and five HTTP subtests |
| `npm run check` | 0 | Syntax for 7 modules, static HTML IDs, visible evidence boundary, no dependencies, scoped contact/credential heuristics and runtime endpoint/persistence/nondeterminism checks |
| `npm run qa:browser` in restricted execution | 1 | BLOCKED before page testing: Chrome answered browser-level CDP, but `Runtime.enable` timed out |
| `node scripts/browser-qa.mjs` with approved process-launch escalation, first executed page run | 1 | All 36 interaction checks completed, but console check found CSP-blocked `data:,` favicon; fixed by adding an allowlisted local SVG |
| `node scripts/browser-qa.mjs` with process-launch escalation, after favicon fix | 0 | 36 browser assertions, no page outbound requests or browser errors |
| `node scripts/browser-qa.mjs` with process-launch escalation, final duplicate-safe draft UI | 0 | 38 browser assertions, two screenshots, no page outbound requests or browser errors |
| `npm start` + loopback HTTP smoke | 0 (HTTP check) | Started the actual npm script with `PORT=43127`; HTTP 200 and the expected synthetic boundary were observed. The long-running process was subsequently terminated as described below |
| `git diff --check` (repository root) | 0 | No whitespace errors |
| Baseline preservation and added-file link review | 0 | Removing only the new README section reproduces the original README; original three institutional reference documents are unchanged; local Markdown targets exist |

The first `npm run check` returned 1 because an intentionally invalid email-shaped test key triggered the contact heuristic, including its exception string in the scanner. Both were removed; the negative case now uses `not-an-intake-key`. No scan exception suppresses the final result.

An initial baseline-comparison helper returned 1 because it compared Windows checkout CRLF against Git blob LF literally. The corrected comparison normalized line endings and passed; no original institutional reference files were changed. CSS was expanded into readable blocks before the final verification.

Smoke-server cleanup: Windows PTY Ctrl+C did not stop the owned process. After verifying the loopback page boundary, listening port and `node server.mjs` command, `Stop-Process` returned 1 with an internal null-reference error. A narrowly scoped `taskkill /PID 36196 /F` returned 0 and terminated only that verified owned server. The separate closed-port check returned 0 afterward. This was controlled test cleanup, not a graceful application shutdown test.

## Browser evidence

The checked-in [JSON report](qa-artifacts/browser-results.json) lists the actual 38 assertions and browser version. Screenshots: [1440px full page](qa-artifacts/operations-1440.png), [390px full page](qa-artifacts/operations-390.png). Both were visually inspected after generation for hierarchy, wrapping, spacing and visible boundaries. These are automation captures of fictional records, not production captures.

The script launches Google Chrome with a newly generated temporary `--user-data-dir`, uses an ephemeral loopback debug port and closes only that launched instance. It never selects an existing Chrome window/profile. Temporary-profile deletion checks the resolved parent and generated basename before recursive cleanup. Chrome's renderer sandbox was retained; process-launch escalation was needed because the workspace's restricted execution stalled renderer commands.

At each viewport (1440 × 1000 and 390 × 844), the browser checked initial metrics and clock; competing review and mutation-free conflict; approval, request-info and rejection; active filter intersection and clearing hidden selection; learner/staff control gating; needs-info response; New and Returning intake; direct repeated Submit and explicit Replay idempotency; live queue/metric totals; actual Tab key flow and visible focus; and no horizontal overflow before/after interaction. Reduced-motion media preference was enabled. Page runtime/console errors and non-loopback page requests were zero in the final run.

Network observation is scoped to the tested page's DevTools events, with non-loopback page requests blocked and Chrome background networking disabled by flags. It is not an operating-system packet capture and does not certify absence of all browser-process traffic. Scripted clicks exercise UI behavior but are not a full manual pointer/touch or assistive-technology audit.

## Static/heuristic scan scope

`npm run check` scans text source and documentation under this demo, plus root README, the new engineering note and the new workflow, for selected credential markers, email-shaped strings and phone-shaped strings. It scans the five runtime HTML/CSS/JS files for non-loopback HTTP URLs, outbound/persistent browser APIs and wall-clock/randomness usage. The SVG's standard XML namespace is a format identifier, not a request. The root README's original public historical URLs are preserved and are outside the runtime-endpoint rule.

The generated `qa-artifacts/` directory is excluded from the source heuristic and syntax traversal. Its JSON result and synthetic screenshots were inspected separately. Existing unrelated repository files and `.git` were not scanned for secrets. This is a scoped heuristic review, not a full DLP/secret audit; unfamiliar secret formats or personal information may evade pattern matching. No real data was supplied to this implementation or its tests.

## Remaining gates and limitations

- **GitHub Actions: NOT RUN.** Work is intentionally uncommitted and unpushed. No exact pushed SHA or CI PASS exists. A separate reviewer must repeat checks and inspect the eventual Node 22 run.
- **Exact Node 22 local execution: NOT RUN.** Available runtime was Node 24. Code uses built-in Node APIs available in the declared Node 22+ range; the workflow selects Node 22, but compatibility is not claimed as an observed Node 22 result.
- Full screen-reader testing, 200% zoom/enlarged text, forced colors, real touch devices, intermediate widths and other browsers: **NOT RUN**. No WCAG conformance claim.
- Independent human code review: **PENDING**. This report is the implementing agent's verification; no sub-agent or separate reviewer was represented as independent QA.
- Real authentication, production authorization, ownership, persistent idempotency, database transactions, distributed concurrency and real delivery: intentionally unimplemented. See the [README](README.md) for the complete omissions list.
- Process command-line preflight was restricted as described above. Final browser QA is no longer blocked; it ran successfully in the approved isolated launch context.

## Changed-file inventory

| Location | Files |
|---|---|
| Repository root | `README.md` (one additive proof-link section) |
| Engineering note | `docs/INDEPENDENT-OPERATIONS-ENGINEERING.md` |
| CI | `.github/workflows/operations-case-lab.yml` |
| Demo runtime | `demo/operations-case-lab/engine.mjs`, `app.mjs`, `index.html`, `styles.css`, `favicon.svg`, `server.mjs` |
| Demo package / documentation | `demo/operations-case-lab/package.json`, `README.md`, `QA_REPORT.md` |
| Demo verification | `demo/operations-case-lab/test/engine.test.mjs`, `test/server.test.mjs`, `scripts/check.mjs`, `scripts/browser-qa.mjs` |
| Synthetic QA artifacts | `demo/operations-case-lab/qa-artifacts/browser-results.json`, `operations-1440.png`, `operations-390.png` |

Changes are left uncommitted for the separate reviewer. This task does not continue to any other queue item.
