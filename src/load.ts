/**
 * Loading and structural validation only.
 *
 * This file deliberately contains no domain logic. Scoring, cadence and lint
 * belong to Construction, after the open questions in docs/aidlc/00-intent.md
 * are settled with the operator. What lives here is the harness: read a corpus
 * directory, parse it, and assert the structural invariants the proposed model
 * claims to hold, so that a change to the model shows up as a failing test
 * rather than as a surprise later.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const CORPUS_FILES = [
  "operator",
  "rubric",
  "companies",
  "people",
  "opportunities",
  "closures",
  "rules",
  "touches",
] as const;

export type CorpusFile = (typeof CORPUS_FILES)[number];

export type Corpus = Partial<Record<CorpusFile, unknown>>;

/** The four provenance statuses. See docs/design/domain-model-proposal.md. */
export const INTEL_STATUSES = [
  "stated",
  "verified",
  "observed",
  "inferred",
] as const;

export type IntelStatus = (typeof INTEL_STATUSES)[number];

/**
 * Statuses that must never be surfaced as the cause of an outcome.
 * This encodes the operator's own discipline: "this is transcript analysis,
 * not a stated cause."
 */
export const NON_CAUSAL_STATUSES: readonly IntelStatus[] = [
  "observed",
  "inferred",
];

export function loadCorpus(dir: string): Corpus {
  const corpus: Corpus = {};
  for (const name of CORPUS_FILES) {
    const path = join(dir, `${name}.yaml`);
    if (!existsSync(path)) continue;
    corpus[name] = parse(readFileSync(path, "utf8"));
  }
  return corpus;
}

export interface Problem {
  file: string;
  path: string;
  message: string;
}

function asRecordArray(doc: unknown, key: string): Record<string, unknown>[] {
  if (doc === null || typeof doc !== "object") return [];
  const list = (doc as Record<string, unknown>)[key];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (r): r is Record<string, unknown> => r !== null && typeof r === "object",
  );
}

/**
 * Structural invariants of the PROPOSED model. Each one is a claim the
 * proposal makes about itself, written down so it can be checked.
 */
export function validate(corpus: Corpus): Problem[] {
  const problems: Problem[] = [];

  // Every rule is actionable: it needs an id, a severity, a kind and a target.
  for (const rule of asRecordArray(corpus.rules, "rules")) {
    const id = typeof rule.id === "string" ? rule.id : "(missing id)";
    for (const field of ["id", "severity", "kind", "applies_to"]) {
      if (rule[field] === undefined) {
        problems.push({
          file: "rules.yaml",
          path: id,
          message: `missing required field "${field}"`,
        });
      }
    }
    if (rule.severity !== undefined && rule.severity !== "error" && rule.severity !== "warning") {
      problems.push({
        file: "rules.yaml",
        path: id,
        message: `severity must be "error" or "warning", got "${String(rule.severity)}"`,
      });
    }
  }

  // Rubric dimension weights sum to 100, so a score is comparable across runs.
  const rubric = corpus.rubric as Record<string, unknown> | undefined;
  if (rubric && Array.isArray(rubric.dimensions)) {
    const total = rubric.dimensions.reduce((sum: number, d: unknown) => {
      const w = (d as Record<string, unknown> | null)?.weight;
      return sum + (typeof w === "number" ? w : 0);
    }, 0);
    if (total !== 100) {
      problems.push({
        file: "rubric.yaml",
        path: "dimensions",
        message: `weights must sum to 100, got ${total}`,
      });
    }
  }

  // Every provenance-bearing claim carries a known status.
  for (const closure of asRecordArray(corpus.closures, "closures")) {
    const opp = typeof closure.opportunity === "string" ? closure.opportunity : "(unknown)";
    for (const group of ["reasons", "observations", "feedback_received"]) {
      const entries = closure[group];
      if (!Array.isArray(entries)) continue;
      entries.forEach((entry: unknown, i: number) => {
        const rec = entry as Record<string, unknown> | null;
        const status = rec?.status;
        if (typeof status !== "string" || !INTEL_STATUSES.includes(status as IntelStatus)) {
          problems.push({
            file: "closures.yaml",
            path: `${opp}.${group}[${i}]`,
            message: `status must be one of ${INTEL_STATUSES.join(", ")}, got "${String(status)}"`,
          });
        }
      });
    }

    // A closure with no company feedback must carry no stated reason.
    if (closure.company_feedback === "none") {
      const reasons = Array.isArray(closure.reasons) ? closure.reasons : [];
      if (reasons.length > 0) {
        problems.push({
          file: "closures.yaml",
          path: opp,
          message:
            "company_feedback is none, so reasons must be empty; a reason here would present analysis as a cause",
        });
      }
    }
  }

  // Referential integrity: opportunities point at companies that exist.
  const companyIds = new Set(
    asRecordArray(corpus.companies, "companies")
      .map((c) => c.id)
      .filter((id): id is string => typeof id === "string"),
  );
  if (companyIds.size > 0) {
    for (const opp of asRecordArray(corpus.opportunities, "opportunities")) {
      const id = typeof opp.id === "string" ? opp.id : "(missing id)";
      if (typeof opp.company === "string" && !companyIds.has(opp.company)) {
        problems.push({
          file: "opportunities.yaml",
          path: id,
          message: `unknown company "${opp.company}"`,
        });
      }
    }
  }

  return problems;
}
