/**
 * Returns a fixed calculation time when configured.
 * This keeps demo and test results repeatable instead of depending on the real clock.
 */
export function getMatchingReferenceTime() {
  const configured = process.env.MATCHING_REFERENCE_TIME;
  return configured ? new Date(configured) : new Date();
}

/**
 * API-friendly ISO representation of the matching reference time.
 */
export function getMatchingReferenceTimeIso() {
  return getMatchingReferenceTime().toISOString();
}
