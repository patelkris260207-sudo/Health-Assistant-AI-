import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

function collectJsFiles(dir) {
  const result = [];
  for (const item of readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      result.push(...collectJsFiles(fullPath));
    } else if (fullPath.endsWith(".js")) {
      result.push(fullPath);
    }
  }
  return result;
}

const jsFiles = collectJsFiles(path.resolve(process.cwd(), "backend/src"));
for (const file of jsFiles) {
  execSync(`node --check "${file}"`, { stdio: "inherit" });
}

console.log("Build check passed (syntax validation).");
