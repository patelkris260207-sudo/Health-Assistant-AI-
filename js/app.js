/**
 * Health Assistant AI — Main application bootstrap & event wiring
 */

/* ── tiny shared UI helpers (used by other modules via UI.xxx) ─────── */
const UI = {
  showToast(msg, type = 'info', durationMs = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    // animate in
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, durationMs);
  },

  setLocationBadge(text, active = false) {
    const badge = document.getElementById('locationBadge');
    if (!badge) return;
    badge.textContent = text;
    badge.classList.toggle('active', active);
  },
};

/* ── App state ────────────────────────────────────────────────────── */
const App = (() => {
  let _isSending = false;

  /* ── Setup wizard ────────────────────────────────────────────────── */
  function _showSetupWizard() {
    const modal = document.getElementById('setupModal');
    if (modal) modal.classList.add('active');
  }

  function _hideSetupWizard() {
    const modal = document.getElementById('setupModal');
    if (modal) modal.classList.remove('active');
  }

  /* ── Submit an API key from the setup wizard ─────────────────────── */
  function _saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input?.value?.trim();
    if (!key || !key.startsWith('sk-')) {
      UI.showToast('Please enter a valid OpenAI API key (starts with sk-).', 'error');
      return;
    }
    CONFIG.apiKey = key;
    _hideSetupWizard();
    UI.showToast('API key saved! You can now use the assistant.', 'success');
    Chat.addSystemMessage('✅ API key configured. Ask me anything about a medical situation!');
  }

  /* ── Request location ───────────────────────────────────────────── */
  async function _requestLocation() {
    UI.setLocationBadge('📍 Detecting…');
    try {
      const { lat, lng } = await Location.request();
      const city = Location.city || 'your location';
      UI.setLocationBadge(`📍 ${city}`, true);
      Chat.addSystemMessage(`📍 Location detected: ${city} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      UI.showToast(`Location set to ${city}`, 'success');
    } catch (err) {
      UI.setLocationBadge('📍 Location');
      const msg =
        err.code === 1
          ? 'Location permission denied. Nearest hospitals will be listed alphabetically.'
          : 'Could not get location. Nearest hospitals will be listed alphabetically.';
      UI.showToast(msg, 'warning');
    }
  }

  /* ── Check if text contains emergency keywords ───────────────────── */
  function _isEmergencyText(text) {
    const lower = text.toLowerCase();
    return CONFIG.EMERGENCY_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
  }

  /* ── Send a message to the AI ────────────────────────────────────── */
  async function _send() {
    if (_isSending) return;

    const input = document.getElementById('messageInput');
    const text = input?.value?.trim() || '';
    const imageDataUrl = Camera.currentDataUrl;

    if (!text && !imageDataUrl) return;

    // Check for API key
    if (!CONFIG.apiKey) {
      _showSetupWizard();
      UI.showToast('Please enter your OpenAI API key first.', 'warning');
      return;
    }

    _isSending = true;
    _setSendingState(true);

    // Show user message
    Chat.addUserMessage(text, imageDataUrl);
    if (input) input.value = '';
    Camera.clearImage();

    // Pre-check: if user's own text contains emergency keywords → show panel immediately
    if (_isEmergencyText(text)) {
      Emergency.show();
    }

    const removeTyping = Chat.showTyping();

    try {
      const { text: reply, emergency, severity } = await AI.send(text, imageDataUrl);

      removeTyping();
      Chat.addAIMessage(reply, severity);

      // If AI says emergency OR severity is high → show emergency panel
      if (emergency || severity >= 7) {
        Emergency.show();
      }
    } catch (err) {
      removeTyping();
      if (err.message === 'NO_API_KEY') {
        _showSetupWizard();
        Chat.addError('Please configure your OpenAI API key to use this assistant.');
      } else {
        Chat.addError(`Sorry, I encountered an error: ${err.message}`);
        UI.showToast('AI request failed. Check your API key and internet connection.', 'error');
      }
    } finally {
      _isSending = false;
      _setSendingState(false);
    }
  }

  /* ── Update send button state ────────────────────────────────────── */
  function _setSendingState(sending) {
    const btn = document.getElementById('sendBtn');
    const input = document.getElementById('messageInput');
    if (btn) { btn.disabled = sending; btn.textContent = sending ? '…' : 'Send'; }
    if (input) input.disabled = sending;
  }

  /* ── Wire up all event listeners ────────────────────────────────── */
  function _wireEvents() {
    /* Send button */
    document.getElementById('sendBtn')?.addEventListener('click', _send);

    /* Enter key in textarea (Shift+Enter = new line) */
    document.getElementById('messageInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        _send();
      }
    });

    /* Location button */
    document.getElementById('locationBtn')?.addEventListener('click', _requestLocation);

    /* Emergency (SOS) button in header */
    document.getElementById('emergencyBtn')?.addEventListener('click', () => Emergency.show());

    /* Close emergency panel */
    document.getElementById('closeEmergencyPanel')?.addEventListener('click', () => Emergency.hide());

    /* Camera button — opens camera on mobile, file picker on desktop */
    document.getElementById('cameraBtn')?.addEventListener('click', () => {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        Camera.openCamera();
      } else {
        Camera.openFilePicker();
      }
    });

    /* Upload / gallery button */
    document.getElementById('uploadBtn')?.addEventListener('click', () => Camera.openFilePicker());

    /* Hidden file input */
    document.getElementById('photoFileInput')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (file) {
        await Camera.onFileSelected(file);
        e.target.value = '';   // reset so same file can be selected again
        UI.showToast('Image selected. Type a question and press Send.', 'info');
      }
    });

    /* Camera modal buttons */
    document.getElementById('snapBtn')?.addEventListener('click', () => Camera.captureFromCamera());
    document.getElementById('closeCameraBtn')?.addEventListener('click', () => Camera.closeCamera());

    /* Setup wizard */
    document.getElementById('saveApiKeyBtn')?.addEventListener('click', _saveApiKey);
    document.getElementById('apiKeyInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') _saveApiKey();
    });
    document.getElementById('openSetupBtn')?.addEventListener('click', _showSetupWizard);
    document.getElementById('closeSetupBtn')?.addEventListener('click', _hideSetupWizard);

    /* New chat */
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
      Chat.clear();
      AI.clearHistory();
      Chat.addSystemMessage('New session started. How can I help you today?');
    });

    /* SOS share */
    document.getElementById('sosShareBtn')?.addEventListener('click', () => Emergency.shareSOS());

    /* Quick-question chips */
    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('messageInput');
        if (input) {
          input.value = chip.dataset.question || chip.textContent.trim();
          input.focus();
        }
      });
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────── */
  return {
    async init() {
      _wireEvents();

      // Show welcome greeting
      Chat.addSystemMessage('👋 Welcome to Health Assistant AI! I can help with medical emergencies, first-aid guidance, and more.');
      Chat.addSystemMessage('📸 You can also <strong>upload a photo</strong> of an injury or condition for visual analysis.');

      // If no API key is configured, show the wizard
      if (!CONFIG.apiKey) {
        setTimeout(_showSetupWizard, 800);
      } else {
        Chat.addSystemMessage('✅ API key found. Ask me anything!');
      }
    },
  };
})();

/* ── Bootstrap ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
