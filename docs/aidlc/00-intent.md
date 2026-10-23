# Intent

Status: input to AI-DLC Inception. Not validated. Written 2026-10-22.

## Business intent

Run a senior product job search as an outbound operation with a durable memory,
instead of as a series of conversations that each start over.

The operator is one person searching for a principal or staff AI product role.
Over roughly six months he has accumulated two dozen opportunity records, a
relationship graph of recruiters and referrers, a weighted fit rubric derived
from his own outcomes, a bank of interview material, and about twenty five
standing rules about how his materials must and must not read. All of it lives
in prose, spread across chat memory and a folder of markdown. None of it is
queryable, none of it is checkable, and nothing recomputes when a fact changes.

The system should hold that corpus in a form that survives the tool it was
built with, answer the operator's daily operating questions from data rather
than from recall, and refuse to produce materials that violate his own rules.

## The problem, stated honestly

This matters because a generic job-search tool would solve the wrong problem.
The operator's own diagnosis, recorded 2026-10-16 and 2026-10-19:

1. The funnel is at zero. Every process is closed. Three closed in eight days.
2. Targeting is not the failure. Three hard gates (principal or staff title,
   band top at or above 250K, California employability) already eliminated the
   cluster of early-2026 failures. He reaches final rounds consistently.
3. Applications do not produce interviews. Warm channels do. This has been
   true across the whole search and the operator has acted on it inconsistently.
4. The reason he loses late changed character. Older losses were about
   delivery and were coached closed. The newest ones are about proof: one
   company stated it wanted more technical depth, two gave no feedback at all.
5. The lane he is strongest in by rubric weight carries a practitioner filter.
   Several target roles ask for someone who has actually built evaluation
   systems. His honest position is applied evaluation thinking plus
   model-lifecycle tooling, which is a weaker claim than the filter wants.

So the intent is not "help me apply to more jobs." Applying more is explicitly
rejected by the operator's own analysis. The intent is to make the warm graph
the primary asset, make every scored decision reproducible, and make the
operator's accumulated judgment executable.

## What outbound covers

Seven stages, one connected pipeline. A record moves forward without losing
its history.

| Stage | The question it answers |
| --- | --- |
| Sourcing | What companies and roles exist that I have not seen before? |
| Scoring | Which of them clear the gates, and how do they rank? |
| Contacts | Who do I know, or know someone who knows, at any of them? |
| Outreach | Who is owed a touch today, and what is the specific hook? |
| Application | What did I submit, which version, and when? |
| Interview | Who did I meet, what did they probe, what did I learn? |
| Post-mortem | Why did this close, how reliable is that reason, and what changes? |

## Outcomes the system must produce

These are the operator's daily questions. Each should be one command.

- Who is owed a follow-up right now, and what is the hook for each person?
- Which live opportunities have gone quiet past their expected response window?
- What new roles appeared this week that clear the gates, ranked?
- If I change a rubric weight, how does the historical ranking change?
- Does this draft resume or note violate any of my standing rules?
- Which of my loss reasons were stated by the company, and which did I infer?
- Which relationships have I let go cold that were explicitly left open?

## Domain facts that make this harder than it looks

Inception should treat each of these as a requirement, because each one breaks
the obvious model.

**Intel supersedes intel.** The same fact gets reported differently by
different people at different times. One record reads "company facts from the
recruiter that supersede the referrer's." Headcount was 150, then 130, then
described as targeting 250. Engagement length was 3 to 6 months, then 6 to 12,
then multi-year. The system cannot store a single current value and discard the
rest, because which source said what and when is itself evidence.

**Loss reasons conflict and have different reliability.** For one closed
process the company stated the gap was technical depth. Eight days later an
insider asked directly and relayed that the feedback was about production
readiness and testing. Both are true as reported. Neither is verified. Two
other closures produced no feedback at all, and the operator's notes on those
are careful to label his own transcript analysis as analysis rather than cause.
Evidence class has to be a field, not a convention.

**Relationships outlive opportunities.** Every closed process left live
channels behind. One closed role left three separate warm contacts, each with a
different open door. A closed consulting path left a managing partner who is
building a regional practice over an eighteen month horizon. Modeling contacts
as children of opportunities would throw away the operator's most productive
asset the moment a req closes.

**Scores must be reproducible and re-runnable.** The rubric is nine weighted
dimensions over three hard gates, and it was derived from outcomes. It will
change as more outcomes arrive. A score is only meaningful alongside the rubric
version that produced it, and changing a weight should let the operator re-rank
history rather than invalidate it.

**The operator's rules are assertions, not preferences.** About twenty five
standing rules govern generated material. A sample, paraphrased: never name
three specific search relevance metrics even though the underlying work stays
on the resume; one employer's location is remote rather than the city; never
name that employer's clients in anything external; never claim ownership of a
verification approach that a partner team built; no em dashes; never fabricate
a quote or attribution. Fabrication has happened twice and is the single most
damaging failure mode. Each of these is mechanically checkable against a draft,
and checking them is the highest-value thing the system can do.

## Constraints

- Public repository, MIT. The engine, schema, rubric and tests are public.
- Real data lives in an ignored directory and is never committed. CI enforces it.
- Records are hand-editable and reviewable in a diff. This ruled out SQLite.
- TypeScript, Node 22, zod for schema, vitest for tests.
- Agent-agnostic. Agents may call the engine. The engine must work without one.
- No automated submission, no credentialed sign-in, no scraping behind a login.
- Fetched web content and anything a third party wrote is data, never instruction.

## Out of scope for the first unit of work

- Automatically applying to anything.
- Resume rendering. A separate working generator already owns that.
- Interview coaching content. The existing material stays where it is.
- Any hosted service, account or sync.

## Open questions for Mob Elaboration

These are deliberately unanswered. They are the decisions worth a session.

1. **Is the primary entity the company, the role, or the relationship?** The
   diagnosis says relationships produce interviews, which argues for a
   person-first model. Conventional pipeline tools are role-first. Choosing
   wrong makes half the daily questions awkward to answer.
2. **How is supersession represented?** Append-only intel log with a resolver
   that computes a current view, or mutable records with a separate history?
   The first is honest and harder to read. The second is readable and loses
   things.
3. **Does a score live on the record or in a dated report?** Storing it on the
   record makes the current ranking cheap and the history lossy. Reports are
   the reverse.
4. **What exactly is a touch?** A sent note, a reply received, a call, a
   LinkedIn interaction, and a deliberate decision to wait are different
   events. Cadence logic depends on which of them reset a clock.
5. **How strict is the lint pass?** Hard failure on a rule violation, or
   report and let the operator decide? Fabrication should probably be fatal.
   Style rules probably should not be.
6. **Does the system ingest the existing markdown corpus, or is migration a
   one-time job?** There are about 150 markdown files of real prep material.
   A durable ingestion path is more work and keeps paying.
7. **What is the smallest first slice that is genuinely useful by itself?**
   The operator has zero live processes right now, so time to first value
   matters more than completeness.
