# Working in this repository

Read this before changing anything.

## Method

This project uses AI-DLC. Phases are Inception, Construction and Operations.
`docs/aidlc/00-intent.md` is the business intent and is the input to Inception.
Do not skip ahead: the open questions at the end of the intent brief are
unanswered on purpose and are resolved with the operator in Mob Elaboration,
not by a best guess in a pull request.

## The one rule that matters most

Never fabricate. No invented quotes, no attributing a claim to someone who did
not make it, no filling a gap with a plausible detail. This has caused real
damage in the source corpus twice. If a fact is not in the data or a primary
source you actually read, the correct output is that you do not know it.

When migrating or ingesting, a record you cannot substantiate is marked
`migration: stub` with a note about where the detail lives. It is not completed
from inference.

## Private data

`data/` holds real job-search data and is ignored twice over. Never commit it,
never copy its contents into a tracked file, never quote a real name,
compensation figure or rejection reason into documentation, a test fixture, a
commit message or a code comment. Use `data.example/`, where everything is
invented.

## Provenance

Any new fact-bearing field carries `status`, `source` and `asof`. The four
statuses are `stated`, `verified`, `observed` and `inferred`. Code that surfaces
a reason for an outcome must not present an `inferred` or `observed` record as a
cause. If you add a path that could, add a test that proves it does not.

## Style

Prose in this repository avoids em dashes, uses colons, commas and periods
instead, and says the literal thing rather than the clever one. This matches the
operator's own standing rules, which are encoded in `data/rules.yaml` and
mirrored in `data.example/rules.yaml`.

## Checks

```sh
npm run typecheck
npm test
```

Both run in CI, alongside a job that fails if anything under `data/` is tracked.
