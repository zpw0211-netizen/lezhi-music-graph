import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const source = await readFile("app/lib/ai/graph-rag.ts", "utf8");
assert(source.includes("candidateKnowledge: never[]")); assert(source.includes("candidateKnowledge: []"));
for (const file of ["worker/ai-api.ts", "app/lib/ai/response-generation.ts", "app/api/ask/route.ts"]) {
  assert(!/writeFile|appendFile|candidate-accepted/.test(await readFile(file, "utf8")), `${file} must not write formal data`);
}
console.log("AI_CANDIDATE_BOUNDARY_AUDIT_PASSED generation=disabled P3_P4=deferred formal_writes=none");
