# SMI Digital Operations — Service Architecture

```mermaid
flowchart TB
  subgraph Public["Public institutional access"]
    WEB["SMI Main Website"]
    SCH["Scholarships Portal"]
    SUB["Course Subscription"]
    APT["SCI Appointment System"]
  end

  subgraph Learning["Learner platforms"]
    SEC["Secondary Training"]
    GATE["Student Gateway · Core Periods"]
    EXAM["Student Examinations"]
  end

  subgraph Operations["Registration and staff operations"]
    REG["Registration Hub"]
    REGCTL["Registration Control Center"]
    SCHCTL["Scholarship Control Center"]
    CRM["CRM · Leads"]
    OUT["Outreach"]
  end

  GATE --> EXAM
  SEC --> OUT
```

## Reading the diagram

- The three groups distinguish public entry points, learner-facing platforms and staff-facing operations.
- Examinations are a module inside Student Gateway.
- Outreach is embedded within Secondary Training.
- The diagram does **not** assert that all other services share a database, exchange records automatically or are connected through a single API.
- Staff-only routes are intentionally omitted.

This is a service-responsibility map, not a technical deployment diagram or a verified data-flow model.
