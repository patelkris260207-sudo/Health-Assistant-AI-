import test from "node:test";
import assert from "node:assert/strict";
import { assessTriage } from "../src/services/triage.js";

test("triage marks critical chest pain as emergency", () => {
  const result = assessTriage({ message: "My father has severe chest pain and cannot breathe" });
  assert.equal(result.severity, "critical");
  assert.equal(result.emergencyTrigger, true);
  assert.equal(result.specialty, "cardiac");
});

test("triage marks medium fever as non-emergency", () => {
  const result = assessTriage({ message: "I have fever and vomiting" });
  assert.equal(result.severity, "medium");
  assert.equal(result.emergencyTrigger, false);
});
