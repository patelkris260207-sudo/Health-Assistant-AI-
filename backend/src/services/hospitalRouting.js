function isValidPhone(phone) {
  // Step 1 allows common formatting; step 2 enforces realistic digit count.
  if (typeof phone !== "string" || !/^\+?[0-9 -]{7,20}$/.test(phone)) {
    return false;
  }
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isHospitalReachable(hospital) {
  return (
    hospital.status?.emergencyOpen === true &&
    hospital.status?.reachable === true &&
    isValidPhone(hospital.contact?.emergencyDesk)
  );
}

export function routeHospital(candidates) {
  const audit = [];
  let selected = null;

  for (const candidate of candidates) {
    if (isHospitalReachable(candidate)) {
      selected = candidate;
      audit.push({
        hospitalId: candidate.id,
        decision: "selected",
        reason: "Nearest eligible and reachable emergency hospital.",
      });
      break;
    }

    audit.push({
      hospitalId: candidate.id,
      decision: "skipped",
      reason: "Hospital unreachable, closed, or invalid emergency contact.",
    });
  }

  const fallbackCandidates = candidates.filter((item) => item.id !== selected?.id).slice(0, 3);
  return { selected, fallbackCandidates, audit };
}
