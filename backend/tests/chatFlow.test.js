import test from "node:test";
import assert from "node:assert/strict";
import { handleChat } from "../src/routes/chat.js";

test("critical case triggers emergency panel and hospital details", async () => {
  const result = await handleChat({
    message: "There is heavy bleeding after an accident",
    photo: { fileName: "bleed-hand.jpg" },
    location: { lat: 23.03, lng: 72.58 },
    region: { country: "India", state: "Gujarat", city: "Ahmedabad" },
  });

  assert.equal(result.triage.emergencyTrigger, true);
  assert.equal(result.emergency.shouldShow, true);
  assert.ok(result.emergency.ambulanceNumber);
  assert.ok(result.emergency.selectedHospital);
});

test("location denied still returns emergency guidance text", async () => {
  const result = await handleChat({
    message: "I have chest pain and cannot breathe",
    photo: null,
    location: null,
    region: { country: "India", state: "Gujarat", city: "Ahmedabad" },
  });

  assert.equal(result.location.available, false);
  assert.match(result.location.message, /Location unavailable/i);
  assert.equal(result.triage.emergencyTrigger, true);
});
