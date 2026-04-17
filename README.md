# 🏥 Health Assistant AI

A **fully offline-capable, single-page web application** that acts as an intelligent medical emergency assistant. It guides users through first-aid situations, auto-detects critical conditions, shows emergency contact numbers, finds the nearest hospitals, supports **live photo analysis** via OpenAI GPT-4o vision, and can initiate a **direct phone call** to any hospital or emergency service.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 AI Chat | GPT-4o–powered health & emergency assistant with a full medical system prompt |
| 📸 Photo Analysis | Upload or capture a photo of an injury/condition — the AI analyses it visually |
| 🚨 Auto Emergency Panel | If the AI detects a critical / life-threatening situation (severity ≥ 7) the emergency panel opens automatically |
| 📞 Direct Call | Tap any phone number to call it instantly (works on mobile) |
| 🏥 Hospital Finder | 26 major Indian hospitals across 10 cities, sorted by distance from you |
| 🔄 Cascade Logic | If a hospital is unreachable, tap "Mark Unreachable → Try Next" to auto-reveal the next one |
| 📍 Live Location | Detects your GPS coordinates and shows nearest hospitals first |
| 📤 SOS Share | One-tap share of your location + emergency message via WhatsApp, SMS, etc. |
| 🇮🇳 India Emergency Numbers | 112, 108, 100, 101, 1091, 1098, 104 … all wired |
| 🌐 Multi-language | AI replies in the same language the user writes (English, Hindi, Gujarati, Tamil, etc.) |
| 🔑 API Key in browser | Key kept in-memory only for the active page session — never persisted in browser storage |

---

## 📁 File Structure

```
Health-Assistant-AI-/
├── index.html              ← Main SPA shell
├── css/
│   └── style.css           ← Dark medical theme
├── js/
│   ├── config.js           ← Runtime config + emergency keyword list
│   ├── hospitals.js        ← Hospital DB utilities + card renderer
│   ├── location.js         ← Geolocation + reverse-geocode helper
│   ├── camera.js           ← Camera capture + file upload + image resize
│   ├── ai.js               ← OpenAI API + full health system prompt
│   ├── emergency.js        ← Emergency panel, cascade call logic, SOS share
│   ├── chat.js             ← Chat message rendering helpers
│   └── app.js              ← App bootstrap + all event wiring
└── data/
    └── hospitals.json      ← 26 hospitals + emergency numbers
```

---

## 🚀 Quick Start

### Option A — Open locally (no server needed)

```bash
# Just open the file in your browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

> **Note:** The `fetch('data/hospitals.json')` call requires a local HTTP server if you get a CORS error. Use Option B.

### Option B — Local development server

```bash
# Python (built-in)
python3 -m http.server 8080
# then open http://localhost:8080

