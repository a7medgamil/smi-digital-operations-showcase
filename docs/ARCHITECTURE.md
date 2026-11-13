# SMI Digital Operations — Operating Architecture

~~~mermaid
flowchart TB
  L[Learners] --> P[Learning Programs]
  P --> S[Speaking Practice]
  P --> A[Attendance Workflows]
  P --> E[Assessment and Progress]
  S --> R[Session Records]
  A --> R
  E --> R
  R --> O[Institutional Operations]
  O --> C[Learner Support and Reporting]
  O --> M[Approved Communications]
~~~

This diagram describes an operating model, not a live data-flow map or technical deployment diagram.
