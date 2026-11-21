# SMI Digital Operations — Product & Delivery Evidence Packet

**Portfolio record · 21 November 2026**  
**Audience:** remote Technical Project Manager, Product Owner, Product Manager, and Digital Operations recruitment teams  
**Scope:** public-safe professional case study, not a live-system acceptance certificate

> **Evidence discipline.** This packet distinguishes **recorded institutional scope**, **observed public reachability**, **proposed product requirements**, and **unverified outcomes**. Illustrative acceptance criteria are a demonstration of product-management method, not a claim that SMI has approved or implemented them. No private source, learner records, staff accounts, or internal routes are disclosed.

## 1. Executive summary

Superior Multiskills Institution (SMI) is an operating education institution with a documented eight-domain operating model (17 areas) and a separate inventory of 12 named applications and modules. Those counts describe **different organizing views**, not 29 separately deployed systems. The documented domains cover student and academic operations, staff, assessment, mental training, reporting, administration, and executive oversight.

The institutional portfolio presents a transformation **from separate operational needs toward a structured digital-services inventory**. Its public record establishes scope and some service reachability; it does **not** independently establish deployment dates, system interconnections, user outcomes, automated data transfer, cost reduction, or service quality.

**Leadership context:** The profile identifies Ahmed Gamil as SMI's Founder & Managing Director, with responsibilities spanning institutional operations and technology direction. The public materials do not reliably attribute every line of code or each individual design decision to one person; this packet therefore focuses on accountable operating/product framing rather than unsupported personal authorship claims.

Sources: [operating model](OPERATING-MODEL.md) · [application inventory](SYSTEM-INVENTORY.md) · [service-responsibility architecture](ARCHITECTURE.md) · [main case study](../README.md).

## 2. What is actually evidenced

| Evidence class | Supported record | What it does **not** prove |
|---|---|---|
| Institutional scope | Eight domains, 17 operating areas | Every area is automated or independently deployed |
| Application inventory | Twelve named applications and modules | Twelve independent production deployments |
| Public reachability | Six documented endpoints returned HTTP 200 on **15 Nov 2026** | Successful registration, authenticated journeys, integrations or uptime |
| Service grouping | Three functional groups; Examinations embedded in Student Gateway; Outreach embedded in Secondary Training | Shared database, direct API contracts or automatic synchronization |
| Registration Hub | Unified registration is listed as a workflow | Release/version, accessible route or completed functional acceptance |
| Internal administrative modules | Named in the inventory, staff-facing paths withheld | Verified production access, permissions or data quality |
| Financial and educational outcomes | No audited metric series attached here | Specific savings, graduate counts attributable to software, or productivity gains |

**Verification status:** route-response evidence is historical and route-level. The records do not include a reproducible browser transcript, synthetic end-to-end run, operational log sample, or uptime export for the broader workflows. Rechecking these endpoints would produce a new dated observation, not retroactive proof of end-to-end functionality.

## 3. Product thinking example — Registration Hub

The registration workflow is a particularly useful example because it touches learner experience and staff review. The inventory describes unified registration for **new and returning learners**, with a separate Registration Control Center for staff-facing review. No actual production sequence between them has been independently verified.

### Product problem — framed as a hypothesis

When a learner-facing institution operates multiple application entry points, inconsistent enrollment journeys **can** create duplicate submissions, incomplete records, or avoidable staff review. These are **potential risks to investigate**, not observed incident counts for SMI.

**Proposed product outcome:** make entry and verification understandable for applicants while giving authorized staff a traceable review workflow, without exposing protected records.

### Candidate user journeys (design proposal, not verified implementation)

1. **New learner:** lands on the enrollment page, understands eligibility, enters required information, receives explicit validation feedback and a final submission status.
2. **Returning learner:** uses an appropriate verified re-entry process and receives a clear outcome without creating a duplicate active application.
3. **Staff reviewer:** sees a queue and status reasons within authorized access, can move a legitimate submission through a documented review state, and can identify incomplete information.
4. **Exception path:** a rejected, incomplete, or duplicate submission receives clear next steps without leaking whether another person's account exists.

### Proposed requirements and acceptance criteria

| ID | Proposed requirement | Example acceptance criterion | Verification to collect |
|---|---|---|---|
| REG-01 | Distinct new/returning entry paths | A synthetic test user can select either path; labels and back navigation remain understandable on mobile and keyboard | Browser test + accessible-name inspection |
| REG-02 | Clear client/server validation boundary | Invalid synthetic payloads are rejected server-side; client feedback explains correction without revealing sensitive internals | API contract + boundary tests |
| REG-03 | Duplicate-safe submissions | Two identical synthetic submissions cannot create unintended duplicate active records; concurrency behavior documented | Idempotency/concurrency test |
| REG-04 | Transparent workflow state | Each allowed state transition has a documented owner, trigger, timestamp and reason; illegal transitions fail | State-machine unit tests |
| REG-05 | Staff authorization | Learner sessions cannot open staff-only functions or view other learners' records | Permission matrix + negative-access tests |
| REG-06 | Auditability | State-changing staff actions create an appropriate privacy-conscious trace in a protected environment | Synthetic integration test |
| REG-07 | Accessible communication | Required fields, errors, focus order and success states meet stated accessibility expectations | Keyboard and assistive-tech review |
| REG-08 | Recovery and safe failure | Simulated temporary failures do not create ambiguous duplicate submissions and show retry guidance | Failure-injection test |

