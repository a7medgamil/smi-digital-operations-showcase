# SMI Digital Operations — Evidence and Status

## Route-level checks

Checked on 15 November 2026. Each route below returned HTTP 200:

| Public service | Route | Observation |
|---|---|---|
| SMI Main Website | `/` | HTTP 200 |
| Secondary Training | `/smi-secondary-training/` | HTTP 200 |
| Student Gateway | `/student-gateway/` | HTTP 200 |
| Scholarships | `/scholarships/` | HTTP 200 |
| Course Subscription | `/course-subscribe/` | HTTP 200 |
| SCI Appointments | `/appointments/` | HTTP 200 |

A successful HTTP response is a reachability check only. It is not an end-to-end functional test or production certification.

## Inventory notes

| Component | Recorded position |
|---|---|
| Registration Hub | Listed in cPanel inventory; current release and route not verified |
| Registration Control Center | Staff-facing administrative component; route withheld |
| Scholarship Control Center | Staff-facing administrative component; route withheld |
| Student Examinations | Module inside Student Gateway |
| CRM · Leads | Internal staff workspace; route withheld |
| Outreach | Embedded in Secondary Training |

## Governance requirements

- Confirm the exact source revision and environment before reporting a test result.
- Do not publish student, staff, applicant or scholarship records.
- Do not publish credentials, internal administrative URLs or infrastructure details.
- Do not infer deployment readiness from a route returning HTTP 200.
- Keep embedded modules distinct from separately deployed applications.
- Verify module-level workflows and integrations before claiming they are complete.

This repository is a public scope summary. It does not claim that every workflow is fully automated, integrated or production-certified.
