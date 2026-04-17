import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import { handleChat } from "./routes/chat.js";
import { getEmergencyNumbers } from "./routes/emergency.js";
import { getNearestHospitalRoute } from "./routes/hospitals.js";

const PORT = Number(process.env.PORT || 3000);
const root = process.cwd();
const frontendRoot = path.resolve(root, "frontend");

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": contentType });
  res.end(fs.readFileSync(filePath));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/chat") {
    try {
      const body = await parseBody(req);
      const reply = await handleChat({
        message: body.message || "",
        photo: body.photo || null,
        location: body.location || null,
        region: body.region || {},
      });
      sendJson(res, 200, reply);
    } catch (error) {
      sendJson(res, 400, { error: "Invalid request", details: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/emergency") {
    const payload = getEmergencyNumbers({
      country: url.searchParams.get("country") || "India",
      state: url.searchParams.get("state") || "",
      city: url.searchParams.get("city") || "",
    });
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/hospitals/nearest") {
    const payload = getNearestHospitalRoute({
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
      specialty: url.searchParams.get("specialty") || "general",
      region: {
        country: url.searchParams.get("country") || "India",
        state: url.searchParams.get("state") || "",
        city: url.searchParams.get("city") || "",
      },
    });
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    sendFile(res, path.join(frontendRoot, "index.html"), "text/html; charset=utf-8");
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/src/")) {
    const filePath = path.join(frontendRoot, url.pathname);
    const contentType = filePath.endsWith(".css")
      ? "text/css; charset=utf-8"
      : "application/javascript; charset=utf-8";
    sendFile(res, filePath, contentType);
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Health Assistant AI listening on http://localhost:${PORT}`);
});
