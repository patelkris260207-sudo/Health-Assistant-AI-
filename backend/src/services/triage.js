const CRITICAL_KEYWORDS = [
  "not breathing",
  "can't breathe",
  "chest pain",
  "unconscious",
  "heavy bleeding",
  "stroke",
  "seizure",
  "cardiac arrest",
  "heart attack",
];

const HIGH_KEYWORDS = ["fracture", "severe burn", "head injury", "poison", "allergic reaction"];
const MEDIUM_KEYWORDS = ["fever", "vomiting", "diarrhea", "sprain", "minor burn", "infection"];

const SPECIALTY_HINTS = {
  cardiac: ["chest pain", "heart", "cardiac"],
  trauma: ["fracture", "head injury", "accident", "bleeding"],
  stroke: ["stroke", "face droop", "speech slur", "weakness"],
  pediatric: ["child", "baby", "infant"],
};

export function detectSpecialty(text = "") {
  const normalized = text.toLowerCase();
  for (const [specialty, hints] of Object.entries(SPECIALTY_HINTS)) {
    if (hints.some((hint) => normalized.includes(hint))) {
      return specialty;
    }
  }
  return "general";
}

export function assessTriage({ message = "", imageSummary = "" }) {
  const content = `${message} ${imageSummary}`.toLowerCase();
  const specialty = detectSpecialty(content);

  if (CRITICAL_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return { severity: "critical", emergencyTrigger: true, specialty };
  }
  if (HIGH_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return { severity: "high", emergencyTrigger: true, specialty };
  }
  if (MEDIUM_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return { severity: "medium", emergencyTrigger: false, specialty };
  }
  return { severity: "low", emergencyTrigger: false, specialty: "general" };
}

export function firstAidGuidance(severity) {
  switch (severity) {
    case "critical":
      return "This may be life-threatening. Call emergency services now. Keep the person safe, monitor breathing, and avoid delay.";
    case "high":
      return "Urgent medical attention is recommended. Keep the person stable, avoid unsafe movement, and contact emergency support.";
    case "medium":
      return "Monitor symptoms, hydrate if safe, and seek medical evaluation soon if symptoms worsen.";
    default:
      return "Provide basic rest and monitoring. If symptoms increase, contact a medical professional.";
  }
}
