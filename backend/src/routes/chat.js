import fs from "node:fs";
import path from "node:path";
import { assessTriage, firstAidGuidance } from "../services/triage.js";
import { analyzePhoto } from "../services/vision.js";
import { findNearestEligibleHospitals } from "../services/location.js";
import { routeHospital } from "../services/hospitalRouting.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

const dataRoot = path.resolve(process.cwd(), "data");
const hospitals = JSON.parse(fs.readFileSync(path.join(dataRoot, "hospitals.json"), "utf8"));
const emergencyNumbers = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "emergency_numbers.json"), "utf8"),
);

function findEmergencyNumbers(region = {}) {
  const exact = emergencyNumbers.find(
    (entry) =>
      entry.country === region.country &&
      entry.state === region.state &&
      entry.city === region.city,
  );
  if (exact) return exact;

  const stateLevel = emergencyNumbers.find(
    (entry) => entry.country === region.country && entry.state === region.state && !entry.city,
  );
  if (stateLevel) return stateLevel;

  return emergencyNumbers.find((entry) => entry.country === region.country) || emergencyNumbers[0];
}

function toReply({ triage, routed, numbers, locationAvailable }) {
  const selected = routed.selected;
  const emergency = triage.emergencyTrigger
    ? {
        shouldShow: true,
        ambulanceNumber: numbers.ambulance,
        policeNumber: numbers.police,
        fireNumber: numbers.fire,
        selectedHospital: selected
          ? {
              id: selected.id,
              name: selected.name,
              city: selected.region.city,
              emergencyDesk: selected.contact.emergencyDesk,
              distanceKm: selected.distanceKm,
            }
          : null,
        fallbackHospitals: routed.fallbackCandidates.map((item) => ({
          id: item.id,
          name: item.name,
          emergencyDesk: item.contact.emergencyDesk,
          city: item.region.city,
        })),
      }
    : { shouldShow: false };

  return {
    disclaimer:
      "This assistant is not a substitute for professional medical care. In severe symptoms, call emergency services immediately.",
    triage,
    guidance: firstAidGuidance(triage.severity),
    emergency,
    location: {
      available: locationAvailable,
      message: locationAvailable
        ? "Live location processed for nearest hospital suggestion."
        : "Location unavailable. Enable location for nearest hospital routing.",
    },
    audit: routed.audit,
    systemPromptUsed: SYSTEM_PROMPT.trim(),
  };
}

export async function handleChat({ message, photo, location, region }) {
  const vision = analyzePhoto(photo);
  const triageBase = assessTriage({
    message,
    imageSummary: vision.imageSummary,
  });
  const triage =
    vision.imageSpecialtyHint !== "general" && triageBase.specialty === "general"
      ? { ...triageBase, specialty: vision.imageSpecialtyHint }
      : triageBase;

  const numbers = findEmergencyNumbers(region);
  const candidates = findNearestEligibleHospitals({
    hospitals,
    userLocation: location,
    specialty: triage.specialty,
    region,
  });
  const routed = routeHospital(candidates);

  return toReply({
    triage,
    routed,
    numbers,
    locationAvailable: Boolean(location),
  });
}