**Important:** these criteria define a credible engineering/product review plan. They are **not a report that REG-01 through REG-08 pass in SMI production**. Any code demonstration should use synthetic records and independent implementation.

## 4. Delivery decisions and ownership map — an interview-ready template

| Decision to document | Trade-off to explain | Evidence needed before claiming it happened |
|---|---|---|
| Unified vs. separate enrollment entry | Consistent journey vs. legacy flexibility | Signed-off requirement, dated UI diff, or release notes |
| Synchronous vs. staged verification | Immediate response vs. reliability and staff review | Architecture decision record and actual workflow trace |
| Idempotency and deduplication | Extra state logic vs. reducing duplicate work | Relevant tests, anomaly baseline, observed post-release outcomes |
| Staff permissions | Review speed vs. least-privilege privacy | Permission policy and synthetic negative tests |
| Operational metrics | Measurement usefulness vs. confidentiality | Aggregate, approved instrumentation and reproducible definitions |

**Suggested responsible roles** (illustrative, not the institution's certified org chart): product/operations owner, technical lead, tester, authorized staff reviewer and privacy/security reviewer. For every decision record, attach the date, alternatives, approved owner, test, rollback path and measured outcome once those documents actually exist.

## 5. A measurement plan rather than invented impact

| Metric | Definition and denominator | Evidence needed | Current value |
|---|---|---|---|
| Registration completion rate | Valid completed applications / eligible started applications, per defined cohort | Consent-aware event counts, deduped cohort | **Not verified** |
| Time to reviewed application | Median time from submitted to first resolved review state | Privacy-safe timestamps and workflow semantics | **Not verified** |
| Duplicate rate | Confirmed duplicate active records / applications received | Documented deduplication rules and sampled audit | **Not verified** |
| Staff handling effort | Median active staff time per valid case | Approved time sampling; distinguish wait from work | **Not verified** |
| Attendance recording consistency | Recorded eligible attendance / independently verified attendance events | Synthetic/approved non-PII audit method | **Not verified** |
| Operational cost | Like-for-like monthly cost with dates, currency, and included services | Invoices, labor assumptions and ownership-approved comparison | **Not verified** |

Do not equate a projected saving, annualization, hypothetical unit cost or anecdote with a measured production outcome. Publish numeric claims only with a source, date window, calculation, definitions and permission to share.

## 6. Delivery risk register (proposed, not a record of actual incidents)

| Risk | Impact | Practical mitigation | Evidence gate |
|---|---|---|---|
| Exposure of learner or staff records | Critical privacy harm | Strict redaction, synthetic fixtures, role-scoped testing | Independent PII/secret scan |
| Duplicate or missing registration outcomes | User confusion and extra staff work | Idempotency design, transition logs, recovery tests | Synthetic fault-injection results |
| Misleading deployment claims | Hiring/reputation risk | Scope-versus-evidence labeling and dated verification | Editorial fact check |
| Dependency on separate institutional modules | Inconsistent status across surfaces | Explicit integration contract before claiming synchronization | Approved integration test |
| Inaccessible mobile forms | Exclusion and abandonment | Responsive, keyboard and accessibility testing | Repeatable automated + manual tests |
| Publishing internal admin endpoints | Increased security exposure | List public entry points only; withhold staff routes | Publication review |

## 7. What a recruiter can inspect now

- [Eight-domain institutional operating model](OPERATING-MODEL.md): scope and responsible functions.
- [Twelve-item digital systems inventory](SYSTEM-INVENTORY.md): clear distinction between applications and embedded modules.
- [Public-safe service map](ARCHITECTURE.md): responsibility boundaries without inventing data integrations.
- [Institutional case study](../README.md): dated reachability and privacy limitations.
- [MIYTO engineering case study](https://github.com/a7medgamil/miyto-smart-rooms-showcase): separate QA snapshot; not a substitute for SMI Registration Hub acceptance.

### Outstanding evidence for a stronger hiring portfolio

- [ ] Public-safe, owner-approved screenshots with visible date/provenance and no personal records.
- [ ] Actual PRD/acceptance criteria and dated change decisions, distinguishing authorship from leadership.
- [ ] Synthetic end-to-end test artifacts for the proposed enrollment experience.
- [ ] Verified aggregate operational metrics, with before/after methods and an approved disclosure scope.
- [ ] Usability/accessibility review and a concise issue → decision → result narrative.

**Publication rule:** no confidential operational content is required to make a convincing product portfolio. Clear methods, replicable synthetic proofs, precise boundaries, and verifiable engineering outcomes are more valuable than inflated impact claims.

© 2026 Superior Multiskills Institution. Public-safe portfolio study; no learner or staff data included.
