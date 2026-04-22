import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const requiredFiles = [
  "frontend/index.html",
  "frontend/src/app.js",
  "backend/src/server.js",
  "backend/src/routes/chat.js",
  "backend/src/services/triage.js",
  "data/hospitals.json",
  "data/emergency_numbers.json",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error("Missing required files:\n" + missing.join("\n"));
  process.exit(1);
}

console.log("Lint check passed (structure validation).");
