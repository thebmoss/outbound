# outbound

A durable engine for running a senior product job search as an outbound
operation, with a memory that survives the tool it was built with.

Most job-search tooling is a set of prompts that help you write a better
resume. This is a data system. It holds a scored target list, a persistent
relationship graph, provenance on every claim, and a set of lint rules that
refuse to let generated material contradict the facts.

Built with the [AI-Driven Development Life Cycle](https://github.com/awslabs/aidlc-workflows).
Inception artifacts are in `docs/aidlc/`.

## Status

Pre-Inception. The repository, toolchain and corpus are in place. The domain
model in `docs/design/domain-model-proposal.md` is a **proposal** awaiting Mob
Elaboration. No engine has been built yet, deliberately: the design decisions
worth making are listed as open questions in `docs/aidlc/00-intent.md` and
belong in a session with a human, not in a first draft.

## Why it is shaped this way

Three ideas carry most of the weight, and each came from a failure in the real
search rather than from a feature list.

### Provenance is a type, not a convention

Every non-structural fact is an intel record carrying a status: `stated` by a
person, `verified` against a primary source, `observed` directly, or `inferred`
by the operator. The system enforces one rule above all others: **an inferred
record is never presented as a cause.**

This exists because the most dangerous entry in a job-search record is a
plausible reason you made up. One process in the source corpus closed with no
feedback at all, and the operator's notes carefully label his own transcript
analysis as analysis. That discipline should not depend on remembering to be
careful.

### Intel supersedes intel, and conflicts are kept

The same fact arrives differently from different people on different dates.
Headcount, engagement length and compensation bands all moved as more sources
reported them. In one closure, the official reason given was a lack of
technical depth, and eight days later an insider who asked the company directly
relayed that the feedback was about production readiness and testing. Both are
true as reported. Neither is verified.

A model that stores the latest value and discards the rest destroys the
evidence. Records supersede rather than overwrite, and a resolver computes the
current view on demand.

### Relationships outlive opportunities

Requisitions close. The people do not. Every closed process in the corpus left
live channels behind, and in one case a single closed role left three separate
warm contacts with three different open doors.

So people are top-level entities, not children of an application. This also
matches the operator's own finding that warm channels produce his interviews
while cold applications do not.

### Rules as lint

About twenty five standing rules govern generated material. Some are honesty
constraints: do not claim a completed evaluation set that was only committed
to, do not take sole credit for a verification approach a partner team built,
never name a former employer's clients. Some are voice: no em dashes, no
"X, not Y" construction. Some are procedure: always find the canonical posting
on the company's own applicant system rather than an aggregator.

All of them are mechanically checkable. Turning accumulated judgment into a
check that runs is the highest-leverage thing in this repository.

## Layout

```
docs/aidlc/00-intent.md              Business intent. Input to Inception.
docs/design/domain-model-proposal.md Proposed entities. Not a decision.
data/                                Real data. Git-ignored. Never committed.
data.example/                        Synthetic fixtures. Committed.
src/                                 Loading and structural validation.
tests/                               Vitest suite over the fixtures.
```

## Privacy

`data/` is ignored by the root `.gitignore` and again by its own `.gitignore`
containing `*`. A CI job fails the build if anything under `data/` is ever
tracked. Nothing in the committed tree names a real contact, compensation
figure or rejection reason.

The engine reads `data.example/` by default so that a fresh clone works and the
tests are meaningful to anyone.

## Setup

```sh
nvm use
npm install
npm test
```

## Credits

The data model owes real debts to three MIT-licensed projects, recorded in
`NOTICE` so they are not mistaken for original invention. The closest relative
is [brianraines/job-hunt](https://github.com/brianraines/job-hunt), which is
worth reading if you want a well-built skill-based take on the same problem.

MIT licensed.
