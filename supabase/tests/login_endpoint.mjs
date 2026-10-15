import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../../lib/account/config.ts", import.meta.url), "utf8");
const url = config.match(/ACCOUNT_URL = .*?\|\| "([^"]+)"/)[1];
const publicKey = config.match(/ACCOUNT_KEY = .*?\|\| "([^"]+)"/)[1];
const endpoint = `${url}/functions/v1/yapu-login`;
const cases = [
  { label: "allowed preflight", method: "OPTIONS", status: 204, origin: "https://yapu.studio" },
  { label: "unsupported method", method: "GET", status: 405, origin: "https://yapu.studio" },
  { label: "unapproved origin", method: "POST", status: 403, origin: "https://unapproved.invalid", body: "{}" },
  { label: "invalid JSON", method: "POST", status: 400, origin: "https://yapu.studio", body: "{" },
  { label: "invalid body type", method: "POST", status: 400, origin: "https://yapu.studio", body: "null" },
  { label: "incorrect credentials", method: "POST", status: 401, origin: "https://yapu.studio", body: JSON.stringify({ identifier: "qa_missing_username", password: "NotARealPassword491" }) },
];
for (const test of cases) {
  const options = {
    method: test.method,
    headers: { apikey: publicKey, Origin: test.origin, "Content-Type": "application/json" },
    body: test.body,
  };
  let response;
  // A dropped TLS connection can occur on this network; retry transport failures once.
  for (let attempt = 0; attempt < 2; attempt++) {
    try { response = await fetch(endpoint, { ...options, signal: AbortSignal.timeout(15000) }); break; }
    catch (error) { if (attempt === 1) throw error; }
  }
  assert.equal(response.status, test.status, test.label);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), test.status === 403 ? null : test.origin, test.label);
  if (test.status !== 204) {
    const body = await response.json();
    assert.equal(typeof body.error, "string", test.label);
    assert.equal(body.session, undefined, test.label);
    assert.equal(body.user, undefined, test.label);
  }
  console.log(`PASS: ${test.label}`);
}
