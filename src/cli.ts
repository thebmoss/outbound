#!/usr/bin/env node
/** Minimal harness CLI. Only `validate` exists; commands belong to Construction. */
import { loadCorpus, validate } from "./load.ts";

const [command = "validate", dir = "data.example"] = process.argv.slice(2);

if (command !== "validate") {
  console.error(`Unknown command "${command}". Only "validate" exists so far.`);
  console.error("Commands are designed in Construction. See docs/aidlc/00-intent.md.");
  process.exit(2);
}

const problems = validate(loadCorpus(dir));

if (problems.length === 0) {
  console.log(`${dir}: ok`);
  process.exit(0);
}

for (const p of problems) {
  console.error(`${p.file} ${p.path}: ${p.message}`);
}
console.error(`\n${problems.length} problem(s) in ${dir}`);
process.exit(1);
