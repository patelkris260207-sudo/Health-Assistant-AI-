function createCallButton(label, phone) {
  const a = document.createElement("a");
  a.className = "btn btn-danger";
  a.href = `tel:${phone}`;
  a.textContent = `${label}: ${phone}`;
  a.setAttribute("aria-label", `Call ${label} at ${phone}`);
  return a;
}

export function renderEmergencyPanel(container, emergency) {
  container.innerHTML = "";
  if (!emergency?.shouldShow) {
    container.className = "emergency-panel hidden";
    return;
  }

  container.className = "emergency-panel";
  const heading = document.createElement("h2");
  heading.textContent = "Emergency Actions";
  container.appendChild(heading);

  container.appendChild(createCallButton("Ambulance", emergency.ambulanceNumber));

  if (emergency.selectedHospital) {
    container.appendChild(
      createCallButton("Hospital", emergency.selectedHospital.emergencyDesk),
    );
    const card = document.createElement("p");
    card.className = "hospital-card";
    card.textContent = `Nearest reachable: ${emergency.selectedHospital.name} (${emergency.selectedHospital.city})`;
    container.appendChild(card);
  }

  if (emergency.fallbackHospitals?.length) {
    const fallback = document.createElement("p");
    fallback.className = "fallback-note";
    fallback.textContent = `Fallback ready: ${emergency.fallbackHospitals
      .map((h) => `${h.name} (${h.emergencyDesk})`)
      .join(" | ")}`;
    container.appendChild(fallback);
  }
}
