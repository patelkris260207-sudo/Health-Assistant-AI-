import test from "node:test";
import assert from "node:assert/strict";
import { routeHospital } from "../src/services/hospitalRouting.js";

test("routing skips unreachable hospital and selects fallback", () => {
  const candidates = [
    {
      id: "h1",
      status: { emergencyOpen: true, reachable: false },
      contact: { emergencyDesk: "+91 11 1111 1111" },
    },
    {
      id: "h2",
      status: { emergencyOpen: true, reachable: true },
      contact: { emergencyDesk: "+91 22 2222 2222" },
    },
  ];

  const result = routeHospital(candidates);
  assert.equal(result.selected.id, "h2");
  assert.equal(result.audit[0].decision, "skipped");
  assert.equal(result.audit[1].decision, "selected");
});
