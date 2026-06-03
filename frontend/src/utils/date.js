/**
 * Formats full timestamps for global context, such as the fixed calculation time.
 */
export function formatDateTime(value) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

/**
 * Formats compact timestamps inside cargo and matching result rows.
 */
export function formatShortDateTime(value) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
