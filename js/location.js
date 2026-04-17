/**
 * Health Assistant AI — Geolocation helper
 */

const Location = (() => {
  let _lat = null;
  let _lng = null;
  let _city = null;

  return {
    get lat() { return _lat; },
    get lng() { return _lng; },
    get city() { return _city; },
    get hasLocation() { return _lat !== null && _lng !== null; },

    /**
     * Request the user's location.
     * Returns { lat, lng } or throws if denied/timed out.
     */
    request() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error('Geolocation is not supported by your browser.'));
        }
        navigator.geolocation.getCurrentPosition(
          pos => {
            _lat = pos.coords.latitude;
            _lng = pos.coords.longitude;
            resolve({ lat: _lat, lng: _lng });
            Location._reverseGeocode(_lat, _lng);
          },
          err => reject(err),
          {
            enableHighAccuracy: true,
            timeout: CONFIG.GEO_TIMEOUT_MS,
            maximumAge: CONFIG.GEO_MAX_AGE_MS,
          }
        );
      });
    },

    /** Best-effort reverse geocode via Nominatim (no API key needed) */
    async _reverseGeocode(lat, lng) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await resp.json();
        _city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'your location';
      } catch (_) {
        _city = 'your location';
      }
    },

    /** Open Google Maps with coordinates */
    openMap(lat, lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    },

    /** Share location link (Web Share API or clipboard fallback) */
    async shareLocation() {
      if (!_lat) throw new Error('Location not available');
      const url = `https://www.google.com/maps?q=${_lat},${_lng}`;
      const text = `My current location: ${url}`;
      if (navigator.share) {
        await navigator.share({ title: 'My Location', text, url });
      } else {
        await navigator.clipboard.writeText(text);
        UI.showToast('Location link copied to clipboard!');
      }
    },
  };
})();
