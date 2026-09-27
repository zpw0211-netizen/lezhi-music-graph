import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const compile = async entry => {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "neutral" });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
};

const { validateGraphIndex } = await compile("app/lib/ai/graph-validation.ts");
const index = JSON.parse(await readFile("public/data/graph-index.json", "utf8"));
const valid = validateGraphIndex(index);
assert.equal(valid.ok, true, valid.ok ? "" : valid.reason);

const rejects = [];
const reject = (name, graphIndex) => {
  const result = validateGraphIndex(graphIndex);
  assert.equal(result.ok, false, `${name} was accepted`);
  rejects.push(name);
};
const clone = () => structuredClone(index);

const duplicateId = clone();
duplicateId.canonicalGraph.entities[1].id = duplicateId.canonicalGraph.entities[0].id;
reject("duplicate-id", duplicateId);

const danglingSubject = clone();
danglingSubject.canonicalGraph.relationships[0].subject = "missing-entity";
reject("dangling-subject", danglingSubject);

const danglingObject = clone();
danglingObject.canonicalGraph.relationships[0].objectId = "missing-entity";
reject("dangling-objectId", danglingObject);

const missingBooks = clone();
delete missingBooks.canonicalGraph.books;
reject("missing-books", missingBooks);

const missingEntityId = clone();
delete missingEntityId.canonicalGraph.entities[0].id;
reject("missing-entity-id", missingEntityId);

const missingSubject = clone();
delete missingSubject.canonicalGraph.relationships[0].subject;
reject("missing-subject", missingSubject);

const missingLiteral = clone();
missingLiteral.canonicalGraph.relationships[0].objectId = null;
delete missingLiteral.canonicalGraph.relationships[0].literal;
reject("missing-literal", missingLiteral);

const emptyEntities = clone();
emptyEntities.canonicalGraph.entities = [];
reject("empty-entities", emptyEntities);

const emptyRelationships = clone();
emptyRelationships.canonicalGraph.relationships = [];
reject("empty-relationships", emptyRelationships);

const literalRelation = clone();
literalRelation.canonicalGraph.relationships[0].objectId = null;
literalRelation.canonicalGraph.relationships[0].literal = "audit literal";
assert.equal(validateGraphIndex(literalRelation).ok, true, "literal relation with an empty objectId was rejected");

const worker = (await compile("worker/ai-api.ts")).default;
let entityIterations = 0;
let relationshipIterations = 0;
const invalidIndex = {
  canonicalGraph: {
    books: [],
    entities: new Proxy([{ id: "entity-1" }], {
      get(target, property, receiver) {
        if (property === Symbol.iterator) entityIterations += 1;
        return Reflect.get(target, property, receiver);
      },
    }),
    relationships: new Proxy([{ id: "relation-1", subject: "missing-entity", objectId: "entity-1" }], {
      get(target, property, receiver) {
        if (property === Symbol.iterator) relationshipIterations += 1;
        return Reflect.get(target, property, receiver);
      },
    }),
  },
};
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const validationLogs = [];
globalThis.fetch = async () => ({ ok: true, json: async () => invalidIndex });
console.error = (...parts) => validationLogs.push(parts.join(" "));
const env = {
  OPENAI_API_KEY: "audit-only-mock-key",
  ALLOWED_ORIGIN: "https://zpw0211-netizen.github.io",
  GRAPH_DATA_URL: "https://example.test/data",
  AI_RATE_LIMIT: { limit: async () => ({ success: true }) },
};
const request = () => new Request("https://api.test/ask", {
  method: "POST",
  headers: { origin: env.ALLOWED_ORIGIN, "content-type": "application/json" },
  body: JSON.stringify({ question: "audit" }),
});
try {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.message, "AI 服务暂时不可用，请使用本地图谱回答");
    assert(!JSON.stringify(body).includes("missing-entity"), "graph contents must not be returned to clients");
  }
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
}
assert.equal(entityIterations, 1, "entity validation was repeated for a cached graph URL");
assert.equal(relationshipIterations, 1, "relationship validation was repeated for a cached graph URL");
assert(validationLogs.length === 2 && validationLogs.every(line => line.includes("unknown or missing subject")), "validation failures must identify the failed field in logs");

console.log(`AI_WORKER_AUDIT_PASSED canonical=${valid.graphIndex.canonicalGraph.entities.length}/${valid.graphIndex.canonicalGraph.relationships.length} books=${valid.graphIndex.canonicalGraph.books.length} rejected=${rejects.join(",")} validationCache=reused`);
