export function requestLiveLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ granted: false, reason: "Geolocation not supported." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          granted: true,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      () => {
        resolve({ granted: false, reason: "Location permission denied." });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
