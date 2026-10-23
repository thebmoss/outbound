import { describe, it, expect } from "vitest";
import {
  loadCorpus,
  validate,
  INTEL_STATUSES,
  NON_CAUSAL_STATUSES,
} from "../src/load.ts";

const fixtures = loadCorpus("data.example");

describe("synthetic fixtures", () => {
  it("load every corpus file the proposal defines", () => {
    expect(Object.keys(fixtures).sort()).toEqual(
      [
        "closures",
        "companies",
        "operator",
        "opportunities",
        "people",
        "rubric",
        "rules",
        "touches",
      ].sort(),
    );
  });

  it("satisfy every structural invariant", () => {
    expect(validate(fixtures)).toEqual([]);
  });
});

describe("rubric", () => {
  it("has dimension weights summing to 100", () => {
    const problems = validate({ rubric: fixtures.rubric });
    expect(problems.filter((p) => p.file === "rubric.yaml")).toEqual([]);
  });

  it("rejects a rubric whose weights do not sum to 100", () => {
    const problems = validate({
      rubric: { dimensions: [{ id: "a", weight: 50 }, { id: "b", weight: 30 }] },
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain("got 80");
  });
});

describe("provenance", () => {
  it("defines exactly four statuses", () => {
    expect(INTEL_STATUSES).toEqual(["stated", "verified", "observed", "inferred"]);
  });

  it("treats observed and inferred as non-causal", () => {
    expect(NON_CAUSAL_STATUSES).toEqual(["observed", "inferred"]);
  });

  it("rejects an unknown status on a closure reason", () => {
    const problems = validate({
      closures: {
        closures: [
          { opportunity: "x", reasons: [{ claim: "c", status: "probably" }] },
        ],
      },
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain("status must be one of");
  });

  // The invariant that matters most: a closure the company gave no reason for
  // must not carry one. This is the operator's own discipline, as a test.
  it("rejects a stated reason on a closure with no company feedback", () => {
    const problems = validate({
      closures: {
        closures: [
          {
            opportunity: "x",
            company_feedback: "none",
            reasons: [{ claim: "they wanted more depth", status: "stated" }],
          },
        ],
      },
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain("analysis as a cause");
  });

  it("allows observations on a closure with no company feedback", () => {
    const problems = validate({
      closures: {
        closures: [
          {
            opportunity: "x",
            company_feedback: "none",
            reasons: [],
            observations: [{ claim: "buried the answer", status: "observed" }],
          },
        ],
      },
    });
    expect(problems).toEqual([]);
  });
});

describe("rules", () => {
  it("requires id, severity, kind and applies_to on every rule", () => {
    const problems = validate({ rules: { rules: [{ id: "bare" }] } });
    const missing = problems.map((p) => p.message);
    expect(missing).toContain('missing required field "severity"');
    expect(missing).toContain('missing required field "kind"');
    expect(missing).toContain('missing required field "applies_to"');
  });

  it("rejects an unknown severity", () => {
    const problems = validate({
      rules: {
        rules: [{ id: "x", severity: "critical", kind: "forbidden_pattern", applies_to: ["resume"] }],
      },
    });
    expect(problems.some((p) => p.message.includes("severity must be"))).toBe(true);
  });
});

describe("referential integrity", () => {
  it("rejects an opportunity pointing at an unknown company", () => {
    const problems = validate({
      companies: { companies: [{ id: "known" }] },
      opportunities: { opportunities: [{ id: "o1", company: "ghost" }] },
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('unknown company "ghost"');
  });
});
