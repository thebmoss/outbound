# Domain model: proposal

**Status: PROPOSAL. Not a decision.**

This document exists so AI-DLC Inception has something concrete to argue with.
Every choice here is open. The operator validates or replaces it in Mob
Elaboration. Where a choice is genuinely contested, the alternative is written
down next to it rather than omitted.

All examples below are synthetic. This file is public.

## The organising idea

Most job-search tools model a pipeline of applications. This one models a
**graph of relationships** with **opportunities as events on that graph**, and
it attaches **provenance to every claim**.

Two reasons, both from the operator's own record:

1. Warm channels produce his interviews. Applications do not. Relationships
   survive the closure of the req that introduced them, so they cannot be
   children of it.
2. Nearly every useful fact in his corpus came from a named person on a known
   date and was later revised by someone else. A model that stores only the
   latest value destroys the evidence.

## Core entities

### `intel` — the spine

Every non-structural fact in the system is an intel record. This is the piece
worth getting right, and the piece no comparable tool has.

```yaml
- id: int-0041
  subject: { kind: company, id: northwind }
  claim: "Engagements run 6 to 12 months; a client may have several pods."
  status: stated          # stated | verified | observed | inferred
  source:
    kind: person          # person | posting | web | document | self
    id: p-0007
    detail: "recruiter screen"
  asof: 2026-09-22
  supersedes: [int-0032]
  confidence: high        # optional, only where the operator has a view
```

`status` is the field that does the work:

| Status | Means | Example |
| --- | --- | --- |
| `stated` | A person asserted it. Reliability is the source's. | A recruiter quotes a comp band. |
| `verified` | Confirmed against a primary source, with a date. | Headcount from the company's own filing. |
| `observed` | The operator saw it directly. | An interviewer asked the same question three times. |
| `inferred` | The operator's own conclusion. | "The decider was probably the VP." |

The rule the operator already follows in prose and the system should enforce:
**an `inferred` record may never be presented as a cause.** His own note on one
closure reads "no company feedback, this is transcript analysis, not a stated
cause." That distinction becomes a type.

`supersedes` is a list, so the chain stays walkable. A resolver computes the
current view; the log keeps everything. See open question 2 in the intent brief
for the alternative.

### `person`

The durable asset. Exists independently of any opportunity.

```yaml
- id: p-0007
  name: "Jane Okafor"
  handles: { linkedin: "jane-okafor" }
  org: { company: northwind, title: "Talent Partner" }
  relationship: recruiter   # referrer | recruiter | hiring_manager | peer | former_colleague | advocate
  warmth: warm              # cold | contacted | warm | advocate
  door: open                # open | closed | unknown
  door_note: "Asked to stay in touch; said roles shift often as they grow."
  hook: "Follow up when a platform req opens."
  channels: [email, linkedin]
  companies_seen: [northwind, acme-systems]
```

`companies_seen` matters because people move, and a contact's value is not
confined to their current employer.

### `touch`

An event on a person. Append-only. Cadence is computed from these, never stored.

```yaml
- id: t-0112
  person: p-0007
  direction: outbound       # outbound | inbound
  kind: note                # note | reply | call | interaction | deliberate_wait
  asof: 2026-10-20
  summary: "Sent the note about staying connected as roles shift."
  opportunity: opp-0019     # optional
  expects_reply_by: 2026-10-30
```

`deliberate_wait` is included because a decision not to reach out is a real
state and should stop the system nagging. Which kinds reset the clock is open
question 4.

### `company` and `opportunity`

Deliberately thin. They are the skeleton that intel hangs on.

```yaml
# company
- id: northwind
  name: "Northwind Systems"
  board: { ats: ashby, url: "https://jobs.ashbyhq.com/northwind" }
  size_band: "150-500"
  status: active            # active | paused | excluded
  excluded_reason: null
```

```yaml
# opportunity
- id: opp-0019
  company: northwind
  title: "Principal Product Manager, Platform"
  level: principal          # ic | senior | staff | principal | director | contract
  posting:
    canonical_url: "https://jobs.ashbyhq.com/northwind/abc-123"
    req_id: "abc-123"
    first_seen: 2026-09-14
    content_hash: "sha256:..."
  arrangement: { remote: true, employable_in_ca: unknown }
  comp: { source: stated, base_low: 240000, base_high: 300000, note: "total cash" }
  origin: referral          # inbound_recruiter | referral | application | agency | network
  state: closed             # identified | scored | contacted | applied | interviewing | closed | offer
  people: [p-0007]
```

