# SMI Digital Application Inventory

**Inventory size:** 12 named applications and modules

**Public route check:** 15 November 2026

**Hosting context:** SMI cPanel application environment, as recorded by the institution

This inventory separates public services, learner-facing applications and staff-facing modules. The listed routes are included only where a public route was supplied and checked. Internal administrative paths are intentionally not reproduced.

## 1. Institutional access and learner services

| ID | Application | Purpose | Access / placement | Evidence note |
|---|---|---|---|---|
| SMI-D01 | SMI Main Website | Public institutional identity and information | Public · `/` | HTTP 200 |
| SMI-D06 | Scholarships Portal | Public scholarship information and access | Public · `/scholarships/` | HTTP 200 |
| SMI-D08 | Course Subscription | Course subscription and enrollment entry | Learner-facing · `/course-subscribe/` | HTTP 200 |
| SMI-D09 | SCI Appointment System | Appointment coordination | Public route · `/appointments/` | HTTP 200 |

## 2. Learning and assessment

| ID | Application | Purpose | Access / placement | Evidence note |
|---|---|---|---|---|
| SMI-D02 | Secondary Training Platform | Secondary-period learner access and guided practice | Learner-facing · `/smi-secondary-training/` | HTTP 200 |
| SMI-D03 | Student Gateway · Core Periods | Core-period student portal and academic activity | Learner-facing · `/student-gateway/` | HTTP 200 |
| SMI-D10 | Student Examinations | Examination delivery within Student Gateway | Embedded module · Student Gateway | Not a separate application route |

## 3. Registration, administration and engagement

| ID | Application | Purpose | Access / placement | Evidence note |
|---|---|---|---|---|
| SMI-D04 | Registration Hub | Unified registration for new and returning learners | Registration workflow | Listed in cPanel inventory; release and route unverified |
| SMI-D05 | Registration Control Center | Registration review, approvals and administrative control | Staff-facing | Internal route withheld |
| SMI-D07 | Scholarship Control Center | Scholarship administration and follow-up | Staff-facing | Internal route withheld |
| SMI-D11 | CRM · Leads | Lead records, contact history and follow-up | Internal staff workspace | Internal route withheld |
| SMI-D12 | Outreach | Learner engagement and outreach workflow | Embedded in Secondary Training | No separate application route |

## Interpretation

- **HTTP 200** means the public route responded during the dated check. It does not prove every user journey works.
- **Listed in cPanel inventory** records the institution's system inventory, not independent confirmation of a live release.
- **Embedded module** means the function belongs to a parent application and should not be counted as a separate deployment.
- **Internal route withheld** protects staff-facing entry points from unnecessary public exposure.

No student or staff data, credentials, source code, database exports or administrative URLs are included.
