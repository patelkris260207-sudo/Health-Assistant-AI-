import fs from "node:fs";
import path from "node:path";
import { findNearestEligibleHospitals } from "../services/location.js";
import { routeHospital } from "../services/hospitalRouting.js";

const hospitals = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "data", "hospitals.json"), "utf8"),
);

export function getNearestHospitalRoute({ lat, lng, specialty, region }) {
  const candidates = findNearestEligibleHospitals({
    hospitals,
    userLocation: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
    specialty: specialty || "general",
    region,
  });

  return routeHospital(candidates);
}
