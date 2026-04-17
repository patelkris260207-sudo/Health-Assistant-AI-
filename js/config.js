/**
 * Health Assistant AI — Configuration
 * All user-configurable settings live here.
 * API keys are kept in-memory only and never persisted in browser storage.
 */

const CONFIG = (() => {
  let _apiKey = '';

  return {
  /* ── AI Provider ──────────────────────────────────────────────────── */
  AI_PROVIDER: 'openai',          // currently only 'openai' is supported
  OPENAI_API_BASE: 'https://api.openai.com/v1/chat/completions',
  OPENAI_MODEL: 'gpt-4o',         // vision-capable model
  MAX_TOKENS: 1200,
  TEMPERATURE: 0.4,               // lower = more deterministic / safer
  MAX_HISTORY_MESSAGES: 20,
  MAX_CONTACT_MESSAGE_LENGTH: 1200,

  /* ── Emergency Detection ─────────────────────────────────────────── */
  // Any message containing at least one of these phrases triggers the
  // emergency panel automatically.
  EMERGENCY_KEYWORDS: [
    // English
    'heart attack', 'cardiac arrest', 'myocardial infarction',
    'not breathing', 'stopped breathing', 'no pulse',
    'stroke', 'brain hemorrhage', 'aneurysm',
    'unconscious', 'unresponsive', 'passed out', 'fainted',
    'severe bleeding', 'heavy bleeding', 'blood loss',
    'choking', 'can\'t breathe', 'difficulty breathing', 'airway blocked',
    'drowning', 'near drowning',
    'overdose', 'drug overdose', 'alcohol poisoning',
    'poisoning', 'ingested poison',
    'anaphylaxis', 'severe allergic reaction', 'throat closing',
    'seizure', 'convulsions', 'epilepsy attack',
    'chest pain', 'chest tightness', 'crushing chest',
    'diabetic coma', 'hypoglycaemia', 'hypoglycemia',
    'life threatening', 'life-threatening',
    'critical condition', 'critical',
    'call ambulance', 'call 108', 'call 112',
    'emergency', 'urgent help',
    // Hindi transliterations
    'dil ka dora', 'dil ka daura', 'dil ki bimari',
    'saans nahi', 'hosh nahi', 'behosh',
    'khoon aa raha', 'bahut khoon',
    'bachao', 'help karo',
    'jaan ka khaatra', 'jaan khatre mein',
    // Tamil/Telugu/Kannada (romanized) – common phrases
    'marunthu adikkavidai', 'uyir apaayam',
  ],

  /* ── Hospital auto-cascade ───────────────────────────────────────── */
  // If user marks hospital as unreachable, the next one is highlighted.
  MAX_HOSPITAL_CASCADE: 5,        // show up to this many hospitals at once

  /* ── Geolocation ─────────────────────────────────────────────────── */
  GEO_TIMEOUT_MS: 10000,
  GEO_MAX_AGE_MS: 60000,

  /* ── storage keys (for non-sensitive local data) ─────────────────── */
  LS_CHAT_HISTORY: 'health_ai_chat_history',
  LS_USER_PROFILE: 'health_ai_user_profile',

  /* ── getters ─────────────────────────────────────────────────────── */
  get apiKey() {
    // Keep API key in-memory only (never persisted in browser storage).
    return _apiKey;
  },
  set apiKey(val) {
    _apiKey = val && val.trim() ? val.trim() : '';
  },
  };
})();
