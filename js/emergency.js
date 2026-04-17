/**
 * Health Assistant AI — Emergency panel controller
 *
 * Responsibilities:
 *  • Show/hide the emergency overlay panel
 *  • Load and render nearest hospitals
 *  • Handle "Mark Unreachable → Try Next" cascade
 *  • Initiate tel: calls
 */

const Emergency = (() => {
  let _nearbyHospitals = [];  // current sorted list
  let _shownCount = 0;        // how many cards are currently shown

  /* ── helpers ─────────────────────────────────────────────────────── */
  function _panel() { return document.getElementById('emergencyPanel'); }
  function _hospContainer() { return document.getElementById('hospitalList'); }
  function _qs(sel) { return document.querySelector(sel); }

  /* ── Public API ──────────────────────────────────────────────────── */
  return {
    /** Show the emergency panel (called when AI detects emergency) */
    async show() {
      const panel = _panel();
      if (!panel) return;
      panel.classList.add('active');
      document.body.classList.add('emergency-active');

      // Load emergency numbers
      Emergency._renderEmergencyNumbers();

      // Load nearest hospitals
      await Emergency._loadHospitals();
    },

    hide() {
      const panel = _panel();
      if (!panel) return;
      panel.classList.remove('active');
      document.body.classList.remove('emergency-active');
    },

    toggle() {
      const panel = _panel();
      if (!panel) return;
      if (panel.classList.contains('active')) {
        Emergency.hide();
      } else {
        Emergency.show();
      }
    },

    /** Render national emergency numbers at the top of the panel */
    async _renderEmergencyNumbers() {
      const container = document.getElementById('emergencyNumbers');
      if (!container) return;
      const nums = await HospitalDB.getEmergencyNumbers();
      container.innerHTML = Object.values(nums)
        .map(n => `
          <a href="tel:${n.number.replace(/\D/g, '')}" class="emerg-num-btn">
            📞 ${n.label}<br/><strong>${n.number}</strong>
          </a>`)
        .join('');
    },

    /** Load hospitals sorted by proximity and render first card */
    async _loadHospitals() {
      const container = _hospContainer();
      if (!container) return;

      container.innerHTML = '<p class="loading-text">📍 Finding nearest hospitals…</p>';

      _nearbyHospitals = await HospitalDB.getNearby(
        Location.lat,
        Location.lng,
        { limit: CONFIG.MAX_HOSPITAL_CASCADE, allEmergencyOnly: true }
      );

      _shownCount = 0;
      container.innerHTML = '';

      if (!_nearbyHospitals.length) {
        container.innerHTML = '<p>No hospital data available. Please call 112.</p>';
        return;
      }

      // Show the first hospital immediately
      Emergency._showNextHospital();

      // Wire up "Mark Unreachable" buttons
      container.addEventListener('click', e => {
        const btn = e.target.closest('.unreachable-btn');
        if (!btn) return;
        const hospId = parseInt(btn.dataset.hospitalId, 10);
        Emergency._markUnreachable(hospId);
      });
    },

    _showNextHospital() {
      if (_shownCount >= _nearbyHospitals.length) {
        const extra = document.createElement('p');
        extra.className = 'no-more-hospitals';
        extra.textContent = '⚠️ No more hospitals in the list. Please call 112 immediately.';
        _hospContainer().appendChild(extra);
        return;
      }
      const h = _nearbyHospitals[_shownCount];
      const card = document.createElement('div');
      card.innerHTML = HospitalDB.formatCard(h, _shownCount);
      _hospContainer().appendChild(card.firstElementChild);
      _shownCount++;
    },

    _markUnreachable(hospId) {
      const card = document.getElementById(`hosp-${hospId}`);
      if (card) {
        card.classList.add('unreachable');
        const btn = card.querySelector('.unreachable-btn');
        if (btn) {
          btn.textContent = '✖ Marked as unreachable';
          btn.disabled = true;
        }
      }
      UI.showToast('Trying next nearest hospital…', 'warning');
      Emergency._showNextHospital();
    },

    /** Programmatic call via tel: link */
    callNumber(number) {
      const cleaned = String(number).replace(/\D/g, '');
      window.location.href = `tel:${cleaned}`;
    },

    /** Share current location + emergency SOS message via Web Share or clipboard */
    async shareSOS() {
      let locationText = '';
      if (Location.hasLocation) {
        locationText = `\nLocation: https://www.google.com/maps?q=${Location.lat},${Location.lng}`;
      }
      const msg = `🚨 MEDICAL EMERGENCY — I need immediate help!${locationText}\nSent from Health Assistant AI`;
      try {
        if (navigator.share) {
          await navigator.share({ title: '🚨 Medical Emergency', text: msg });
        } else {
          await navigator.clipboard.writeText(msg);
          UI.showToast('SOS message copied! Paste it to share.', 'success');
        }
      } catch (_) {
        UI.showToast('Could not share. Please call 112 directly.', 'error');
      }
    },
  };
})();
