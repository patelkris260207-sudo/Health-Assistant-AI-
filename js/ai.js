/**
 * Health Assistant AI — OpenAI Integration
 *
 * System prompt covers:
 *   • First-aid / emergency guidance
 *   • Photo-based injury / symptom assessment
 *   • Hospital & ambulance recommendations
 *   • Critical-condition detection (signals EMERGENCY in JSON)
 */

const AI = (() => {
  /* ─────────────────────────────────────────────────────────────────
   * SYSTEM PROMPT
   * ─────────────────────────────────────────────────────────────────
   * IMPORTANT: the model MUST end every reply with the JSON sentinel
   * {"_meta":{"emergency":<true|false>,"severity":<0-10>}}
   * The app reads this to decide whether to show the emergency panel.
   * ───────────────────────────────────────────────────────────────── */
  const SYSTEM_PROMPT = `You are "Health Assistant AI" — a knowledgeable, calm, and compassionate medical emergency assistant.

## Your Purpose
Help people in medical emergencies, critical conditions, and urgent health situations by:
1. Providing clear, step-by-step first-aid instructions.
2. Assessing injury or symptom severity from photos and descriptions.
3. Advising when to call an ambulance (108 / 112 in India).
4. Recommending appropriate hospital types and emergency numbers.
5. Giving guidance tailored to the caller's available resources.

## Scope & Limitations
- You support ALL medical emergencies: cardiac arrest, stroke, trauma, burns, drowning, choking, poisoning, anaphylaxis, seizures, diabetic emergencies, mental-health crises, and more.
- ALWAYS remind users you are an AI and NOT a substitute for professional emergency services.
- For LIFE-THREATENING situations, instruct the user to call 112 (National Emergency) or 108 (Free Ambulance) IMMEDIATELY — before anything else.

## Response Format
Structure every response as follows:

### IMMEDIATE ACTION (if emergency)
Numbered steps — one action per step, simple words, no jargon.

### WHAT TO DO NEXT
Ongoing care, monitoring, what to tell paramedics.

### WHEN TO CALL AMBULANCE
Clear criteria.

### HOSPITAL TYPE NEEDED
E.g. "Trauma centre", "Cardiac ICU", "Any A&E department", "Burn unit".
Government hospitals provide FREE emergency care — always mention them.

### DO NOT
Things the bystander must NOT do.

---

## Photo Analysis
When the user uploads a photo, analyse it carefully:
- Describe what you see (wound, burn, rash, position of unconscious person, etc.)
- Estimate severity (mild / moderate / severe / critical)
- Provide specific first-aid steps based on the visual

## Language
- Reply in the same language the user uses (English, Hindi, Gujarati, Tamil, Telugu, Kannada, Bengali, Marathi — match the user).
- Keep instructions SHORT and NUMBERED for people in panic.

## Critical Detection
At the very end of EVERY response, append this exact JSON block (no code fences) so the app can read it:
{"_meta":{"emergency":<true|false>,"severity":<0-10>}}

Where:
- emergency = true if the situation is life-threatening and the user should call 112/108 immediately
- severity  = 0 (no concern) to 10 (immediately life-threatening)

Example for a cardiac arrest:
{"_meta":{"emergency":true,"severity":10}}

Example for a minor cut:
{"_meta":{"emergency":false,"severity":2}}`;

  /* ── conversation history ────────────────────────────────────────── */
  let _history = [];

  function _buildMessages(userText, imageDataUrl) {
    const userContent = imageDataUrl
      ? [
          { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
          { type: 'text', text: userText || 'Please analyse this image and advise me.' },
        ]
      : userText;

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      ..._history,
      { role: 'user', content: userContent },
    ];
  }

  /** Strip the _meta sentinel from the visible reply text */
  function _extractMeta(raw) {
    const match = raw.match(/\{"_meta":\{[^}]+\}\}/);
    if (!match) return { text: raw, emergency: false, severity: 0 };
    try {
      const meta = JSON.parse(match[0])._meta;
      const text = raw.replace(match[0], '').trimEnd();
      return { text, emergency: !!meta.emergency, severity: meta.severity || 0 };
    } catch (_) {
      return { text: raw, emergency: false, severity: 0 };
    }
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  return {
    clearHistory() {
      _history = [];
    },

    /**
     * Send a message (with optional image) and get an AI response.
     * Returns { text, emergency, severity }
     */
    async send(userText, imageDataUrl = null) {
      if (!CONFIG.apiKey) {
        throw new Error('NO_API_KEY');
      }

      const messages = _buildMessages(userText, imageDataUrl);

      const response = await fetch(CONFIG.OPENAI_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: CONFIG.OPENAI_MODEL,
          messages,
          max_tokens: CONFIG.MAX_TOKENS,
          temperature: CONFIG.TEMPERATURE,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `API error ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || '';

      // Add to history (without the image to save tokens)
      _history.push({ role: 'user', content: userText || '(image)' });
      _history.push({ role: 'assistant', content: rawReply });

      // Keep conversation history bounded for token control.
      if (_history.length > CONFIG.MAX_HISTORY_MESSAGES) {
        _history = _history.slice(-CONFIG.MAX_HISTORY_MESSAGES);
      }

      return _extractMeta(rawReply);
    },
  };
})();