`posting.content_hash` is borrowed from `brianraines/job-hunt`: a posting is
only resurfaced when its content actually changed, not every time it is seen.

`employable_in_ca: unknown` is a tri-state on purpose. It is a hard gate and
"remote US" does not answer it. An unanswered gate should surface as a question
to ask, not silently pass or fail.

### `closure`

Separated from `opportunity` because the reason a thing ended is the most
valuable and least reliable data in the corpus.

```yaml
- opportunity: opp-0019
  asof: 2026-10-08
  outcome: rejected         # rejected | withdrawn | no_response | role_cancelled | offer_declined | offer_accepted
  stage_reached: technical_round
  reasons:
    - claim: "Wanted more depth on the technical side for this role."
      status: stated
      source: { kind: person, id: p-0007 }
      asof: 2026-10-08
    - claim: "Feedback was about production readiness and testing."
      status: stated
      source: { kind: person, id: p-0011, detail: "asked the company directly" }
      asof: 2026-10-16
  doors_left_open: [p-0007, p-0011, p-0014]
```

Note what this shape permits: two conflicting stated reasons, each with its own
source and date, neither promoted to truth. And `outcome: no_response` is a
first-class outcome because it is common, and it carries no reason at all.

### `rubric` and `score`

The rubric is versioned config, not code.

```yaml
# rubric
version: 3
effective: 2026-10-16
gates:
  - id: level
    rule: "level in [staff, principal]"
    override: "written above-band precedent"
  - id: comp_top
    rule: "comp.base_high >= 250000"
  - id: ca_employable
    rule: "arrangement.employable_in_ca == true"
dimensions:
  - { id: builder_facing_platform, weight: 16 }
  - { id: owns_trust_quality_layer, weight: 15 }
  # ... weights sum to 100
bands: { pursue_hard: 80, apply_and_tailor: 65, warm_intro_only: 50 }
```

A score names the rubric version that produced it, so re-scoring history after
a weight change is a supported operation rather than a loss of data.

```yaml
- opportunity: opp-0019
  rubric_version: 3
  computed: 2026-10-20
  gates: { level: pass, comp_top: pass, ca_employable: unknown }
  dimensions: { builder_facing_platform: 3, owns_trust_quality_layer: 2 }
  total: 78
  band: apply_and_tailor
```

### `rule` — the lint assertions

The operator's standing rules, made mechanical. This is the component that
turns accumulated judgment into something executable.

```yaml
- id: no-fabricated-attribution
  severity: error
  applies_to: [resume, cover_letter, outreach, prep_doc]
  kind: requires_citation
  description: "A quote or attributed claim must cite a source in the corpus."
  rationale: "Fabrication has occurred twice and is the most damaging failure."

- id: employer-location-canonical
  severity: error
  applies_to: [resume]
  kind: canonical_fact
  fact: "employer.northwind.location"
  expect: "Remote"

- id: no-em-dash
  severity: warning
  applies_to: [resume, cover_letter, outreach]
  kind: forbidden_pattern
  pattern: "—"
```

Three rule kinds cover most of the real set: `forbidden_pattern`,
`canonical_fact`, and `requires_citation`. Severity splits fatal from advisory,
which is open question 5.

## What this model makes cheap

Each of the operator's daily questions becomes a traversal rather than a recall:

- Owed a follow-up: `touch` where `expects_reply_by` has passed and no inbound since.
- Gone quiet: `opportunity` in `interviewing` with no `touch` inside the window.
- Re-rank after a weight change: recompute `score` at the new `rubric.version`.
- Stated versus inferred losses: filter `closure.reasons` on `status`.
- Cold but open doors: `person` where `door: open` and newest `touch` is old.

## What this model deliberately does not do

- It does not store a single "current truth" for contested facts.
- It does not let an opportunity own a person.
- It does not treat a missing gate answer as a pass.
- It does not promote the operator's own analysis to a stated cause.
