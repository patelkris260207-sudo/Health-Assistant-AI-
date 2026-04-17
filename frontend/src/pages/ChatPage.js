import { createMessageBubble } from "../components/MessageBubble.js";
import { renderEmergencyPanel } from "../components/EmergencyPanel.js";
import { createPhotoUpload } from "../components/PhotoUpload.js";
import { requestLiveLocation } from "../components/LocationPermission.js";

const DEFAULT_REGION = {
  country: "India",
  state: "Gujarat",
  city: "Ahmedabad",
};

function addMessage(chatLog, role, text) {
  chatLog.appendChild(createMessageBubble({ role, text }));
  chatLog.scrollTop = chatLog.scrollHeight;
}

export function renderChatPage(root) {
  let selectedPhoto = null;
  let liveLocation = null;

  root.innerHTML = `
    <section class="shell">
      <header class="app-header">
        <h1>Health Assistant AI</h1>
        <p class="subtitle">Emergency-first guidance for critical conditions</p>
      </header>
      <section id="emergency-panel" class="emergency-panel hidden" aria-live="assertive"></section>
      <section id="chat-log" class="chat-log" aria-live="polite"></section>
      <form id="chat-form" class="chat-form">
        <textarea id="message-input" required rows="3" placeholder="Describe symptoms or emergency condition"></textarea>
        <div class="actions">
          <button type="button" id="location-btn" class="btn btn-secondary">Use Live Location</button>
          <button type="submit" class="btn btn-primary">Send</button>
        </div>
      </form>
      <section id="photo-zone"></section>
      <p id="disclaimer" class="disclaimer"></p>
    </section>
  `;

  const emergencyPanel = root.querySelector("#emergency-panel");
  const chatLog = root.querySelector("#chat-log");
  const chatForm = root.querySelector("#chat-form");
  const input = root.querySelector("#message-input");
  const locationBtn = root.querySelector("#location-btn");
  const photoZone = root.querySelector("#photo-zone");
  const disclaimer = root.querySelector("#disclaimer");

  photoZone.appendChild(
    createPhotoUpload((photo) => {
      selectedPhoto = photo;
      addMessage(chatLog, "user", `Photo attached: ${photo.fileName}`);
    }),
  );

  locationBtn.addEventListener("click", async () => {
    const locationResult = await requestLiveLocation();
    if (locationResult.granted) {
      liveLocation = locationResult.coords;
      addMessage(chatLog, "assistant", "Live location enabled for nearest hospital routing.");
    } else {
      addMessage(chatLog, "assistant", locationResult.reason);
    }
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage(chatLog, "user", message);
    input.value = "";

    const payload = {
      message,
      photo: selectedPhoto,
      location: liveLocation,
      region: DEFAULT_REGION,
    };

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    disclaimer.textContent = data.disclaimer;
    addMessage(chatLog, "assistant", `${data.guidance} Severity: ${data.triage.severity}.`);
    addMessage(chatLog, "assistant", data.location.message);
    renderEmergencyPanel(emergencyPanel, data.emergency);
  });
}
