# Health Assistant AI

Emergency-first AI assistant prototype for first-aid guidance, emergency escalation, nearby hospital suggestions, and ambulance/hospital call shortcuts.

## Safety Notice
- This project is **not a replacement for licensed medical professionals**.
- In severe symptoms (breathing trouble, chest pain, heavy bleeding, unconsciousness, stroke signs, seizures), users should call emergency services immediately.
- AI guidance is limited to safer first-aid style actions and escalation.

## Project Structure

```
frontend/
  index.html
  src/
    app.js
    pages/ChatPage.js
    components/
      MessageBubble.js
      EmergencyPanel.js
      PhotoUpload.js
      LocationPermission.js
    styles/theme.css
backend/
  src/
    server.js
    routes/
      chat.js
      emergency.js
      hospitals.js
    services/
      triage.js
      location.js
      hospitalRouting.js
      vision.js
    prompts/systemPrompt.js
  tests/
    triage.test.js
    routing.test.js
    chatFlow.test.js
data/
  hospitals.json
  emergency_numbers.json
docs/
  PRD.md
  SafetyPolicy.md
  HospitalDataFormat.md
scripts/
  lint-check.js
  build-check.js
```

## Run

```bash
npm run lint
npm run build
npm test
npm start
```

Then open: `http://localhost:3000`

## Current Region Dataset
- Seed region: India (national + selected state/city records in sample data).
- Dataset supports country/state/city extension.

## Key Features Implemented
- Emergency-first triage severity detection (critical/high/medium/low).
- General-vs-specialty hospital filtering.
- Reachability fallback routing to alternate hospital.
- One-tap ambulance/hospital call links.
- Photo upload/capture support and image-keyword analysis.
- Location permission flow and nearest eligible hospital recommendation.
- Structured AI system prompt and reusable prompt templates.
