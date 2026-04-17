import fs from "node:fs";
import path from "node:path";

const emergencyNumbers = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "data", "emergency_numbers.json"), "utf8"),
);

export function getEmergencyNumbers({ country, state, city }) {
  const exact = emergencyNumbers.find(
    (entry) => entry.country === country && entry.state === state && entry.city === city,
  );
  if (exact) return exact;

  const stateLevel = emergencyNumbers.find(
    (entry) => entry.country === country && entry.state === state && !entry.city,
  );
  if (stateLevel) return stateLevel;

  return emergencyNumbers.find((entry) => entry.country === country) || emergencyNumbers[0];
}
