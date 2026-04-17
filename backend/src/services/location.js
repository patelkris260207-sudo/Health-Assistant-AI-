const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

export function filterHospitalsByRegion(hospitals, region = {}) {
  return hospitals.filter((hospital) => {
    const countryOk = !region.country || hospital.region.country === region.country;
    const stateOk = !region.state || hospital.region.state === region.state;
    const cityOk = !region.city || hospital.region.city === region.city;
    return countryOk && stateOk && cityOk;
  });
}

export function findNearestEligibleHospitals({
  hospitals,
  userLocation,
  specialty = "general",
  region = {},
}) {
  const regional = filterHospitalsByRegion(hospitals, region);
  const eligible = regional.filter((hospital) => {
    if (specialty === "general") {
      return hospital.acceptsAllEmergencies === true;
    }
    return (
      hospital.acceptsAllEmergencies === true || hospital.specialties.includes(specialty)
    );
  });

  return eligible
    .map((hospital) => ({
      ...hospital,
      distanceKm: userLocation
        ? Number(haversineDistanceKm(userLocation, hospital.location).toFixed(2))
        : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
