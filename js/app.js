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
  let _userProfile = null;

  /* ── tiny utility ───────────────────────────────────────────────── */
  function _escapeHtml(text = '') {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _readUserProfile() {
    try {
      const raw = localStorage.getItem(CONFIG.LS_USER_PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function _writeUserProfile(profile) {
    if (profile) {
      localStorage.setItem(CONFIG.LS_USER_PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(CONFIG.LS_USER_PROFILE);
    }
  }

  function _updateLoginButton() {
    const label = document.getElementById('loginBtnLabel');
    if (!label) return;
    label.textContent = _userProfile?.name ? _userProfile.name.split(' ')[0] : 'Login';
  }

  function _showLoginModal() {
    const modal = document.getElementById('loginModal');
    const nameInput = document.getElementById('loginNameInput');
    const emailInput = document.getElementById('loginEmailInput');
    const logoutBtn = document.getElementById('logoutBtn');
    if (nameInput) nameInput.value = _userProfile?.name || '';
    if (emailInput) emailInput.value = _userProfile?.email || '';
    if (logoutBtn) logoutBtn.classList.toggle('hidden', !_userProfile);
    modal?.classList.add('active');
  }

  function _hideLoginModal() {
    document.getElementById('loginModal')?.classList.remove('active');
  }

  function _saveLogin() {
    const name = document.getElementById('loginNameInput')?.value?.trim() || '';
    const email = document.getElementById('loginEmailInput')?.value?.trim() || '';

    if (!name || !email) {
      UI.showToast('Please fill name and email.', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      UI.showToast('Please enter a valid email address.', 'warning');
      return;
    }
    _userProfile = { name, email };
    _writeUserProfile(_userProfile);
    _updateLoginButton();
    _hideLoginModal();
    UI.showToast(`Welcome, ${name}!`, 'success');
  }

  function _logout() {
    _userProfile = null;
    _writeUserProfile(null);
    _updateLoginButton();
    _hideLoginModal();
    document.getElementById('loginForm')?.reset();
    UI.showToast('You have been logged out.', 'info');
  }

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
      _renderNearbyHospitals();
    } catch (err) {
      UI.setLocationBadge('📍 Location');
      const msg =
        err.code === 1
          ? 'Location permission denied. Nearest hospitals will be listed alphabetically.'
          : 'Could not get location. Nearest hospitals will be listed alphabetically.';
      UI.showToast(msg, 'warning');
      _renderNearbyHospitals();
    }
  }

  async function _renderNearbyHospitals() {
    const list = document.getElementById('nearbyHospitalsList');
    if (!list) return;
    list.innerHTML = '<p class="loading-text">📍 Loading nearby hospitals…</p>';
    try {
      const hospitals = await HospitalDB.getNearby(Location.lat, Location.lng, {
        limit: 3,
        allEmergencyOnly: true,
      });
      if (!hospitals.length) {
        list.innerHTML = '<p class="loading-text">No nearby hospitals available. Please call 112.</p>';
        return;
      }
      list.innerHTML = hospitals
        .map(h => {
          const firstPhone = h.phone?.[0] || '';
          const distance = h.distanceKm != null ? `${h.distanceKm.toFixed(1)} km` : 'Distance unavailable';
          return `
            <article class="mini-hospital-card">
              <div class="mini-hospital-title">
                <span>${_escapeHtml(h.name)}</span>
                <span>${distance}</span>
              </div>
              <p class="mini-hospital-meta">${_escapeHtml(h.city)}, ${_escapeHtml(h.state)}</p>
              <div class="mini-hospital-actions">
                ${firstPhone ? `<a class="mini-action-btn" href="tel:${firstPhone.replace(/\D/g, '')}">📞 Call</a>` : ''}
                <a class="mini-action-btn" href="https://www.google.com/maps?q=${h.lat},${h.lng}" target="_blank" rel="noopener">🗺️ Directions</a>
              </div>
            </article>
          `;
        })
        .join('');
    } catch (err) {
      list.innerHTML = '<p class="loading-text">Could not load hospitals right now.</p>';
      console.error(err);
    }
  }

  function _onContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value?.trim() || '';
    const email = document.getElementById('contactEmail')?.value?.trim() || '';
    const message = document.getElementById('contactMessage')?.value?.trim() || '';
    if (!name || !email || !message) {
      UI.showToast('Please complete all contact form fields.', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      UI.showToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (message.length > CONFIG.MAX_CONTACT_MESSAGE_LENGTH) {
      const overBy = message.length - CONFIG.MAX_CONTACT_MESSAGE_LENGTH;
      UI.showToast(`Message is ${message.length} chars. Please shorten by ${overBy}.`, 'warning');
      return;
    }
    const mailto = `mailto:support@healthassistantai.app?subject=${encodeURIComponent('Health Assistant Support Request')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    window.location.href = mailto;
    Chat.addSystemMessage('📩 Your email app was opened with a pre-filled support draft.');
    document.getElementById('contactForm')?.reset();
    UI.showToast('Support draft opened in your email app.', 'success');
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
    document.getElementById('heroEmergencyBtn')?.addEventListener('click', () => Emergency.show());
    document.getElementById('quickEmergencyBtn')?.addEventListener('click', () => Emergency.show());
    document.getElementById('quickShareSosBtn')?.addEventListener('click', () => Emergency.shareSOS());

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
    document.getElementById('cameraCtaBtn')?.addEventListener('click', () => {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        Camera.openCamera();
      } else {
        Camera.openFilePicker();
      }
    });
    document.getElementById('uploadCtaBtn')?.addEventListener('click', () => Camera.openFilePicker());

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
    document.getElementById('loginBtn')?.addEventListener('click', _showLoginModal);
    document.getElementById('closeLoginBtn')?.addEventListener('click', _hideLoginModal);
    document.getElementById('saveLoginBtn')?.addEventListener('click', _saveLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', _logout);

    /* New chat */
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
      Chat.clear();
      AI.clearHistory();
      Chat.addSystemMessage('New session started. How can I help you today?');
    });

    /* SOS share */
    document.getElementById('sosShareBtn')?.addEventListener('click', () => Emergency.shareSOS());
    document.getElementById('heroStartChatBtn')?.addEventListener('click', () => {
      document.getElementById('messageInput')?.focus();
      UI.showToast('Describe symptoms and press Send.', 'info');
    });
    document.getElementById('refreshNearbyBtn')?.addEventListener('click', _renderNearbyHospitals);
    document.getElementById('contactForm')?.addEventListener('submit', _onContactSubmit);

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
      _userProfile = _readUserProfile();
      _updateLoginButton();
      _wireEvents();
      _renderNearbyHospitals();

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
