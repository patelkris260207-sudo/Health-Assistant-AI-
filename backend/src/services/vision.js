const PHOTO_HINTS = Object.freeze([
  { keyword: "burn", summary: "Possible burn injury signs in photo.", specialty: "trauma" },
  { keyword: "bleed", summary: "Possible bleeding visible in image.", specialty: "trauma" },
  { keyword: "rash", summary: "Possible skin reaction/rash pattern.", specialty: "general" },
  { keyword: "swelling", summary: "Possible swelling around affected area.", specialty: "general" },
]);

export function analyzePhoto(photo) {
  if (!photo || !photo.fileName) {
    return { imageSummary: "", imageSpecialtyHint: "general" };
  }

  const name = photo.fileName.toLowerCase();
  const hit = PHOTO_HINTS.find((entry) => name.includes(entry.keyword));
  if (!hit) {
    return {
      imageSummary: "Photo received. No strong visual keyword signals detected.",
      imageSpecialtyHint: "general",
    };
  }

  return { imageSummary: hit.summary, imageSpecialtyHint: hit.specialty };
}