# Node.js
npx serve .
```

### Step 1 — Get an OpenAI API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key (starts with `sk-`)
3. Enable the **GPT-4o** model in your billing settings

### Step 2 — Configure the app

1. Open the app in your browser
2. The **Setup** modal opens automatically on first visit
3. Paste your API key and click **Save & Continue**
4. The key is kept in-memory for the active tab — it never leaves your device except direct calls to OpenAI

---

## 🛡️ Emergency Capabilities

### Automatic emergency detection

The AI appends a hidden JSON sentinel to every reply:

```json
{"_meta":{"emergency":true,"severity":9}}
```

If `emergency === true` **or** `severity >= 7`, the emergency panel slides in automatically.

### Manual trigger

Click the **🆘 SOS** button in the top-right corner at any time.

### Hospital cascade

1. The 5 nearest hospitals that handle **all medical emergencies** are loaded.
2. The first card is shown.
3. If a call fails → tap **✖ Mark Unreachable → Try Next** → the next card slides in.
4. If all 5 are exhausted → a prompt to call **112** appears.

### Emergency numbers (wired)

| Service | Number |
|---|---|
| National Emergency | **112** |
| Free Ambulance | **108** |
| Police | **100** |
| Fire Brigade | **101** |
| Women Helpline | **1091** |
| Child Helpline | **1098** |
| Blood Bank | **104** |
| Disaster Management | **1078** |

---

## 📸 Photo-Based Diagnosis

1. Tap the **📷 camera** button (captures live via device camera on mobile)  
   **or** tap the **🖼️ gallery** button to upload from your library
2. A thumbnail preview appears above the chat input
3. Optionally type a question (e.g. *"Is this burn serious?"*)
4. Press **Send** — the image is passed to GPT-4o vision for analysis
5. The AI describes what it sees, estimates severity, and gives specific first-aid steps

---

## 🏥 Hospital Database

26 hospitals across India covering:

| City | Hospitals |
|---|---|
| New Delhi | AIIMS Delhi, Safdarjung, LNJP, Apollo Indraprastha, Max Saket |
| Mumbai | KEM, Nair, Kokilaben Ambani, Fortis Mulund |
| Bengaluru | Manipal Old Airport, Victoria Hospital |
| Chennai | Apollo Greams Road, Rajiv Gandhi General |
| Hyderabad | KIMS, Osmania General |
| Chandigarh | PGIMER |
| Jaipur | SMS Hospital |
| Ahmedabad | Apollo, Civil Hospital |
| Pune | Ruby Hall, Sassoon General |
| Bhopal | AIIMS Bhopal |
| Vellore | CMC |
| Lucknow | SGPGI |
| Kolkata | Fortis, SSKM |

Every hospital entry includes:
- `handles_all_emergencies` flag (shown as **All Emergencies** badge)
- Government hospitals marked **Free** for emergency care
- GPS coordinates for distance sorting
- Multiple phone numbers (each is a tappable `tel:` link)

---

## 🤖 AI System Prompt Highlights

The system prompt instructs the model to:

1. **Prioritise** calling 112/108 above everything else for life-threatening situations
2. Provide **numbered, jargon-free steps** (optimised for panicked bystanders)
3. Structure every response with sections: *Immediate Action / What To Do Next / When To Call Ambulance / Hospital Type Needed / Do NOT*
4. **Analyse uploaded photos** — describe wound/condition, estimate severity, give visual-specific first-aid
5. Reply in the **same language** the user uses (English, Hindi, Gujarati, Tamil, Telugu, Kannada, Bengali, Marathi)
6. Append the hidden `{"_meta":{"emergency":...,"severity":...}}` sentinel that the app reads to trigger the emergency panel automatically

---

## 🔒 Privacy & Security

- The OpenAI API key is stored **only in-memory** in the active tab (not persisted to localStorage/sessionStorage)
- No data is stored on any server — all conversation history is in-memory only
- Reverse geocoding uses [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) — no API key required
- Location is **never sent to any server** other than Nominatim for the city name lookup (which does not store personal data)

---

## 🛠️ Customisation

### Change the AI model

Edit `js/config.js`:

```js
OPENAI_MODEL: 'gpt-4o',   // change to 'gpt-4-turbo' or 'gpt-3.5-turbo'
```

### Add more hospitals

Edit `data/hospitals.json` — follow the existing schema:

```json
{
  "id": 27,
  "name": "Your Hospital Name",
  "type": "government",
  "categories": ["general", "trauma"],
  "handles_all_emergencies": true,
  "city": "City",
  "state": "State",
  "address": "Full address",
  "phone": ["STD-Number1"],
  "emergency_number": "STD-Number1",
  "lat": 00.0000,
  "lng": 00.0000,
  "available_24x7": true,
  "free_emergency": true
}
```

### Add emergency keywords

Edit the `EMERGENCY_KEYWORDS` array in `js/config.js`.

---

## 📱 Mobile Usage

- **Camera button** launches the device's native camera on mobile
- All hospital phone numbers are `tel:` links → single tap to call
- Responsive layout adapts to all screen sizes
- PWA-ready (add to Home Screen supported via the theme-color meta tag)

---

## 👥 Team

Built as a college project demonstrating AI-assisted emergency response.  
Powered by **OpenAI GPT-4o**, **OpenStreetMap Nominatim**, and the browser's native **Geolocation & MediaDevices APIs**.

---

> ⚠️ **Disclaimer:** This application is for educational and guidance purposes only. It is **not** a substitute for calling emergency services. In any life-threatening situation, **call 112 immediately**.
