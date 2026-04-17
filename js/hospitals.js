/**
 * Health Assistant AI — Hospital utilities
 * Loads the hospital DB from hospitals.json and provides distance/search helpers.
 */

const HospitalDB = (() => {
  let _data = null;   // { emergency_numbers, hospitals }

  /* ── Haversine distance (km) ──────────────────────────────────────── */
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ── Load JSON once ───────────────────────────────────────────────── */
  async function load() {
    if (_data) return _data;
    const resp = await fetch('data/hospitals.json');
    _data = await resp.json();
    return _data;
  }

  /* ── Public API ──────────────────────────────────────────────────── */
  return {
    async getEmergencyNumbers() {
      const d = await load();
      return d.emergency_numbers;
    },

    async getAllHospitals() {
      const d = await load();
      return d.hospitals;
    },

    /**
     * Returns hospitals sorted by distance from (userLat, userLng).
     * If no location is provided, returns the full list sorted alphabetically.
     * @param {number|null} userLat
     * @param {number|null} userLng
     * @param {object} opts  – { limit, allEmergencyOnly, category }
     */
    async getNearby(userLat, userLng, opts = {}) {
      const { limit = 10, allEmergencyOnly = false, category = null } = opts;
      const d = await load();
      let list = d.hospitals;

      if (allEmergencyOnly) {
        list = list.filter(h => h.handles_all_emergencies);
      }
      if (category) {
        list = list.filter(h => h.categories.includes(category));
      }

      if (userLat != null && userLng != null) {
        list = list
          .map(h => ({
            ...h,
            distanceKm: haversine(userLat, userLng, h.lat, h.lng),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm);
      } else {
        list = list.map(h => ({ ...h, distanceKm: null }));
      }

      return list.slice(0, limit);
    },

    /** Format a hospital card as HTML */
    formatCard(h, index = 0) {
      const dist = h.distanceKm != null
        ? `<span class="hosp-dist">${h.distanceKm.toFixed(1)} km away</span>`
        : '';
      const badge = h.handles_all_emergencies
        ? '<span class="badge badge-all">All Emergencies</span>'
        : '';
      const freeBadge = h.free_emergency
        ? '<span class="badge badge-free">Free</span>'
        : '<span class="badge badge-paid">Private</span>';
      const phones = h.phone
        .map(p => `<a href="tel:${p.replace(/\D/g, '')}" class="call-btn" data-hospital-id="${h.id}" data-phone="${p}">📞 ${p}</a>`)
        .join('');

      return `
        <div class="hospital-card" id="hosp-${h.id}" data-index="${index}">
          <div class="hosp-header">
            <span class="hosp-name">${h.name}</span>
            ${badge} ${freeBadge} ${dist}
          </div>
          <div class="hosp-address">📍 ${h.address}</div>
          <div class="hosp-phones">${phones}</div>
          <button class="unreachable-btn" data-hospital-id="${h.id}">
            ✖ Mark Unreachable → Try Next
          </button>
        </div>`;
    },
  };
})();
