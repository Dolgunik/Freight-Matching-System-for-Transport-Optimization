export function getMatchingReferenceTime() {
  const configured = process.env.MATCHING_REFERENCE_TIME;
  return configured ? new Date(configured) : new Date();
}

export function getMatchingReferenceTimeIso() {
  return getMatchingReferenceTime().toISOString();
}

